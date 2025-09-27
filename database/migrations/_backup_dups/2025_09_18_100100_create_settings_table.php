<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('location_id')->nullable()->constrained()->restrictOnDelete()->cascadeOnUpdate();
            $table->string('key', 150);
            $table->json('value')->nullable();
            $table->timestamps();

            $table->unique(['location_id', 'key']);
            $table->index('key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
