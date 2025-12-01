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
        $request->validate([
            'name' => 'required|string|max:100|unique:roles,name,' . $role->id,
            'description' => 'nullable|string',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        DB::beginTransaction();
        try {
            $role->update([
                'name' => $request->name,
                'slug' => Str::slug($request->name),
                'description' => $request->description
            ]);

            if ($request->has('permissions')) {
                $role->permissions()->sync($request->permissions);
            }

            DB::commit();
            return response()->json([
                'message' => 'Role updated successfully',
                'data' => $role->load('permissions')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to update role: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Role $role): JsonResponse
    {
        if ($role->users()->count() > 0) {
            return response()->json(['message' => 'Cannot delete role assigned to users'], 422);
        }

        $role->delete();
        return response()->json(['message' => 'Role deleted successfully']);
    }

    public function getAllPermissions(): JsonResponse
    {
        $permissions = Permission::all()->groupBy(function($item) {
            // Group by resource name (e.g., "create-user" -> "user")
            // Assuming format "action-resource" or similar
            $parts = explode('-', $item->slug);
            return count($parts) > 1 ? end($parts) : 'general';
        });
        
        return response()->json(['data' => $permissions]);
    }
}
