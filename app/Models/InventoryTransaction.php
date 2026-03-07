<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    use HasFactory, \App\Traits\BranchScopable;

    // Transaction Types
    const TYPE_PURCHASE = 'purchase';
    const TYPE_ADJUSTMENT = 'adjustment';
    const TYPE_USAGE = 'usage';
    const TYPE_WASTAGE = 'wastage';
    const TYPE_TRANSFER = 'transfer';
    const TYPE_RETURN = 'return';

    protected $guarded = [
        'id',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_cost' => 'decimal:2',
        'value' => 'decimal:2',
        'transacted_at' => 'datetime',
    ];

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function sourceable()
    {
        return $this->morphTo();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
