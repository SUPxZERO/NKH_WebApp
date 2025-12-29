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
        // Skip if shifts table doesn't exist
        if (!Schema::hasTable('shifts')) {
            return;
        }

        Schema::table('shifts', function (Blueprint $table) {
            // Add calculated fields to shifts
            if (!Schema::hasColumn('shifts', 'actual_start_time')) {
                $table->time('actual_start_time')->nullable();
            }
            if (!Schema::hasColumn('shifts', 'actual_end_time')) {
                $table->time('actual_end_time')->nullable();
            }
            if (!Schema::hasColumn('shifts', 'calculated_hours')) {
                $table->decimal('calculated_hours', 10, 2)->nullable();
            }
            if (!Schema::hasColumn('shifts', 'published_at')) {
                $table->timestamp('published_at')->nullable();
            }
        });

        // Add indexes separately with error handling for both MySQL and PostgreSQL
        try {
            Schema::table('shifts', function (Blueprint $table) {
                $table->index(['location_id', 'date'], 'shifts_location_date_index');
            });
        } catch (\Exception $e) {
            // Index may already exist, ignore
        }

        try {
            Schema::table('shifts', function (Blueprint $table) {
                $table->index('status', 'shifts_status_index');
            });
        } catch (\Exception $e) {
            // Index may already exist, ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropIndexIfExists(['location_id', 'date']);
            $table->dropIndexIfExists(['status']);

            $columns = ['actual_start_time', 'actual_end_time', 'calculated_hours', 'published_at'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('shifts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
