<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->string('sku', 60)->nullable();
            $table->string('name', 200);
            $table->string('unit', 20)->default('unit');
            $table->decimal('quantity_on_hand', 12, 3)->default(0);
            $table->decimal('reorder_level', 12, 3)->default(0);
            $table->decimal('reorder_quantity', 12, 3)->nullable();
            $table->decimal('cost', 12, 2)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            

            $table->unique(['location_id', 'sku']);
            $table->index(['location_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
