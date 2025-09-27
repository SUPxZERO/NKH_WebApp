<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->foreignId('preferred_location_id')->nullable()->constrained('locations')->nullOnDelete()->cascadeOnUpdate();
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male','female','other'])->nullable();
            $table->json('preferences')->nullable();
            $table->unsignedInteger('points_balance')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['preferred_location_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
