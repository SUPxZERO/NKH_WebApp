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
        Schema::table('telegram_users', function (Blueprint $table) {
            if (!Schema::hasColumn('telegram_users', 'phone_number')) {
                $table->string('phone_number', 20)->nullable()->after('language_code');
            }
            if (!Schema::hasColumn('telegram_users', 'delivery_address')) {
                $table->text('delivery_address')->nullable()->after('phone_number');
            }
            if (!Schema::hasColumn('telegram_users', 'saved_addresses')) {
                $table->json('saved_addresses')->nullable()->after('delivery_address');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('telegram_users', function (Blueprint $table) {
            $table->dropColumn(['phone_number', 'delivery_address', 'saved_addresses']);
        });
    }
};
