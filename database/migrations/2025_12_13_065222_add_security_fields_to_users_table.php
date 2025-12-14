<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds security-related fields to support:
     * - Account lockout after failed login attempts
     * - Password change tracking
     * - MFA/2FA readiness
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Account lockout fields
            $table->unsignedTinyInteger('failed_login_attempts')->default(0)->after('is_active');
            $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            
            // Password security
            $table->timestamp('password_changed_at')->nullable()->after('locked_until');
            
            // MFA readiness
            $table->boolean('mfa_enabled')->default(false)->after('password_changed_at');
            $table->string('mfa_secret', 128)->nullable()->after('mfa_enabled');
            
            // Add index for lockout queries
            $table->index(['email', 'locked_until'], 'users_lockout_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_lockout_index');
            $table->dropColumn([
                'failed_login_attempts',
                'locked_until',
                'password_changed_at',
                'mfa_enabled',
                'mfa_secret',
            ]);
        });
    }
};
