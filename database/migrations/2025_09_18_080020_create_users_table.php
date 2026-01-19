<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: users table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * FK: default_location_id -> locations.id
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('email', 255)->nullable()->unique();
            $table->string('role', 50)->default('customer');
            $table->bigInteger('telegram_id')->nullable()->unique();
            $table->string('phone', 30)->nullable()->unique('ux_users_phone');
            $table->text('address')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('avatar', 255)->nullable();
            $table->string('image_path', 255)->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->string('password', 255)->nullable();
            $table->string('avatar_url', 255)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->tinyInteger('failed_login_attempts')->unsigned()->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->boolean('mfa_enabled')->default(false);
            $table->string('mfa_secret', 128)->nullable();
            $table->string('remember_token', 100)->nullable();
            $table->unsignedBigInteger('default_location_id')->nullable();
            $table->timestamps();
            $table->timestamp('last_login_at')->nullable();

            $table->foreign('default_location_id')
                ->references('id')
                ->on('locations')
                ->onDelete('restrict')
                ->onUpdate('cascade');

            $table->index(['email', 'locked_until'], 'users_lockout_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
