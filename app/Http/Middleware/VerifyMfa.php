<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * MFA Middleware
 * 
 * Enforces MFA verification for users who have MFA enabled.
 * Should be applied to sensitive routes that require additional verification.
 */
class VerifyMfa
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // If MFA is not enabled, allow through
        if (!$user->mfa_enabled) {
            return $next($request);
        }

        // Check if session/token has been MFA verified
        $mfaVerified = $this->isMfaVerified($request, $user);

        if (!$mfaVerified) {
            return response()->json([
                'message' => 'MFA verification required.',
                'mfa_required' => true,
                'verify_url' => '/api/auth/mfa/validate',
            ], 403);
        }

        return $next($request);
    }

    /**
     * Check if the current session/token has completed MFA verification.
     */
    protected function isMfaVerified(Request $request, $user): bool
    {
        // For API tokens, check token abilities or cache
        $token = $user->currentAccessToken();
        if ($token) {
            // Check if token has MFA verified flag
            $cacheKey = "mfa_verified:token:{$token->id}";
            return (bool) cache()->get($cacheKey, false);
        }

        // For session-based auth
        return (bool) session()->get('mfa_verified', false);
    }

    /**
     * Mark the current session/token as MFA verified.
     */
    public static function markVerified($user): void
    {
        $token = $user->currentAccessToken();
        if ($token) {
            $cacheKey = "mfa_verified:token:{$token->id}";
            cache()->put($cacheKey, true, now()->addHours(1));
        } else {
            session()->put('mfa_verified', true);
        }
    }
}
