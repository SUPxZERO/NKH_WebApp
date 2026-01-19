<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: user_notifications table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('broadcast_notification_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->enum('type', ['order', 'promotion', 'reward', 'system'])->default('system');
            $table->string('target_type', 255)->nullable()->index();
            $table->json('target_metadata')->nullable();
            $table->string('title', 255);
            $table->text('message');
            $table->string('action_url', 255)->nullable();
            $table->boolean('read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read']);
            $table->index('created_at');
            $table->index('broadcast_notification_id');

            $table->foreign('broadcast_notification_id')->references('id')->on('broadcast_notifications')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_notifications');
    }
};
