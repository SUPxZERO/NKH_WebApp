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
        if (Schema::hasTable('ingredients') && !Schema::hasColumn('ingredients', 'location_id')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->foreignId('location_id')->nullable()->after('id')->constrained('locations')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way fix
    }
};
