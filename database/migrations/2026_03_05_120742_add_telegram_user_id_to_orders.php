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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'telegram_user_id')) {
                $table->foreignId('telegram_user_id')
                    ->nullable()
                    ->after('customer_id')
                    ->constrained('telegram_users')
                    ->nullOnDelete();

                // Add index for telegram user lookups
                $table->index('telegram_user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['telegram_user_id']);
            $table->dropIndex(['telegram_user_id']);
            $table->dropColumn('telegram_user_id');
        });
    }
};
