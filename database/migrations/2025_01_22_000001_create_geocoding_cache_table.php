<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration to create geocoding_cache table
 * 
 * Stores cached geocoding results to minimize API calls and improve performance
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('geocoding_cache', function (Blueprint $table) {
            $table->id();
            $table->string('address_hash', 64)->unique(); // SHA256 hash of normalized address
            $table->text('address_text'); // Original address for reference
            $table->decimal('latitude', 10, 8); // Up to 8 decimal places precision
            $table->decimal('longitude', 11, 8); // Up to 8 decimal places precision
            $table->string('provider', 50); // nominatim, google, mapbox
            $table->float('quality_score')->nullable(); // 0-1 confidence score from provider
            $table->timestamp('geocoded_at');
            $table->timestamps();

            // Index for quick lookups
            $table->index('address_hash');
            $table->index('geocoded_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('geocoding_cache');
    }
};
