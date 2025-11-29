<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            // Rename existing columns to match new schema
            if (Schema::hasColumn('ingredients', 'sku')) {
                $table->renameColumn('sku', 'code');
            } else {
                $table->string('code', 50)->unique()->nullable();
            }

            if (Schema::hasColumn('ingredients', 'cost')) {
                $table->renameColumn('cost', 'cost_per_unit');
            } else {
                $table->decimal('cost_per_unit', 10, 2)->default(0);
            }

            if (Schema::hasColumn('ingredients', 'quantity_on_hand')) {
                $table->renameColumn('quantity_on_hand', 'current_stock');
            } else {
                $table->decimal('current_stock', 10, 3)->default(0);
            }

            if (Schema::hasColumn('ingredients', 'reorder_level')) {
                $table->renameColumn('reorder_level', 'reorder_point');
            } else {
                $table->decimal('reorder_point', 10, 3)->nullable();
            }

            // Add new columns
            $table->string('category')->default('other')->after('name');
            $table->text('description')->nullable()->after('name');
            
            // Foreign keys
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            
            // Stock levels
            $table->decimal('min_stock_level', 10, 3)->nullable();
            $table->decimal('max_stock_level', 10, 3)->nullable();
            
            // Details
            $table->text('storage_requirements')->nullable();
            $table->text('allergens')->nullable();
            $table->integer('shelf_life_days')->nullable();
            
            // Drop old columns if they exist
            if (Schema::hasColumn('ingredients', 'unit')) {
                $table->dropColumn('unit');
            }
            if (Schema::hasColumn('ingredients', 'reorder_quantity')) {
                $table->dropColumn('reorder_quantity');
            }
            if (Schema::hasColumn('ingredients', 'location_id')) {
                // We might want to keep location_id if it's per-location stock, 
                // but for now we are simplifying or it's handled in inventory table.
                // The Inventory module handles location-specific stock.
                // So we can drop it from ingredients table which is the catalog.
                $table->dropForeign(['location_id']);
                $table->dropColumn('location_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->renameColumn('code', 'sku');
            $table->renameColumn('cost_per_unit', 'cost');
            $table->renameColumn('current_stock', 'quantity_on_hand');
            $table->renameColumn('reorder_point', 'reorder_level');
            
            $table->dropColumn([
                'category', 
                'description', 
                'unit_id', 
                'supplier_id', 
                'min_stock_level', 
                'max_stock_level', 
                'storage_requirements', 
                'allergens', 
                'shelf_life_days'
            ]);
            
            $table->string('unit')->nullable();
            $table->decimal('reorder_quantity', 10, 3)->nullable();
            $table->foreignId('location_id')->nullable();
        });
    }
};
