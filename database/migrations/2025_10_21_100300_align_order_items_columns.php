<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'total')) {
                $table->renameColumn('total', 'total_price');
            }
            if (Schema::hasColumn('order_items', 'notes')) {
                $table->renameColumn('notes', 'special_instructions');
            }
            if (Schema::hasColumn('order_items', 'kitchen_status')) {
                if (Schema::hasColumn('order_items', 'status')) {
                    $table->dropColumn('kitchen_status');
                } else {
                    $table->renameColumn('kitchen_status', 'status');
                }
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->renameColumn('total_price', 'total');
            $table->renameColumn('special_instructions', 'notes');
            $table->renameColumn('status', 'kitchen_status');
        });
    }
};