<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operating_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week'); // 0 (Sun) - 6 (Sat)
            $table->enum('service_type', ['dine-in','pickup','delivery']);
            $table->time('opening_time');
            $table->time('closing_time');
            $table->timestamps();

            $table->unique(['location_id', 'day_of_week', 'service_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operating_hours');
    }
};
