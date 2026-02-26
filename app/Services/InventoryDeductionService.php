<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\InventoryOrderDeduction;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\StockMovement;
use App\Models\Recipe;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * InventoryDeductionService
 * 
 * Handles automatic inventory deductions based on recipes when orders are completed.
 * FIX: D0.1 - Creates audit trail linking orders to inventory deductions.
 */
class InventoryDeductionService
{
    /**
     * Process inventory deductions for a completed order
     * 
     * @param Order $order
     * @param int $userId User performing the deduction (usually system or admin)
     * @return array Summary of deductions
     */
    public function processOrderDeductions(Order $order, int $userId): array
    {
        if ($order->status !== 'completed') {
            Log::warning('Attempted to deduct inventory for non-completed order', [
                'order_id' => $order->id,
                'status' => $order->status
            ]);
            return ['success' => false, 'message' => 'Order must be completed to deduct inventory'];
        }

        $deductions = [];
        $errors = [];

        DB::transaction(function () use ($order, $userId, &$deductions, &$errors) {
            // AUDIT FIX: Atomic double-deduction guard inside transaction
            // This prevents two concurrent requests from both passing the check
            if ($order->inventoryDeductions()->where('status', 'deducted')->lockForUpdate()->exists()) {
                Log::info('Order inventory already deducted', ['order_id' => $order->id]);
                return;
            }

            foreach ($order->items as $orderItem) {
                try {
                    $itemDeductions = $this->deductForOrderItem($orderItem, $order->location_id, $userId);
                    $deductions = array_merge($deductions, $itemDeductions);
                } catch (\Exception $e) {
                    $errors[] = [
                        'order_item_id' => $orderItem->id,
                        'menu_item' => $orderItem->menuItem->name ?? 'Unknown',
                        'error' => $e->getMessage()
                    ];
                    Log::error('Failed to deduct inventory for order item', [
                        'order_item_id' => $orderItem->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
        });

        return [
            'success' => empty($errors),
            'deductions_count' => count($deductions),
            'deductions' => $deductions,
            'errors' => $errors
        ];
    }

    /**
     * Deduct inventory for a single order item based on its recipe
     * 
     * @param OrderItem $orderItem
     * @param int $locationId
     * @param int $userId
     * @return array Array of InventoryOrderDeduction records created
     */
    protected function deductForOrderItem(OrderItem $orderItem, int $locationId, int $userId): array
    {
        $menuItem = $orderItem->menuItem;

        // Load recipe with ingredients
        $recipe = Recipe::with('ingredients.ingredient')
            ->where('menu_item_id', $menuItem->id)
            ->where('is_active', true)
            ->first();

        if (!$recipe) {
            Log::warning('No recipe found for menu item', [
                'menu_item_id' => $menuItem->id,
                'name' => $menuItem->name
            ]);
            return []; // No recipe = no deduction (some items may not have recipes)
        }

        $deductions = [];

        foreach ($recipe->ingredients as $recipeIngredient) {
            $ingredient = $recipeIngredient->ingredient;
            $quantityPerServing = $recipeIngredient->quantity;
            $totalQuantity = $quantityPerServing * $orderItem->quantity;

            // Create deduction record (pending)
            $deduction = InventoryOrderDeduction::create([
                'order_id' => $orderItem->order_id,
                'order_item_id' => $orderItem->id,
                'ingredient_id' => $ingredient->id,
                'location_id' => $locationId,
                'quantity_deducted' => $totalQuantity,
                'unit' => $recipeIngredient->unit,
                'status' => 'pending',
                'deducted_by' => $userId,
                'notes' => "Auto-deduction for {$menuItem->name} x{$orderItem->quantity}"
            ]);

            // AUDIT FIX: Pessimistic locking to prevent concurrent overselling
            // lockForUpdate() ensures no other transaction can read/modify this row
            // until this transaction commits, preventing lost-update anomalies.
            $inventory = Inventory::lockForUpdate()->firstOrCreate(
                [
                    'location_id' => $locationId,
                    'ingredient_id' => $ingredient->id
                ],
                ['quantity' => 0]
            );

            // Calculate new balance
            $newBalance = $inventory->quantity - $totalQuantity;

            // 1. Update legacy inventory (to keep old UI working until fully migrated)
            $inventory->update(['quantity' => $newBalance]);

            // 2. AUDIT FIX: Append to immutable Stock Ledger
            StockMovement::create([
                'ingredient_id' => $ingredient->id,
                'location_id' => $locationId,
                'movement_type' => 'order_out',
                'quantity' => -$totalQuantity,
                'running_balance' => $newBalance,
                'reference_type' => get_class($orderItem->order),
                'reference_id' => $orderItem->order->id,
                'created_by' => $userId,
            ]);

            // Create inventory transaction
            $transaction = InventoryTransaction::create([
                'location_id' => $locationId,
                'ingredient_id' => $ingredient->id,
                'type' => 'order_deduction',
                'movement_type' => 'out',
                'quantity' => -$totalQuantity, // Negative for deduction
                'notes' => "Order #{$orderItem->order->order_number} - {$menuItem->name}",
                'transacted_at' => now(),
                'created_by' => $userId,
                'user_id' => $userId
            ]);

            // Mark deduction as completed
            $deduction->markDeducted($transaction->id, $userId);

            $deductions[] = $deduction;

            Log::info('Inventory deducted', [
                'ingredient' => $ingredient->name,
                'quantity' => $totalQuantity,
                'unit' => $recipeIngredient->unit,
                'order_item_id' => $orderItem->id
            ]);
        }

        return $deductions;
    }

    /**
     * Revert inventory deductions for a cancelled or refunded order
     * 
     * @param Order $order
     * @param int $userId
     * @param string $reason
     * @return bool
     */
    public function revertOrderDeductions(Order $order, int $userId, string $reason = 'Order cancelled/refunded'): bool
    {
        $deductions = $order->inventoryDeductions()->where('status', 'deducted')->get();

        if ($deductions->isEmpty()) {
            return true; // Nothing to revert
        }

        DB::transaction(function () use ($order, $deductions, $userId, $reason) {
            foreach ($deductions as $deduction) {
                // AUDIT FIX: Pessimistic locking on revert as well
                $inventory = Inventory::lockForUpdate()->firstOrCreate(
                    [
                        'location_id' => $deduction->location_id,
                        'ingredient_id' => $deduction->ingredient_id
                    ],
                    ['quantity' => 0]
                );

                // Calculate new balance
                $newBalance = $inventory->quantity + $deduction->quantity_deducted;

                // 1. Update legacy inventory
                $inventory->update(['quantity' => $newBalance]);

                // 2. AUDIT FIX: Append to immutable Stock Ledger
                StockMovement::create([
                    'ingredient_id' => $deduction->ingredient_id,
                    'location_id' => $deduction->location_id,
                    'movement_type' => 'reversal',
                    'quantity' => $deduction->quantity_deducted,
                    'running_balance' => $newBalance,
                    'reference_type' => get_class($order),
                    'reference_id' => $order->id,
                    'created_by' => $userId,
                ]);

                // Create reversal transaction
                InventoryTransaction::create([
                    'location_id' => $deduction->location_id,
                    'ingredient_id' => $deduction->ingredient_id,
                    'type' => 'deduction_reversal',
                    'movement_type' => 'in',
                    'quantity' => $deduction->quantity_deducted, // Positive for reversal
                    'notes' => "Reversal: {$reason}",
                    'transacted_at' => now(),
                    'created_by' => $userId,
                    'user_id' => $userId
                ]);

                // Mark deduction as reverted
                $deduction->revert($userId, $reason);
            }
        });

        return true;
    }
}
