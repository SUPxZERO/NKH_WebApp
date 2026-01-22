<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('table_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('table_id');
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('telegram_user_id')->nullable();
            $table->unsignedBigInteger('order_id')->nullable();

            $table->string('session_token', 64)->unique();
            $table->enum('status', ['active', 'ordering', 'payment_pending', 'completed'])->default('active')->index();

            $table->string('device_fingerprint', 64)->nullable()->index();
            $table->text('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();

            $table->timestamp('started_at')->nullable()->index();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->timestamp('closed_at')->nullable()->index();

            $table->timestamps();

            $table->foreign('table_id')->references('id')->on('tables')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('telegram_user_id')->references('id')->on('telegram_users')->onDelete('set null');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('table_sessions');
    }
};
