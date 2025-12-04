<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add missing columns to purchase_orders table
     */
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_orders', 'location_id')) {
                $table->unsignedBigInteger('location_id')->nullable()->after('id');
            }
            if (!Schema::hasColumn('purchase_orders', 'supplier_id')) {
                $table->unsignedBigInteger('supplier_id')->nullable()->after('location_id');
            }
            if (!Schema::hasColumn('purchase_orders', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('supplier_id');
            }
            if (!Schema::hasColumn('purchase_orders', 'po_number')) {
                $table->string('po_number', 50)->unique()->nullable()->after('created_by');
            }
            if (!Schema::hasColumn('purchase_orders', 'order_date')) {
                $table->date('order_date')->nullable()->after('po_number');
            }
            if (!Schema::hasColumn('purchase_orders', 'expected_delivery_date')) {
                $table->date('expected_delivery_date')->nullable()->after('order_date');
            }
            if (!Schema::hasColumn('purchase_orders', 'received_date')) {
                $table->datetime('received_date')->nullable()->after('expected_delivery_date');
            }
            if (!Schema::hasColumn('purchase_orders', 'status')) {
                $table->string('status', 30)->default('draft')->after('received_date');
            }
            if (!Schema::hasColumn('purchase_orders', 'total_amount')) {
                $table->decimal('total_amount', 12, 2)->default(0)->after('status');
            }
            if (!Schema::hasColumn('purchase_orders', 'notes')) {
                $table->text('notes')->nullable()->after('total_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $columns = ['location_id', 'supplier_id', 'created_by', 'po_number', 'order_date', 
                       'expected_delivery_date', 'received_date', 'status', 'total_amount', 'notes'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('purchase_orders', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
