<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('position_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->string('employee_code', 50);
            $table->date('hire_date')->nullable();
            $table->enum('salary_type', ['hourly','monthly'])->default('monthly');
            $table->decimal('salary', 12, 2)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('address')->nullable();
            $table->enum('status', ['active','inactive','terminated','on_leave'])->default('active')->index();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['location_id', 'employee_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
