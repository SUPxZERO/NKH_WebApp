<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration to add geocoding metadata to existing customer_addresses table
 * 
 * Adds fields to track geocoding attempts, provider used, and result quality
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->timestamp('geocoding_attempted_at')->nullable()->after('longitude');
            $table->boolean('geocoding_failed')->default(false)->after('geocoding_attempted_at');
            $table->string('geocoding_provider', 50)->nullable()->after('geocoding_failed');
            $table->float('geocoding_quality')->nullable()->after('geocoding_provider');

            // Index for finding addresses that need geocoding
            $table->index(['geocoding_attempted_at', 'geocoding_failed']);
        });
    }

    public function down(): void
    {
        Schema::table('customer_addresses', function (Blueprint $table) {
            $table->dropIndex(['geocoding_attempted_at', 'geocoding_failed']);
            $table->dropColumn([
                'geocoding_attempted_at',
                'geocoding_failed',
                'geocoding_provider',
                'geocoding_quality'
            ]);
        });
    }
};
