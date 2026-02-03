<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Role-Based Access Control (RBAC) Matrix
    |--------------------------------------------------------------------------
    |
    | This file serves as the "Source of Truth" for system permissions.
    | It defines exactly which permissions each role should have.
    |
    | '*' indicates all permissions.
    | 'group.*' indicates all permissions in that group.
    */

    'roles' => [
        'super-admin' => ['*'], // Has everything by default

        'admin' => [
            // Can manage everything except destructive dev actions if any
            'dashboard.view',
            'users.*',
            'roles.manage',
            'permissions.manage',
            'settings.*',
            'audit.view',
            'reports.*',
            'notifications.*',
            'locations.*',
            'categories.*',
            'menu.*',
            'employees.*',
            'customers.*',
            'orders.*',
            'reservations.*',
            'inventory.*',
            'recipes.*',
            'promotions.*',
            'payments.*',
            'loyalty.*',
            'expenses.*',
            'invoices.*',
        ],

        'manager' => [
            // Operational Manager
            'dashboard.view',
            'orders.*',
            'reservations.*',
            'customers.*',
            'employees.view',
            'employees.create',
            'employees.update', // Can manage schedule but maybe not delete
            'inventory.view',
            'inventory.adjust',
            'reports.view',
            'reports.export',
            'menu.view',
            'menu.update', // Can update availability
            'notifications.view',
            'payments.view',
            'payments.refund',
        ],

        'chief' => [
            // Head Chef / Kitchen Manager
            'dashboard.view',
            'orders.view',
            'orders.update', // Kitchen display
            'inventory.*', // Full inventory control
            'recipes.*',   // Full recipe control
            'menu.view',
            'menu.update', // Update stock status
            'suppliers.*', // Manage suppliers
            'units.*',
        ],

        'service-manager' => [
            'dashboard.view',
            'orders.*',
            'reservations.*',
            'customers.*',
            'tables.view',
            'tables.update',
            'floors.view',
        ],

        'finance-manager' => [
            'dashboard.view',
            'reports.*',
            'payments.*',
            'expenses.*',
            'invoices.*',
            'payroll.*',
        ],

        'hr-manager' => [
            'dashboard.view',
            'employees.*',
            'positions.*',
            'attendance.*',
            'payroll.view', // Can view but maybe finance finalizes? Let's give all for now or refine.
            'time-off-requests.*',
        ],

        'inventory-manager' => [
            'dashboard.view',
            'inventory.*',
            'suppliers.*',
            'purchase-orders.*',
            'stock-alerts.*',
            'recipes.view',
            'units.*',
        ],

        'operations-manager' => [
            'dashboard.view',
            'locations.*',
            'floors.*',
            'tables.*',
            'settings.view',
        ],

        'employee' => [
            // Standard Staff (Waiter/POS)
            'orders.view',
            'orders.create',
            'orders.update', // Basic POS
            'reservations.view',
            'reservations.create',
            'customers.view',
            'customers.create',
            'menu.view',
            'tables.view',
        ],

        'customer' => [
            // Minimal permissions, mostly likely handled via separate guard/logic, 
            // but if they have a user account:
            'profile.view',
            'profile.update',
        ],
    ],

    // Helper to expand wildcards
    'permissions_map' => [
        'users' => ['users.view', 'users.create', 'users.update', 'users.delete'],
        'roles' => ['roles.manage'],
        'permissions' => ['permissions.manage'],
        'settings' => ['settings.view', 'settings.update'],
        'reports' => ['reports.view', 'reports.export'],
        'audit' => ['audit.view'],
        'notifications' => ['notifications.view', 'notifications.send'],
        'locations' => ['locations.view', 'locations.manage'],
        'categories' => ['categories.view', 'categories.create', 'categories.update', 'categories.delete'],
        'menu' => ['menu.view', 'menu.create', 'menu.update', 'menu.delete'],
        'employees' => ['employees.view', 'employees.create', 'employees.update', 'employees.delete', 'employees.manage'],
        'customers' => ['customers.view', 'customers.create', 'customers.update', 'customers.delete'],
        'orders' => ['orders.view', 'orders.create', 'orders.update', 'orders.approve', 'orders.delete'],
        'reservations' => ['reservations.view', 'reservations.create', 'reservations.update', 'reservations.delete'],
        'inventory' => ['inventory.view', 'inventory.adjust', 'inventory.approve'],
        'recipes' => ['recipes.view', 'recipes.create', 'recipes.update', 'recipes.delete'],
        'promotions' => ['promotions.view', 'promotions.manage'],
        'payments' => ['payments.view', 'payments.refund'],
        'loyalty' => ['loyalty.view', 'loyalty.manage'],
        'expenses' => ['expenses.view', 'expenses.create', 'expenses.update', 'expenses.delete'],
        'invoices' => ['invoices.view', 'invoices.create', 'invoices.update', 'invoices.delete'],
        'payroll' => ['payroll.view', 'payroll.manage'],
        'positions' => ['positions.view', 'positions.manage'],
        'attendance' => ['attendance.view', 'attendance.manage'],
        'time-off-requests' => ['time-off-requests.view', 'time-off-requests.approve', 'time-off-requests.reject'], // These act as employees.* in current routes but ideally split
        'suppliers' => ['suppliers.view', 'suppliers.manage'],
        'purchase-orders' => ['purchase-orders.view', 'purchase-orders.create', 'purchase-orders.update', 'purchase-orders.delete', 'purchase-orders.approve'],
        'stock-alerts' => ['stock-alerts.view', 'stock-alerts.acknowledge'],
        'units' => ['units.view', 'units.manage'],
        'floors' => ['floors.view', 'floors.manage'],
        'tables' => ['tables.view', 'tables.manage'],
    ]
];
