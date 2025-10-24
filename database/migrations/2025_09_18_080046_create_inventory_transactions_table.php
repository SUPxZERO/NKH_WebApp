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
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->string('movement_type', 20)->index(); // purchase, usage, transfer, adjustment, waste
            $table->decimal('quantity', 10, 2);
            $table->string('unit', 20);
            $table->string('reference_type', 30)->nullable()->index(); // purchase_order, order, stock_transfer, inventory_count, waste_record
            $table->unsignedBigInteger('reference_id')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamp('transacted_at')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
