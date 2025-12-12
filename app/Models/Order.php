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

    protected $fillable = [
        'location_id',
        'table_id',
        'customer_id',
        'employee_id',
        'order_number',
        'order_type',
        'status',
        'payment_status',
        'payment_mode',
        'payment_collected_by',
        'payment_collected_at',
        'payment_collection_notes',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'service_charge',
        'delivery_fee',
        'total_amount',
        'currency',
        'ordered_at',
        'scheduled_at',
        'pickup_time',
        'completed_at',
        'special_instructions',
        'delivery_instructions',
        'customer_address_id',
        'time_slot_id',
        'estimated_ready_time',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'is_auto_approved',
        'promotion_id',
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
     */
    public function approve(?int $userId): bool
    {
        return $this->update([
            'status' => 'received',
            'approval_status' => self::APPROVAL_STATUS_APPROVED,
            'approved_by' => $userId,
            'approved_at' => now(),
            'rejection_reason' => null,
        ]);
    }

    /**
     * Reject the order
     */
    public function reject(string $reason): bool
    {
        return $this->update([
            'status' => 'cancelled',
            'approval_status' => self::APPROVAL_STATUS_REJECTED,
            'rejection_reason' => $reason,
        ]);
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
     */
    public function collectPayment(int $userId, ?string $notes = null): bool
    {
        return $this->update([
            'payment_status' => self::PAYMENT_STATUS_PAID,
            'payment_collected_by' => $userId,
            'payment_collected_at' => now(),
            'payment_collection_notes' => $notes,
        ]);
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
