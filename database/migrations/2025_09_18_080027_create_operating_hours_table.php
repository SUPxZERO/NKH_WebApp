<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: operating_hours table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * FK: location_id -> locations.id
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operating_hours', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id');
            $table->tinyInteger('day_of_week')->unsigned();
            $table->enum('service_type', ['dine-in', 'pickup', 'delivery']);
            $table->time('opening_time');
            $table->time('closing_time');
            $table->timestamps();

            $table->unique(['location_id', 'day_of_week', 'service_type']);

            $table->foreign('location_id')
                ->references('id')
                ->on('locations')
                ->onDelete('cascade')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operating_hours');
    }
};
