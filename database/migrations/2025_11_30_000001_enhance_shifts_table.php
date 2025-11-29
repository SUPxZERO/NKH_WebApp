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
        Schema::table('shifts', function (Blueprint $table) {
            // Add calculated fields to shifts
            if (!Schema::hasColumn('shifts', 'actual_start_time')) {
                $table->time('actual_start_time')->nullable()->after('end_time');
            }
            if (!Schema::hasColumn('shifts', 'actual_end_time')) {
                $table->time('actual_end_time')->nullable()->after('actual_start_time');
            }
            if (!Schema::hasColumn('shifts', 'calculated_hours')) {
                $table->decimal('calculated_hours', 10, 2)->nullable()->after('actual_end_time');
            }
            if (!Schema::hasColumn('shifts', 'published_at')) {
                $table->timestamp('published_at')->nullable()->after('calculated_hours');
            }

            // Add missing indexes (skip if they already exist)
            $indexes = DB::select("SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'shifts' AND COLUMN_NAME IN ('location_id', 'date')");
            if (empty($indexes)) {
                $table->index(['location_id', 'date']);
            }
            
            $statusIndex = DB::select("SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_NAME = 'shifts' AND COLUMN_NAME = 'status'");
            if (empty($statusIndex)) {
                $table->index('status');
            }
        });
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
