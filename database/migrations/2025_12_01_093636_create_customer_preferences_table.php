<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_preferences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->string('category', 50)->comment('e.g., notification, dietary, accessibility');
            $table->string('preference_key', 100);
            $table->json('preference_value');
            $table->timestamps();
            
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->unique(['customer_id', 'category', 'preference_key'], 'uk_customer_pref');
            $table->index(['customer_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_preferences');
    }
};
