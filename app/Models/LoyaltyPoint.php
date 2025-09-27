<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'order_id',
        'location_id',
        'type',
        'points',
        'balance_after',
        'occurred_at',
        'notes',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
        'points' => 'integer',
        'balance_after' => 'integer',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}
