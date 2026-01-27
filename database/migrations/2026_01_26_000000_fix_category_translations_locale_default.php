<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('category_translations', function (Blueprint $table) {
            // Add default value 'en' to the locale column
            $table->string('locale', 10)->default('en')->change();
        });
    }

    public function down(): void
    {
        Schema::table('category_translations', function (Blueprint $table) {
            // Revert the change
            $table->string('locale', 10)->change();
        });
    }
};
