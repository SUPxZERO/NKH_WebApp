<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_time_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->constrained()->cascadeOnUpdate()->cascadeOnDelete();
            $table->date('slot_date');
            $table->time('slot_start_time');
            $table->enum('slot_type', ['pickup','delivery'])->index();
            $table->unsignedInteger('max_orders');
            $table->unsignedInteger('current_orders')->default(0);
            $table->timestamps();

            $table->unique(['location_id', 'slot_date', 'slot_start_time', 'slot_type'], 'order_time_slots_unique');
            $table->index(['slot_date', 'slot_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_time_slots');
    }
};
