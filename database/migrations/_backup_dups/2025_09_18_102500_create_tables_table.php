<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('floor_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->string('code', 50); // e.g., T1, A12
            $table->unsignedInteger('capacity')->default(2);
            $table->enum('status', ['available','reserved','occupied','unavailable'])->default('available')->index();
            $table->timestamps();

            $table->unique(['floor_id', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
