<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('telegram_users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('customers')
                ->onDelete('set null');

            $table->bigInteger('telegram_id')->unique('telegram_users_telegram_id_unique');
            $table->string('telegram_username', 100)->nullable();
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('language_code', 10)->default('en');

            // Conversation state management
            $table->string('conversation_state', 50)->default('none');
            $table->json('conversation_data')->nullable();

            // Settings
            $table->boolean('is_active')->default(true);
            $table->boolean('notifications_enabled')->default(true);

            $table->timestamp('last_interaction_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['is_active', 'notifications_enabled']);
            $table->index('customer_id');
            $table->index('conversation_state');
        });

        Schema::create('telegram_order_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->onDelete('cascade');

            $table->foreignId('telegram_user_id')
                ->constrained('telegram_users')
                ->onDelete('cascade');

            $table->string('status', 50); // placed, approved, preparing, ready, etc.
            $table->text('message')->nullable();
            $table->boolean('sent')->default(false);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['order_id', 'telegram_user_id']);
            $table->index('sent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telegram_order_notifications');
        Schema::dropIfExists('telegram_users');
    }
};
