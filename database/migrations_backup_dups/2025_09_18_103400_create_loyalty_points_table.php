<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->enum('type', ['earned','redeemed','adjusted'])->index();
            $table->integer('points');
            $table->integer('balance_after')->nullable();
            $table->timestamp('occurred_at')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'occurred_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_points');
    }
};
