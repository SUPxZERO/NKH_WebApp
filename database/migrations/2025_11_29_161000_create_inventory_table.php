<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 10, 3)->default(0);
            $table->string('batch_number')->nullable();
            $table->date('expiration_date')->nullable();
            $table->timestamps();
            
            $table->unique(['ingredient_id', 'location_id', 'batch_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory');
    }
};
