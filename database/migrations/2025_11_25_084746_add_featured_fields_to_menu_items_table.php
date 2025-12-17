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
        Schema::table('menu_items', function (Blueprint $table) {
            // Only add columns if they don't already exist
            if (!Schema::hasColumn('menu_items', 'is_featured')) {
                $table->boolean('is_featured')->default(false)->after('is_popular');
            }
            if (!Schema::hasColumn('menu_items', 'featured_order')) {
                $table->unsignedInteger('featured_order')->default(0)->after('is_featured');
            }
            if (!Schema::hasColumn('menu_items', 'badge')) {
                $table->string('badge', 50)->nullable()->after('featured_order');
            }
            if (!Schema::hasColumn('menu_items', 'description')) {
                $table->text('description')->nullable()->after('image_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['is_featured', 'featured_order', 'badge', 'description']);
        });
    }
};
