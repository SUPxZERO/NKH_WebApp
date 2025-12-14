<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Account Lockout Middleware
 * 
 * Prevents brute force attacks by locking accounts after too many failed attempts.
 * Uses progressive lockout (escalating duration) for repeated violations.
 */
class AccountLockout
{
    /**
     * Maximum failed attempts before lockout
     */
    protected const MAX_ATTEMPTS = 5;

    /**
     * Initial lockout duration in minutes
     */
    protected const BASE_LOCKOUT_MINUTES = 15;

    /**
     * Maximum lockout duration in minutes (caps progressive escalation)
     */
    protected const MAX_LOCKOUT_MINUTES = 1440; // 24 hours

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $email = $request->input('email');
        
        if (!$email) {
            return $next($request);
        }

        // Check if account is locked
        $lockInfo = $this->getLockInfo($email);
        
        if ($lockInfo['locked']) {
            return response()->json([
                'message' => 'Account is temporarily locked due to too many failed login attempts.',
                'locked_until' => $lockInfo['until']->toIso8601String(),
                'retry_after' => $lockInfo['until']->diffInSeconds(now()),
            ], 423); // 423 Locked
        }

        return $next($request);
    }

    /**
     * Record a failed login attempt.
     */
    public static function recordFailedAttempt(string $email): array
    {
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            // Still track by IP/email combo to prevent enumeration attacks
            return self::recordFailedAttemptByKey($email);
        }

        $attempts = $user->failed_login_attempts + 1;
        $user->failed_login_attempts = $attempts;

        if ($attempts >= self::MAX_ATTEMPTS) {
            // Progressive lockout: double duration each time, capped at max
            $lockoutMinutes = min(
                self::BASE_LOCKOUT_MINUTES * pow(2, floor($attempts / self::MAX_ATTEMPTS) - 1),
                self::MAX_LOCKOUT_MINUTES
            );
            $user->locked_until = now()->addMinutes($lockoutMinutes);
        }

        $user->save();

        return [
            'attempts' => $attempts,
            'max_attempts' => self::MAX_ATTEMPTS,
            'locked' => $user->locked_until && $user->locked_until->isFuture(),
            'locked_until' => $user->locked_until,
        ];
    }

    /**
     * Clear failed attempts on successful login.
     */
    public static function clearAttempts(User $user): void
    {
        $user->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
        
        // Also clear cache-based tracking
        Cache::forget("login_attempts:{$user->email}");
    }

    /**
     * Get lock status for an email.
     */
    protected function getLockInfo(string $email): array
    {
        $user = User::where('email', $email)->first();
        
        if ($user && $user->locked_until && $user->locked_until->isFuture()) {
            return [
                'locked' => true,
                'until' => $user->locked_until,
            ];
        }

        // Check cache for non-existent users (prevents enumeration)
        $cacheKey = "login_lockout:{$email}";
        $lockedUntil = Cache::get($cacheKey);
        
        if ($lockedUntil && now()->lt($lockedUntil)) {
            return [
                'locked' => true,
                'until' => $lockedUntil,
            ];
        }

        return ['locked' => false, 'until' => null];
    }

    /**
     * Track failed attempts for non-existent users (prevents enumeration).
     */
    protected static function recordFailedAttemptByKey(string $email): array
    {
        $cacheKey = "login_attempts:{$email}";
        $attempts = Cache::get($cacheKey, 0) + 1;
        
        Cache::put($cacheKey, $attempts, now()->addHours(1));

        if ($attempts >= self::MAX_ATTEMPTS) {
            $lockoutMinutes = self::BASE_LOCKOUT_MINUTES;
            $lockoutUntil = now()->addMinutes($lockoutMinutes);
            Cache::put("login_lockout:{$email}", $lockoutUntil, $lockoutUntil);
            
            return [
                'attempts' => $attempts,
                'max_attempts' => self::MAX_ATTEMPTS,
                'locked' => true,
                'locked_until' => $lockoutUntil,
            ];
        }

        return [
            'attempts' => $attempts,
            'max_attempts' => self::MAX_ATTEMPTS,
            'locked' => false,
            'locked_until' => null,
        ];
    }
}
