<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->string('sku', 50)->nullable();
            $table->string('slug', 150)->index();
            $table->decimal('price', 12, 2);
            $table->decimal('cost', 12, 2)->nullable();
            $table->string('image_path')->nullable();
            $table->boolean('is_popular')->default(false)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
            

            $table->unique(['location_id', 'slug']);
            $table->unique(['location_id', 'sku']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
