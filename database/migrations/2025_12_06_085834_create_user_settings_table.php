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
        Schema::create('user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            
            // Notification Settings
            $table->boolean('notification_order_updates')->default(true);
            $table->boolean('notification_promotions')->default(true);
            $table->boolean('notification_newsletter')->default(false);
            $table->boolean('notification_sms')->default(false);
            $table->boolean('notification_push')->default(true);
            
            // Privacy Settings
            $table->boolean('privacy_show_profile')->default(true);
            $table->boolean('privacy_share_order_history')->default(false);
            $table->boolean('privacy_allow_analytics')->default(true);
            
            // Appearance & Language
            $table->enum('theme', ['light', 'dark', 'system'])->default('system');
            $table->string('language', 10)->default('en');
            
            $table->timestamps();
            
            // Ensure one settings record per user
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_settings');
    }
};
