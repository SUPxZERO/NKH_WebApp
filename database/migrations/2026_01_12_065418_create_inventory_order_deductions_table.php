<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This table creates an audit trail linking orders to inventory deductions.
     * FIX: D0.1 - Inventory-Order Deduction Gap
     */
    public function up(): void
    {
        Schema::create('inventory_order_deductions', function (Blueprint $table) {
            $table->id();
            
            // Link to order and order item
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('order_item_id')->constrained('order_items')->onDelete('cascade');
            
            // Link to ingredient
            $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
            $table->foreignId('location_id')->constrained('locations')->onDelete('cascade');
            
            // Deduction details
            $table->decimal('quantity_deducted', 10, 3);
            $table->string('unit', 20); // kg, L, pcs, etc.
            
            // Status tracking
            $table->enum('status', ['pending', 'deducted', 'reverted', 'cancelled'])->default('pending');
            $table->timestamp('deducted_at')->nullable();
            $table->timestamp('reverted_at')->nullable();
            
            // Link to inventory transaction (if created)
            $table->foreignId('inventory_transaction_id')->nullable()->constrained('inventory_transactions')->onDelete('set null');
            
            // Audit trail
            $table->foreignId('deducted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes for performance (custom names to avoid MySQL 64-char limit)
            $table->index(['order_id', 'status'], 'idx_inv_ded_order_status');
            $table->index(['ingredient_id', 'location_id', 'status'], 'idx_inv_ded_ing_loc_status');
            $table->index('deducted_at', 'idx_inv_ded_deducted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_order_deductions');
    }
};
