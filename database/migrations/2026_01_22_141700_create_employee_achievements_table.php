<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Employee Achievements Table
 * Stores earned badges/achievements for employee performance gamification.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_achievements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->string('achievement_code', 50); // e.g., 'early_bird', 'service_star', 'speedster'
            $table->string('title', 100);
            $table->text('description')->nullable();
            $table->string('icon', 10)->default('🏆');
            $table->timestamp('earned_at');
            $table->json('metadata')->nullable(); // Extra context data
            $table->timestamps();

            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->unique(['employee_id', 'achievement_code']); // Each achievement can only be earned once
            $table->index('achievement_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_achievements');
    }
};
