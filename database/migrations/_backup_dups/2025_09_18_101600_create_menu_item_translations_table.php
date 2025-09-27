<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_translations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete()->cascadeOnUpdate();
            $table->string('locale', 10)->index();
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['menu_item_id', 'locale']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_translations');
    }
};
