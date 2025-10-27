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
            // Users & Roles
            ['name' => 'Manage Users', 'slug' => 'users.manage'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage'],
            ['name' => 'Manage Permissions', 'slug' => 'permissions.manage'],
            // Locations & Settings
            ['name' => 'Manage Locations', 'slug' => 'locations.manage'],
            ['name' => 'Manage Settings', 'slug' => 'settings.manage'],
            // HR
            ['name' => 'View Employees', 'slug' => 'employees.view'],
            ['name' => 'Create Employees', 'slug' => 'employees.create'],
            ['name' => 'Update Employees', 'slug' => 'employees.update'],
            ['name' => 'Delete Employees', 'slug' => 'employees.delete'],
            // Menu
            ['name' => 'View Menu Items', 'slug' => 'menu_items.view'],
            ['name' => 'Create Menu Items', 'slug' => 'menu_items.create'],
            ['name' => 'Update Menu Items', 'slug' => 'menu_items.update'],
            ['name' => 'Delete Menu Items', 'slug' => 'menu_items.delete'],
            // Orders
            ['name' => 'View Orders', 'slug' => 'orders.view'],
            ['name' => 'Create Orders', 'slug' => 'orders.create'],
            ['name' => 'Update Orders', 'slug' => 'orders.update'],
            ['name' => 'Delete Orders', 'slug' => 'orders.delete'],
            // Inventory
            ['name' => 'View Inventory', 'slug' => 'inventory.view'],
            ['name' => 'Update Inventory', 'slug' => 'inventory.update'],
            // Payments
            ['name' => 'Process Payments', 'slug' => 'payments.process'],
            ['name' => 'Process Refunds', 'slug' => 'refunds.process'],
            // Promotions
            ['name' => 'Manage Promotions', 'slug' => 'promotions.manage'],
            // Reports
            ['name' => 'View Reports', 'slug' => 'reports.view'],
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

        // Role -> Permissions mapping
        $map = [
            'admin' => [
                'users.manage','roles.manage','permissions.manage',
                'locations.manage','settings.manage',
                'employees.view','employees.create','employees.update','employees.delete',
                'menu_items.view','menu_items.create','menu_items.update','menu_items.delete',
                'orders.view','orders.create','orders.update','orders.delete',
                'inventory.view','inventory.update',
                'payments.process','refunds.process',
                'promotions.manage','reports.view',
            ],
            'manager' => [
                'employees.view','employees.update',
                'menu_items.view','menu_items.create','menu_items.update',
                'orders.view','orders.create','orders.update',
                'inventory.view','inventory.update',
                'payments.process',
                'promotions.manage','reports.view',
            ],
            'chef' => [
                'orders.view','orders.update','menu_items.view',
            ],
            'waiter' => [
                'orders.view','orders.create','orders.update','payments.process',
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
