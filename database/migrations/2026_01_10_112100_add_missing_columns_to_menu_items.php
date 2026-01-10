<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds missing columns to menu_items table to sync with model expectations.
     */
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // Only add columns that don't exist
            if (!Schema::hasColumn('menu_items', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('menu_items', 'featured_order')) {
                $table->integer('featured_order')->nullable()->after('is_featured');
            }
            if (!Schema::hasColumn('menu_items', 'cook_time')) {
                $table->integer('cook_time')->nullable()->after('prep_time');
            }
            if (!Schema::hasColumn('menu_items', 'rating')) {
                $table->decimal('rating', 2, 1)->nullable()->after('calories');
            }
            if (!Schema::hasColumn('menu_items', 'reviews_count')) {
                $table->integer('reviews_count')->default(0)->after('rating');
            }
            if (!Schema::hasColumn('menu_items', 'spice_level')) {
                $table->integer('spice_level')->nullable()->after('reviews_count');
            }
            if (!Schema::hasColumn('menu_items', 'serving_size')) {
                $table->string('serving_size')->nullable()->after('spice_level');
            }
            if (!Schema::hasColumn('menu_items', 'availability_status')) {
                $table->string('availability_status')->nullable()->default('available')->after('serving_size');
            }
            if (!Schema::hasColumn('menu_items', 'nutrition')) {
                $table->json('nutrition')->nullable()->after('availability_status');
            }
            if (!Schema::hasColumn('menu_items', 'allergens')) {
                $table->json('allergens')->nullable()->after('nutrition');
            }
            if (!Schema::hasColumn('menu_items', 'dietary_tags')) {
                $table->json('dietary_tags')->nullable()->after('allergens');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn([
                'is_featured', 'featured_order', 'cook_time', 'rating', 
                'reviews_count', 'spice_level', 'serving_size', 'availability_status',
                'nutrition', 'allergens', 'dietary_tags'
            ]);
        });
    }
};
