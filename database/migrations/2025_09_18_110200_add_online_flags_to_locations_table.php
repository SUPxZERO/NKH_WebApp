<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->boolean('accepts_online_orders')->default(false)->after('is_active')->index();
            $table->boolean('accepts_pickup')->default(false)->after('accepts_online_orders')->index();
            $table->boolean('accepts_delivery')->default(false)->after('accepts_pickup')->index();
        });
    }

    public function down(): void
    {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['accepts_online_orders', 'accepts_pickup', 'accepts_delivery']);
        });
    }
};
