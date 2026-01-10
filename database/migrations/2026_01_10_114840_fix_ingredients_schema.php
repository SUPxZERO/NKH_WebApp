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
        Schema::table('ingredients', function (Blueprint $table) {
            // Rename sku to code if needed
            if (Schema::hasColumn('ingredients', 'sku') && !Schema::hasColumn('ingredients', 'code')) {
                // Drop index using sku first if it exists? Laravel usually handles rename, but let's be safe.
                // We'll trust renameColumn for now.
                $table->renameColumn('sku', 'code');
            }

            // Fix unit column - seeder uses unit_id
            if (Schema::hasColumn('ingredients', 'unit')) {
                $table->string('unit')->nullable()->change(); // Make nullable if replacing
            }

            // Add new columns
            if (!Schema::hasColumn('ingredients', 'category')) {
                $table->string('category')->nullable()->after('name');
            }

            if (!Schema::hasColumn('ingredients', 'unit_id')) {
                $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete()->after('category');
            }

            if (!Schema::hasColumn('ingredients', 'supplier_id')) {
                $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete()->after('unit_id');
            }

            if (!Schema::hasColumn('ingredients', 'cost_per_unit')) {
                 $table->decimal('cost_per_unit', 10, 2)->nullable()->after('supplier_id');
            }

            if (!Schema::hasColumn('ingredients', 'current_stock')) {
                 $table->decimal('current_stock', 10, 3)->default(0)->after('cost_per_unit');
            }
            
            if (!Schema::hasColumn('ingredients', 'min_stock_level')) {
                 $table->decimal('min_stock_level', 10, 3)->default(0)->after('current_stock');
            }

            if (!Schema::hasColumn('ingredients', 'max_stock_level')) {
                 $table->decimal('max_stock_level', 10, 3)->default(100)->after('min_stock_level');
            }
            
            if (!Schema::hasColumn('ingredients', 'reorder_point')) {
                 $table->decimal('reorder_point', 10, 3)->default(10)->after('max_stock_level');
            }

            if (!Schema::hasColumn('ingredients', 'shelf_life_days')) {
                 $table->integer('shelf_life_days')->nullable()->after('reorder_point');
            }

            if (!Schema::hasColumn('ingredients', 'storage_requirements')) {
                 $table->text('storage_requirements')->nullable()->after('shelf_life_days');
            }

            if (!Schema::hasColumn('ingredients', 'allergens')) {
                 $table->json('allergens')->nullable()->after('storage_requirements');
            }
            
            if (!Schema::hasColumn('ingredients', 'description')) {
                 $table->text('description')->nullable()->after('name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
             if (Schema::hasColumn('ingredients', 'code') && !Schema::hasColumn('ingredients', 'sku')) {
                $table->renameColumn('code', 'sku');
            }
            $table->dropForeign(['unit_id']);
            $table->dropForeign(['supplier_id']);
            $table->dropColumn([
                'category', 'unit_id', 'supplier_id', 'cost_per_unit', 'current_stock',
                'min_stock_level', 'max_stock_level', 'reorder_point', 
                'shelf_life_days', 'storage_requirements', 'allergens', 'description'
            ]);
        });
    }
};
