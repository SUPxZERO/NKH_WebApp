<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: shifts table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('position_id')->nullable();
            $table->unsignedBigInteger('location_id');
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->enum('shift_type', ['morning', 'afternoon', 'evening', 'night', 'split'])->default('morning');
            $table->enum('status', ['scheduled', 'completed', 'cancelled', 'no_show', 'draft', 'published'])->default('draft')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->time('actual_start_time')->nullable();
            $table->time('actual_end_time')->nullable();
            $table->decimal('calculated_hours', 10, 2)->nullable();
            $table->timestamp('published_at')->nullable();

            $table->index(['employee_id', 'date']);
            $table->index(['location_id', 'date'], 'shifts_location_date_index');

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('position_id')->references('id')->on('positions')->onDelete('set null');
            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
