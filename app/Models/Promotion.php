<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasFactory;

    protected $fillable = [
        'location_id',
        'code',
        'name',
        'description',
        'type',
        'value',
        'min_order_amount',
        'usage_limit',
        'per_customer_limit',
        'start_at',
        'end_at',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'min_order_amount' => 'decimal:2',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }
}
