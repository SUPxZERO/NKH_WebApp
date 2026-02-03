<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Permission Middleware
 * 
 * Checks if the authenticated user has the required permission(s).
 * Usage: ->middleware('permission:orders.create')
 *        ->middleware('permission:orders.create,orders.update') // any of these
 */
class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param string ...$permissions One or more permission slugs (user needs ANY of them)
     */
    public function handle(Request $request, Closure $next, string ...$permissions): mixed
    {
        $user = $request->user();

        // SECURITY: Always require authentication - no bypasses
        // Use proper test credentials in development instead of authentication bypasses
        if (!$user) {
            throw new HttpException(401, 'Unauthenticated.');
        }

        if (empty($permissions)) {
            return $next($request);
        }

        // Support comma-delimited permissions in first arg
        if (count($permissions) === 1 && str_contains($permissions[0], ',')) {
            $permissions = array_map('trim', explode(',', $permissions[0]));
        }



        // Check if user has ANY of the required permissions
        foreach ($permissions as $permission) {
            $hasPermission = $user->hasPermission($permission);
            \Log::debug('Permission check', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'permission' => $permission,
                'has_permission' => $hasPermission,
                'user_roles' => $user->roles->pluck('slug')->toArray(),
                'path' => $request->path(),
            ]);
            if ($hasPermission) {
                return $next($request);
            }
        }

        // Log the failed permission check for auditing
        \Log::warning('Permission denied', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'required_permissions' => $permissions,
            'user_roles' => $user->roles->pluck('slug')->toArray(),
            'path' => $request->path(),
            'method' => $request->method(),
        ]);

        throw new HttpException(403, 'Forbidden: insufficient permissions.');
    }
}
