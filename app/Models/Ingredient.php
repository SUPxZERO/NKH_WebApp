<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ingredient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'location_id',
        'sku',
        'name',
        'unit',
        'quantity_on_hand',
        'reorder_level',
        'reorder_quantity',
        'cost',
        'is_active',
    ];

    protected $casts = [
        'quantity_on_hand' => 'decimal:3',
        'reorder_level' => 'decimal:3',
        'reorder_quantity' => 'decimal:3',
        'cost' => 'decimal:2',
        'is_active' => 'boolean',
    ];

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
