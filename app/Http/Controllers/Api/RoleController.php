<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::withCount(['users', 'permissions'])->get();
        return response()->json(['data' => $roles]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100|unique:roles,name',
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        DB::beginTransaction();
        try {
            $role = Role::create([
                'name' => $request->name,
                'slug' => Str::slug($request->name),
                'description' => $request->description
            ]);

            if ($request->has('permissions')) {
                $role->permissions()->sync($request->permissions);
            }

            DB::commit();
            return response()->json([
                'message' => 'Role created successfully',
                'data' => $role->load('permissions')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create role: ' . $e->getMessage()], 500);
        }
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');
        return response()->json(['data' => $role]);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        // 1. Validate
        $request->validate([
            'name' => 'required|string|max:100|unique:roles,name,' . $role->id,
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id' // Accepts IDs
        ]);

        DB::beginTransaction();
        try {
            // 2. Handle System Role Protection (Name & Slug)
            if ($role->is_system) {
                // Prevent renaming system roles
                // We compare strict equality to ensure absolute stability of system role keys
                if ($request->name !== $role->name) {
                    throw new \Exception("Cannot rename system role '{$role->name}'. Name must remain unchanged.");
                }

                // Only update description for system roles
                $role->update([
                    'description' => $request->description
                ]);
            } else {
                // Normal roles: Update name, slug, description
                $role->update([
                    'name' => $request->name,
                    'slug' => Str::slug($request->name),
                    'description' => $request->description
                ]);
            }

            // 3. Sync Permissions (Always allowed, even for system roles)
            // Use 'sync' to strictly match the provided list (detaching others)
            if ($request->has('permissions')) {
                // Ensure we pass an array of integers/IDs
                $role->permissions()->sync($request->permissions);
            }

            DB::commit();

            // 4. Return Fresh Data
            return response()->json([
                'message' => 'Role updated successfully',
                'data' => $role->load('permissions')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            // Log the error for debugging
            \Log::error('Role Update Failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update role: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->is_system) {
            return response()->json(['message' => 'Cannot delete system role'], 403);
        }

        if ($role->users()->count() > 0) {
            return response()->json(['message' => 'Cannot delete role assigned to users'], 422);
        }

        $role->delete();
        return response()->json(['message' => 'Role deleted successfully']);
    }

    public function getAllPermissions(): JsonResponse
    {
        $permissions = Permission::all()->groupBy(function ($item) {
            // Group by resource name (e.g., "create-user" -> "user")
            // Assuming format "action-resource" or similar
            $parts = explode('-', $item->slug);
            return count($parts) > 1 ? end($parts) : 'general';
        });

        return response()->json(['data' => $permissions]);
    }
}
