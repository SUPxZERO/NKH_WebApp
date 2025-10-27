<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Fix order status enum to match controller expectations
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'mysql') {
            // Update the enum to include all necessary statuses
            DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('pending','received','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'received'");
            
            // Add missing columns if they don't exist
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'payment_status')) {
                    $table->enum('payment_status', ['unpaid', 'paid', 'refunded'])->default('unpaid')->after('status');
                }
                if (!Schema::hasColumn('orders', 'order_type')) {
                    $table->string('order_type')->nullable()->after('type');
                }
                if (!Schema::hasColumn('orders', 'scheduled_at')) {
                    $table->timestamp('scheduled_at')->nullable()->after('placed_at');
                }
                if (!Schema::hasColumn('orders', 'customer_address_id')) {
                    $table->foreignId('customer_address_id')->nullable()->after('customer_id')->constrained('customer_addresses')->nullOnDelete();
                }
                if (!Schema::hasColumn('orders', 'kitchen_submitted_at')) {
                    $table->timestamp('kitchen_submitted_at')->nullable()->after('scheduled_at');
                }
                            });
        }
    }

    public function down(): void
    {
        // Revert to original enum
        $driver = Schema::getConnection()->getDriverName();
        
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE `orders` MODIFY `status` ENUM('open','completed','cancelled') NOT NULL DEFAULT 'open'");
            
            Schema::table('orders', function (Blueprint $table) {
                $table->dropColumn([
                    'payment_status',
                    'order_type', 
                    'scheduled_at',
                    'customer_address_id',
                    'kitchen_submitted_at',
                                    ]);
            });
        }
    }
};
