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
        Schema::table('promotions', function (Blueprint $table) {
            $table->decimal('max_discount_amount', 12, 2)->nullable()->after('min_order_amount');
            $table->enum('applicable_to', ['all', 'categories', 'items'])->default('all')->after('is_active');
            $table->text('terms_conditions')->nullable()->after('applicable_to');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn(['max_discount_amount', 'applicable_to', 'terms_conditions']);
        });
    }
};
