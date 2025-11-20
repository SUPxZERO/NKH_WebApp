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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->nullable()->constrained()->cascadeOnUpdate()->nullOnDelete();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->string('contact_name', 100)->nullable();
            $table->string('contact_phone', 30)->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('type', 50)->index();
            $table->string('payment_terms', 50)->nullable();
            $table->text('notes')->nullable();
            $table->string('tax_id', 50)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
