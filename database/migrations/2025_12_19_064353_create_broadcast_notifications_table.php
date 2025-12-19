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
        Schema::create('broadcast_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('message');
            $table->string('type'); // order, promotion, reward, system
            $table->string('target_type'); // all_users, all_customers, by_role, etc.
            $table->json('target_metadata')->nullable(); // roles, tiers, location_ids, etc.
            $table->string('action_url')->nullable();
            $table->integer('recipient_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->index(['target_type', 'created_at']);
        });

        // Add broadcast_notification_id to user_notifications
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->foreignId('broadcast_notification_id')->nullable()->after('id')->constrained()->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropForeign(['broadcast_notification_id']);
            $table->dropColumn('broadcast_notification_id');
        });

        Schema::dropIfExists('broadcast_notifications');
    }
};
