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
    }
}

