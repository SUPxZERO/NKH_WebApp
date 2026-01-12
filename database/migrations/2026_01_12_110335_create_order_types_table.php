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
        Schema::create('order_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // e.g., 'delivery', 'dine_in', 'pickup'
            $table->string('name', 100); // e.g., 'Delivery', 'Dine-In', 'Pickup'
            $table->string('icon', 50)->nullable(); // Icon class/name
            $table->string('color', 20)->nullable(); // HEX color for UI badges
            $table->boolean('allows_delivery')->default(false);
            $table->boolean('allows_table')->default(false);
            $table->boolean('allows_pickup')->default(false);
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_types');
    }
};
