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
        Schema::table('orders', function (Blueprint $table) {
            // These columns SHOULD already exist, but we'll check and add if missing
            if (!Schema::hasColumn('orders', 'approval_status')) {
                $table->enum('approval_status', ['pending', 'approved', 'rejected'])
                    ->default('pending')
                    ->after('status');
            }
            
            if (!Schema::hasColumn('orders', 'approved_by')) {
                $table->foreignId('approved_by')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete()
                    ->after('approval_status');
            }
            
            if (!Schema::hasColumn('orders', 'approved_at')) {
                $table->timestamp('approved_at')
                    ->nullable()
                    ->after('approved_by');
            }
            
            if (!Schema::hasColumn('orders', 'rejection_reason')) {
                $table->text('rejection_reason')
                    ->nullable()
                    ->after('approved_at');
            }
            
            if (!Schema::hasColumn('orders', 'is_auto_approved')) {
                $table->boolean('is_auto_approved')
                    ->default(false)
                    ->after('rejection_reason');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't drop these columns in down() because they are critical to Order functionality
        \Log::warning('Down migration skipped - approval columns are core to Order model');
    }
};
