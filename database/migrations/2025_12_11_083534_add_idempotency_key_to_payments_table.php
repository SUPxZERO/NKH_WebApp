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
            // Idempotency key to prevent duplicate payments
            if (!Schema::hasColumn('payments', 'idempotency_key')) {
                $table->string('idempotency_key', 64)->nullable();
                $table->unique('idempotency_key');
            }
            
            // Additional tracking fields for production
            if (!Schema::hasColumn('payments', 'client_ip')) {
                $table->string('client_ip', 45)->nullable(); // IPv6 compatible
            }
            if (!Schema::hasColumn('payments', 'user_agent')) {
                $table->string('user_agent', 500)->nullable();
            }
            if (!Schema::hasColumn('payments', 'verified_at')) {
                $table->timestamp('verified_at')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['idempotency_key']);
            $table->dropColumn(['idempotency_key', 'client_ip', 'user_agent', 'verified_at']);
        });
    }
};

