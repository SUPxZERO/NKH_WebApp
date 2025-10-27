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

    protected $appends = [
        'is_customer_request',
    ];

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
        'total_amount',
        'currency',
        'ordered_at',
        'scheduled_at',
        'completed_at',
        'special_instructions',
        'customer_address_id',
        'estimated_ready_time',
        'approval_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'is_auto_approved'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'ordered_at' => 'datetime',
        'scheduled_at' => 'datetime',
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

    public function payments()
    {
        return $this->hasManyThrough(Payment::class, Invoice::class, 'order_id', 'invoice_id', 'id', 'id');
    }

    public function customerAddress()
    {
        return $this->belongsTo(CustomerAddress::class, 'customer_address_id');
    }

    public function getIsCustomerRequestAttribute(): bool
    {
        return in_array($this->order_type, ['delivery', 'pickup']) && !$this->is_auto_approved;
    }

    public function customerRequest()
    {
        return $this->hasOne(CustomerRequest::class);
    }
}
