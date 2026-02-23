<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * AUDIT FIX: Schema corrections identified in production system audit.
 *
 * 1. Remove duplicate unique constraint on orders table
 * 2. Add missing composite indexes for common query patterns
 * 3. Add index on invoices.status (used in all invoice queries)
 * 4. Add index on payments.payment_method_id (for analytics)
 */
return new class extends Migration {
    public function up(): void
    {
        // 1. Fix duplicate unique constraint on orders table
        // The orders table has BOTH 'orders_location_order_unique' AND
        // 'orders_location_id_order_number_unique' — identical constraints.
        Schema::table('orders', function (Blueprint $table) {
            // Drop the duplicate (keep the more descriptive name)
            try {
                $table->dropUnique('orders_location_order_unique');
            } catch (\Exception $e) {
                // Index may not exist depending on migration state
            }
        });

        // 2. Add missing composite indexes for performance
        Schema::table('orders', function (Blueprint $table) {
            // Branch + status filtering (admin dashboard, branch reports)
            if (!$this->indexExists('orders', 'idx_orders_location_status_id')) {
                $table->index(['location_id', 'order_status_id'], 'idx_orders_location_status_id');
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            // Status-based queries (unpaid/paid/partial scopes)
            if (!$this->indexExists('invoices', 'idx_invoices_status')) {
                $table->index('status', 'idx_invoices_status');
            }
            // Location + status composite for branch-filtered reports
            if (!$this->indexExists('invoices', 'idx_invoices_location_status')) {
                $table->index(['location_id', 'status'], 'idx_invoices_location_status');
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            // Payment method analytics
            if (!$this->indexExists('payments', 'idx_payments_method_id')) {
                $table->index('payment_method_id', 'idx_payments_method_id');
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            // Kitchen display: order items by status
            if (!$this->indexExists('order_items', 'idx_order_items_order_status')) {
                $table->index(['order_id', 'status'], 'idx_order_items_order_status');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            try {
                $table->dropIndex('idx_orders_location_status_id');
            } catch (\Exception $e) {
            }
            // Re-add the duplicate unique if rolling back
            try {
                $table->unique(['location_id', 'order_number'], 'orders_location_order_unique');
            } catch (\Exception $e) {
            }
        });

        Schema::table('invoices', function (Blueprint $table) {
            try {
                $table->dropIndex('idx_invoices_status');
            } catch (\Exception $e) {
            }
            try {
                $table->dropIndex('idx_invoices_location_status');
            } catch (\Exception $e) {
            }
        });

        Schema::table('payments', function (Blueprint $table) {
            try {
                $table->dropIndex('idx_payments_method_id');
            } catch (\Exception $e) {
            }
        });

        Schema::table('order_items', function (Blueprint $table) {
            try {
                $table->dropIndex('idx_order_items_order_status');
            } catch (\Exception $e) {
            }
        });
    }

    /**
     * Check if an index already exists on a table.
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }
};
