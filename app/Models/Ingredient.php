<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    use HasFactory;
    /**
     * SECURITY: Use $guarded to protect inventory financial data
     * 
     * Protected fields:
     * - Financial: cost_per_unit (pricing data)
     * - Inventory: current_stock (system-tracked)
     * - System: code (auto-generated)
     */
    protected $guarded = [
        'id',
        'code',                 // ⚠️ System-generated identifier
        'cost_per_unit',        // ⚠️ CRITICAL: Supplier pricing
        'current_stock',        // ⚠️ System-tracked (inventory transactions)
        'created_at',
        'updated_at',
    ];


    protected $casts = [
        'cost_per_unit' => 'decimal:2',
        'current_stock' => 'decimal:3',
        'min_stock_level' => 'decimal:3',
        'max_stock_level' => 'decimal:3',
        'reorder_point' => 'decimal:3',
        'is_active' => 'boolean',
        'shelf_life_days' => 'integer',
        'allergens' => 'array',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    public function purchaseOrderItems()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }
}
