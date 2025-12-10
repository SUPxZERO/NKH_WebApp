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
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('channel', 50); // 'in_app', 'push', 'email'
            $table->string('type', 50); // 'order', 'promotion', 'reward', 'system', 'reservation'
            $table->boolean('enabled')->default(true);
            $table->timestamps();
            
            // Unique constraint: one preference per user/channel/type combo
            $table->unique(['user_id', 'channel', 'type'], 'notification_pref_unique');
            
            // Index for quick lookups
            $table->index(['user_id', 'enabled']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_preferences');
    }
};
