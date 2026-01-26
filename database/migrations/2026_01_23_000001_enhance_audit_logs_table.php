<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Enhanced Audit Logs Migration
     * 
     * Adds critical columns for:
     * - Full auth context (guard, user_role)
     * - Request tracing (request_id, route, method, session_id, source)
     * - Change tracking (before_data, after_data, change_summary)
     * - Status tracking (status, error_message)
     */
    public function up(): void
    {
        // Check if table exists first (for migration safety)
        if (!Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action', 150);
                $table->string('auditable_type', 255)->nullable();
                $table->unsignedBigInteger('auditable_id')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('users')->onDelete('set null')->onUpdate('cascade');
                $table->index(['auditable_type', 'auditable_id']);
                $table->index('created_at');
                $table->index('action');
            });
            return;
        }

        // Otherwise, enhance the existing table with missing columns
        Schema::table('audit_logs', function (Blueprint $table) {
            // Guard & Auth Context
            if (!Schema::hasColumn('audit_logs', 'guard')) {
                $table->after('user_id', function (Blueprint $table) {
                    $table->string('guard', 50)->nullable()->comment('web, api, admin');
                });
            }

            if (!Schema::hasColumn('audit_logs', 'user_role')) {
                $table->after('guard', function (Blueprint $table) {
                    $table->string('user_role', 100)->nullable()->comment('Denormalized role for query speed');
                });
            }

            // Request Context
            if (!Schema::hasColumn('audit_logs', 'route')) {
                $table->after('user_agent', function (Blueprint $table) {
                    $table->string('route', 255)->nullable()->comment('Named route: orders.store, payments.refund');
                });
            }

            if (!Schema::hasColumn('audit_logs', 'method')) {
                $table->after('route', function (Blueprint $table) {
                    $table->string('method', 10)->nullable()->comment('GET, POST, PUT, DELETE, PATCH');
                });
            }

            if (!Schema::hasColumn('audit_logs', 'request_id')) {
                $table->after('method', function (Blueprint $table) {
                    $table->string('request_id', 36)->nullable()->comment('UUID for request tracing');
                });
            }

            if (!Schema::hasColumn('audit_logs', 'session_id')) {
                $table->after('request_id', function (Blueprint $table) {
                    $table->string('session_id', 255)->nullable()->comment('Session tracking');
                });
            }

            if (!Schema::hasColumn('audit_logs', 'source')) {
                $table->after('session_id', function (Blueprint $table) {
                    $table->string('source', 50)->nullable()->comment('web, api, admin, job, system');
                });
            }

            // Change Tracking
            if (!Schema::hasColumn('audit_logs', 'before_data')) {
                $table->after('source', function (Blueprint $table) {
                    $table->json('before_data')->nullable()->comment('Old values before change');
                });
            }

            if (!Schema::hasColumn('audit_logs', 'after_data')) {
                $table->after('before_data', function (Blueprint $table) {
                    $table->json('after_data')->nullable()->comment('New values after change');
                });
            }

            if (!Schema::hasColumn('audit_logs', 'change_summary')) {
                $table->after('after_data', function (Blueprint $table) {
                    $table->text('change_summary')->nullable()->comment('Human-readable summary of changes');
                });
            }

            // Status Tracking
            if (!Schema::hasColumn('audit_logs', 'status')) {
                $table->after('change_summary', function (Blueprint $table) {
                    $table->string('status', 20)->default('success')->comment('success, failed');
                });
            }

            if (!Schema::hasColumn('audit_logs', 'error_message')) {
                $table->after('status', function (Blueprint $table) {
                    $table->text('error_message')->nullable()->comment('Error details if status=failed');
                });
            }
        });

        // Add indexes for new columns (for query performance)
        Schema::table('audit_logs', function (Blueprint $table) {
            // These are for common queries
            if (!Schema::hasIndex('audit_logs', 'idx_user_id_created_at')) {
                $table->index(['user_id', 'created_at']);
            }
            if (!Schema::hasIndex('audit_logs', 'idx_action_created_at')) {
                $table->index(['action', 'created_at']);
            }
            if (!Schema::hasIndex('audit_logs', 'idx_route')) {
                $table->index('route');
            }
            if (!Schema::hasIndex('audit_logs', 'idx_source')) {
                $table->index('source');
            }
            if (!Schema::hasIndex('audit_logs', 'idx_status')) {
                $table->index('status');
            }
            if (!Schema::hasIndex('audit_logs', 'idx_request_id')) {
                $table->index('request_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            // Drop indexes
            $table->dropIndex('idx_user_id_created_at');
            $table->dropIndex('idx_action_created_at');
            $table->dropIndex('idx_route');
            $table->dropIndex('idx_source');
            $table->dropIndex('idx_status');
            $table->dropIndex('idx_request_id');

            // Drop columns
            $table->dropColumn([
                'guard',
                'user_role',
                'route',
                'method',
                'request_id',
                'session_id',
                'source',
                'before_data',
                'after_data',
                'change_summary',
                'status',
                'error_message',
            ]);
        });
    }
};
