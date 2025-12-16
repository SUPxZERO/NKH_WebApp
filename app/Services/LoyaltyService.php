<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\LoyaltyPoint;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LoyaltyService
{
    /**
     * Award points to a customer for an order.
     * Default rate: 1 point per $1 spent.
     *
     * @param Order $order
     * @param float|null $amount If null, uses order total.
     * @return int Points awarded
     */
    public function awardPoints(Order $order, ?float $amount = null): int
    {
        if (!$order->customer_id) {
            return 0;
        }

        $customer = Customer::find($order->customer_id);
        if (!$customer) {
            return 0;
        }

        // Prevent duplicate point awards for the same order
        $existingPoints = LoyaltyPoint::where('customer_id', $customer->id)
            ->where('order_id', $order->id)
            ->where('type', 'earn')
            ->exists();

        if ($existingPoints) {
            Log::warning("Loyalty points already awarded for order {$order->id}, skipping duplicate award");
            return 0;
        }

        $amountToProcess = $amount ?? $order->total_amount;

        // Calculate points: 1 point per $1 (floor value)
        // This could be configurable in settings
        $points = (int) floor($amountToProcess);

        if ($points <= 0) {
            return 0;
        }

        try {
            DB::transaction(function () use ($customer, $order, $points) {
                // Get current balance before this transaction
                $currentBalance = $customer->points_balance ?? 0;
                $newBalance = $currentBalance + $points;

                // Create loyalty transaction record with balance_after
                LoyaltyPoint::create([
                    'customer_id' => $customer->id,
                    'order_id' => $order->id,
                    'location_id' => $order->location_id,
                    'points' => $points,
                    'type' => 'earn',
                    'balance_after' => $newBalance,
                    'notes' => "Points earned from Order #{$order->order_number}",
                    'reference_id' => $order->id,
                    'reference_type' => Order::class,
                    'occurred_at' => now(),
                    'expires_at' => now()->addYear(), // Points expire in 1 year
                ]);

                // Update customer balance
                $customer->increment('points_balance', $points);

                // Update customer tier based on total_spent
                $customer->calculateTier();
                $customer->save();
            });

            Log::info("Awarded {$points} loyalty points to customer {$customer->id} for order {$order->id}");

            return $points;

        } catch (\Exception $e) {
            Log::error("Failed to award loyalty points: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Deduct points (redemption).
     */
    public function redeemPoints(Customer $customer, int $points, string $description): bool
    {
        if ($customer->points_balance < $points) {
            return false;
        }

        DB::transaction(function () use ($customer, $points, $description) {
            LoyaltyPoint::create([
                'customer_id' => $customer->id,
                'points' => -$points,
                'type' => 'redeem',
                'description' => $description,
                'occurred_at' => now(),
            ]);

            $customer->decrement('points_balance', $points);
        });

        return true;
    }
}
