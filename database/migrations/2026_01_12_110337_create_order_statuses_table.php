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
        Schema::create('order_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique(); // e.g., 'received', 'preparing', 'ready'
            $table->string('name', 100); // e.g., 'Received', 'Preparing', 'Ready'
            $table->string('icon', 50)->nullable();
            $table->string('color', 20)->nullable(); // For status badges
            $table->boolean('is_terminal')->default(false); // Cannot transition from terminal states
            $table->integer('workflow_position')->default(0); // Order in workflow (1=first, 10=last)
            $table->integer('display_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('show_to_customer')->default(true); // Customer can see this status
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('code');
            $table->index('is_terminal');
            $table->index('workflow_position');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_statuses');
    }
};
