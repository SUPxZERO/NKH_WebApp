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
        Schema::table('employees', function (Blueprint $table) {
            // Add missing employee fields
            if (!Schema::hasColumn('employees', 'phone')) {
                $table->string('phone', 20)->nullable()->after('address');
            }
            if (!Schema::hasColumn('employees', 'hourly_rate')) {
                $table->decimal('hourly_rate', 12, 2)->nullable()->after('salary_type');
            }
            if (!Schema::hasColumn('employees', 'department')) {
                $table->string('department', 100)->nullable()->after('position_id');
            }
            if (!Schema::hasColumn('employees', 'emergency_contact_name')) {
                $table->string('emergency_contact_name', 255)->nullable()->after('phone');
            }
            if (!Schema::hasColumn('employees', 'emergency_contact_phone')) {
                $table->string('emergency_contact_phone', 20)->nullable()->after('emergency_contact_name');
            }
            if (!Schema::hasColumn('employees', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('emergency_contact_phone');
            }
            if (!Schema::hasColumn('employees', 'preferred_shift_start')) {
                $table->time('preferred_shift_start')->nullable()->after('date_of_birth');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $columns = ['phone', 'hourly_rate', 'department', 'emergency_contact_name', 'emergency_contact_phone', 'date_of_birth', 'preferred_shift_start'];
            foreach ($columns as $column) {
                if (Schema::hasColumn('employees', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
