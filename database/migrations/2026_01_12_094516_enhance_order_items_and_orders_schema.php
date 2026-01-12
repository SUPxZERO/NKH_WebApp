<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Enhance order_items
        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'cost_price')) {
                $table->decimal('cost_price', 12, 2)->nullable()->after('unit_price')
                    ->comment('Cost of the item at the moment of sale for P&L');
            }
            if (!Schema::hasColumn('order_items', 'notes')) {
                $table->text('notes')->nullable()->after('special_instructions')
                    ->comment('Internal notes for staff (e.g., reason for void)');
            }
        });

        // 2. Enhance orders
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'reservation_id')) {
                $table->foreignId('reservation_id')->nullable()->after('table_id')
                    ->constrained('reservations')->nullOnDelete()
                    ->comment('Link to reservation if applicable');
            }
            if (!Schema::hasColumn('orders', 'shift_id')) {
                $table->foreignId('shift_id')->nullable()->after('employee_id')
                    ->constrained('shifts')->nullOnDelete()
                    ->comment('Shift during which order was placed');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['reservation_id']);
            $table->dropColumn('reservation_id');
            $table->dropForeign(['shift_id']);
            $table->dropColumn('shift_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropColumn(['cost_price', 'notes']);
        });
    }
};
