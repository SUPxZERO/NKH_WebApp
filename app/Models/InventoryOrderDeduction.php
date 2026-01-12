<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryOrderDeduction extends Model
{
    use HasFactory;

    protected $guarded = [
        'id',
        'order_id',
        'order_item_id',
        'ingredient_id',
        'location_id',
        'quantity_deducted',
        'unit',
        'status',
        'deducted_at',
        'reverted_at',
        'inventory_transaction_id',
        'deducted_by',
        'notes',
            'created_at',
        'updated_at',
    ];

    protected $casts = [
        'quantity_deducted' => 'decimal:3',
        'deducted_at' => 'datetime',
        'reverted_at' => 'datetime',
    ];

    // ==================== RELATIONSHIPS ====================

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem()
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function location()
    {
        return $this->belongsTo(Location::class);
    }

    public function inventoryTransaction()
    {
        return $this->belongsTo(InventoryTransaction::class);
    }

    public function deductedByUser()
    {
        return $this->belongsTo(User::class, 'deducted_by');
    }

    // ==================== HELPER METHODS ====================

    /**
     * Mark deduction as completed
     */
    public function markDeducted(int $transactionId, int $userId): bool
    {
        $this->status = 'deducted';
        $this->deducted_at = now();
        $this->inventory_transaction_id = $transactionId;
        $this->deducted_by = $userId;
        return $this->save();
    }

    /**
     * Revert the deduction
     */
    public function revert(int $userId, string $reason = null): bool
    {
        $this->status = 'reverted';
        $this->reverted_at = now();
        $this->notes = $reason;
        return $this->save();
    }

    /**
     * Check if deduction is pending
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if deduction is complete
     */
    public function isDeducted(): bool
    {
        return $this->status === 'deducted';
    }
}
