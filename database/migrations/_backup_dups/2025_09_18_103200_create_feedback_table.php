<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete()->cascadeOnUpdate();
            $table->unsignedTinyInteger('rating')->default(5)->index(); // 1-5
            $table->text('comments')->nullable();
            $table->enum('visibility', ['public','private','hidden'])->default('public')->index();
            $table->timestamps();

            $table->index(['order_id', 'customer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
