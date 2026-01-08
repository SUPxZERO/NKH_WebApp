<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Phase 1 Performance Indexes - Fixed column names
     * Expected Impact: 10-20x faster queries on admin pages
     */
    public function up(): void
    {
        // ORDERS TABLE - Most critical for performance
        Schema::table('orders', function (Blueprint $table) {
            // Use created_at since that's what exists
            $table->index(['location_id', 'created_at'], 'idx_orders_location_created');
            $table->index(['location_id', 'status'], 'idx_orders_location_status');
            $table->index(['customer_id', 'created_at'], 'idx_orders_customer_created');
        });

        // ORDER_ITEMS TABLE
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->index(['order_id'], 'idx_order_items_order');
            });
        }

        // INVOICES TABLE
        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->index(['created_at'], 'idx_invoices_created');
                if (Schema::hasColumn('invoices', 'amount_due')) {
                    $table->index(['amount_due'], 'idx_invoices_amount_due');
                }
            });
        }

        // PAYMENTS TABLE
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['invoice_id', 'status'], 'idx_payments_invoice_status');
                if (Schema::hasColumn('payments', 'qr_reference')) {
                    $table->index(['qr_reference'], 'idx_payments_qr_reference');
                }
            });
        }

        // CUSTOMERS TABLE
        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                if (Schema::hasColumn('customers', 'email')) {
                    $table->index(['email'], 'idx_customers_email');
                }
                if (Schema::hasColumn('customers', 'phone')) {
                    $table->index(['phone'], 'idx_customers_phone');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_location_created');
            $table->dropIndex('idx_orders_location_status');
            $table->dropIndex('idx_orders_customer_created');
        });

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropIndex('idx_order_items_order');
            });
        }

        if (Schema::hasTable('invoices')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropIndex('idx_invoices_created');
                if (Schema::hasColumn('invoices', 'amount_due')) {
                    $table->dropIndex('idx_invoices_amount_due');
                }
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropIndex('idx_payments_invoice_status');
                if (Schema::hasColumn('payments', 'qr_reference')) {
                    $table->dropIndex('idx_payments_qr_reference');
                }
            });
        }

        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                if (Schema::hasColumn('customers', 'email')) {
                    $table->dropIndex('idx_customers_email');
                }
                if (Schema::hasColumn('customers', 'phone')) {
                    $table->dropIndex('idx_customers_phone');
                }
            });
        }
    }
};

