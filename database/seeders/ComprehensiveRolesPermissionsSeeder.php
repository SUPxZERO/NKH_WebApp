<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class ComprehensiveRolesPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * This seeder creates a comprehensive role and permission system
     * supporting multiple admin roles with granular access control.
     */
    public function run(): void
    {
        $this->command->info('Starting comprehensive roles & permissions seeding...');

        // Step 1: Create all roles
        $roles = $this->createRoles();

        // Step 2: Create all permissions
        $permissions = $this->createPermissions();

        // Step 3: Assign permissions to roles
        $this->assignPermissionsToRoles($roles, $permissions);

        // Step 4: Assign super-admin role to first user if exists
        $this->assignSuperAdminToFirstUser($roles);

        $this->command->info('✓ Roles & permissions seeded successfully!');
    }

    /**
     * Create all system roles
     */
    private function createRoles(): array
    {
        $this->command->info('Creating roles...');

        $roleData = [
            [
                'name' => 'Super Administrator',
                'slug' => 'super-admin',
                'description' => 'Full system access with ability to manage roles, permissions, and security settings',
            ],
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'General administrative access with limited system configuration capabilities',
            ],
            [
                'name' => 'Chief',
                'slug' => 'chief',
                'description' => 'Kitchen operations: recipes, inventory viewing, menu planning',
            ],
            [
                'name' => 'Service Manager',
                'slug' => 'service-manager',
                'description' => 'Customer-facing operations: orders, reservations, customer management',
            ],
            [
                'name' => 'Finance Manager',
                'slug' => 'finance-manager',
                'description' => 'Financial operations: payments, invoices, expenses, financial reports',
            ],
            [
                'name' => 'HR Manager',
                'slug' => 'hr-manager',
                'description' => 'Human resources: employee management, payroll, attendance, shifts',
            ],
            [
                'name' => 'Inventory Manager',
                'slug' => 'inventory-manager',
                'description' => 'Full inventory control: stock management, suppliers, purchase orders',
            ],
            [
                'name' => 'Operations Manager',
                'slug' => 'operations-manager',
                'description' => 'Operational setup: locations, tables, floors, operating hours',
            ],
            [
                'name' => 'Viewer',
                'slug' => 'viewer',
                'description' => 'Read-only access to reports, orders, and inventory for auditing purposes',
            ],
            // Keep legacy roles for backwards compatibility
            [
                'name' => 'Manager',
                'slug' => 'manager',
                'description' => 'Legacy manager role (deprecated - use specific manager roles)',
            ],
            [
                'name' => 'Employee',
                'slug' => 'employee',
                'description' => 'General employee access',
            ],
            [
                'name' => 'Customer',
                'slug' => 'customer',
                'description' => 'Regular customer access',
            ],
        ];

        $roles = [];
        foreach ($roleData as $data) {
            $roles[$data['slug']] = Role::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );
            $this->command->info("  ✓ Role: {$data['name']}");
        }

        return $roles;
    }

    /**
     * Create all system permissions
     */
    private function createPermissions(): array
    {
        $this->command->info('Creating permissions...');

        $permissionData = [
            // Dashboard & Analytics
            ['name' => 'View Dashboard', 'slug' => 'dashboard.view'],
            ['name' => 'View Reports', 'slug' => 'reports.view'],
            ['name' => 'Export Reports', 'slug' => 'reports.export'],

            // Categories
            ['name' => 'View Categories', 'slug' => 'categories.view'],
            ['name' => 'Create Categories', 'slug' => 'categories.create'],
            ['name' => 'Update Categories', 'slug' => 'categories.update'],
            ['name' => 'Delete Categories', 'slug' => 'categories.delete'],

            // Menu Items
            ['name' => 'View Menu', 'slug' => 'menu.view'],
            ['name' => 'Create Menu', 'slug' => 'menu.create'],
            ['name' => 'Update Menu', 'slug' => 'menu.update'],
            ['name' => 'Delete Menu', 'slug' => 'menu.delete'],

            // Orders
            ['name' => 'View Orders', 'slug' => 'orders.view'],
            ['name' => 'Create Orders', 'slug' => 'orders.create'],
            ['name' => 'Update Orders', 'slug' => 'orders.update'],
            ['name' => 'Approve Orders', 'slug' => 'orders.approve'],
            ['name' => 'Delete Orders', 'slug' => 'orders.delete'],

            // Reservations
            ['name' => 'View Reservations', 'slug' => 'reservations.view'],
            ['name' => 'Create Reservations', 'slug' => 'reservations.create'],
            ['name' => 'Update Reservations', 'slug' => 'reservations.update'],
            ['name' => 'Delete Reservations', 'slug' => 'reservations.delete'],

            // Customers
            ['name' => 'View Customers', 'slug' => 'customers.view'],
            ['name' => 'Update Customers', 'slug' => 'customers.update'],
            ['name' => 'Delete Customers', 'slug' => 'customers.delete'],

            // Inventory
            ['name' => 'View Inventory', 'slug' => 'inventory.view'],
            ['name' => 'Adjust Inventory', 'slug' => 'inventory.adjust'],
            ['name' => 'Approve Inventory', 'slug' => 'inventory.approve'],

            // Recipes
            ['name' => 'View Recipes', 'slug' => 'recipes.view'],
            ['name' => 'Create Recipes', 'slug' => 'recipes.create'],
            ['name' => 'Update Recipes', 'slug' => 'recipes.update'],
            ['name' => 'Delete Recipes', 'slug' => 'recipes.delete'],

            // Suppliers
            ['name' => 'View Suppliers', 'slug' => 'suppliers.view'],
            ['name' => 'Manage Suppliers', 'slug' => 'suppliers.manage'],

            // Purchase Orders
            ['name' => 'View Purchase Orders', 'slug' => 'purchase-orders.view'],
            ['name' => 'Manage Purchase Orders', 'slug' => 'purchase-orders.manage'],
            ['name' => 'Approve Purchase Orders', 'slug' => 'purchase-orders.approve'],

            // Payments
            ['name' => 'View Payment Records', 'slug' => 'payments.view'],
            ['name' => 'Refund Payments', 'slug' => 'payments.refund'],

            // Expenses
            ['name' => 'View Expenses', 'slug' => 'expenses.view'],
            ['name' => 'Manage Expenses', 'slug' => 'expenses.manage'],

            // Employees
            ['name' => 'View Employees', 'slug' => 'employees.view'],
            ['name' => 'Create Employees', 'slug' => 'employees.create'],
            ['name' => 'Update Employees', 'slug' => 'employees.update'],
            ['name' => 'Delete Employees', 'slug' => 'employees.delete'],

            // Attendance
            ['name' => 'View Attendance', 'slug' => 'attendance.view'],
            ['name' => 'Manage Attendance', 'slug' => 'attendance.manage'],

            // Shifts
            ['name' => 'View Shifts', 'slug' => 'shifts.view'],
            ['name' => 'Manage Shifts', 'slug' => 'shifts.manage'],

            // Payroll
            ['name' => 'View Payroll', 'slug' => 'payroll.view'],
            ['name' => 'Process Payroll', 'slug' => 'payroll.process'],

            // Time Off
            ['name' => 'View Time Off', 'slug' => 'timeoff.view'],
            ['name' => 'Approve Time Off', 'slug' => 'timeoff.approve'],

            // Locations
            ['name' => 'View Locations', 'slug' => 'locations.view'],
            ['name' => 'Manage Locations', 'slug' => 'locations.manage'],

            // Floors & Tables
            ['name' => 'Manage Floors', 'slug' => 'floors.manage'],
            ['name' => 'Manage Tables', 'slug' => 'tables.manage'],

            // Promotions
            ['name' => 'View Promotions', 'slug' => 'promotions.view'],
            ['name' => 'Manage Promotions', 'slug' => 'promotions.manage'],

            // Loyalty
            ['name' => 'View Loyalty', 'slug' => 'loyalty.view'],
            ['name' => 'Manage Loyalty', 'slug' => 'loyalty.manage'],

            // System Administration
            ['name' => 'View Settings', 'slug' => 'settings.view'],
            ['name' => 'Update Settings', 'slug' => 'settings.update'],
            ['name' => 'Manage Roles', 'slug' => 'roles.manage'],
            ['name' => 'Manage Permissions', 'slug' => 'permissions.manage'],
            ['name' => 'View Admin Users', 'slug' => 'users.view'],
            ['name' => 'Create Admin Users', 'slug' => 'users.create'],
            ['name' => 'Update Admin Users', 'slug' => 'users.update'],
            ['name' => 'Delete Admin Users', 'slug' => 'users.delete'],
            ['name' => 'View Audit Logs', 'slug' => 'audit.view'],
            ['name' => 'Manage Translations', 'slug' => 'translations.manage'],
        ];

        $permissions = [];
        foreach ($permissionData as $data) {
            $permissions[$data['slug']] = Permission::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );
        }

        $this->command->info("  ✓ Created " . count($permissions) . " permissions");

        return $permissions;
    }

    /**
     * Assign permissions to each role
     */
    private function assignPermissionsToRoles(array $roles, array $permissions): void
    {
        $this->command->info('Assigning permissions to roles...');

        $rolePermissions = [
            // Super Admin - Gets all permissions via Gate bypass, but we'll assign them anyway
            'super-admin' => array_keys($permissions),

            // Admin - All except system administration
            'admin' => [
                'dashboard.view',
                'reports.view',
                'reports.export',
                'categories.view',
                'categories.create',
                'categories.update',
                'categories.delete',
                'menu.view',
                'menu.create',
                'menu.update',
                'menu.delete',
                'orders.view',
                'orders.create',
                'orders.update',
                'orders.approve',
                'orders.delete',
                'reservations.view',
                'reservations.create',
                'reservations.update',
                'reservations.delete',
                'customers.view',
                'customers.update',
                'customers.delete',
                'inventory.view',
                'inventory.adjust',
                'recipes.view',
                'recipes.create',
                'recipes.update',
                'recipes.delete',
                'suppliers.view',
                'suppliers.manage',
                'purchase-orders.view',
                'purchase-orders.manage',
                'payments.view',
                'expenses.view',
                'employees.view',
                'employees.create',
                'employees.update',
                'attendance.view',
                'shifts.view',
                'locations.view',
                'locations.manage',
                'floors.manage',
                'tables.manage',
                'promotions.view',
                'promotions.manage',
                'loyalty.view',
                'loyalty.manage',
                'audit.view',
            ],

            // Chief - Kitchen operations
            'chief' => [
                'dashboard.view',
                'menu.view',
                'categories.view',
                'orders.view',
                'inventory.view',
                'recipes.view',
                'recipes.create',
                'recipes.update',
                'suppliers.view',
                'purchase-orders.view',
                'reports.view',
            ],

            // Service Manager - Customer-facing
            'service-manager' => [
                'dashboard.view',
                'orders.view',
                'orders.update',
                'orders.approve',
                'reservations.view',
                'reservations.create',
                'reservations.update',
                'reservations.delete',
                'customers.view',
                'customers.update',
                'menu.view',
                'tables.manage',
                'reports.view',
            ],

            // Finance Manager - Financial operations
            'finance-manager' => [
                'dashboard.view',
                'payments.view',
                'payments.refund',
                'expenses.view',
                'expenses.manage',
                'orders.view',
                'reports.view',
                'reports.export',
                'customers.view',
            ],

            // HR Manager - Human resources
            'hr-manager' => [
                'dashboard.view',
                'employees.view',
                'employees.create',
                'employees.update',
                'employees.delete',
                'attendance.view',
                'attendance.manage',
                'shifts.view',
                'shifts.manage',
                'payroll.view',
                'payroll.process',
                'timeoff.view',
                'timeoff.approve',
                'reports.view',
            ],

            // Inventory Manager - Full inventory control
            'inventory-manager' => [
                'dashboard.view',
                'inventory.view',
                'inventory.adjust',
                'inventory.approve',
                'recipes.view',
                'suppliers.view',
                'suppliers.manage',
                'purchase-orders.view',
                'purchase-orders.manage',
                'purchase-orders.approve',
                'reports.view',
            ],

            // Operations Manager - Operational setup
            'operations-manager' => [
                'dashboard.view',
                'locations.view',
                'locations.manage',
                'floors.manage',
                'tables.manage',
                'reservations.view',
                'orders.view',
                'reports.view',
            ],

            // Viewer - Read-only access
            'viewer' => [
                'dashboard.view',
                'orders.view',
                'inventory.view',
                'customers.view',
                'reports.view',
                'reports.export',
                'menu.view',
                'employees.view',
                'audit.view',
            ],

            // Legacy: Manager role
            'manager' => [
                'dashboard.view',
                'reports.view',
                'orders.view',
                'orders.create',
                'orders.update',
                'menu.view',
                'menu.create',
                'menu.update',
                'inventory.view',
                'inventory.adjust',
                'customers.view',
            ],

            // Employee - General Staff
            'employee' => [
                'dashboard.view',
                'orders.view',
                'orders.create',
                'orders.update',
                'menu.view',
                'tables.manage', // Required to update table status
                'customers.view',
                'reservations.view',
            ],
        ];

        foreach ($rolePermissions as $roleSlug => $permissionSlugs) {
            if (!isset($roles[$roleSlug])) {
                continue;
            }

            $role = $roles[$roleSlug];
            $permissionIds = collect($permissionSlugs)
                ->filter(fn($slug) => isset($permissions[$slug]))
                ->map(fn($slug) => $permissions[$slug]->id)
                ->all();

            $role->permissions()->sync($permissionIds);
            $this->command->info("  ✓ Assigned " . count($permissionIds) . " permissions to {$role->name}");
        }
    }

    /**
     * Assign super-admin role to the first user
     */
    private function assignSuperAdminToFirstUser(array $roles): void
    {
        $user = User::first();
        if ($user && isset($roles['super-admin'])) {
            $user->roles()->syncWithoutDetaching([$roles['super-admin']->id]);
            $this->command->info("  ✓ Assigned super-admin role to user: {$user->email}");
        }
    }
}
