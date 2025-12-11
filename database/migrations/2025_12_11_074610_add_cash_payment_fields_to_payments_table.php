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
        Schema::table('payments', function (Blueprint $table) {
            // Cash payment specific fields
            $table->decimal('cash_received', 10, 2)->nullable()->after('amount');
            $table->decimal('change_given', 10, 2)->nullable()->after('cash_received');
            $table->unsignedBigInteger('confirmed_by')->nullable()->after('change_given');
            $table->timestamp('confirmed_at')->nullable()->after('confirmed_by');
            
            // Foreign key for employee who confirmed the payment
            $table->foreign('confirmed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['confirmed_by']);
            $table->dropColumn(['cash_received', 'change_given', 'confirmed_by', 'confirmed_at']);
        });
    }
};
