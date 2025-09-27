<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('label', 100);
            $table->string('address_line_1');
            $table->string('address_line_2')->nullable();
            $table->string('city', 120);
            $table->string('province', 120);
            $table->string('postal_code', 20);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('delivery_instructions')->nullable();
            $table->timestamps();

            $table->index(['customer_id', 'label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
    }
};
