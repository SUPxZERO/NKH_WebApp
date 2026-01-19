<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: user_profiles table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->unique();
            $table->string('customer_code', 20)->nullable()->unique();
            $table->date('birth_date')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('preferred_language', 10)->default('en');
            $table->boolean('marketing_consent')->default(false);
            $table->integer('points_balance')->default(0)->index();
            $table->enum('customer_tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze')->index();
            $table->timestamp('tier_updated_at')->nullable();
            $table->unsignedBigInteger('preferred_location_id')->nullable();
            $table->json('dietary_restrictions')->nullable();
            $table->json('favorite_menu_items')->nullable();
            $table->timestamp('last_order_at')->nullable();
            $table->decimal('total_spent', 10, 2)->default(0.00);
            $table->integer('total_orders')->default(0);
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('preferred_location_id')->references('id')->on('locations')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
