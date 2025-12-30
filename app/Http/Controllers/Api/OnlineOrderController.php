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
use App\Models\Promotion;
use App\Models\Setting;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OnlineOrderController extends Controller
{
    /**
     * GET /api/time-slots?date=YYYY-MM-DD&mode=delivery&location_id=1
     */
    public function timeSlots(Request $request)
    {
        $validated = $request->validate([
            'date' => ['nullable','date_format:Y-m-d'],
            'mode' => ['required','in:pickup,delivery'],
            'location_id' => ['required','integer','exists:locations,id'],
            'interval' => ['nullable','integer','in:15,30,60'], // Slot interval in minutes
        ]);

        // Default to today if no date provided
        $date = $validated['date'] ?? now()->format('Y-m-d');
        $serviceType = $validated['mode'];
        $locationId = $validated['location_id'];
        $interval = $validated['interval'] ?? 30; // Default 30 minute slots

        // Use TimeSlotService to generate real-time slots
        $timeSlotService = app(\App\Services\TimeSlotService::class);
        $slots = $timeSlotService->getAvailableTimeSlots(
            $locationId,
            $serviceType,
            $date,
            $interval
        );

        // Transform to expected format
        $formattedSlots = $slots->map(function ($slot) use ($locationId, $serviceType) {
            return [
                'id' => md5($slot['slot_date'] . $slot['slot_time'] . $locationId . $serviceType), // Generate unique ID
                'label' => $slot['full_label'],
                'start' => $slot['slot_date'] . 'T' . $slot['slot_time'],
                'end' => $slot['slot_date'] . 'T' . $slot['slot_time'],
                'available' => $slot['is_available'],
                'location_id' => $locationId,
                'slot_date' => $slot['slot_date'],
                'slot_start_time' => $slot['slot_time'],
                'slot_type' => $serviceType,
            ];
        });

        return response()->json([
            'data' => $formattedSlots->values(),
            'total' => $formattedSlots->count(),
        ]);
    }

    /**
     * Apply and validate a promotion code. Returns [discountAmount, promotionId].
     */
    private function applyPromotion(?string $code, Customer $customer, float $subtotal, int $locationId): array
    {
        if (!$code) {
            return [0.0, null];
        }

        $promotion = Promotion::query()
            ->where('code', $code)
            ->where('is_active', true)
            ->where(function ($q) use ($locationId) {
                $q->whereNull('location_id')
                  ->orWhere('location_id', $locationId);
            })
            ->where(function ($q) {
                $now = now();
                $q->whereNull('start_at')->orWhere('start_at', '<=', $now);
            })
            ->where(function ($q) {
                $now = now();
                $q->whereNull('end_at')->orWhere('end_at', '>=', $now);
            })
            ->first();

        if (!$promotion) {
            abort(422, 'Invalid or expired promotion code.');
        }

        if (!is_null($promotion->min_order_amount) && $subtotal < (float) $promotion->min_order_amount) {
            abort(422, 'Order does not meet the minimum amount for this promotion.');
        }

        // Global usage limit (count orders using this promotion)
        if (!is_null($promotion->usage_limit)) {
            $used = Order::where('promotion_id', $promotion->id)->count();
            if ($used >= $promotion->usage_limit) {
                abort(422, 'This promotion has reached its usage limit.');
            }
        }

        // Per-customer limit
        if (!is_null($promotion->per_customer_limit)) {
            $usedByCustomer = Order::where('promotion_id', $promotion->id)
                ->where('customer_id', $customer->id)
                ->count();

            if ($usedByCustomer >= $promotion->per_customer_limit) {
                abort(422, 'You have already used this promotion the maximum number of times.');
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
        \Log::info('🛒 OnlineOrderController: store() called');
        \Log::info('📦 Raw Request Data:', $request->all());

        try {
            $data = $request->validated();
            \Log::info('✅ Validation passed', $data);
        } catch (\Exception $e) {
            \Log::error('❌ Validation Failed:', ['error' => $e->getMessage()]);
            throw $e;
        }
        
        // DEVELOPMENT MODE: Handle when authentication is disabled
        $customer = null;
        
        if ($request->user()) {
            \Log::info('👤 User is authenticated:', ['id' => $request->user()->id]);
            // Authenticated: Get customer from user relationship
            $customer = $request->user()->customer;
        } elseif ($request->filled('telegram_id')) {
            // Check if telegram_id is provided (e.g. from Mini App)
            $telegramId = $request->input('telegram_id');
            \Log::info('👤 User identified via telegram_id:', ['telegram_id' => $telegramId]);
            
            $telegramUser = \App\Models\TelegramUser::where('telegram_id', $telegramId)->first();
            if ($telegramUser && $telegramUser->customer) {
                $customer = $telegramUser->customer;
            } else {
                 \Log::warning('⚠️ Telegram User found but no customer linked, or user not found.', ['telegram_id' => $telegramId]);
            }
        } 
        
        if (!$customer) {
            \Log::warning('⚠️ No authenticated user or valid telegram_id found. Attempting fallback.');
            // DEVELOPMENT ONLY: Fallback to first customer or specific ID
            // TODO: Remove this in production and enable auth middleware
            // Try to get customer ID from request (for testing)
            $customerId = $request->input('customer_id', 1); // Default to ID 1
            $customer = Customer::find($customerId);
        }
        
        if (!$customer) {
            \Log::error('❌ Customer profile not found.');
            abort(422, 'Customer profile not found. Please ensure you are logged in.');
        }

        \Log::info('👤 Customer identified:', ['id' => $customer->id, 'name' => $customer->name]);

        try {
            $order = DB::transaction(function () use ($data, $customer, $request) {
                \Log::info('🔄 Starting DB Transaction');

                // Handle time slot - support both old (time_slot_id) and new (slot_date + slot_time) approaches
                $slot = null;
                $slotDate = null;
                $slotTime = null;

                if (isset($data['time_slot_id'])) {
                    // Legacy approach: use existing OrderTimeSlot
                    $slot = OrderTimeSlot::where('id', $data['time_slot_id'])->lockForUpdate()->firstOrFail();
                    \Log::info('🕒 Time Slot locked (legacy):', ['id' => $slot->id]);
                    
                    $slotDate = $slot->slot_date->format('Y-m-d');
                    $slotTime = $slot->slot_start_time;
                    
                    // Validate slot type matches order type
                    if ($slot->slot_type !== $data['order_type']) {
                        \Log::error('❌ Slot type mismatch', ['slot' => $slot->slot_type, 'order' => $data['order_type']]);
                        abort(422, 'Selected time slot does not match order type.');
                    }
                    
                    // Validate slot location matches
                    if ((int) $slot->location_id !== (int) $data['location_id']) {
                        \Log::error('❌ Location mismatch');
                        abort(422, 'Selected time slot and location mismatch.');
                    }
                    
                    // Check slot availability
                    if ($slot->current_orders >= $slot->max_orders) {
                        \Log::error('❌ Slot full');
                        abort(409, 'Selected time slot is fully booked.');
                    }
                } else {
                    // New dynamic approach: validate using TimeSlotService
                    $slotDate = $data['slot_date'];
                    $slotTime = $data['slot_time'];
                    
                    \Log::info('🕒 Using dynamic time slot:', [
                        'date' => $slotDate,
                        'time' => $slotTime,
                        'type' => $data['order_type']
                    ]);
                    
                    // Validate the time slot using TimeSlotService
                    $timeSlotService = app(\App\Services\TimeSlotService::class);
                    $validation = $timeSlotService->validateTimeSlot(
                        $data['location_id'],
                        $slotDate,
                        $slotTime,
                        $data['order_type']
                    );
                    
                    if (!$validation['valid']) {
                        \Log::error('❌ Time slot validation failed:', ['message' => $validation['message']]);
                        abort(422, $validation['message']);
                    }
                    
                    // Get or create the OrderTimeSlot record for booking tracking
                    $slot = $timeSlotService->getOrCreateTimeSlot(
                        $data['location_id'],
                        $slotDate,
                        $slotTime,
                        $data['order_type'],
                        10 // max_orders default
                    );
                    
                    // Lock for update to prevent race conditions
                    $slot = OrderTimeSlot::where('id', $slot->id)->lockForUpdate()->first();
                    
                    // Check availability again after locking
                    if ($slot->current_orders >= $slot->max_orders) {
                        \Log::error('❌ Slot became full during transaction');
                        abort(409, 'Selected time slot is fully booked. Please select another time.');
                    }
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

                // Calculate totals
                $subtotal = 0;
                $orderItemsData = [];

                foreach ($data['order_items'] as $item) {
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

                \Log::info('💰 Subtotal calculated:', ['subtotal' => $subtotal]);

                if ($subtotal <= 0) {
                    abort(422, 'Order subtotal must be greater than zero.');
                }

                // Apply promotion (if any)
                [$discountAmount, $promotionId] = $this->applyPromotion(
                    $data['promotion_code'] ?? null,
                    $customer,
                    $subtotal,
                    (int) $data['location_id']
                );

                // Get tax rate from settings (or use default 10%)
                $taxRate = $this->getTaxRate($data['location_id']);
                $taxableBase = max(0, $subtotal - $discountAmount);
                $taxAmount = round($taxableBase * $taxRate, 2);
                
                // Calculate totals
                $serviceCharge = 0;
                $totalAmount = $taxableBase + $taxAmount + $serviceCharge + $deliveryFee;

                \Log::info('💵 Final Totals:', [
                    'subtotal' => $subtotal,
                    'delivery_fee' => $deliveryFee,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount
                ]);

                $scheduledAt = $slot->slot_date->format('Y-m-d') . ' ' . $slot->slot_start_time;

                // Create the order
                $order = Order::create([
                    'location_id' => $data['location_id'],
                    'customer_id' => $customer->id,
                    'order_number' => $this->generateOrderNumber($data['location_id'], 'ONL'),
                    'order_type' => $data['order_type'],
                    'status' => 'pending',
                    'approval_status' => 'pending',
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'service_charge' => $serviceCharge,
                    'delivery_fee' => $deliveryFee,
                    'tax_amount' => $taxAmount,
                    'total_amount' => $totalAmount,
                    'promotion_id' => $promotionId,
                    'currency' => 'USD',
                    'ordered_at' => now(),
                    'pickup_time' => $data['order_type'] === 'pickup' ? $scheduledAt : null,
                    'special_instructions' => $data['notes'] ?? null,
                    'customer_address_id' => $data['customer_address_id'] ?? null,
                    'time_slot_id' => $slot->id,
                    'payment_mode' => $data['payment_mode'] ?? 'pay_now',
                ]);

            // Create order items
            foreach ($orderItemsData as $item) {
                $order->items()->create($item);
            }

            // Increment slot usage
            $slot->increment('current_orders');

            // Clear customer's cart items (if they exist)
            CartItem::where('customer_id', $customer->id)->delete();

            return $order;
        });

        \Log::info('🎉 Transaction committed successfully');

        // Send order placed notification to customer
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->sendOrderNotification($order, 'placed');
            \Log::info('📧 Order confirmation notification sent');
        } catch (\Exception $e) {
            \Log::warning('Failed to send order placed notification: ' . $e->getMessage());
        }

        return new OrderResource($order->load(['items.menuItem', 'customerAddress', 'timeSlot']));

    } catch (\Exception $e) {
        \Log::error('❌ Transaction Failed:', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ]);
        throw $e;
    }
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
