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
        Schema::create('payment_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // e.g., 'pending', 'completed', 'failed'
            $table->string('name', 100); // e.g., 'Pending', 'Completed', 'Failed'
            $table->string('icon', 50)->nullable();
            $table->string('color', 20)->nullable();
            $table->boolean('is_successful')->default(false); // Indicates payment was successful
            $table->boolean('is_terminal')->default(false); // Cannot transition from this state
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('code');
            $table->index('is_successful');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_statuses');
    }
};
