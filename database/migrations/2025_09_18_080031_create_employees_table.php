<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: employees table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->unsignedBigInteger('position_id')->nullable();
            $table->string('department', 100)->nullable();
            $table->unsignedBigInteger('location_id');
            $table->string('employee_code', 50);
            $table->date('hire_date')->nullable();
            $table->enum('salary_type', ['hourly', 'monthly'])->default('monthly');
            $table->decimal('hourly_rate', 12, 2)->nullable();
            $table->decimal('salary', 12, 2)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('emergency_contact_name', 255)->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->time('preferred_shift_start')->nullable();
            $table->enum('status', ['active', 'inactive', 'terminated', 'on_leave'])->default('active')->index();
            $table->timestamps();
            $table->json('preferred_stations')->nullable();
            $table->json('preferred_shifts')->nullable();
            $table->json('available_days')->nullable();
            $table->smallInteger('max_hours_per_week')->unsigned()->default(40);
            $table->string('emergency_contact_relation', 50)->nullable();

            $table->unique(['location_id', 'employee_code']);
            $table->index(['location_id', 'status'], 'idx_employees_location_status');

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('position_id')->references('id')->on('positions')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('location_id')->references('id')->on('locations')->onDelete('restrict')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
