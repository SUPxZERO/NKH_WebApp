<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('ingredient_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->enum('type', ['purchase','sale','spoilage','adjustment','transfer_in','transfer_out'])->index();
            $table->decimal('quantity', 12, 3);
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->decimal('value', 12, 2)->nullable();
            $table->morphs('sourceable');
            $table->text('notes')->nullable();
            $table->timestamp('transacted_at')->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete()->cascadeOnUpdate();
            $table->timestamps();

            $table->index(['ingredient_id', 'transacted_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
