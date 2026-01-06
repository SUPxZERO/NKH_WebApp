<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add default value to total column
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `purchase_order_items` MODIFY COLUMN `total` DECIMAL(12,2) NOT NULL DEFAULT 0');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove default value
        DB::statement('ALTER TABLE `purchase_order_items` MODIFY COLUMN `total` DECIMAL(12,2) NOT NULL');
    }
};
