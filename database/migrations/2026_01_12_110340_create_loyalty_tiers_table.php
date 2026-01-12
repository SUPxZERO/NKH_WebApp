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
        Schema::create('loyalty_tiers', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // e.g., 'bronze', 'silver', 'gold', 'platinum'
            $table->string('name', 100); // e.g., 'Bronze', 'Silver', 'Gold', 'Platinum'
            $table->string('icon', 50)->nullable();
            $table->string('color', 20)->nullable();
            $table->decimal('min_spent', 10, 2)->default(0); // Minimum total spent to achieve
            $table->decimal('max_spent', 10, 2)->nullable(); // Maximum (null = unlimited for top tier)
            $table->decimal('discount_percent', 5, 2)->default(0); // Tier discount percentage
            $table->integer('points_multiplier')->default(1); // Earn multiplier (2x points, etc.)
            $table->json('benefits')->nullable(); // JSON array of benefits
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('code');
            $table->index(['min_spent', 'max_spent']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_tiers');
    }
};
