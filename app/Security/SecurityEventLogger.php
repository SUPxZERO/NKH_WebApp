<?php

namespace App\Security;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

/**
 * Security Event Logger
 * 
 * Logs security-related events for auditing and alerting.
 */
class SecurityEventLogger
{
    public const EVENT_LOGIN_SUCCESS = 'login_success';
    public const EVENT_LOGIN_FAILED = 'login_failed';
    public const EVENT_LOGOUT = 'logout';
    public const EVENT_PASSWORD_CHANGE = 'password_change';
    public const EVENT_PASSWORD_RESET = 'password_reset';
    public const EVENT_MFA_ENABLED = 'mfa_enabled';
    public const EVENT_MFA_DISABLED = 'mfa_disabled';
    public const EVENT_PERMISSION_DENIED = 'permission_denied';
    public const EVENT_RATE_LIMITED = 'rate_limited';
    public const EVENT_ACCOUNT_LOCKED = 'account_locked';
    public const EVENT_SUSPICIOUS_ACTIVITY = 'suspicious_activity';

    /**
     * Log a security event.
     */
    public static function log(
        string $event,
        ?int $userId = null,
        array $metadata = [],
        string $severity = 'info'
    ): void {
        $request = request();

        $logData = [
            'event' => $event,
            'user_id' => $userId ?? auth()->id(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'path' => $request->path(),
            'metadata' => $metadata,
            'timestamp' => now()->toIso8601String(),
        ];

        // Log to file
        match ($severity) {
            'warning' => Log::warning("[SECURITY] {$event}", $logData),
            'error' => Log::error("[SECURITY] {$event}", $logData),
            'critical' => Log::critical("[SECURITY] {$event}", $logData),
            default => Log::info("[SECURITY] {$event}", $logData),
        };

        // Also store in database audit log if user is available
        if ($userId || auth()->id()) {
            try {
                AuditLog::create([
                    'user_id' => $userId ?? auth()->id(),
                    'action' => $event,
                    'auditable_type' => 'security',
                    'auditable_id' => $userId ?? auth()->id() ?? 0,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'metadata' => json_encode($metadata),
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to create security audit log', ['error' => $e->getMessage()]);
            }
        }
    }

    /**
     * Log successful login.
     */
    public static function loginSuccess(int $userId, array $extra = []): void
    {
        self::log(self::EVENT_LOGIN_SUCCESS, $userId, $extra, 'info');
    }

    /**
     * Log failed login attempt.
     */
    public static function loginFailed(string $email, array $extra = []): void
    {
        self::log(self::EVENT_LOGIN_FAILED, null, array_merge(['email' => $email], $extra), 'warning');
    }

    /**
     * Log permission denied.
     */
    public static function permissionDenied(?int $userId, string $permission, array $extra = []): void
    {
        self::log(self::EVENT_PERMISSION_DENIED, $userId, array_merge([
            'required_permission' => $permission,
        ], $extra), 'warning');
    }

    /**
     * Log rate limiting event.
     */
    public static function rateLimited(?int $userId, string $tier, array $extra = []): void
    {
        self::log(self::EVENT_RATE_LIMITED, $userId, array_merge([
            'tier' => $tier,
        ], $extra), 'warning');
    }

    /**
     * Log account lockout.
     */
    public static function accountLocked(string $email, int $attempts, array $extra = []): void
    {
        self::log(self::EVENT_ACCOUNT_LOCKED, null, array_merge([
            'email' => $email,
            'attempts' => $attempts,
        ], $extra), 'warning');
    }
}
