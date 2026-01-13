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
            $table->dropColumn(['order_type', 'status']);
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('customer_tier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('order_type')->nullable(); // Revert as nullable to avoid data issues
            $table->string('status')->default('pending');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('status')->default('pending');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->string('customer_tier')->default('bronze');
        });
    }
};
