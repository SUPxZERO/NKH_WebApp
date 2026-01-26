<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the admin role
        $adminRole = DB::table('roles')
            ->where('slug', 'admin')
            ->first();

        if (!$adminRole) {
            return;
        }

        // Get the required permission IDs
        $requiredPermissions = [
            'employees.view', 'employees.create', 'employees.update', 'employees.delete',
            'dashboard.view', 'reports.view', 'reports.export',
            'categories.view', 'categories.create', 'categories.update', 'categories.delete',
            'menu.view', 'menu.create', 'menu.update', 'menu.delete',
            'orders.view', 'orders.create', 'orders.update', 'orders.approve', 'orders.delete',
            'reservations.view', 'reservations.create', 'reservations.update', 'reservations.delete',
            'customers.view', 'customers.update', 'customers.delete',
            'inventory.view', 'inventory.adjust',
            'recipes.view', 'recipes.create', 'recipes.update', 'recipes.delete',
            'suppliers.view', 'suppliers.manage',
            'purchase-orders.view', 'purchase-orders.manage',
            'payments.view',
            'expenses.view',
            'attendance.view', 'shifts.view',
            'locations.view', 'locations.manage',
            'floors.manage', 'tables.manage',
            'promotions.view', 'promotions.manage',
            'loyalty.view', 'loyalty.manage',
            'audit.view',
        ];

        $permissionIds = DB::table('permissions')
            ->whereIn('slug', $requiredPermissions)
            ->pluck('id')
            ->all();

        // Sync the permissions (this will add any missing permissions)
        DB::table('role_permission')->where('role_id', $adminRole->id)->delete();
        
        foreach ($permissionIds as $permissionId) {
            DB::table('role_permission')->insertOrIgnore([
                'role_id' => $adminRole->id,
                'permission_id' => $permissionId,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // This migration is not reversible in a meaningful way
    }
};
