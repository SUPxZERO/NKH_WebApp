<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('table_id')->constrained('tables')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->string('code', 50);
            $table->dateTime('reserved_for')->index();
            $table->unsignedSmallInteger('duration_minutes')->default(60);
            $table->unsignedSmallInteger('guest_count')->default(2);
            $table->enum('status', ['pending','confirmed','seated','cancelled','no_show'])->default('pending')->index();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['location_id', 'code']);
            $table->index(['table_id', 'reserved_for']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
