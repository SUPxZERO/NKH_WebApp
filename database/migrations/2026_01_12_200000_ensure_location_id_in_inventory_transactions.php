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
        if (Schema::hasTable('inventory_transactions') && !Schema::hasColumn('inventory_transactions', 'location_id')) {
            Schema::table('inventory_transactions', function (Blueprint $table) {
                // Determine insertion point
                $after = 'id';
                if (Schema::hasColumn('inventory_transactions', 'ingredient_id')) {
                    $after = 'ingredient_id';
                }

                $table->foreignId('location_id')->nullable()->after($after)->constrained('locations')->nullOnDelete();
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
