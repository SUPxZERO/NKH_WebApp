<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payment_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('action', 50); // status_changed, completed, failed, cancelled, refunded, etc.
            $table->string('old_value', 50)->nullable(); // Previous status/value
            $table->string('new_value', 50)->nullable(); // New status/value
            $table->string('ip_address', 45)->nullable(); // IPv6 compatible
            $table->string('user_agent', 255)->nullable();
            $table->json('metadata')->nullable(); // Additional context (failure reason, etc.)
            $table->timestamps();

            // Indexes for common queries
            $table->index('action');
            $table->index('created_at');
            $table->index(['payment_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_audit_logs');
    }
};
