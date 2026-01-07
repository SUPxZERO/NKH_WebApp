<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates table_sessions for tracking customer sessions at QR-scanned tables.
     */
    public function up(): void
    {
        if (Schema::hasTable('table_sessions')) {
            return;
        }

        Schema::create('table_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_id')->constrained('tables')->cascadeOnDelete();
            $table->string('session_token', 64)->unique();
            
            // Customer identification (one of these should be set)
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('telegram_user_id')->nullable()->constrained('telegram_users')->nullOnDelete();
            
            // Device tracking for security
            $table->string('device_fingerprint', 64)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->string('ip_address', 45)->nullable();
            
            // Session status
            $table->enum('status', [
                'active',           // Session started, browsing
                'ordering',         // Adding items to cart
                'payment_pending',  // Order placed, awaiting payment
                'completed',        // Payment done, session ended
                'expired'           // Session timed out
            ])->default('active');
            
            // Link to order once created
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            
            // Timestamps
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('last_activity_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['table_id', 'status']);
            $table->index('session_token');
            $table->index('last_activity_at');
            $table->index(['customer_id', 'status']);
            $table->index(['telegram_user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('table_sessions');
    }
};
