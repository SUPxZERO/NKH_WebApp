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
        Schema::create('time_off_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->unsignedInteger('year');
            $table->decimal('vacation_hours_available', 10, 2)->default(0);
            $table->decimal('vacation_hours_used', 10, 2)->default(0);
            $table->decimal('sick_hours_available', 10, 2)->default(0);
            $table->decimal('sick_hours_used', 10, 2)->default(0);
            $table->decimal('personal_hours_available', 10, 2)->default(0);
            $table->decimal('personal_hours_used', 10, 2)->default(0);
            $table->timestamps();

            // Unique constraint on employee_id and year
            $table->unique(['employee_id', 'year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('time_off_balances');
    }
};
