<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fix the purchase_orders and purchase_order_items tables to allow nullable columns
     */
    public function up(): void
    {
        // Disable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Drop foreign key temporarily, modify column, then re-add
        try {
            DB::statement('ALTER TABLE `purchase_orders` DROP FOREIGN KEY `purchase_orders_location_id_foreign`');
        } catch (\Exception $e) {
            // Foreign key might not exist
        }

        // Make location_id nullable
        DB::statement('ALTER TABLE `purchase_orders` MODIFY COLUMN `location_id` BIGINT UNSIGNED NULL');

        // Re-add foreign key
        try {
            DB::statement('ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE');
        } catch (\Exception $e) {
            // Foreign key might already exist
        }

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Not reversible as it would cause data loss
    }
};
