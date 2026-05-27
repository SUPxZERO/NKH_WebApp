<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\BranchScopable;
use App\Models\OrderStatus;

class Order extends Model
{
    use HasFactory, BranchScopable;

    // Payment modes
    const PAYMENT_MODE_PAY_NOW = 'pay_now';
    const PAYMENT_MODE_PAY_ON_DELIVERY = 'pay_on_delivery';
    const PAYMENT_MODE_PAY_ON_PICKUP = 'pay_on_pickup';
    const PAYMENT_MODE_PAY_AT_COUNTER = 'pay_at_counter';

    // Payment statuses
    const PAYMENT_STATUS_UNPAID = 'unpaid';
    const PAYMENT_STATUS_PAID = 'paid';
    const PAYMENT_STATUS_PARTIAL = 'partial';
    const PAYMENT_STATUS_REFUNDED = 'refunded';

    // Approval statuses
    const APPROVAL_STATUS_PENDING  = 'pending';
    const APPROVAL_STATUS_APPROVED = 'approved';
    const APPROVAL_STATUS_REJECTED = 'rejected';

    /**
     * SECURITY: Use $guarded to protect sensitive fields that should not be mass-assigned
     *
     * Fields that MUST NOT be settable via user input/API requests:
     * - payment_collected_by/at: Only payment collection flow
     * - order_type_id: Lookup ID (should not be modified after creation)
     * - order_status_id: Lookup ID (should not be modified after creation)
     *
     * NOTE: Fields like status, payment_status are NOT guarded
     * because they need to be set during order creation. Protection is provided by
     * authorization policies (OrderPolicy) which check permissions before allowing updates.
     *
     * Attack prevented: Policy middleware ensures only authorized users can update sensitive fields
     */
    protected $guarded = [
        'id',
        'order_type_id',            // ⚠️ Lookup ID - set via order_type string field
        'order_status_id',          // ⚠️ Lookup ID - managed by approval flow
        'payment_status',           // ⚠️ Security: Prevent direct manipulation, use collectPayment()
        'status',                   // ⚠️ Security: Managed via order_status_id or specific transitions
        'payment_collected_by',     // ⚠️ Set by payment collection flow
        'payment_collected_at',     // ⚠️ Set by payment collection flow
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'delivery_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'ordered_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'pickup_time' => 'datetime',
        'completed_at' => 'datetime',
        'estimated_ready_time' => 'datetime',
        'payment_collected_at' => 'datetime',
    ];

    /**
     * Append virtual attributes to JSON/array output.
     * These accessors provide backward-compatible string codes.
     */
    protected $appends = ['order_type_code', 'status_code'];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function table()
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function driver()
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function orderType()
    {
        return $this->belongsTo(OrderType::class);
    }

    public function orderStatus()
    {
        return $this->belongsTo(OrderStatus::class);
    }

    // ==================== ACCESSORS (Backward Compatibility) ====================
    // IMPORTANT: These are named *_code to avoid shadowing the relationship methods.
    // Use $order->order_type_code and $order->status_code to get string codes.
    // Use $order->orderType and $order->orderStatus to get the related models.

    /**
     * Get order type code string (e.g., 'delivery', 'pickup', 'dine_in').
     * Access via: $order->order_type_code
     */
    public function getOrderTypeCodeAttribute(): string
    {
        return $this->orderType?->code ?? 'dine_in';
    }

    /**
     * Get order status code string (e.g., 'pending', 'preparing', 'ready').
     * Access via: $order->status_code
     */
    public function getStatusCodeAttribute(): string
    {
        return $this->orderStatus?->code ?? 'pending';
    }

    /**
     * Legacy Accessor: Get status code.
     * Fixes usage of $order->status in Resources and frontend.
     */
    public function getStatusAttribute(): string
    {
        return $this->getStatusCodeAttribute();
    }

    /**
     * Legacy Mutator: Set status code.
     * Maps $order->status = 'code' to order_status_id.
     * Fixes "Unknown column 'status'" errors during update.
     */
    public function setStatusAttribute($value)
    {
        if ($value) {
            // optimized: cache statuses or just lookup?
            // Static cache might be overkill, just look up.
            $status = \App\Models\OrderStatus::where('code', $value)->first();
            if ($status) {
                $this->attributes['order_status_id'] = $status->id;
            } else {
                // Fallback for non-existent status? Or just ignore? 
                // Ignoring might fail silently. But usually codes are valid.
                \Log::warning("Attempted to set invalid status code: $value");
            }
        }
    }

    /**
     * Legacy Mutator: Set order type code.
     * Maps $order->order_type = 'code' to order_type_id.
     * Fixes order type always defaulting to 'dine_in' because order_type_id is guarded.
     */
    public function setOrderTypeAttribute($value)
    {
        if ($value) {
            $type = \App\Models\OrderType::where('code', $value)->first();
            if ($type) {
                $this->attributes['order_type_id'] = $type->id;
            } else {
                \Log::warning("Attempted to set invalid order type code: $value");
            }
        }
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function invoice()
    {
        return $this->hasOne(Invoice::class);
    }

    public function promotion()
    {
        return $this->belongsTo(Promotion::class);
    }

    public function payments()
    {
        return $this->hasManyThrough(Payment::class, Invoice::class, 'order_id', 'invoice_id', 'id', 'id');
    }

    public function customerAddress()
    {
        return $this->belongsTo(CustomerAddress::class, 'customer_address_id');
    }

    public function timeSlot()
    {
        return $this->belongsTo(OrderTimeSlot::class, 'time_slot_id');
    }

    /**
     * Telegram user for guest orders (without customer account)
     */
    public function telegramUser()
    {
        return $this->belongsTo(TelegramUser::class);
    }

    /*
     * DEAD CODE: Table inventory_order_deductions does not exist in nkh_restaurant.sql
    public function inventoryDeductions()
    {
        return $this->hasMany(InventoryOrderDeduction::class);
    }
    */

    /**
     * Check if this is a guest order (via Telegram without customer account)
     */
    public function isGuestOrder(): bool
    {
        return $this->telegram_user_id !== null && $this->customer_id === null;
    }

    /**
     * Get the order owner display name (customer or telegram user)
     */
    public function getOwnerNameAttribute(): string
    {
        if ($this->customer_id && $this->customer?->user) {
            return $this->customer->user->name;
        }
        if ($this->telegram_user_id && $this->telegramUser) {
            return $this->telegramUser->display_name;
        }
        return 'Guest';
    }

    /**
     * Get contact phone for this order (from customer or telegram user)
     */
    public function getContactPhoneAttribute(): ?string
    {
        if ($this->customer_id && $this->customer?->user) {
            return $this->customer->user->phone;
        }
        if ($this->telegram_user_id && $this->telegramUser) {
            return $this->telegramUser->phone_number;
        }
        return null;
    }

    // ==================== PAYMENT HELPERS ====================

    /**
     * Check if order is paid
     */
    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_PAID;
    }

    /**
     * Check if order is unpaid
     */
    public function isUnpaid(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_UNPAID;
    }

    /**
     * Check if order is partially paid
     */
    public function isPartiallyPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_STATUS_PARTIAL;
    }

    /**
     * Check if payment is required on delivery
     */
    public function isPayOnDelivery(): bool
    {
        return $this->payment_mode === self::PAYMENT_MODE_PAY_ON_DELIVERY;
    }

    /**
     * Check if payment is required on pickup
     */
    public function isPayOnPickup(): bool
    {
        return $this->payment_mode === self::PAYMENT_MODE_PAY_ON_PICKUP;
    }

    /**
     * Check if payment needs to be collected (on delivery/pickup and not yet paid)
     */
    public function needsPaymentCollection(): bool
    {
        return in_array($this->payment_mode, [
            self::PAYMENT_MODE_PAY_ON_DELIVERY,
            self::PAYMENT_MODE_PAY_ON_PICKUP,
            self::PAYMENT_MODE_PAY_AT_COUNTER,
        ]) && !$this->isPaid();
    }

    /**
     * Mark payment as collected (by delivery/staff)
     * NOTE: payment_status, payment_collected_by/at are guarded - must use direct assignment
     */
    public function collectPayment(int $userId, ?string $notes = null): bool
    {
        $this->payment_status = self::PAYMENT_STATUS_PAID;
        $this->payment_collected_by = $userId;
        $this->payment_collected_at = now();
        $this->payment_collection_notes = $notes;
        return $this->save();
    }

    /**
     * User who collected the payment
     */
    public function paymentCollector()
    {
        return $this->belongsTo(User::class, 'payment_collected_by');
    }

    /**
     * Get available payment modes for this order type
     */
    public static function getPaymentModesForOrderType(string $orderType): array
    {
        return match ($orderType) {
            'delivery' => [
                self::PAYMENT_MODE_PAY_NOW,
                self::PAYMENT_MODE_PAY_ON_DELIVERY,
            ],
            'pickup' => [
                self::PAYMENT_MODE_PAY_NOW,
                self::PAYMENT_MODE_PAY_ON_PICKUP,
            ],
            'dine_in', 'dine-in' => [
                self::PAYMENT_MODE_PAY_NOW,
                self::PAYMENT_MODE_PAY_AT_COUNTER,
            ],
            default => [self::PAYMENT_MODE_PAY_NOW],
        };
    }
    /**
     * Helper to set status by code (polyfilled for missing status column)
     */
    public function setStatus(string $statusCode)
    {
        // Try to find status ID
        $status = \App\Models\OrderStatus::where('code', $statusCode)->first();
        if ($status) {
            $this->order_status_id = $status->id;
        } else {
            // Fallback if status table is empty/missing? 
            // Maybe log error? For now, do nothing or assume it might work if column existed?
            // actually, better to throw exception or log
            \Log::warning("Attempted to set invalid order status code: $statusCode");
        }
    }
}
