<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Customer\StoreAddressRequest;
use App\Http\Requests\Api\OnlineOrder\StoreOnlineOrderRequest;
use App\Http\Resources\CustomerAddressResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\OrderTimeSlotResource;
use App\Http\Traits\TelegramAwareAuth;
use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderTimeSlot;
use App\Models\Promotion;
use App\Models\Setting;
use App\Models\TableSession;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OnlineOrderController extends Controller
{
    use TelegramAwareAuth;
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
        $customer = $this->getCurrentCustomer($request);
        if (!$customer) {
            abort(404, 'Customer profile not found');
        }

        return CustomerAddressResource::collection($customer->addresses()->latest()->paginate());
    }

    // POST /api/customer/addresses (auth:sanctum, role:customer)
    public function addressesStore(StoreAddressRequest $request)
    {
        $customer = $this->getCurrentCustomer($request);
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
        
        // Get Customer using unified helper
        $customer = $this->getCurrentCustomer($request);

        // ==================== TABLE SESSION GUEST HANDLING ====================
        // If no customer but we have a valid table session, allow as Guest
        $tableSession = $this->getActiveTableSession($request);

        if (!$customer && $tableSession && $tableSession->isValid()) {
            // Check if this session already has a temp customer assigned (from previous orders?)
            // Or create a new one based on the session
            
            if ($tableSession->customer) {
                $customer = $tableSession->customer;
            } else {
                // Create specific guest customer for this session to track history
                // We use a specific prefix to identify them
                try {
                    $customer = Customer::create([
                        'name' => 'Guest ' . $tableSession->table->code, // e.g. "Guest T-01"
                        'customer_code' => 'GUEST-' . strtoupper(Str::random(6)),
                        // No phone/email
                    ]);
                    
                    // Attach to session so future requests use same customer
                    $tableSession->customer_id = $customer->id;
                    $tableSession->save();
                    
                    \Log::info('👤 Created Guest Customer for Table Session:', ['id' => $customer->id]);
                } catch (\Exception $e) {
                    \Log::error('Failed to create guest customer: ' . $e->getMessage());
                    // Fallback to a generic guest if creation fails?
                }
            }
        }
        // ==================== END TABLE SESSION GUEST HANDLING ====================
        
        // If still no customer, try to create one if telegram_id is present (First time user)
        if (!$customer && $request->filled('telegram_id')) {
            $telegramId = $request->input('telegram_id');
            \Log::info('👤 First time Telegram ID:', ['telegram_id' => $telegramId]);

            $telegramUser = \App\Models\TelegramUser::firstOrCreate(
                ['telegram_id' => $telegramId],
                ['is_active' => true, 'notifications_enabled' => true]
            );

            // Auto-create customer if missing
            if (!$telegramUser->customer_id) {
                 $newCustomer = Customer::create([
                    'user_id' => null, // Guest
                    'name' => $telegramUser->first_name ? ($telegramUser->first_name . ' ' . $telegramUser->last_name) : 'Telegram Guest',
                    'customer_code' => \App\Models\Customer::generateCustomerCode('TG'), // Use proper helper
                ]);
                $telegramUser->update(['customer_id' => $newCustomer->id]);
                $customer = $newCustomer;
            } else {
                $customer = $telegramUser->customer;
            }
        }
        
        if (!$customer) {
            \Log::warning('⚠️ No authenticated user or valid telegram_id found. Attempting fallback.');
            // DEVELOPMENT ONLY
            // $customerId = $request->input('customer_id', 1);
            // $customer = Customer::find($customerId);
        }
        
        if (!$customer) {
            \Log::error('❌ Customer profile not found.');
            // Return 401 instead of 422 for unauthenticated
            abort(401, 'Unauthenticated. Please scan the QR code again.');
        }

        \Log::info('👤 Customer identified:', ['id' => $customer->id, 'name' => $customer->name]);

        try {
            $order = DB::transaction(function () use ($data, $customer, $request) {
                \Log::info('🔄 Starting DB Transaction');

                // ==================== TABLE SESSION DETECTION (Sprint P17) ====================
                // Check if this order is being placed from a QR table session
                $tableSession = $this->getActiveTableSession($request);
                $tableId = null;
                $isQrTableOrder = false;

                if ($tableSession) {
                    $tableId = $tableSession->table_id;
                    $isQrTableOrder = true;
                    
                    // Force order_type to dine-in for table orders
                    $data['order_type'] = 'dine-in';
                    
                    \Log::info('🍽️ QR Table Order detected', [
                        'session_id' => $tableSession->id,
                        'table_id' => $tableId,
                        'table_code' => $tableSession->table?->code,
                    ]);
                    
                    // Update table session status to 'ordering'
                    $tableSession->updateStatus(TableSession::STATUS_ORDERING);
                }
                // ==================== END TABLE SESSION DETECTION ====================

                // Handle time slot - support old (time_slot_id), new (slot_date + slot_time), and ASAP (order_now) approaches
                $slot = null;
                $slotDate = null;
                $slotTime = null;
                $timeSlotService = app(\App\Services\TimeSlotService::class);

                // Check if this is an "Order Now" request
                $orderNow = $data['order_now'] ?? false;

                if ($orderNow) {
                    // ASAP ordering - auto-assign earliest available slot
                    \Log::info('⚡ Order Now requested - finding earliest available slot');
                    
                    $earliestSlot = $timeSlotService->getEarliestAvailableSlot(
                        $data['location_id'],
                        $data['order_type']
                    );
                    
                    if (!$earliestSlot) {
                        \Log::error('❌ No available slots for ASAP ordering');
                        abort(422, 'No available time slots found. The restaurant may be closed or fully booked.');
                    }
                    
                    $slotDate = $earliestSlot['slot_date'];
                    $slotTime = $earliestSlot['slot_time'];
                    
                    \Log::info('⚡ Auto-assigned slot:', ['date' => $slotDate, 'time' => $slotTime]);
                    
                    // Get or create the OrderTimeSlot record
                    $slot = $timeSlotService->getOrCreateTimeSlot(
                        $data['location_id'],
                        $slotDate,
                        $slotTime,
                        $data['order_type'],
                        10
                    );
                    
                    // Lock for update
                    $slot = OrderTimeSlot::where('id', $slot->id)->lockForUpdate()->first();
                    
                    if ($slot->current_orders >= $slot->max_orders) {
                        \Log::error('❌ Slot became full');
                        abort(409, 'The earliest time slot is now fully booked. Please try again.');
                    }
                    
                } elseif ($data['order_type'] === 'dine-in') {
                    // For dine-in, we don't use time slots. 
                    // We just use the current time as placed_at (handled by default)
                    \Log::info('🍽️ Dine-in order - skipping time slot validation');
                    $slot = null;
                } elseif (isset($data['time_slot_id'])) {
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
                    // Check if address belongs to customer OR to telegram user
                    $addressQuery = CustomerAddress::where('id', $data['customer_address_id'] ?? 0);
                    
                    // Get telegram_user_id from telegram_id if provided
                    $telegramUser = null;
                    if ($request->filled('telegram_id')) {
                        $telegramUser = \App\Models\TelegramUser::where('telegram_id', $request->input('telegram_id'))->first();
                    }
                    
                    // Address can belong to customer_id OR telegram_user_id
                    $addressQuery->where(function ($q) use ($customer, $telegramUser) {
                        $q->where('customer_id', $customer->id);
                        if ($telegramUser) {
                            $q->orWhere('telegram_user_id', $telegramUser->id);
                        }
                    });
                    
                    $address = $addressQuery->first();
                        
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

                $scheduledAt = $slot 
                    ? $slot->slot_date->format('Y-m-d') . ' ' . $slot->slot_start_time
                    : now()->format('Y-m-d H:i:s');

                // Create the order
                $order = Order::create([
                    'location_id' => $data['location_id'],
                    'table_id' => $tableId, // QR Table Order: auto-bind table (Sprint P17)
                    'customer_id' => $customer->id,
                    'order_number' => $this->generateOrderNumber($data['location_id'], $isQrTableOrder ? 'TBL' : 'ONL'),
                    'order_type' => $data['order_type'],
                    'status' => $isQrTableOrder ? 'received' : 'pending', // QR orders auto-approved
                    'approval_status' => $isQrTableOrder ? 'approved' : 'pending', // QR orders auto-approved
                    'is_auto_approved' => $isQrTableOrder,
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
                    'time_slot_id' => $slot ? $slot->id : null,
                    'payment_mode' => $isQrTableOrder ? ($data['payment_mode'] ?? Order::PAYMENT_MODE_PAY_AT_COUNTER) : ($data['payment_mode'] ?? 'pay_now'),
                ]);

            // Create order items
            foreach ($orderItemsData as $item) {
                $order->items()->create($item);
            }

            // Increment slot usage
            if ($slot) {
                $slot->increment('current_orders');
            }

            // Clear customer's cart items (if they exist)
            CartItem::where('customer_id', $customer->id)->delete();

            // ==================== TABLE SESSION LINKING (Sprint P17) ====================
            if ($tableSession && $isQrTableOrder) {
                // Link order to table session
                $tableSession->linkOrder($order);
                
                // Mark table as occupied
                $tableSession->table->markOccupied();
                
                \Log::info('🍽️ Order linked to table session', [
                    'order_id' => $order->id,
                    'session_id' => $tableSession->id,
                    'table_code' => $tableSession->table->code,
                ]);
            }
            // ==================== END TABLE SESSION LINKING ====================

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

    // ==================== TABLE SESSION HELPER (Sprint P17) ====================

    /**
     * Get active table session from request
     * Checks X-Table-Session header, cookie, and middleware attachment
     */
    private function getActiveTableSession(Request $request): ?TableSession
    {
        // First check if attached by TableSessionMiddleware
        if ($request->attributes->has('table_session')) {
            return $request->attributes->get('table_session');
        }

        // Try to get from header or cookie
        $sessionToken = $request->header('X-Table-Session')
            ?? $request->cookie('table_session')
            ?? $request->input('table_session_token');

        if (!$sessionToken) {
            return null;
        }

        // Find active, non-expired session
        return TableSession::findByToken($sessionToken);
    }
}
