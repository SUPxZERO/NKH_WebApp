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
            // Featured item flag - for homepage display
            $table->boolean('is_featured')->default(false)->after('is_popular');
            // Order in which featured items appear
            $table->unsignedInteger('featured_order')->default(0)->after('is_featured');
            // Badge text (e.g., "Best Seller", "Chef's Choice", "Trending")
            $table->string('badge', 50)->nullable()->after('featured_order');
            // Description text
            $table->text('description')->nullable()->after('image_path');
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
