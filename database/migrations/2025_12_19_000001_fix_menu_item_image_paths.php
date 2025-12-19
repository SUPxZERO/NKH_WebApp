<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix menu item image paths from 'menu/' to 'menu_images/'
        // The images are actually stored in storage/app/public/menu_images/
        // but the database had incorrect paths pointing to 'menu/'

        DB::table('menu_items')
            ->where('image_path', 'like', 'menu/%')
            ->update([
                'image_path' => DB::raw("REPLACE(image_path, 'menu/', 'menu_images/')")
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert the changes
        DB::table('menu_items')
            ->where('image_path', 'like', 'menu_images/%')
            ->update([
                'image_path' => DB::raw("REPLACE(image_path, 'menu_images/', 'menu/')")
            ]);
    }
};
