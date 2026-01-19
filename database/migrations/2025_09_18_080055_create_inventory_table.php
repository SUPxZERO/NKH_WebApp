<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: inventory table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ingredient_id');
            $table->unsignedBigInteger('location_id');
            $table->decimal('quantity', 10, 3)->default(0.000);
            $table->string('batch_number', 255)->nullable();
            $table->date('expiration_date')->nullable();
            $table->timestamps();

            $table->unique(['ingredient_id', 'location_id', 'batch_number']);

            $table->foreign('ingredient_id')->references('id')->on('ingredients')->onDelete('cascade');
            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
