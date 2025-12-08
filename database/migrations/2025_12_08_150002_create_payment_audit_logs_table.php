<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates payment audit logs for tracking all payment-related events.
     */
    public function up(): void
    {
        Schema::create('payment_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            
            // Action tracking
            $table->string('action', 50); // initiated, qr_generated, webhook_received, completed, failed, refunded
            $table->string('old_status', 20)->nullable();
            $table->string('new_status', 20)->nullable();
            $table->decimal('amount_change', 12, 2)->nullable();
            
            // Actor tracking
            $table->foreignId('performed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_type', 20)->default('system'); // user, system, webhook
            
            // Request context
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            // Additional data
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            
            $table->timestamp('created_at')->useCurrent();
            
            // Indexes
            $table->index(['payment_id', 'action'], 'idx_payment_audit_action');
            $table->index(['created_at'], 'idx_payment_audit_date');
            $table->index(['action', 'created_at'], 'idx_payment_audit_action_date');
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
