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
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('order_type_id')->nullable()->after('order_type')->constrained('order_types')->nullOnDelete();
            $table->foreignId('order_status_id')->nullable()->after('status')->constrained('order_statuses')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['order_type_id']);
            $table->dropForeign(['order_status_id']);
            $table->dropColumn(['order_type_id', 'order_status_id']);
        });
    }
};
