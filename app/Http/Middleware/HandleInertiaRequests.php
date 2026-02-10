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

        // Always fetch from roles() relationship for correct role assignment
        // The 'role' column (if it exists) may be stale or null
        $userRole = null;
        $permissions = [];

        if ($user) {
            $roles = $user->roles()->with('permissions')->get();
            $userRole = $roles->first()?->slug;
            $permissions = $roles->pluck('permissions.*.slug')->flatten()->unique()->values()->all();

            // Fallback to direct 'role' attribute only if no roles assigned via relationship
            if (!$userRole && isset($user->role)) {
                $userRole = $user->role;
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $userRole,
                    'avatar' => $user->avatar ? \Illuminate\Support\Facades\Storage::url($user->avatar) : null,
                    'permissions' => $permissions,
                ] : null,
            ],
            'csrf_token' => csrf_token(),
            'locale' => app()->getLocale(),
            'translations' => function () {
                $locale = app()->getLocale();
                $path = lang_path("{$locale}.json");
                return file_exists($path) ? json_decode(file_get_contents($path), true) : [];
            },
        ];
    }
}
