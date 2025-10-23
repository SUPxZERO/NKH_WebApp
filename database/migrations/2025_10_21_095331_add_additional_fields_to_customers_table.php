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
        Schema::table('customers', function (Blueprint $table) {
            $table->integer('loyalty_points')->default(0)->after('customer_code');
            $table->decimal('total_spent', 10, 2)->default(0)->after('loyalty_points');
            $table->string('preferred_language')->nullable()->after('total_spent');
            $table->json('dietary_preferences')->nullable()->after('preferred_language');
            $table->boolean('marketing_consent')->default(false)->after('dietary_preferences');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'loyalty_points',
                'total_spent',
                'preferred_language',
                'dietary_preferences',
                'marketing_consent'
            ]);
        });
    }
};
