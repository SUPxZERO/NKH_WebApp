<?php

namespace App\Http\Middleware;

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
        if (!$hasAny) {
            throw new HttpException(403, 'Forbidden: insufficient role.');
        }

        return $next($request);
    }
}
