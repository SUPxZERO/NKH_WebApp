<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Security Permissions Seeder
 * 
 * Seeds granular permissions for the RBAC system.
 * Run with: php artisan db:seed --class=SecurityPermissionsSeeder
 */
class SecurityPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'orders.view', 'orders.create', 'orders.update', 'orders.delete', 'orders.approve', 'orders.cancel',
            'menu.view', 'menu.create', 'menu.update', 'menu.delete',
            'categories.view', 'categories.create', 'categories.update', 'categories.delete',
            'inventory.view', 'inventory.adjust', 'inventory.approve',
            'employees.view', 'employees.create', 'employees.update', 'employees.delete',
            'customers.view', 'customers.update', 'customers.delete',
            'reservations.view', 'reservations.create', 'reservations.update', 'reservations.delete',
            'payments.view', 'payments.process', 'payments.refund',
            'reports.view', 'reports.export',
            'settings.view', 'settings.update',
            'users.view', 'users.create', 'users.update', 'users.delete',
            'roles.manage', 'permissions.manage',
            'audit.view', 'audit.export',
            'locations.view', 'locations.manage',
            'notifications.view', 'notifications.send',
            'dashboard.view',
            'recipes.view', 'recipes.create', 'recipes.update', 'recipes.delete',
            'promotions.view', 'promotions.manage',
            'loyalty.view', 'loyalty.manage',
            'employees.manage',
            'expenses.view', 'expenses.create', 'expenses.update', 'expenses.delete',
            'invoices.view', 'invoices.create', 'invoices.update', 'invoices.delete',
        ];

        $created = 0;
        $skipped = 0;
        
        foreach ($permissions as $slug) {
            // Check if slug already exists
            $exists = Permission::where('slug', $slug)->exists();
            
            if (!$exists) {
                try {
                    // Generate name from slug (e.g., 'orders.view' -> 'Orders View')
                    $name = ucwords(str_replace(['.', '_'], ' ', $slug));
                    
                    Permission::create([
                        'slug' => $slug,
                        'name' => $name,
                    ]);
                    $created++;
                } catch (\Exception $e) {
                    $skipped++;
                }
            } else {
                $skipped++;
            }
        }

        $this->command->info("Created {$created} permissions, skipped {$skipped} existing.");

        // Assign all permissions to admin role
        $adminRole = Role::where('slug', 'admin')->first();
        if ($adminRole) {
            $allPermissionIds = Permission::pluck('id')->toArray();
            $adminRole->permissions()->syncWithoutDetaching($allPermissionIds);
            $this->command->info('Assigned all permissions to admin role.');
        }

        // Assign manager permissions
        $managerRole = Role::where('slug', 'manager')->first();
        if ($managerRole) {
            $managerPerms = Permission::whereNotIn('slug', [
                'users.create', 'users.delete', 'roles.manage', 'permissions.manage'
            ])->pluck('id')->toArray();
            $managerRole->permissions()->syncWithoutDetaching($managerPerms);
            $this->command->info('Assigned manager permissions.');
        }

        // Assign permissions to chief role (includes notifications)
        $chiefRole = Role::where('slug', 'chief')->first();
        if ($chiefRole) {
            $chiefPerms = Permission::whereIn('slug', [
                'orders.view', 'orders.approve', 'menu.view', 'notifications.view', 'notifications.send',
                'dashboard.view', 'reports.view', 'employees.view', 'payments.view'
            ])->pluck('id')->toArray();
            $chiefRole->permissions()->syncWithoutDetaching($chiefPerms);
            $this->command->info('Assigned chief permissions.');
        }

        // Assign permissions to service-manager role (includes notifications)
        $serviceManagerRole = Role::where('slug', 'service-manager')->first();
        if ($serviceManagerRole) {
            $servicePerms = Permission::whereIn('slug', [
                'orders.view', 'orders.approve', 'menu.view', 'notifications.view', 'notifications.send',
                'dashboard.view', 'employees.view'
            ])->pluck('id')->toArray();
            $serviceManagerRole->permissions()->syncWithoutDetaching($servicePerms);
            $this->command->info('Assigned service-manager permissions.');
        }

        // Assign permissions to other manager roles
        $otherRoles = ['finance-manager', 'hr-manager', 'inventory-manager', 'operations-manager'];
        foreach ($otherRoles as $roleSlug) {
            $role = Role::where('slug', $roleSlug)->first();
            if ($role) {
                $perms = Permission::whereIn('slug', [
                    'dashboard.view', 'reports.view', 'notifications.view',
                    'settings.view'
                ])->pluck('id')->toArray();
                $role->permissions()->syncWithoutDetaching($perms);
                $this->command->info("Assigned {$roleSlug} permissions.");
            }
        }

        // Assign permissions to viewer role
        $viewerRole = Role::where('slug', 'viewer')->first();
        if ($viewerRole) {
            $viewerPerms = Permission::whereIn('slug', [
                'dashboard.view', 'reports.view', 'notifications.view'
            ])->pluck('id')->toArray();
            $viewerRole->permissions()->syncWithoutDetaching($viewerPerms);
            $this->command->info('Assigned viewer permissions.');
        }

        // Assign permissions to super-admin role (all permissions)
        $superAdminRole = Role::where('slug', 'super-admin')->first();
        if ($superAdminRole) {
            $allPermissionIds = Permission::pluck('id')->toArray();
            $superAdminRole->permissions()->syncWithoutDetaching($allPermissionIds);
            $this->command->info('Assigned all permissions to super-admin role.');
        }
    }
}

