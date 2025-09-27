<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->timestamp('clock_in_at')->index();
            $table->timestamp('clock_out_at')->nullable()->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'clock_in_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
