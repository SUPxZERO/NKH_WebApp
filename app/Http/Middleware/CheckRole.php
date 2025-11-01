<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!Auth::check()) {
            // For API/XHR requests return JSON 401 instead of redirecting to login
            if ($request->expectsJson() || $request->is('api/*') || $request->ajax()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect('login');
        }

        $user = Auth::user();
        foreach ($roles as $role) {
            if (method_exists($user, 'hasRole') && $user->hasRole($role)) {
                return $next($request);
            }
            if (data_get($user, 'role') === $role) {
                return $next($request);
            }
        }

        // For API/XHR requests return JSON 403 to avoid HTML error pages
        if ($request->expectsJson() || $request->is('api/*') || $request->ajax()) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return abort(403, 'Unauthorized action.');
    }
}