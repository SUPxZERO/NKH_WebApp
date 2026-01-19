<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: floors table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * FK: location_id -> locations.id
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('floors', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id');
            $table->string('name', 255);
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->integer('map_width')->default(800);
            $table->integer('map_height')->default(600);
            $table->timestamps();

            $table->foreign('location_id')
                ->references('id')
                ->on('locations')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('floors');
    }
};
