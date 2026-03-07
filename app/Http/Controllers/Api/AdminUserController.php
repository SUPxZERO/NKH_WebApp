<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * Display a listing of admin users.
     */
    public function index(Request $request)
    {
        $query = User::where(function ($q) {
            $q->whereHas('roles', function ($q2) {
                $q2->whereIn('slug', ['super-admin', 'admin', 'manager']);
            });
        })->with(['roles', 'locations']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $admins = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($admins);
    }

    /**
     * Store a new admin user.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'is_active' => 'boolean',
            'role' => 'required|string|in:admin,manager,super-admin',
            'location_ids' => 'nullable|array',
            'location_ids.*' => 'exists:locations,id',
            'default_location_id' => 'nullable|exists:locations,id',
        ]);

        $admin = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'default_location_id' => $validated['default_location_id'] ?? null,
            ]);

            // Ensure role exists and attach
            $roleSlug = $validated['role'];
            $roleName = ucfirst($roleSlug);
            $role = Role::firstOrCreate(['slug' => $roleSlug], ['name' => $roleName]);
            $user->roles()->attach($role);

            // Sync locations
            if (!empty($validated['location_ids'])) {
                $user->locations()->sync($validated['location_ids']);
            } elseif ($user->default_location_id) {
                $user->locations()->sync([$user->default_location_id]);
            }

            return $user->load(['roles', 'locations']);
        });

        return response()->json($admin, 201);
    }

    /**
     * Update the specified admin user.
     */
    public function update(Request $request, User $user)
    {
        // Typically route model binding will find the User by ID.
        // We should ensure this user is actually an admin or we have rights to edit them.

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'phone' => 'nullable|string|max:20',
            'role' => 'sometimes|string|in:admin,manager,super-admin',
            'is_active' => 'sometimes|boolean',
            'location_ids' => 'sometimes|array',
            'location_ids.*' => 'exists:locations,id',
            'default_location_id' => 'sometimes|nullable|exists:locations,id',
        ]);

        $user = DB::transaction(function () use ($validated, $user) {
            $updateData = [];
            if (isset($validated['name']))
                $updateData['name'] = $validated['name'];
            if (isset($validated['email']))
                $updateData['email'] = $validated['email'];
            if (isset($validated['phone']))
                $updateData['phone'] = $validated['phone'];
            if (isset($validated['is_active']))
                $updateData['is_active'] = $validated['is_active'];
            if (array_key_exists('default_location_id', $validated))
                $updateData['default_location_id'] = $validated['default_location_id'];

            if (!empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $user->update($updateData);

            // Update Spatie role if provided
            if (isset($validated['role'])) {
                $roleSlug = $validated['role'];
                $roleName = ucfirst($roleSlug);
                $role = Role::firstOrCreate(['slug' => $roleSlug], ['name' => $roleName]);
                $user->roles()->sync([$role->id]);
            }

            // Sync locations
            if (isset($validated['location_ids'])) {
                $syncIds = $validated['location_ids'];
                $primaryId = $validated['default_location_id'] ?? $user->default_location_id;

                if ($primaryId && !in_array($primaryId, $syncIds)) {
                    $syncIds[] = (int) $primaryId;
                }

                $user->locations()->sync($syncIds);
            } elseif (isset($validated['default_location_id']) && $validated['default_location_id']) {
                // If only default changed, ensure it's in the pivot
                $user->locations()->syncWithoutDetaching([$validated['default_location_id']]);
            }

            return $user->load(['roles', 'locations']);
        });

        return response()->json($user);
    }

    /**
     * Remove (deactivate) the specified admin user.
     */
    public function destroy(User $user)
    {
        // Prevent deleting oneself
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $user->update(['is_active' => false]);
        return response()->json(['message' => 'Admin deactivated successfully']);
    }

    /**
     * Get basic stats for admin page
     */
    public function stats()
    {
        // Count users with any admin-capable role
        $adminRoles = ['super-admin', 'admin', 'manager'];
        $query = User::where(function ($q) use ($adminRoles) {
            $q->whereHas('roles', fn($q2) => $q2->whereIn('slug', $adminRoles));
        });

        return response()->json([
            'total' => (clone $query)->count(),
            'active' => (clone $query)->where('is_active', true)->count(),
            'inactive' => (clone $query)->where('is_active', false)->count(),
        ]);
    }
}
