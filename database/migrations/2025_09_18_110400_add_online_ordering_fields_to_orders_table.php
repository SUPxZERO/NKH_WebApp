<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // New discriminator for online ordering
            if (!Schema::hasColumn('orders', 'order_type')) {
                $table->enum('order_type', ['dine-in','pickup','delivery'])->default('dine-in')->index();
            }

            // Delivery address (only for delivery orders)
            if (!Schema::hasColumn('orders', 'customer_address_id')) {
                $table->foreignId('customer_address_id')->nullable()
                    ->constrained('customer_addresses')->nullOnDelete()->cascadeOnUpdate();
            }

            // Enhanced lifecycle status and payment status
            if (!Schema::hasColumn('orders', 'payment_status')) {
                $table->enum('payment_status', ['unpaid','paid','refunded'])->default('unpaid')->index();
            }

            // Scheduling support
            if (!Schema::hasColumn('orders', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->index();
            }
        });

        // Attempt to alter `status` enum values for MySQL
        try {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'mysql' && Schema::hasColumn('orders', 'status')) {
                DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('pending_payment','received','in_kitchen','ready_for_pickup','out_for_delivery','completed','cancelled') NOT NULL DEFAULT 'pending_payment'");
            }
        } catch (\Throwable $e) {
            // No-op: On non-MySQL drivers or if alteration fails, keep existing definition.
        }
    }

    public function down(): void
    {
        // Revert status enum to prior definition for MySQL only
        try {
            $driver = Schema::getConnection()->getDriverName();
            if ($driver === 'mysql') {
                DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('open','completed','cancelled') NOT NULL DEFAULT 'open'");
            }
        } catch (\Throwable $e) {
            // ignore
        }

        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'customer_address_id')) {
                try { $table->dropConstrainedForeignId('customer_address_id'); } catch (\Throwable $e) { /* ignore */ }
            }
            $drops = [];
            foreach (['order_type', 'payment_status', 'scheduled_at'] as $col) {
                if (Schema::hasColumn('orders', $col)) { $drops[] = $col; }
            }
            if (!empty($drops)) {
                $table->dropColumn($drops);
            }
        });
    }
};
