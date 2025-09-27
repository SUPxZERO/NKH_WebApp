<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'location_id',
        'invoice_number',
        'subtotal',
        'tax_total',
        'discount_total',
        'service_charge',
        'total',
        'amount_paid',
        'amount_due',
        'currency',
        'issued_at',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'amount_due' => 'decimal:2',
        'issued_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
