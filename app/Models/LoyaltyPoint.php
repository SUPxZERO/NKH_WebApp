<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LoyaltyPoint extends Model
{
    use HasFactory;

    /**
     * SECURITY: Protect loyalty point balance calculations
     * 
     * Protected fields:
     * - Financial: points, balance_after (system-calculated)
     * - Audit: occurred_at (timestamp of transaction)
     */
    protected $guarded = [
        'id',
        'points',               // ⚠️ CRITICAL: Point amount (can be +/-)
        'balance_after',        // ⚠️ CRITICAL: Running balance
        'occurred_at',          // ⚠️ Transaction timestamp
        'created_at',
        'updated_at',
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
