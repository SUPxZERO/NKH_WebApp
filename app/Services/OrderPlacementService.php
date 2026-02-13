<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderTimeSlot;
use App\Models\TableSession;
use App\Models\TelegramUser;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\OrderType;

class OrderPlacementService
{
    protected $timeSlotService;
    protected $notificationService;
    protected $calculationService;

    public function __construct(
        TimeSlotService $timeSlotService,
        NotificationService $notificationService,
        OrderCalculationService $calculationService
    ) {
        $this->timeSlotService = $timeSlotService;
        $this->notificationService = $notificationService;
        $this->calculationService = $calculationService;
    }

    /**
     * Place a new order
     *
     * @param array $data Validated order data
     * @param Customer $customer The authenticated customer
     * @param TableSession|null $tableSession Active table session if any
     * @param string|null $telegramId Optional telegram ID for address validation context
     * @return Order
     * @throws \Throwable
     */
    public function placeOrder(array $data, Customer $customer, ?TableSession $tableSession = null, ?string $telegramId = null): Order
    {
        return DB::transaction(function () use ($data, $customer, $tableSession, $telegramId) {
            \Log::info('🔄 Starting Order Placement Transaction (Service)');

            // ==================== TABLE SESSION LOGIC ====================
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

            // ==================== TIME SLOT LOGIC ====================
            $slot = $this->handleTimeSlot($data);

            // ==================== ADDRESS & DELIVERY LOGIC ====================
            $address = null;
            if ($data['order_type'] === 'delivery') {
                $address = $this->validateDeliveryAddress($data, $customer, $telegramId);
            }

            // ==================== CALCULATION LOGIC ====================
            $totals = $this->calculationService->calculate(
                $data['order_items'],
                $data['location_id'],
                $data['promotion_code'] ?? null,
                $customer,
                $address,
                $data['order_type']
            );

            // Extract calculation results
            $subtotal = $totals['subtotal'];
            $discountAmount = $totals['discount_amount'];
            $taxAmount = $totals['tax_amount'];
            $totalAmount = $totals['total_amount'];
            $deliveryFee = $totals['delivery_fee'];
            $promotionId = $totals['promotion_id'];
            $serviceCharge = $totals['service_charge'];
            $orderItemsData = $totals['items_data'];

            // ==================== ORDER CREATION ====================
            $scheduledAt = $slot
                ? $slot->slot_date->format('Y-m-d') . ' ' . $slot->slot_start_time
                : now()->format('Y-m-d H:i:s');

            $order = Order::create([
                'location_id' => $data['location_id'],
                'table_id' => $tableId,
                'customer_id' => $customer->id,
                'order_number' => $this->generateOrderNumber($data['location_id'], $isQrTableOrder ? 'TBL' : 'ONL'),
                // 'order_type' => $data['order_type'], // FIX: Removed from mass assignment
                'status' => $isQrTableOrder ? 'received' : 'pending',
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

            // FIX: Explicitly set order_type to trigger the model mutator (setOrderTypeAttribute)
            // This ensures order_type_id is correctly populated since it's guarded
            $order->order_type = $data['order_type'];
            $order->save();

            // Create order items
            foreach ($orderItemsData as $item) {
                $order->items()->create($item);
            }

            // Increment slot usage
            if ($slot) {
                $slot->increment('current_orders');
            }

            // Clear customer's cart
            CartItem::where('customer_id', $customer->id)->delete();

            // ==================== TABLE SESSION LINKING ====================
            if ($tableSession && $isQrTableOrder) {
                $tableSession->linkOrder($order);
                app(TableStatusService::class)->occupyForQrScan($tableSession->table);

                \Log::info('🍽️ Order linked to table session', [
                    'order_id' => $order->id,
                    'session_id' => $tableSession->id,
                ]);
            }

            // ==================== NOTIFICATIONS ====================
            // FIX Issue #7: Moved OUTSIDE transaction - see below
            // (DB locks should not be held during external API calls)

            return $order;
        });

        // FIX Issue #7: Send notifications AFTER transaction commits
        // This prevents holding DB locks during slow external API calls (Telegram, Email, Pusher)
        $this->sendNotifications($order);

        return $order;
    }

    protected function handleTimeSlot(array $data): ?OrderTimeSlot
    {
        $orderNow = $data['order_now'] ?? false;

        if ($orderNow) {
            \Log::info('⚡ Order Now requested');

            $earliestSlot = $this->timeSlotService->getEarliestAvailableSlot(
                $data['location_id'],
                $data['order_type']
            );

            if (!$earliestSlot) {
                abort(422, 'No available time slots found. The restaurant may be closed or fully booked.');
            }

            $slot = $this->timeSlotService->getOrCreateTimeSlot(
                $data['location_id'],
                $earliestSlot['slot_date'],
                $earliestSlot['slot_time'],
                $data['order_type'],
                10
            );

            // Lock and check
            $slot = OrderTimeSlot::where('id', $slot->id)->lockForUpdate()->first();
            if ($slot->current_orders >= $slot->max_orders) {
                abort(409, 'The earliest time slot is now fully booked. Please try again.');
            }

            return $slot;

        } elseif ($data['order_type'] === 'dine-in') {
            return null;
        } elseif (isset($data['time_slot_id'])) {
            // Legacy
            $slot = OrderTimeSlot::where('id', $data['time_slot_id'])->lockForUpdate()->firstOrFail();

            if ($slot->slot_type !== $data['order_type'])
                abort(422, 'Selected time slot does not match order type.');
            if ((int) $slot->location_id !== (int) $data['location_id'])
                abort(422, 'Selected time slot and location mismatch.');
            if ($slot->current_orders >= $slot->max_orders)
                abort(409, 'Selected time slot is fully booked.');

            return $slot;
        } else {
            // New dynamic
            $validation = $this->timeSlotService->validateTimeSlot(
                $data['location_id'],
                $data['slot_date'],
                $data['slot_time'],
                $data['order_type']
            );

            if (!$validation['valid'])
                abort(422, $validation['message']);

            $slot = $this->timeSlotService->getOrCreateTimeSlot(
                $data['location_id'],
                $data['slot_date'],
                $data['slot_time'],
                $data['order_type'],
                10
            );

            $slot = OrderTimeSlot::where('id', $slot->id)->lockForUpdate()->first();
            if ($slot->current_orders >= $slot->max_orders)
                abort(409, 'Selected time slot is fully booked.');

            return $slot;
        }
    }

    protected function validateDeliveryAddress(array $data, Customer $customer, ?string $telegramId): CustomerAddress
    {
        $addressQuery = CustomerAddress::where('id', $data['customer_address_id'] ?? 0);

        $telegramUser = null;
        if ($telegramId) {
            $telegramUser = TelegramUser::where('telegram_id', $telegramId)->first();
        }

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

        return $address;
    }

    protected function generateOrderNumber(int $locationId, string $prefix = 'ORD'): string
    {
        for ($i = 0; $i < 5; $i++) {
            $number = sprintf('%s-%s-%s', $prefix, now()->format('Ymd'), Str::upper(Str::random(5)));
            if (!Order::where('location_id', $locationId)->where('order_number', $number)->exists()) {
                return $number;
            }
        }
        return sprintf('%s-%s-%s', $prefix, now()->format('YmdHis'), random_int(100, 999));
    }

    protected function sendNotifications(Order $order): void
    {
        // PHASE 19: Dispatch notification job to queue for async processing
        // This improves order placement response time by ~200-500ms
        \App\Jobs\SendOrderNotificationJob::dispatch($order, 'placed');
        \Log::info('📤 Order notification job dispatched to queue');
    }
}
