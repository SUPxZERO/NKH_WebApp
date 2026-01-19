<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: feedback table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('customer_id')->index();
            $table->tinyInteger('rating')->unsigned();
            $table->tinyInteger('service_rating')->unsigned()->nullable()->comment('1-5 scale');
            $table->tinyInteger('food_rating')->unsigned()->nullable()->comment('1-5 scale');
            $table->tinyInteger('ambiance_rating')->unsigned()->nullable()->comment('1-5 scale');
            $table->text('comments')->nullable();
            $table->text('response')->nullable()->comment('Restaurant response');
            $table->timestamp('responded_at')->nullable()->index();
            $table->unsignedBigInteger('responded_by')->nullable()->comment('FK to users');
            $table->json('tags')->nullable()->comment('Feedback categorization');
            $table->enum('visibility', ['public', 'private', 'internal'])->default('public');
            $table->timestamps();

            $table->index('order_id');

            $table->foreign('location_id')->references('id')->on('locations')->onDelete('restrict')->onUpdate('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('responded_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
