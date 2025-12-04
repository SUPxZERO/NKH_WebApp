<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add missing columns to recipes table that the controller expects
     */
    public function up(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            // Make menu_item_id nullable (was unique constraint which is too restrictive)
            if (Schema::hasColumn('recipes', 'menu_item_id')) {
                $table->foreignId('menu_item_id')->nullable()->change();
            }
            
            // Add missing columns
            if (!Schema::hasColumn('recipes', 'name')) {
                $table->string('name', 255)->nullable()->after('menu_item_id');
            }
            if (!Schema::hasColumn('recipes', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('recipes', 'prep_time_minutes')) {
                $table->unsignedInteger('prep_time_minutes')->nullable()->after('yield_portions');
            }
            if (!Schema::hasColumn('recipes', 'cook_time_minutes')) {
                $table->unsignedInteger('cook_time_minutes')->nullable()->after('prep_time_minutes');
            }
            if (!Schema::hasColumn('recipes', 'servings')) {
                $table->unsignedInteger('servings')->default(1)->after('cook_time_minutes');
            }
            if (!Schema::hasColumn('recipes', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('servings');
            }
            if (!Schema::hasColumn('recipes', 'total_cost')) {
                $table->decimal('total_cost', 10, 2)->default(0)->after('is_active');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('recipes', function (Blueprint $table) {
            $columns = ['name', 'description', 'prep_time_minutes', 'cook_time_minutes', 'servings', 'is_active', 'total_cost'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('recipes', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
