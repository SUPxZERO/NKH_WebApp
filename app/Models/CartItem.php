<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = [
        'customer_id',
        'menu_item_id',
        'quantity',
        'notes',
        'customizations',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'customizations' => 'array',
    ];

    /**
     * Get the customer that owns the cart item
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the menu item
     */
    public function menuItem(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class);
    }
}
