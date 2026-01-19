<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: telegram_users table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * FK: customer_id nullable (added later when customers exists)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('telegram_users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id')->nullable()->index();
            $table->bigInteger('telegram_id')->unique();
            $table->string('telegram_username', 100)->nullable();
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('language_code', 10)->default('en');
            $table->string('phone_number', 20)->nullable();
            $table->text('delivery_address')->nullable();
            $table->json('saved_addresses')->nullable();
            $table->string('conversation_state', 50)->default('none')->index();
            $table->json('conversation_data')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('notifications_enabled')->default(true);
            $table->timestamp('last_interaction_at')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'notifications_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('telegram_users');
    }
};
