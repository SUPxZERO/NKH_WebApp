<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds avatar column to customers table to support profile pictures
     * for Telegram users who don't have a linked User record.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('avatar');
        });
    }
};
