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
            // Add featured fields for homepage
            $table->boolean('is_featured')->default(false)->after('is_popular');
            $table->integer('featured_order')->default(999)->after('is_featured');
            $table->string('badge')->nullable()->after('featured_order');
            
            // Add index for faster queries
            $table->index(['is_featured', 'featured_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropIndex(['is_featured', 'featured_order']);
            $table->dropColumn(['is_featured', 'featured_order', 'badge']);
        });
    }
};
