<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extend invoices.status enum for richer financial states
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `invoices` MODIFY `status` ENUM('draft','issued','partial','paid','cancelled','refunded','overpaid') NOT NULL DEFAULT 'draft'");
        }

        // Add nullable promotion_id FK on orders
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'promotion_id')) {
                $table->foreignId('promotion_id')
                    ->nullable()
                    ->after('order_type')
                    ->constrained('promotions')
                    ->nullOnDelete()
                    ->cascadeOnUpdate();
            }
        });
    }

    public function down(): void
    {
        // Revert invoices.status enum to original set
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `invoices` MODIFY `status` ENUM('draft','issued','paid','cancelled') NOT NULL DEFAULT 'draft'");
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'promotion_id')) {
                $table->dropConstrainedForeignId('promotion_id');
            }
        });
    }
};
