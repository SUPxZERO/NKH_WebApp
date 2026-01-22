<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Optimizes dashboard stats: "Count orders by status for customer"
            $table->index(['customer_id', 'order_status_id'], 'idx_orders_customer_status_compound');
            // Optimizes "Orders created today"
            $table->index('created_at', 'idx_orders_created_at_perf');
        });

        Schema::table('payments', function (Blueprint $table) {
            // Often payments are looked up by invoice to get order
            if (!collect(DB::select("SHOW INDEXES FROM payments"))->pluck('Key_name')->contains('idx_payments_invoice_id')) {
                $table->index('invoice_id', 'idx_payments_invoice_id');
            }
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            // Optimizes "Show activity for user X"
            $table->index('user_id', 'idx_audit_logs_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_orders_customer_status_compound');
            $table->dropIndex('idx_orders_created_at_perf');
        });

        Schema::table('payments', function (Blueprint $table) {
            // We check existence in Up, so simple drop in Down might throw if it didn't verify.
            // But usually safe to drop if exists logic or catch error.
            $table->dropIndex('idx_payments_invoice_id');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_logs_user_id');
        });
    }
};
