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
}
