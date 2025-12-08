<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates daily settlements table for end-of-day reconciliation.
     */
    public function up(): void
    {
        Schema::create('daily_settlements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->date('settlement_date');
            
            // Totals
            $table->unsignedInteger('total_orders')->default(0);
            $table->decimal('total_revenue', 14, 2)->default(0);
            $table->decimal('total_refunds', 14, 2)->default(0);
            $table->decimal('net_revenue', 14, 2)->default(0);
            
            // By payment method
            $table->decimal('cash_total', 14, 2)->default(0);
            $table->decimal('card_total', 14, 2)->default(0);
            $table->decimal('qr_total', 14, 2)->default(0);
            $table->decimal('other_total', 14, 2)->default(0);
            
            // Currency breakdown
            $table->decimal('usd_total', 14, 2)->default(0);
            $table->decimal('khr_total', 14, 2)->default(0);
            
            // Status
            $table->enum('status', ['pending', 'reconciled', 'discrepancy', 'closed'])->default('pending');
            $table->decimal('discrepancy_amount', 14, 2)->nullable();
            
            // Reconciliation tracking
            $table->foreignId('reconciled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reconciled_at')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            
            // Constraints
            $table->unique(['location_id', 'settlement_date'], 'uk_settlement_location_date');
            
            // Indexes
            $table->index(['settlement_date', 'status'], 'idx_settlement_date_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_settlements');
    }
};
