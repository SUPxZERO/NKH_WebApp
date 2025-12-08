<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enhances payments table for production payment processing with QRKH support.
     */
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            // UUID for external references
            if (!Schema::hasColumn('payments', 'uuid')) {
                $table->uuid('uuid')->unique()->after('id');
            }
            
            // Currency and exchange
            if (!Schema::hasColumn('payments', 'currency')) {
                $table->string('currency', 3)->default('USD')->after('amount');
            }
            if (!Schema::hasColumn('payments', 'exchange_rate')) {
                $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('currency');
            }
            if (!Schema::hasColumn('payments', 'amount_in_base_currency')) {
                $table->decimal('amount_in_base_currency', 12, 2)->nullable()->after('exchange_rate');
            }
            
            // Gateway references
            if (!Schema::hasColumn('payments', 'gateway_reference')) {
                $table->string('gateway_reference', 255)->nullable()->after('reference_number');
            }
            if (!Schema::hasColumn('payments', 'qr_reference')) {
                $table->string('qr_reference', 100)->nullable()->after('gateway_reference');
            }
            
            // Enhanced status
            if (!Schema::hasColumn('payments', 'failure_reason')) {
                $table->string('failure_reason', 255)->nullable()->after('status');
            }
            
            // Timestamps
            if (!Schema::hasColumn('payments', 'initiated_at')) {
                $table->timestamp('initiated_at')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('payments', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('processed_at');
            }
            
            // Audit fields
            if (!Schema::hasColumn('payments', 'ip_address')) {
                $table->string('ip_address', 45)->nullable()->after('expires_at');
            }
            if (!Schema::hasColumn('payments', 'user_agent')) {
                $table->text('user_agent')->nullable()->after('ip_address');
            }
            if (!Schema::hasColumn('payments', 'device_fingerprint')) {
                $table->string('device_fingerprint', 255)->nullable()->after('user_agent');
            }
            
            // Metadata
            if (!Schema::hasColumn('payments', 'metadata')) {
                $table->json('metadata')->nullable()->after('device_fingerprint');
            }
            
            // Retry tracking
            if (!Schema::hasColumn('payments', 'retry_count')) {
                $table->unsignedTinyInteger('retry_count')->default(0)->after('metadata');
            }
        });
        
        // Add indexes safely (separate schema call to handle errors)
        try {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['qr_reference'], 'idx_payments_qr');
            });
        } catch (\Exception $e) {
            // Index may already exist
        }
        
        try {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['initiated_at'], 'idx_payments_initiated');
            });
        } catch (\Exception $e) {
            // Index may already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('idx_payments_qr');
            $table->dropIndex('idx_payments_initiated');
            
            $columns = [
                'uuid', 'currency', 'exchange_rate', 'amount_in_base_currency',
                'gateway_reference', 'qr_reference', 'failure_reason',
                'initiated_at', 'expires_at', 'ip_address', 'user_agent',
                'device_fingerprint', 'metadata', 'retry_count'
            ];
            
            foreach ($columns as $column) {
                if (Schema::hasColumn('payments', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
