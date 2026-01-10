<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Enums\OrderStatus;

class Order extends Model
{
    use HasFactory;

    const APPROVAL_STATUS_PENDING = 'pending';
    const APPROVAL_STATUS_APPROVED = 'approved';
    const APPROVAL_STATUS_REJECTED = 'rejected';

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

    // Removed is_customer_request accessor - no longer needed

    /**
     * SECURITY: Use $guarded instead of $fillable to protect sensitive fields
     * 
     * These fields MUST NOT be settable via user input/API requests:
     * - payment_status: Only PaymentService can update
     * - status: Only workflow/admin can update
     * - approved_by: Only auth system sets this
     * - payment_collected_by/at: Only payment collection flow
     * 
     * Attack prevented: User sending {"payment_status": "paid"} to bypass payment
     */
    protected $guarded = [
        'id',
        'payment_status',           // ⚠️ CRITICAL: Must be set by PaymentService only
        'status',                   // ⚠️ Set by workflow, not user
        'approved_by',              // ⚠️ Set by auth system
        'approved_at',
        'payment_collected_by',
        'payment_collected_at',
        'is_auto_approved',
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
        'is_auto_approved' => 'boolean',
        'payment_collected_at' => 'datetime',
    ];

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
     * User who approved this order (admin/manager)
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Telegram user for guest orders (without customer account)
     */
    public function telegramUser()
    {
        return $this->belongsTo(TelegramUser::class);
    }

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

    // ==================== HELPER METHODS ====================

    /**
     * Check if order requires manual approval
     */
    public function requiresApproval(): bool
    {
        return in_array($this->order_type, ['delivery', 'pickup']) 
            && !$this->is_auto_approved;
    }

    /**
     * Check if order is pending approval
     */
    public function isPendingApproval(): bool
    {
        return $this->approval_status === self::APPROVAL_STATUS_PENDING;
    }

    /**
     * Check if order is approved
     */
    public function isApproved(): bool
    {
        return $this->approval_status === self::APPROVAL_STATUS_APPROVED;
    }

    /**
     * Check if order is rejected
     */
    public function isRejected(): bool
    {
        return $this->approval_status === self::APPROVAL_STATUS_REJECTED;
    }

    /**
     * Approve the order
     * NOTE: status, approved_by, approved_at are guarded - must use direct assignment
     */
    public function approve(?int $userId): bool
    {
        $this->status = 'received';
        $this->approval_status = self::APPROVAL_STATUS_APPROVED;
        $this->approved_by = $userId;
        $this->approved_at = now();
        $this->rejection_reason = null;
        return $this->save();
    }

    /**
     * Reject the order
     * NOTE: status is guarded - must use direct assignment
     */
    public function reject(string $reason): bool
    {
        $this->status = 'cancelled';
        $this->approval_status = self::APPROVAL_STATUS_REJECTED;
        $this->rejection_reason = $reason;
        return $this->save();
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
}
