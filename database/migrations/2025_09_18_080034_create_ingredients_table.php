<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: ingredients table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ingredients', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->string('code', 60)->nullable()->unique('ingredients_location_id_sku_unique');
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->string('category', 255)->default('other');
            $table->decimal('current_stock', 12, 3)->default(0.000);
            $table->decimal('reorder_point', 12, 3)->default(0.000);
            $table->decimal('cost_per_unit', 12, 2)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('unit_id')->nullable();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->decimal('min_stock_level', 10, 3)->nullable();
            $table->decimal('max_stock_level', 10, 3)->nullable();
            $table->text('storage_requirements')->nullable();
            $table->text('allergens')->nullable();
            $table->integer('shelf_life_days')->nullable();

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('set null');
            $table->foreign('unit_id')->references('id')->on('units')->onDelete('set null');
            $table->foreign('supplier_id')->references('id')->on('suppliers')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ingredients');
    }
};
