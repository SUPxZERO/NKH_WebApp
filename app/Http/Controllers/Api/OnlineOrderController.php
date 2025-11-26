<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Customer\StoreAddressRequest;
use App\Http\Requests\Api\OnlineOrder\StoreOnlineOrderRequest;
use App\Http\Resources\CustomerAddressResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\OrderTimeSlotResource;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderTimeSlot;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OnlineOrderController extends Controller
{
    // GET /api/time-slots?date=YYYY-MM-DD&mode=delivery
    public function timeSlots(Request $request)
    {
        $validated = $request->validate([
            'date' => ['nullable','date_format:Y-m-d'],
            'mode' => ['required','in:pickup,delivery'],
        ]);

        // Default to today if no date provided
        $date = $validated['date'] ?? now()->format('Y-m-d');
        $type = $validated['mode'];

        $query = OrderTimeSlot::query()
            ->where('slot_date', $date)
            ->where('slot_type', $type)
            ->whereColumn('current_orders', '<', 'max_orders')
            ->orderBy('slot_start_time');

        return OrderTimeSlotResource::collection($query->paginate());
    }

    // GET /api/customer/addresses (auth:sanctum, role:customer)
    public function addressesIndex(Request $request)
    {
        $customer = $request->user()->customer;
        if (!$customer) {
            abort(404, 'Customer profile not found');
        }

        return CustomerAddressResource::collection($customer->addresses()->latest()->paginate());
    }

    // POST /api/customer/addresses (auth:sanctum, role:customer)
    public function addressesStore(StoreAddressRequest $request)
    {
        $customer = $request->user()->customer;
        if (!$customer) {
            abort(404, 'Customer profile not found');
        }

        $payload = $request->validated();
        // Support 'notes' alias per API contract -> map to delivery_instructions
        if ($request->filled('notes')) {
            $payload['delivery_instructions'] = $request->string('notes');
        }

        $address = $customer->addresses()->create($payload);
        return new CustomerAddressResource($address);
    }

    /**
     * POST /api/online-orders (auth:sanctum, role:customer)
     * 
     * Creates a new online order (pickup or delivery) from customer cart
     * 
     * Request body:
     * {
     *   "order_type": "delivery" | "pickup",
     *   "location_id": 1,
     *   "customer_address_id": 2,  // required if delivery
     *   "time_slot_id": 5,
     *   "notes": "Leave at door",
     *   "order_items": [
     *     { "menu_item_id": 10, "quantity": 2 },
     *     { "menu_item_id": 15, "quantity": 1 }
     *   ]
     * }
     */
    public function store(StoreOnlineOrderRequest $request)
    {
        $data = $request->validated();
        $customer = $request->user()->customer;
        
        if (!$customer) {
            abort(422, 'Customer profile not found.');
        }

        $order = DB::transaction(function () use ($data, $customer) {
            // Lock slot row to prevent race conditions
            $slot = OrderTimeSlot::where('id', $data['time_slot_id'])->lockForUpdate()->firstOrFail();

            // Validate slot type matches order type
            if ($slot->slot_type !== $data['order_type']) {
                abort(422, 'Selected time slot does not match order type.');
            }
            
            // Validate slot location matches
            if ((int) $slot->location_id !== (int) $data['location_id']) {
                abort(422, 'Selected time slot and location mismatch.');
            }
            
            // Check slot availability
            if ($slot->current_orders >= $slot->max_orders) {
                abort(409, 'Selected time slot is full.');
            }

            // Validate delivery address for delivery orders
            $deliveryFee = 0;
            if ($data['order_type'] === 'delivery') {
                $address = CustomerAddress::where('id', $data['customer_address_id'] ?? 0)
                    ->where('customer_id', $customer->id)
                    ->first();
                    
                if (!$address) {
                    abort(422, 'Invalid delivery address.');
                }

                // Calculate delivery fee (from settings or default)
                $deliveryFee = $this->calculateDeliveryFee($data['location_id'], $address);
            }

            // Generate unique order number
            $orderNumber = $this->generateOrderNumber($data['location_id'], 'ONL');
            $scheduledAt = $slot->slot_date.' '.$slot->slot_start_time;

            // Calculate order totals
            $subtotal = 0;
            $orderItems = [];
            
            foreach ($data['order_items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);
                $qty = $item['quantity'];
                $lineTotal = (float) $menuItem->price * $qty;
                
                $orderItems[] = [
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

            // Get tax rate from settings (or use default 10%)
            $taxRate = $this->getTaxRate($data['location_id']);
            $taxAmount = round($subtotal * $taxRate, 2);
            
            // Calculate totals
            $discountAmount = 0;
            $serviceCharge = 0;
            $totalAmount = $subtotal + $taxAmount + $serviceCharge + $deliveryFee - $discountAmount;

            // Create the order
            $order = Order::create([
                'location_id' => $data['location_id'],
                'customer_id' => $customer->id,
                'order_number' => $orderNumber,
                'order_type' => $data['order_type'],
                'status' => 'pending',
                'approval_status' => 'pending',  // Customer orders require approval
                'is_auto_approved' => false,
                'payment_status' => 'unpaid',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'service_charge' => $serviceCharge,
                'delivery_fee' => $deliveryFee,
                'total_amount' => $totalAmount,
                'currency' => 'USD',
                'ordered_at' => now(),
                'scheduled_at' => $scheduledAt,
                'pickup_time' => $data['order_type'] === 'pickup' ? $scheduledAt : null,
                'special_instructions' => $data['notes'] ?? null,
                'customer_address_id' => $data['customer_address_id'] ?? null,
                'time_slot_id' => $data['time_slot_id'],
                'estimated_ready_time' => now()->addMinutes(30), // Default 30 min
            ]);

            // Create order items
            foreach ($orderItems as $item) {
                $order->items()->create($item);
            }

            // Increment slot usage
            $slot->increment('current_orders');

            // Clear customer's cart items (if they exist)
            CartItem::where('customer_id', $customer->id)->delete();

            return $order;
        });

        return new OrderResource($order->load(['items.menuItem', 'customerAddress', 'timeSlot']));
    }

    /**
     * Calculate delivery fee based on location settings and address distance
     */
    private function calculateDeliveryFee(int $locationId, CustomerAddress $address): float
    {
        // Try to get from settings
        $setting = Setting::where('location_id', $locationId)
            ->where('key', 'delivery_fee')
            ->first();

        if ($setting && isset($setting->value)) {
            return (float) $setting->value;
        }

        // Default delivery fee
        return 2.50;
    }

    /**
     * Get tax rate from location settings
     */
    private function getTaxRate(int $locationId): float
    {
        $setting = Setting::where('location_id', $locationId)
            ->where('key', 'tax_rate')
            ->first();

        if ($setting && isset($setting->value)) {
            return (float) $setting->value;
        }

        // Default 10% tax
        return 0.10;
    }

    /**
     * Generate unique order number
     */
    private function generateOrderNumber(int $locationId, string $prefix = 'ORD'): string
    {
        for ($i = 0; $i < 5; $i++) {
            $number = sprintf('%s-%s-%s', $prefix, now()->format('Ymd'), Str::upper(Str::random(5)));
            $exists = Order::where('location_id', $locationId)->where('order_number', $number)->exists();
            if (!$exists) return $number;
        }
        return sprintf('%s-%s-%s', $prefix, now()->format('YmdHis'), random_int(100, 999));
    }
}
