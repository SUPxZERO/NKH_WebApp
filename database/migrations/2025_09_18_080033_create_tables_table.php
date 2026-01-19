<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: tables table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('floor_id');
            $table->string('code', 50);
            $table->string('table_number', 50)->nullable();
            $table->unsignedInteger('capacity')->default(2);
            $table->enum('status', ['available', 'reserved', 'occupied', 'unavailable'])->default('available')->index();
            $table->string('qr_token', 64)->nullable()->unique();
            $table->timestamp('qr_generated_at')->nullable();
            $table->string('qr_url', 255)->nullable();
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->timestamps();

            $table->unique(['floor_id', 'code']);

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('cascade');
            $table->foreign('floor_id')->references('id')->on('floors')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
