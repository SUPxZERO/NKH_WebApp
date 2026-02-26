<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AUDIT FIX (Phase D): Creates the append-only Stock Ledger.
 *
 * Moving from mutable inventory.quantity to an append-only ledger solves:
 * 1. Concurrency (inserts don't lock each other like updates do)
 * 2. Auditability (every gram of ingredient is tracked to a specific user/order)
 * 3. Historical reporting (what was the stock value last Tuesday?)
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();

            // e.g. 'purchase_in', 'order_out', 'adjustment', 'transfer', 'waste', 'reversal'
            $table->string('movement_type', 30);

            // Positive for inbound (purchases, positive adjustments)
            // Negative for outbound (sales, waste, negative adjustments)
            $table->decimal('quantity', 10, 3);

            // Computed at insert time to allow fast historical stock queries
            $table->decimal('running_balance', 10, 3);

            // Polymorphic relation to the entity that caused the movement (Order, PurchaseOrder, etc.)
            $table->nullableMorphs('reference');

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();

            // Index for fast running balance lookups and daily stock snapshots
            $table->index(['ingredient_id', 'location_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
