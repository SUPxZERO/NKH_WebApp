<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: inventory_transactions table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * Polymorphic: sourceable_type, sourceable_id
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ingredient_id');
            $table->string('type', 50)->nullable();
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('movement_type', 20)->index();
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->decimal('value', 12, 2)->nullable();
            $table->string('sourceable_type', 100)->nullable()->index();
            $table->unsignedBigInteger('sourceable_id')->nullable()->index();
            $table->string('unit', 20)->nullable();
            $table->string('reference_type', 30)->nullable()->index();
            $table->unsignedBigInteger('reference_id')->nullable()->index();
            $table->unsignedBigInteger('order_item_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('transacted_at')->useCurrent();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index(['order_item_id', 'ingredient_id'], 'idx_inventory_out_order_item');

            $table->foreign('ingredient_id')->references('id')->on('ingredients')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('location_id')->references('id')->on('locations')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('order_item_id')->references('id')->on('order_items')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
