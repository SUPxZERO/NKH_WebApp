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
        Schema::table('categories', function (Blueprint $table) {
            // Add parent_id for hierarchical structure
            $table->unsignedBigInteger('parent_id')->nullable()->after('location_id');
            
            // Add display_order for sorting
            $table->integer('display_order')->default(0)->after('is_active');
            
            // Add foreign key constraint
            $table->foreign('parent_id')->references('id')->on('categories')->onDelete('cascade');
            
            // Add index for better performance
            $table->index(['parent_id', 'display_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropIndex(['parent_id', 'display_order']);
            $table->dropColumn(['parent_id', 'display_order']);
        });
    }
};
