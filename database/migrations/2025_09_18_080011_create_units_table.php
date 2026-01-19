<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * SQL Source: units table
 * Engine: InnoDB | Charset: utf8mb4_unicode_ci
 * Self-referencing: base_unit -> units.code
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
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

            $table->index('base_unit');
        });

        // Self-referencing FK added after table creation
        Schema::table('units', function (Blueprint $table) {
            $table->foreign('base_unit')
                ->references('code')
                ->on('units')
                ->onDelete('restrict')
                ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('units', function (Blueprint $table) {
            $table->dropForeign(['base_unit']);
        });
        Schema::dropIfExists('units');
    }
};
