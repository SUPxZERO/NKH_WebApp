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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique()->index();
            $table->string('name', 50);
            $table->string('display_name', 20);
            $table->string('base_unit', 10)->nullable();
            $table->decimal('conversion_factor', 10, 3)->nullable();
            $table->boolean('is_base_unit')->default(false);
            $table->boolean('for_weight')->default(false);
            $table->boolean('for_volume')->default(false);
            $table->boolean('for_quantity')->default(false);
            $table->boolean('for_packaging')->default(false);
            $table->boolean('for_produce')->default(false);
            $table->timestamps();
        });

        // Add foreign key after table creation to avoid circular reference
        Schema::table('units', function (Blueprint $table) {
            $table->foreign('base_unit')
                  ->references('code')
                  ->on('units')
                  ->onDelete('restrict')
                  ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};