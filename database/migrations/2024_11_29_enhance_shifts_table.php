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

            // Add missing indexes
            if (!Schema::hasIndexes('shifts', ['location_id', 'date'])) {
                $table->index(['location_id', 'date']);
            }
            if (!Schema::hasIndex('shifts', 'status')) {
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
