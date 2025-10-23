<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop type if it exists (we'll use order_type instead)
            if (Schema::hasColumn('orders', 'type')) {
                $table->dropColumn('type');
            }

            // Update status enum values
            try {
                $driver = Schema::getConnection()->getDriverName();
                if ($driver === 'mysql') {
                    DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('pending', 'received', 'preparing', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'");
                }
            } catch (\Throwable $e) {
                // ignore
            }

            // Add new columns if they don't exist
            if (!Schema::hasColumn('orders', 'tax_amount')) {
                $table->decimal('tax_amount', 12, 2)->default(0)->after('subtotal');
            }
            if (!Schema::hasColumn('orders', 'discount_amount')) {
                $table->decimal('discount_amount', 12, 2)->default(0)->after('tax_amount');
            }
            if (!Schema::hasColumn('orders', 'total_amount')) {
                $table->decimal('total_amount', 12, 2)->default(0)->after('discount_amount');
            }

            // Drop old columns if they exist
            $columnsToCheck = ['tax_total', 'discount_total', 'total'];
            $columnsToDrop = [];
            foreach ($columnsToCheck as $column) {
                if (Schema::hasColumn('orders', $column)) {
                    $columnsToDrop[] = $column;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }

            // Rename columns if old names exist
            if (Schema::hasColumn('orders', 'placed_at') && !Schema::hasColumn('orders', 'ordered_at')) {
                $table->renameColumn('placed_at', 'ordered_at');
            }
            if (Schema::hasColumn('orders', 'closed_at') && !Schema::hasColumn('orders', 'completed_at')) {
                $table->renameColumn('closed_at', 'completed_at');
            }
            if (Schema::hasColumn('orders', 'notes') && !Schema::hasColumn('orders', 'special_instructions')) {
                $table->renameColumn('notes', 'special_instructions');
            }

            // Add estimated_ready_time if it doesn't exist
            if (!Schema::hasColumn('orders', 'estimated_ready_time')) {
                $table->timestamp('estimated_ready_time')->nullable()->after('special_instructions');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn(['order_type', 'status', 'tax_amount', 'discount_amount', 'total_amount']);

            // Add back original columns
            $table->enum('type', ['dine_in', 'takeaway', 'delivery'])->after('order_number')->default('dine_in')->index();
            $table->enum('status', ['open', 'completed', 'cancelled'])->after('type')->default('open')->index();
            $table->decimal('tax_total', 12, 2)->default(0)->after('subtotal');
            $table->decimal('discount_total', 12, 2)->default(0)->after('tax_total');
            $table->decimal('total', 12, 2)->default(0)->after('service_charge');

            // Rename timestamps back
            $table->renameColumn('ordered_at', 'placed_at');
            $table->renameColumn('completed_at', 'closed_at');
            $table->renameColumn('special_instructions', 'notes');
        });
    }
};