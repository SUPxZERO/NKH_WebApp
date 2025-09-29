<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'preparation_status')) {
                $table->enum('preparation_status', ['pending', 'preparing', 'ready', 'served'])
                    ->default('pending')
                    ->after('type')
                    ->index();
            }

            if (!Schema::hasColumn('orders', 'priority')) {
                $table->integer('priority')->default(0)->after('preparation_status');
            }

            if (!Schema::hasColumn('orders', 'notes')) {
                $table->text('notes')->nullable()->after('priority');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['preparation_status', 'priority', 'notes']);
        });
    }
};