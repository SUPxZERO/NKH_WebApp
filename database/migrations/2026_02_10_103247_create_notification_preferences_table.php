<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type'); // order, promotion, system, reservation
            $table->string('channel'); // email, sms, push, in_app
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            // Ensure one preference per type/channel per user
            $table->unique(['user_id', 'type', 'channel'], 'user_pref_unique');

            // Index for faster lookups
            $table->index(['user_id', 'channel']);
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
