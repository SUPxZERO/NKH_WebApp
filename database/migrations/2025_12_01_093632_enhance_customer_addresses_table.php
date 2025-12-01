<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->boolean('is_default')->default(false)->after('delivery_instructions');
            $table->boolean('is_verified')->default(false)->after('is_default');
            
            $table->index(['customer_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropIndex(['customer_id', 'is_default']);
            $table->dropColumn(['is_default', 'is_verified']);
        });
    }
};
