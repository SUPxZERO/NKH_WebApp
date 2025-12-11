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
        Schema::table('orders', function (Blueprint $table) {
            // Payment mode - determines when payment is collected
            $table->enum('payment_mode', [
                'pay_now',          // Customer pays immediately (default)
                'pay_on_delivery',  // Driver collects cash on delivery
                'pay_on_pickup',    // Pay when picking up
                'pay_at_counter'    // Pay at counter (for dine-in)
            ])->default('pay_now')->after('payment_status');
            
            // Who collected the payment (for delivery/pickup)
            $table->foreignId('payment_collected_by')->nullable()->after('payment_mode')
                ->constrained('users')->nullOnDelete();
            
            // When was the payment collected
            $table->timestamp('payment_collected_at')->nullable()->after('payment_collected_by');
            
            // Payment collection notes (e.g., "Exact change", "Customer paid extra")
            $table->string('payment_collection_notes', 500)->nullable()->after('payment_collected_at');
            
            // Add index for filtering by payment mode
            $table->index(['payment_mode', 'payment_status'], 'idx_order_payment_mode_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('idx_order_payment_mode_status');
            $table->dropForeign(['payment_collected_by']);
            $table->dropColumn([
                'payment_mode',
                'payment_collected_by',
                'payment_collected_at',
                'payment_collection_notes'
            ]);
        });
    }
};

