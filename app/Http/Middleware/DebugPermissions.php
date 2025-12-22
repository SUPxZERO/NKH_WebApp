<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DebugPermissions
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($request->path() === 'api/admin/notifications') {
            Log::info('DEBUG: Accessing /api/admin/notifications', [
                'user_id' => $user?->id,
                'user_email' => $user?->email,
                'user_roles' => $user?->roles()->pluck('slug')->toArray() ?? [],
                'has_notif_view' => $user?->hasPermission('notifications.view') ?? false,
                'has_notif_send' => $user?->hasPermission('notifications.send') ?? false,
            ]);
        }

        return $next($request);
    }
}
