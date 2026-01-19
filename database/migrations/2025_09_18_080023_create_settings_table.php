<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: settings table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * FK: location_id -> locations.id
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->string('key', 150);
            $table->json('value')->nullable();
            $table->timestamps();

            $table->unique(['location_id', 'key']);
            $table->index('key');

            $table->foreign('location_id')
                ->references('id')
                ->on('locations')
                ->onDelete('restrict')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
