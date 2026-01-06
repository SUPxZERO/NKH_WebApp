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
        Schema::table('time_off_requests', function (Blueprint $table) {
            $table->string('type')->after('employee_id')->default('vacation');
            $table->integer('days_requested')->after('end_date')->default(0);
            $table->text('notes')->nullable()->after('reason');
            
            // Rename admin_notes if it exists
            if (Schema::hasColumn('time_off_requests', 'admin_notes')) {
                $table->renameColumn('admin_notes', 'approval_notes');
            }
        });

        // Update status enum and approved_by foreign key
        // Need to drop foreign key first if it exists
        try {
            Schema::table('time_off_requests', function (Blueprint $table) {
                $table->dropForeign(['approved_by']);
             });
        } catch (\Exception $e) {
            // Ignore if FK doesn't exist
        }

        // Modify status column
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE time_off_requests MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
