<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: promotions table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * FK: location_id -> locations.id
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('location_id')->nullable();
            $table->string('code', 50);
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->enum('type', ['percentage', 'fixed', 'happy_hour'])->default('percentage')->index();
            $table->decimal('value', 12, 2)->default(0.00);
            $table->decimal('min_order_amount', 12, 2)->nullable();
            $table->decimal('max_discount_amount', 12, 2)->nullable();
            $table->unsignedInteger('usage_limit')->nullable();
            $table->unsignedInteger('per_customer_limit')->nullable();
            $table->timestamp('start_at')->nullable()->index();
            $table->timestamp('end_at')->nullable()->index();
            $table->boolean('is_active')->default(true)->index();
            $table->enum('applicable_to', ['all', 'categories', 'items'])->default('all');
            $table->text('terms_conditions')->nullable();
            $table->timestamps();

            $table->unique(['location_id', 'code']);

            $table->foreign('location_id')
                ->references('id')
                ->on('locations')
                ->onDelete('set null')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
