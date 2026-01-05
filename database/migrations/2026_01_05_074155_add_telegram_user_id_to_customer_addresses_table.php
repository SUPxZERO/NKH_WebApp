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
        Schema::table('customer_addresses', function (Blueprint $table) {
            // Add telegram_user_id for guest Telegram users (no customer_id required)
            $table->foreignId('telegram_user_id')
                ->nullable()
                ->after('customer_id')
                ->constrained('telegram_users')
                ->nullOnDelete();
            
            // Make customer_id nullable (addresses can belong to either customer OR telegram_user)
            $table->unsignedBigInteger('customer_id')->nullable()->change();
            
            // Add index for telegram user lookups
            $table->index('telegram_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropForeign(['telegram_user_id']);
            $table->dropColumn('telegram_user_id');
        });
    }
};
