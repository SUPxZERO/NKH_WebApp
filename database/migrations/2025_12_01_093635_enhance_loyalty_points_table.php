<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loyalty_points', function (Blueprint $table) {
            $table->dateTime('expires_at')->nullable()->after('balance_after')->comment('Point expiration date');
            $table->string('campaign_id', 50)->nullable()->after('expires_at')->comment('Marketing campaign reference');
            $table->string('reference_type', 50)->nullable()->after('campaign_id')->comment('Polymorphic type');
            $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type')->comment('Polymorphic ID');
            
            $table->index('expires_at');
            $table->index(['reference_type', 'reference_id']);
        });
    }

    public function down(): void
    {
        Schema::table('loyalty_points', function (Blueprint $table) {
            $table->dropIndex(['expires_at']);
            $table->dropIndex(['reference_type', 'reference_id']);
            $table->dropColumn(['expires_at', 'campaign_id', 'reference_type', 'reference_id']);
        });
    }
};
