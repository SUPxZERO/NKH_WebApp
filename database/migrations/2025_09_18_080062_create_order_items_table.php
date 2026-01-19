<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: order_items table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('menu_item_id');
            $table->smallInteger('quantity')->unsigned()->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('cost_price', 12, 2)->nullable()->comment('Cost of the item at the moment of sale for P&L');
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->decimal('total_price', 12, 2);
            $table->enum('status', ['pending', 'preparing', 'ready', 'served', 'cancelled'])->default('pending')->index();
            $table->text('special_instructions')->nullable();
            $table->text('notes')->nullable()->comment('Internal notes for staff (e.g., reason for void)');
            $table->timestamps();

            $table->index('menu_item_id');
            $table->index(['order_id', 'menu_item_id'], 'idx_order_item_menu');
            $table->index('order_id', 'idx_order_items_order');
            $table->index(['menu_item_id', 'order_id'], 'idx_order_items_menu_order');

            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('menu_item_id')->references('id')->on('menu_items')->onDelete('restrict')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
