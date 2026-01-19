<?php

namespace App\Http\Middleware;

use App\Http\Middleware\TelegramWebAppAuth;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     * Usage: ->middleware('role:admin,manager')
     */
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        // Check for Telegram guest users trying to access Customer routes
        if (!$user && !empty($roles)) {
            // Parse roles
            $parsedRoles = $roles;
            if (count($roles) === 1 && str_contains($roles[0], ',')) {
                $parsedRoles = array_map('trim', explode(',', $roles[0]));
            }
            $parsedRoles = array_map('strtolower', $parsedRoles);

            // If customer role is required and we have any telegram session, allow through
            if (in_array('customer', $parsedRoles)) {
                // Allow fully authenticated Telegram guests
                if (TelegramWebAppAuth::isTelegramGuest()) {
                    return $next($request);
                }
                // Allow pending Telegram sessions (frontend will upgrade)
                if (TelegramWebAppAuth::isTelegramPending() || session('telegram_webapp')) {
                    return $next($request);
                }
            }
        }

        if (!$user) {
            throw new HttpException(401, 'Unauthenticated.');
        }

        if (empty($roles)) {
            return $next($request);
        }

        // Support comma-delimited roles in first arg as well as variadic
        if (count($roles) === 1 && str_contains($roles[0], ',')) {
            $roles = array_map('trim', explode(',', $roles[0]));
        }

        if (!$user->relationLoaded('roles')) {
            $user->loadMissing('roles');
        }

        $hasAny = $user->hasAnyRole($roles);
        
        // Fallback for legacy role column
        if (!$hasAny && !empty($user->role)) {
            $hasAny = in_array($user->role, $roles);
        }

        if (!$hasAny) {
            throw new HttpException(403, 'Forbidden: insufficient role.');
        }

        return $next($request);
    }
}
