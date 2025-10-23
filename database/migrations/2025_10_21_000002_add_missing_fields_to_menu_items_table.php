<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            // Add missing fields if they don't exist
            if (!Schema::hasColumn('menu_items', 'sku')) {
                $table->string('sku')->nullable()->after('category_id');
            }
            if (!Schema::hasColumn('menu_items', 'display_order')) {
                $table->integer('display_order')->default(0)->after('is_active');
            }
            if (!Schema::hasColumn('menu_items', 'image_path')) {
                $table->string('image_path')->nullable()->after('cost');
            }
        });
    }

    public function down(): void
    {
        Schema::table('menu_items', function (Blueprint $table) {
            $table->dropColumn(['name', 'description', 'sku', 'display_order', 'image_path']);
        });
    }
};