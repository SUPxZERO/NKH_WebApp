<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{

    protected $fillable = [
        'code',
        'name',
        'description',
        'category',
        'unit_id',
        'supplier_id',
        'cost_per_unit',
        'current_stock',
        'min_stock_level',
        'max_stock_level',
        'reorder_point',
        'storage_requirements',
        'allergens',
        'shelf_life_days',
        'is_active',
    ];

    protected $casts = [
        'cost_per_unit' => 'decimal:2',
        'current_stock' => 'decimal:3',
        'min_stock_level' => 'decimal:3',
        'max_stock_level' => 'decimal:3',
        'reorder_point' => 'decimal:3',
        'is_active' => 'boolean',
        'shelf_life_days' => 'integer',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
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
