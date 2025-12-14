<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add extended food details columns to menu_items table
 * Supports rich food detail modal with nutrition, allergens, and cooking info
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // Nutrition information (JSON for flexibility)
            if (!Schema::hasColumn('menu_items', 'nutrition')) {
                $table->json('nutrition')->nullable()->after('calories')
                    ->comment('JSON: {calories, protein, carbs, fat, fiber, sodium, sugar}');
            }

            // Ingredients list (JSON array)
            if (!Schema::hasColumn('menu_items', 'ingredients')) {
                $table->json('ingredients')->nullable()->after('nutrition')
                    ->comment('JSON array of ingredient names');
            }

            // Allergen information (JSON array)
            if (!Schema::hasColumn('menu_items', 'allergens')) {
                $table->json('allergens')->nullable()->after('ingredients')
                    ->comment('JSON array: nuts, dairy, gluten, shellfish, eggs, soy, etc.');
            }

            // Dietary restrictions/tags (JSON array)
            if (!Schema::hasColumn('menu_items', 'dietary_tags')) {
                $table->json('dietary_tags')->nullable()->after('allergens')
                    ->comment('JSON array: vegetarian, vegan, gluten-free, keto, halal, kosher');
            }

            // Cooking time (separate from prep_time)
            if (!Schema::hasColumn('menu_items', 'cook_time')) {
                $table->unsignedSmallInteger('cook_time')->nullable()->after('prep_time')
                    ->comment('Cooking time in minutes');
            }

            // Serving size
            if (!Schema::hasColumn('menu_items', 'serving_size')) {
                $table->string('serving_size', 50)->nullable()->after('cook_time')
                    ->comment('e.g., "1 plate", "250g", "2 pieces"');
            }

            // Spice level (0-5)
            if (!Schema::hasColumn('menu_items', 'spice_level')) {
                $table->unsignedTinyInteger('spice_level')->default(0)->after('serving_size')
                    ->comment('0=none, 1=mild, 2=medium, 3=hot, 4=very hot, 5=extreme');
            }

            // Availability status
            if (!Schema::hasColumn('menu_items', 'availability_status')) {
                $table->enum('availability_status', ['available', 'low_stock', 'out_of_stock', 'seasonal'])
                    ->default('available')->after('is_active');
            }

            // Availability note (e.g., "Back tomorrow", "Seasonal - Summer only")
            if (!Schema::hasColumn('menu_items', 'availability_note')) {
                $table->string('availability_note', 255)->nullable()->after('availability_status');
            }

            // Add indexes for commonly queried fields
            // Note: Only add if not exists to prevent errors on re-run
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $columns = [
                'nutrition',
                'ingredients',
                'allergens',
                'dietary_tags',
                'cook_time',
                'serving_size',
                'spice_level',
                'availability_status',
                'availability_note',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('menu_items', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
