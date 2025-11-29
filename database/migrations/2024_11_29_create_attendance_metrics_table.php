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
        Schema::create('attendance_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('attendance_id')->constrained('attendances')->cascadeOnDelete();
            $table->unsignedInteger('minutes_late')->default(0);
            $table->unsignedInteger('minutes_early_departure')->default(0);
            $table->unsignedInteger('break_duration_minutes')->default(0);
            $table->decimal('total_shift_hours', 10, 2);
            $table->decimal('overtime_hours', 10, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('employee_id');
            $table->index('attendance_id');
            $table->index(['employee_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_metrics');
    }
};
