<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * FIX: Section 6 - Add missing composite indexes for performance
     */
    public function up(): void
    {
        // Orders table indexes
        if (!$this->indexExists('orders', 'idx_orders_customer_date')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['customer_id', 'ordered_at'], 'idx_orders_customer_date');
            });
        }
        
        if (!$this->indexExists('orders', 'idx_orders_status_date')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['status', 'ordered_at'], 'idx_orders_status_date');
            });
        }
        
        if (!$this->indexExists('orders', 'idx_orders_location_status')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index(['location_id', 'status'], 'idx_orders_location_status');
            });
        }

        // Order items table indexes
        if (!$this->indexExists('order_items', 'idx_order_items_menu_order')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->index(['menu_item_id', 'order_id'], 'idx_order_items_menu_order');
            });
        }

        // Payments table indexes
        if (!$this->indexExists('payments', 'idx_payments_status_created')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['status', 'created_at'], 'idx_payments_status_created');
            });
        }
        
        if (!$this->indexExists('payments', 'idx_payments_invoice_status')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['invoice_id', 'status'], 'idx_payments_invoice_status');
            });
        }
    }

    /**
     * Check if an index exists on a table (Laravel 11 compatible - no Doctrine)
     */
    private function indexExists(string $table, string $indexName): bool
    {
        $database = Schema::getConnection()->getDatabaseName();
        
        $result = Schema::getConnection()->selectOne(
            "SELECT COUNT(*) as count
             FROM information_schema.statistics
             WHERE table_schema = ?
             AND table_name = ?
             AND index_name = ?",
            [$database, $table, $indexName]
        );
        
        return $result->count > 0;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_customer_date');
            $table->dropIndex('idx_orders_status_date');
            $table->dropIndex('idx_orders_location_status');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('idx_order_items_menu_order');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_status_created');
            $table->dropIndex('idx_payments_invoice_status');
        });
    }
};
