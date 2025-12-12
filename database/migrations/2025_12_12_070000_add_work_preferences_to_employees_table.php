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
        // Work preferences columns
        if (!Schema::hasColumn('employees', 'preferred_stations')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->json('preferred_stations')->nullable();
            });
        }
        
        if (!Schema::hasColumn('employees', 'preferred_shifts')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->json('preferred_shifts')->nullable();
            });
        }
        
        if (!Schema::hasColumn('employees', 'available_days')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->json('available_days')->nullable();
            });
        }
        
        if (!Schema::hasColumn('employees', 'max_hours_per_week')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->unsignedSmallInteger('max_hours_per_week')->default(40);
            });
        }
        
        // Emergency contact columns
        if (!Schema::hasColumn('employees', 'emergency_contact_name')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('emergency_contact_name', 255)->nullable();
            });
        }
        
        if (!Schema::hasColumn('employees', 'emergency_contact_phone')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('emergency_contact_phone', 20)->nullable();
            });
        }
        
        if (!Schema::hasColumn('employees', 'emergency_contact_relation')) {
            Schema::table('employees', function (Blueprint $table) {
                $table->string('emergency_contact_relation', 50)->nullable();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $columns = [
                'preferred_stations',
                'preferred_shifts',
                'available_days',
                'max_hours_per_week',
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relation',
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('employees', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
