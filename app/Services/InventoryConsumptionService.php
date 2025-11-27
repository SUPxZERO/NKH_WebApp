<?php

namespace App\Services;

use App\Models\InventoryTransaction;
use App\Models\OrderItem;

class InventoryConsumptionService
{
    /**
     * Record ingredient consumption for a served/prepared order item.
     */
    public function recordForOrderItem(OrderItem $orderItem): void
    {
        if (!in_array($orderItem->status, ['prepared', 'served'], true)) {
            return;
        }

        // Avoid double-booking consumption
        $alreadyRecorded = InventoryTransaction::where('order_item_id', $orderItem->id)
            ->exists();

        if ($alreadyRecorded) {
            return;
        }

        $orderItem->loadMissing('menuItem.recipe.ingredients.ingredient', 'order');
        $menuItem = $orderItem->menuItem;
        $recipe   = $menuItem?->recipe;

        if (!$recipe) {
            return;
        }

        foreach ($recipe->ingredients as $recipeIngredient) {
            $ingredient   = $recipeIngredient->ingredient;
            if (!$ingredient) {
                continue;
            }

            $perItemQty = (float) $recipeIngredient->quantity;
            $totalQty   = $perItemQty * $orderItem->quantity;

            if ($totalQty <= 0) {
                continue;
            }

            $unitCost = (float) ($ingredient->cost ?? 0);
            $value    = round($totalQty * $unitCost, 2);

            InventoryTransaction::create([
                'ingredient_id'   => $ingredient->id,
                'location_id'     => $orderItem->order->location_id,
                'user_id'         => $orderItem->order->employee_id ?? $orderItem->order->customer_id ?? 1,
                'type'            => 'out',
                'movement_type'   => 'usage',
                'quantity'        => $totalQty,
                'unit'            => $ingredient->unit,
                'reference_type'  => 'order',
                'reference_id'    => $orderItem->order_id,
                'order_item_id'   => $orderItem->id,
                'notes'           => 'Auto-consumption for order item '.$orderItem->id,
                'transacted_at'   => now(),
            ]);
        }
    }
}
