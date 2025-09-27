<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'table_id',
        'customer_id',
        'employee_id',
        'order_number',
        'type',
        'order_type',
        'status',
        'payment_status',
        'subtotal',
        'tax_total',
        'discount_total',
        'service_charge',
        'total',
        'currency',
        'placed_at',
        'scheduled_at',
        'closed_at',
        'notes',
        'customer_address_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total' => 'decimal:2',
        'placed_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'closed_at' => 'datetime',
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
}
