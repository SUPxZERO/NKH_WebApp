<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: loyalty_points table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_points', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->enum('type', ['earn', 'redeem', 'adjust']);
            $table->integer('points');
            $table->integer('balance_after');
            $table->dateTime('expires_at')->nullable()->index()->comment('Point expiration date');
            $table->string('campaign_id', 50)->nullable()->comment('Marketing campaign reference');
            $table->string('reference_type', 50)->nullable()->comment('Polymorphic type');
            $table->unsignedBigInteger('reference_id')->nullable()->comment('Polymorphic ID');
            $table->dateTime('occurred_at');
            $table->string('notes', 255)->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'occurred_at'], 'idx_loyalty_customer_time');
            $table->index(['reference_type', 'reference_id']);

            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade')->onUpdate('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null')->onUpdate('cascade');
            $table->foreign('location_id')->references('id')->on('locations')->onDelete('restrict')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_points');
    }
};
