<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        
        // Check role column first (direct role assignment), then fall back to roles relationship
        $userRole = $user?->role;
        
        // If no direct role, check roles relationship
        if (!$userRole && $user) {
            $roles = $user->roles()->with('permissions')->get();
            $userRole = $roles->first()?->slug;
            $permissions = $roles->pluck('permissions.*.slug')->flatten()->unique()->values()->all();
        } else {
            // User has direct role, no need to query relationships
            $permissions = [];
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $userRole,
                    'avatar' => $user->avatar ? \Illuminate\Support\Facades\Storage::url($user->avatar) : null,
                    'permissions' => $permissions,
                ] : null,
            ],
            'csrf_token' => csrf_token(),
        ];
    }
}
