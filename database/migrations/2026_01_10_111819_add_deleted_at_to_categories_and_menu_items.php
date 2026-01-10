<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds deleted_at column to categories and menu_items tables
     * to support SoftDeletes trait in models.
     */
    public function up(): void
    {
        // Add deleted_at to categories if not exists
        if (!Schema::hasColumn('categories', 'deleted_at')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Add deleted_at to menu_items if not exists
        if (!Schema::hasColumn('menu_items', 'deleted_at')) {
            Schema::table('menu_items', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });

        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
