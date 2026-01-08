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
            } elseif (!Schema::hasColumn('ingredients', 'code')) {
                $table->string('code', 50)->unique()->nullable();
            }

            if (Schema::hasColumn('ingredients', 'cost')) {
                $table->renameColumn('cost', 'cost_per_unit');
            } elseif (!Schema::hasColumn('ingredients', 'cost_per_unit')) {
                $table->decimal('cost_per_unit', 10, 2)->default(0);
            }

            if (Schema::hasColumn('ingredients', 'quantity_on_hand')) {
                $table->renameColumn('quantity_on_hand', 'current_stock');
            } elseif (!Schema::hasColumn('ingredients', 'current_stock')) {
                $table->decimal('current_stock', 10, 3)->default(0);
            }

            if (Schema::hasColumn('ingredients', 'reorder_level')) {
                $table->renameColumn('reorder_level', 'reorder_point');
            } elseif (!Schema::hasColumn('ingredients', 'reorder_point')) {
                $table->decimal('reorder_point', 10, 3)->nullable();
            }

            // Add new columns
            if (!Schema::hasColumn('ingredients', 'category')) {
                $table->string('category')->default('other')->after('name');
            }
            if (!Schema::hasColumn('ingredients', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            
            // Foreign keys
            if (!Schema::hasColumn('ingredients', 'unit_id')) {
                $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            }
            if (!Schema::hasColumn('ingredients', 'supplier_id')) {
                $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            }
            
            // Stock levels
            if (!Schema::hasColumn('ingredients', 'min_stock_level')) {
                $table->decimal('min_stock_level', 10, 3)->nullable();
            }
            if (!Schema::hasColumn('ingredients', 'max_stock_level')) {
                $table->decimal('max_stock_level', 10, 3)->nullable();
            }
            
            // Details
            if (!Schema::hasColumn('ingredients', 'storage_requirements')) {
                $table->text('storage_requirements')->nullable();
            }
            if (!Schema::hasColumn('ingredients', 'allergens')) {
                $table->text('allergens')->nullable();
            }
            if (!Schema::hasColumn('ingredients', 'shelf_life_days')) {
                $table->integer('shelf_life_days')->nullable();
            }
            
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
                
                // Drop Foreign Key safely
                // $table->dropForeign(['location_id']); // Move to separate block to be safe?
                // Actually dropForeign usually works if FK exists.
            }
        });

        // Separate block for dropping indexes and foreign keys to handle failures gracefully
        try {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->dropIndex('ingredients_location_id_name_index');
            });
        } catch (\Throwable $e) {
            try {
                Schema::table('ingredients', function (Blueprint $table) {
                     $table->dropIndex(['location_id', 'name']);
                });
            } catch (\Throwable $e2) {}
        }

        try {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->dropIndex('ingredients_location_id_sku_unique');
            });
        } catch (\Throwable $e) {
            try {
                Schema::table('ingredients', function (Blueprint $table) {
                    $table->dropUnique(['location_id', 'sku']);
                });
            } catch (\Throwable $e2) {
                 try {
                    Schema::table('ingredients', function (Blueprint $table) {
                        $table->dropUnique(['location_id', 'code']);
                    });
                } catch (\Throwable $e3) {}
            }
        }

        try {
            Schema::table('ingredients', function (Blueprint $table) {
                if (Schema::hasColumn('ingredients', 'location_id')) {
                    $table->dropForeign(['location_id']);
                    $table->dropColumn('location_id');
                }
            });
        } catch (\Throwable $e) {
            // If FK doesn't exist, it might fail. 
            // Also if location_id already dropped (checked above).
            try {
                 Schema::table('ingredients', function (Blueprint $table) {
                    if (Schema::hasColumn('ingredients', 'location_id')) {
                        $table->dropColumn('location_id');
                    }
                });
            } catch (\Throwable $e2) {}
        }
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
