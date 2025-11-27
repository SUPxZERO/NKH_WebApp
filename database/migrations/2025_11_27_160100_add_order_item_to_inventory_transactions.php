<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_transactions', 'order_item_id')) {
                $table->unsignedBigInteger('order_item_id')
                    ->nullable()
                    ->after('reference_id');

                $table->foreign('order_item_id')
                    ->references('id')
                    ->on('order_items')
                    ->restrictOnDelete()
                    ->cascadeOnUpdate();

                $table->index(['order_item_id', 'ingredient_id'], 'idx_inventory_out_order_item');
            }
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('inventory_transactions', 'order_item_id')) {
                $table->dropIndex('idx_inventory_out_order_item');
                $table->dropForeign(['order_item_id']);
                $table->dropColumn('order_item_id');
            }
        });
    }
};
