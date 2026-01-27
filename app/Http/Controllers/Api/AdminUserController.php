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
        })->with('roles');

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
        ]);

        $admin = DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
            ]);

            // Ensure role exists and attach
            $roleSlug = $validated['role'];
            $roleName = ucfirst($roleSlug);
            $role = Role::firstOrCreate(['slug' => $roleSlug], ['name' => $roleName]);
            $user->roles()->attach($role);

            return $user;
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

            return $user;
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
