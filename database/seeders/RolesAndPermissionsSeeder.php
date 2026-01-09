<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin', 'slug' => 'admin'],
            ['name' => 'Manager', 'slug' => 'manager'],
            ['name' => 'Chef', 'slug' => 'chef'],
            ['name' => 'Waiter', 'slug' => 'waiter'],
            ['name' => 'Customer', 'slug' => 'customer'],
        ];

        $permissions = [
            // Dashboard
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view'],
            // Users & Roles
            ['name' => 'View Users', 'slug' => 'users.view'],
            ['name' => 'Create Users', 'slug' => 'users.create'],
            ['name' => 'Update Users', 'slug' => 'users.update'],
            ['name' => 'Delete Users', 'slug' => 'users.delete'],
            ['name' => 'Manage Users', 'slug' => 'users.manage'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage'],
            ['name' => 'Manage Permissions', 'slug' => 'permissions.manage'],
            // Locations & Settings
            ['name' => 'View Locations', 'slug' => 'locations.view'],
            ['name' => 'Manage Locations', 'slug' => 'locations.manage'],
            ['name' => 'View Settings', 'slug' => 'settings.view'],
            ['name' => 'Update Settings', 'slug' => 'settings.update'],
            ['name' => 'Manage Settings', 'slug' => 'settings.manage'],
            // Categories
            ['name' => 'View Categories', 'slug' => 'categories.view'],
            ['name' => 'Create Categories', 'slug' => 'categories.create'],
            ['name' => 'Update Categories', 'slug' => 'categories.update'],
            ['name' => 'Delete Categories', 'slug' => 'categories.delete'],
            // Menu
            ['name' => 'View Menu', 'slug' => 'menu.view'],
            ['name' => 'Create Menu', 'slug' => 'menu.create'],
            ['name' => 'Update Menu', 'slug' => 'menu.update'],
            ['name' => 'Delete Menu', 'slug' => 'menu.delete'],
            // Legacy menu_items permissions
            ['name' => 'View Menu Items', 'slug' => 'menu_items.view'],
            ['name' => 'Create Menu Items', 'slug' => 'menu_items.create'],
            ['name' => 'Update Menu Items', 'slug' => 'menu_items.update'],
            ['name' => 'Delete Menu Items', 'slug' => 'menu_items.delete'],
            // HR/Employees
            ['name' => 'View Employees', 'slug' => 'employees.view'],
            ['name' => 'Create Employees', 'slug' => 'employees.create'],
            ['name' => 'Update Employees', 'slug' => 'employees.update'],
            ['name' => 'Delete Employees', 'slug' => 'employees.delete'],
            ['name' => 'Manage Employees', 'slug' => 'employees.manage'],
            // Customers
            ['name' => 'View Customers', 'slug' => 'customers.view'],
            ['name' => 'Create Customers', 'slug' => 'customers.create'],
            ['name' => 'Update Customers', 'slug' => 'customers.update'],
            ['name' => 'Delete Customers', 'slug' => 'customers.delete'],
            // Orders
            ['name' => 'View Orders', 'slug' => 'orders.view'],
            ['name' => 'Create Orders', 'slug' => 'orders.create'],
            ['name' => 'Update Orders', 'slug' => 'orders.update'],
            ['name' => 'Delete Orders', 'slug' => 'orders.delete'],
            ['name' => 'Approve Orders', 'slug' => 'orders.approve'],
            // Reservations
            ['name' => 'View Reservations', 'slug' => 'reservations.view'],
            ['name' => 'Create Reservations', 'slug' => 'reservations.create'],
            ['name' => 'Update Reservations', 'slug' => 'reservations.update'],
            ['name' => 'Delete Reservations', 'slug' => 'reservations.delete'],
            // Inventory
            ['name' => 'View Inventory', 'slug' => 'inventory.view'],
            ['name' => 'Update Inventory', 'slug' => 'inventory.update'],
            ['name' => 'Adjust Inventory', 'slug' => 'inventory.adjust'],
            ['name' => 'Approve Inventory', 'slug' => 'inventory.approve'],
            // Recipes
            ['name' => 'View Recipes', 'slug' => 'recipes.view'],
            ['name' => 'Create Recipes', 'slug' => 'recipes.create'],
            ['name' => 'Update Recipes', 'slug' => 'recipes.update'],
            ['name' => 'Delete Recipes', 'slug' => 'recipes.delete'],
            // Payments
            ['name' => 'View Payments', 'slug' => 'payments.view'],
            ['name' => 'Process Payments', 'slug' => 'payments.process'],
            ['name' => 'Refund Payments', 'slug' => 'payments.refund'],
            ['name' => 'Process Refunds', 'slug' => 'refunds.process'],
            // Promotions
            ['name' => 'View Promotions', 'slug' => 'promotions.view'],
            ['name' => 'Manage Promotions', 'slug' => 'promotions.manage'],
            // Reports
            ['name' => 'View Reports', 'slug' => 'reports.view'],
            ['name' => 'Export Reports', 'slug' => 'reports.export'],
            // Audit
            ['name' => 'View Audit Logs', 'slug' => 'audit.view'],
            // Notifications
            ['name' => 'View Notifications', 'slug' => 'notifications.view'],
            ['name' => 'Send Notifications', 'slug' => 'notifications.send'],
            // Invoices
            ['name' => 'View Invoices', 'slug' => 'invoices.view'],
            ['name' => 'Create Invoices', 'slug' => 'invoices.create'],
            ['name' => 'Update Invoices', 'slug' => 'invoices.update'],
            ['name' => 'Delete Invoices', 'slug' => 'invoices.delete'],
            // Expenses
            ['name' => 'View Expenses', 'slug' => 'expenses.view'],
            ['name' => 'Create Expenses', 'slug' => 'expenses.create'],
            ['name' => 'Update Expenses', 'slug' => 'expenses.update'],
            ['name' => 'Delete Expenses', 'slug' => 'expenses.delete'],
            // Loyalty
            ['name' => 'View Loyalty', 'slug' => 'loyalty.view'],
            ['name' => 'Manage Loyalty', 'slug' => 'loyalty.manage'],
        ];

        // Upsert roles
        $roleModels = [];
        foreach ($roles as $r) {
            $roleModels[$r['slug']] = Role::updateOrCreate(
                ['slug' => $r['slug']],
                ['name' => $r['name']]
            );
        }

        // Upsert permissions
        $permModels = [];
        foreach ($permissions as $p) {
            $permModels[$p['slug']] = Permission::updateOrCreate(
                ['slug' => $p['slug']],
                ['name' => $p['name']]
            );
        }

        // Role -> Permissions mapping - Admin gets ALL permissions
        $allPermSlugs = array_column($permissions, 'slug');
        
        $map = [
            'admin' => $allPermSlugs, // Admin gets everything
            'manager' => [
                'dashboard.view',
                'employees.view','employees.update',
                'menu.view','menu.create','menu.update',
                'menu_items.view','menu_items.create','menu_items.update',
                'categories.view','categories.create','categories.update',
                'orders.view','orders.create','orders.update','orders.approve',
                'customers.view','customers.update',
                'reservations.view','reservations.create','reservations.update',
                'inventory.view','inventory.update','inventory.adjust',
                'payments.view','payments.process',
                'promotions.view','promotions.manage',
                'reports.view',
                'notifications.view','notifications.send',
            ],
            'chef' => [
                'dashboard.view',
                'orders.view','orders.update',
                'menu.view','menu_items.view',
                'recipes.view',
                'inventory.view',
            ],
            'waiter' => [
                'dashboard.view',
                'orders.view','orders.create','orders.update',
                'menu.view','menu_items.view',
                'reservations.view','reservations.create',
                'payments.process',
            ],
            'customer' => [
                'orders.create','orders.view',
            ],
        ];

        foreach ($map as $roleSlug => $permSlugs) {
            $role = $roleModels[$roleSlug];
            $ids = collect($permSlugs)->map(fn($s) => $permModels[$s]->id)->all();
            $role->permissions()->sync($ids);
        }

        // Optionally assign Super Admin to the test user if present
        $user = User::where('email', 'test@example.com')->first();
        if ($user) {
            $user->roles()->syncWithoutDetaching([$roleModels['super-admin']->id]);
        }
    }
}
