<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove the unique constraint on menu_item_id to allow multiple recipes per menu item
     */
    public function up(): void
    {
        // Disable foreign key checks temporarily
        if (DB::getDriverName() === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }
        
        Schema::table('recipes', function (Blueprint $table) {
            // Drop the foreign key constraint first (skip for SQLite)
            if (DB::getDriverName() !== 'sqlite') {
                $table->dropForeign(['menu_item_id']);
            }
            
            // Drop the unique index
            $table->dropUnique(['menu_item_id']);
            
            // Re-add the foreign key without unique constraint (skip for SQLite)
            if (DB::getDriverName() !== 'sqlite') {
                $table->foreign('menu_item_id')
                      ->references('id')
                      ->on('menu_items')
                      ->cascadeOnDelete()
                      ->cascadeOnUpdate();
            }
        });
        
        // Re-enable foreign key checks
        if (DB::getDriverName() === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            // Re-add the unique constraint
            $table->dropForeign(['menu_item_id']);
            $table->unique('menu_item_id');
            $table->foreign('menu_item_id')
                  ->references('id')
                  ->on('menu_items')
                  ->cascadeOnDelete()
                  ->cascadeOnUpdate();
        });
    }
};
