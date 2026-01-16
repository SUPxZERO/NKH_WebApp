<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    /**
     * SECURITY: Use $guarded to protect order item pricing
     * 
     * Protected fields:
     * - Pricing: unit_price, discount_amount, tax_amount, total_price (calculated by OrderCalculationService)
     * - Workflow: status (kitchen workflow)
     */
    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];


    protected $casts = [
        'unit_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
