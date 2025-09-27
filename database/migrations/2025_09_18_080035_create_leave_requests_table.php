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
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->date('start_date')->index();
            $table->date('end_date')->index();
            $table->enum('type', ['annual','sick','unpaid','other'])->default('annual');
            $table->text('reason')->nullable();
            $table->enum('status', ['pending','approved','rejected','cancelled'])->default('pending')->index();
            $table->timestamps();
    
            $table->index(['employee_id', 'start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
