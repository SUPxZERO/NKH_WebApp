<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change status column to string/varchar to support more statuses like 'cancelled'
        Schema::table('payments', function (Blueprint $table) {
            $table->string('status', 50)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert is risky if data exists that doesn't fit enum, keeping as string is safer
        // but for completeness:
        // $table->enum('status', ['pending', 'completed', 'failed'])->change();
    }
};
