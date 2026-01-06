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
        Schema::table('shifts', function (Blueprint $table) {
            // Drop existing status column to redefine it with new enum values if needed, 
            // but modifying enum via 'change()' is cleaner if doctrine/dbal is installed.
            // Since we can't assume doctrine/dbal, we will just add shift_type.
            // The user code uses status: 'draft' | 'published' | 'completed' | 'cancelled';
            // DB has: ['scheduled', 'completed', 'cancelled', 'no_show'].
            // We need to support 'draft' and 'published'.
            
            // Add shift_type
            if (!Schema::hasColumn('shifts', 'shift_type')) {
                $table->enum('shift_type', ['morning', 'afternoon', 'evening', 'night', 'split'])->default('morning')->after('end_time');
            }
            
            // Note: Changing ENUM values in Laravel/MySQL without doctrine/dbal is tricky.
            // We will attempt to modify the column using raw SQL for safety.
            // This adds 'draft' and 'published' to the allowed values.
            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE shifts MODIFY COLUMN status ENUM('scheduled', 'completed', 'cancelled', 'no_show', 'draft', 'published') NOT NULL DEFAULT 'draft'");
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            if (Schema::hasColumn('shifts', 'shift_type')) {
                $table->dropColumn('shift_type');
            }
            // Revert status enum is risky if we have data, so we leave as is or revert to original set if empty.
        });
    }
};
