<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * AUDIT FIX: Backfill order_items.cost_price from menu_items.cost.
 *
 * The cost_price column exists in the order_items table but was never populated
 * by OrderCalculationService.calculate(). This migration backfills historical
 * data using the current menu_items.cost value.
 *
 * NOTE: This uses the CURRENT cost from menu_items, which may differ from the
 * actual cost at the time of sale. For future orders, cost_price will be
 * captured at sale time by the updated OrderCalculationService.
 *
 * This migration is safe to run multiple times (idempotent).
 */
return new class extends Migration {
    public function up(): void
    {
        $affected = DB::update('
            UPDATE order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            SET oi.cost_price = mi.cost
            WHERE oi.cost_price IS NULL
              AND mi.cost IS NOT NULL
        ');

        Log::info("AUDIT FIX: Backfilled cost_price for {$affected} order items");
    }

    public function down(): void
    {
        // Intentionally left empty - we cannot determine which rows had NULL
        // vs which had real cost_price values before this migration.
        // The forward fix (OrderCalculationService change) ensures new orders
        // always populate cost_price going forward.
        Log::info('AUDIT FIX: cost_price backfill rollback skipped (non-destructive)');
    }
};
