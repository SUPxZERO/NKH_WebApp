<?php

namespace App\Services\Inventory;

use App\Models\Ingredient;
use App\Models\InventoryTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Adjust stock level for an ingredient.
     *
     * @param Ingredient $item
     * @param float $quantity Positive adds stock, negative removes stock
     * @param string $type Transaction type (adjustment, wastage, etc.)
     * @param string|null $reason Notes for the transaction
     * @param User|null $user User performing the action
     * @return InventoryTransaction
     */
    public function adjustStock(
        Ingredient $item,
        float $quantity,
        string $type = InventoryTransaction::TYPE_ADJUSTMENT,
        ?string $reason = null,
        ?User $user = null
    ): InventoryTransaction {
        return DB::transaction(function () use ($item, $quantity, $type, $reason, $user) {
            // Calculate new stock level
            $newStock = $item->current_stock + $quantity;

            // Prevent negative stock unless explicitly allowed (optional config)
            if ($newStock < 0) {
                // For now, we allow negative stock but could throw exception here
                // throw new Exception("Insufficient stock for item: {$item->name}");
            }

            // Determine location (fallback to user's location or first valid location)
            $locationId = $item->location_id;
            if (!$locationId && $user) {
                $locationId = $user->default_location_id;
            }
            if (!$locationId) {
                // Determine a fallback location ID (e.g. first active location)
                $locationId = \App\Models\Location::query()->where('is_active', true)->value('id')
                    ?? \App\Models\Location::value('id');
            }

            if (!$locationId) {
                throw new Exception("Cannot record transaction: No valid location found in the system.");
            }

            // Update item stock
            $item->current_stock = $newStock;
            $item->save();

            // Create transaction record
            return InventoryTransaction::create([
                'ingredient_id' => $item->id,
                'location_id' => $locationId, // Ensure we track where this stock is
                'type' => $type,
                'quantity' => $quantity,
                'unit_cost' => $item->cost_per_unit,
                'value' => abs($quantity) * $item->cost_per_unit,
                'current_stock_after' => $newStock,
                'user_id' => $user ? $user->id : null,
                'notes' => $reason,
                'transacted_at' => now(),
                'movement_type' => $quantity > 0 ? 'in' : 'out',
            ]);
        });
    }

    /**
     * Record usage from an order.
     */
    public function recordUsage(Ingredient $item, float $quantity, $source = null)
    {
        return $this->adjustStock($item, -$quantity, InventoryTransaction::TYPE_USAGE, 'Order Usage', null);
    }

    /**
     * Record wastage.
     */
    public function recordWastage(Ingredient $item, float $quantity, string $reason, User $user)
    {
        return $this->adjustStock($item, -$quantity, InventoryTransaction::TYPE_WASTAGE, $reason, $user);
    }
}
