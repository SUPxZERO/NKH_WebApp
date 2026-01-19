<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: menu_items table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('category_id')->nullable();
            $table->string('sku', 50)->nullable();
            $table->string('slug', 150);
            $table->decimal('price', 12, 2);
            $table->double('rating')->nullable();
            $table->unsignedInteger('reviews_count')->default(0);
            $table->decimal('cost', 12, 2)->nullable();
            $table->integer('prep_time')->nullable();
            $table->smallInteger('cook_time')->unsigned()->nullable()->comment('Cooking time in minutes');
            $table->string('serving_size', 50)->nullable()->comment('e.g., "1 plate", "250g", "2 pieces"');
            $table->tinyInteger('spice_level')->unsigned()->default(0)->comment('0=none, 1=mild, 2=medium, 3=hot, 4=very hot, 5=extreme');
            $table->integer('calories')->nullable();
            $table->json('nutrition')->nullable()->comment('JSON: {calories, protein, carbs, fat, fiber, sodium, sugar}');
            $table->json('ingredients')->nullable()->comment('JSON array of ingredient names');
            $table->json('allergens')->nullable()->comment('JSON array: nuts, dairy, gluten, shellfish, eggs, soy, etc.');
            $table->json('dietary_tags')->nullable()->comment('JSON array: vegetarian, vegan, gluten-free, keto, halal, kosher');
            $table->string('image_path', 255)->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_popular')->default(false)->index();
            $table->boolean('is_featured')->default(false);
            $table->unsignedInteger('featured_order')->default(0);
            $table->string('badge', 50)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->enum('availability_status', ['available', 'low_stock', 'out_of_stock', 'seasonal'])->default('available');
            $table->string('availability_note', 255)->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['location_id', 'slug']);
            $table->unique(['location_id', 'sku']);
            $table->index('slug');

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_items');
    }
};
