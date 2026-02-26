<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * AUDIT FIX: Creates the sequences table used by SequenceService for atomic,
 * collision-free number generation (order numbers, invoice numbers, etc.).
 *
 * Replaces the random-retry pattern in InvoiceService.generateInvoiceNumber()
 * and OrderPlacementService which had a race condition under concurrent traffic.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('sequences', function (Blueprint $table) {
            $table->id();
            $table->string('entity', 50)->comment('e.g. orders, invoices');
            $table->unsignedInteger('location_id')->nullable()->comment('null = global sequence');
            $table->unsignedBigInteger('value')->default(0)->comment('current counter value');
            $table->timestamps();

            // Each entity can have one global sequence OR one per location
            $table->unique(['entity', 'location_id'], 'sequences_entity_location_unique');
            $table->index('entity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sequences');
    }
};
