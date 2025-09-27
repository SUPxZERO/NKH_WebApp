<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('recipe_ingredients')) {
            return;
        }
        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('ingredient_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->decimal('quantity', 12, 3);
            $table->string('unit', 20)->nullable();
            $table->timestamps();

            $table->unique(['recipe_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_ingredients');
    }
};
