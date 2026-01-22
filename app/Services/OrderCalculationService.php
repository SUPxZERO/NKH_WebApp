<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Promotion;
use App\Models\Setting;
use Illuminate\Validation\ValidationException;

class OrderCalculationService
{
    /**
     * Calculate all order totals including items, tax, discount, delivery
     */
    public function calculate(array $items, int $locationId, ?string $promotionCode = null, ?Customer $customer = null, ?CustomerAddress $address = null, string $orderType = 'pickup'): array
    {
        $subtotal = 0;
        $orderItemsData = [];

        // 1. Calculate Items Total
        foreach ($items as $item) {
            $menuItem = MenuItem::findOrFail($item['menu_item_id']);
            $qty = $item['quantity'];
            $lineTotal = (float) $menuItem->price * $qty;

            $orderItemsData[] = [
                'menu_item_id' => $menuItem->id,
                'quantity' => $qty,
                'unit_price' => $menuItem->price,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'total_price' => $lineTotal,
                'status' => 'pending',
                'special_instructions' => $item['special_instructions'] ?? null,
            ];

            $subtotal += $lineTotal;
        }

        if ($subtotal <= 0) {
            throw ValidationException::withMessages(['subtotal' => 'Order subtotal must be greater than zero.']);
        }

        // 2. Apply Promotion
        [$discountAmount, $promotionId] = $this->applyPromotion(
            $promotionCode,
            $customer,
            $subtotal,
            $locationId
        );

        // 3. Calculate Delivery Fee
        $deliveryFee = 0;
        if ($orderType === 'delivery') {
            $deliveryFee = $this->calculateDeliveryFee($locationId, $address);
        }

        // 4. Calculate Tax
        $taxRate = $this->getTaxRate($locationId);
        $taxableBase = max(0, $subtotal - $discountAmount);
        $taxAmount = round($taxableBase * $taxRate, 2);

        $serviceCharge = 0; // TODO: Fetch from settings if needed

        $totalAmount = $taxableBase + $taxAmount + $serviceCharge + $deliveryFee;

        return [
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'tax_amount' => $taxAmount,
            'service_charge' => $serviceCharge,
            'delivery_fee' => $deliveryFee,
            'total_amount' => $totalAmount,
            'promotion_id' => $promotionId,
            'items_data' => $orderItemsData,
        ];
    }

    /**
     * Recalculate totals for an existing order object
     */
    public function recalculateOrder(Order $order): Order
    {
        $order->loadMissing('items');

        $subtotal = $order->items->sum(function ($i) {
            // Ensure we use the latest pricing logic or keep existing? 
            // Ideally we should re-fetch unit prices if status is still draft, but usually we respect existing lines.
            // For simplicity, sum the total_price which should be kept up to date by line item updates.
            return (float) $i->total_price;
        });

        // For existing orders, we might want to preserve the delivery fee unless explicitly changed
        // But for tax/service charge, we might want to re-evaluate.

        // Simpler implementation mimicking OrderController logic but centralized
        $taxRate = $this->getTaxRate($order->location_id);

        // Re-evaluate discount if promotion exists? 
        // Logic might be complex if promotion expired. Let's keep existing discount unless recalculated explicitly.
        $discountAmount = $order->discount_amount;

        $taxableBase = max(0, $subtotal - $discountAmount);
        $taxAmount = round($taxableBase * $taxRate, 2);

        $totalAmount = $taxableBase + $taxAmount + $order->service_charge + $order->delivery_fee;

        $order->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
        ]);

        return $order;
    }

    public function applyPromotion(?string $code, ?Customer $customer, float $subtotal, int $locationId): array
    {
        if (!$code)
            return [0.0, null];

        $promotion = Promotion::query()
            ->where('code', $code)
            ->where('is_active', true)
            ->where(function ($q) use ($locationId) {
                $q->whereNull('location_id')->orWhere('location_id', $locationId);
            })
            ->where(function ($q) {
                $q->whereNull('start_at')->orWhere('start_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_at')->orWhere('end_at', '>=', now());
            })
            ->first();

        if (!$promotion) {
            throw ValidationException::withMessages(['promotion_code' => 'Invalid or expired promotion code.']);
        }

        if (!is_null($promotion->min_order_amount) && $subtotal < (float) $promotion->min_order_amount) {
            throw ValidationException::withMessages(['promotion_code' => 'Order does not meet the minimum amount for this promotion.']);
        }

        // Check limits
        if (!is_null($promotion->usage_limit)) {
            if (Order::where('promotion_id', $promotion->id)->count() >= $promotion->usage_limit) {
                throw ValidationException::withMessages(['promotion_code' => 'This promotion has reached its usage limit.']);
            }
        }

        if ($customer && !is_null($promotion->per_customer_limit)) {
            if (Order::where('promotion_id', $promotion->id)->where('customer_id', $customer->id)->count() >= $promotion->per_customer_limit) {
                throw ValidationException::withMessages(['promotion_code' => 'You have already used this promotion the maximum number of times.']);
            }
        }

        $discount = match ($promotion->type) {
            'percentage' => round($subtotal * ((float) $promotion->value / 100), 2),
            'fixed' => min($subtotal, (float) $promotion->value),
            'happy_hour' => round($subtotal * ((float) $promotion->value / 100), 2),
            default => 0.0,
        };

        return [$discount, $promotion->id];
    }

    public function calculateDeliveryFee(int $locationId, $address = null): float
    {
        $setting = Setting::where('location_id', $locationId)->where('key', 'delivery_fee')->first();
        return ($setting && isset($setting->value)) ? (float) $setting->value : 2.50;
    }

    public function getTaxRate(int $locationId): float
    {
        $setting = Setting::where('location_id', $locationId)->where('key', 'tax_rate')->first();
        return ($setting && isset($setting->value)) ? (float) $setting->value : 0.10;
    }
}
