# Fix for 403 Forbidden Error on Admin Employee Update Endpoint

## Issue
Admin users were receiving **403 Forbidden** errors when trying to update employees via:
```
PUT http://127.0.0.1:8000/api/admin/employees/1
```

Even though the admin was signed in with valid credentials.

## Root Cause
The issue was a **missing permission configuration** for the admin role:

1. **Seeder Bug**: The `RolePermissionSeeder` was missing the `employees.delete` permission for the admin role
2. **Missing Middleware Registration**: The `PermissionMiddleware` was not registered in the HTTP Kernel, so permission checks were not being enforced properly

## Changes Made

### 1. Fixed RolePermissionSeeder
**File**: `database/seeders/Ref/RolePermissionSeeder.php`

Added `employees.delete` to the admin role permissions list (line 244):
```php
'employees.view', 'employees.create', 'employees.update', 'employees.delete',
```

This ensures the admin role has full CRUD permissions for employees.

### 2. Created Migration to Update Existing Admins
**File**: `database/migrations/2026_01_23_000000_fix_admin_role_permissions.php`

Created a migration that:
- Syncs all required permissions to the admin role
- Adds any missing permissions to existing admin users
- Uses the correct table name `role_permission`

Ran with: `php artisan migrate --step`

### 3. Registered Permission Middleware
**File**: `app/Http/Kernel.php`

Added the missing permission middleware registration:
```php
'permission' => \App\Http\Middleware\PermissionMiddleware::class,
```

This ensures the `permission:` middleware directive works in routes.

## How It Works

The permission system works in layers:

1. **Routes** (in `routes/admin-secure.php`):
   ```php
   Route::middleware('permission:employees.update')
       ->match(['put', 'patch'], 'employees/{employee}', [...]);
   ```

2. **Middleware** (`app/Http/Middleware/PermissionMiddleware.php`):
   - Checks if the authenticated user has the required permission
   - Super-admin role bypasses all permission checks
   - Regular users must have the specific permission

3. **User Model** (`app/Models/User.php`):
   ```php
   public function hasPermission(string $slug): bool {
       return $this->roles()
           ->whereHas('permissions', function ($q) use ($slug) {
               $q->where('slug', $slug);
           })
           ->exists();
   }
   ```

## Testing

To verify the fix:

1. **Create an admin user** with the admin role
2. **Assign the admin role** to the user (via database or seeder)
3. **Make a PUT request** to `/api/admin/employees/1`
4. **Expected result**: The request should succeed (or show proper validation errors, not 403)

## Admin Role Permissions

The admin role now has full permissions for:
- Dashboard & Reports
- Categories, Menu Items, Orders, Reservations, Customers
- Inventory, Recipes, Suppliers, Purchase Orders
- Payments, Expenses
- **Employees (CRUD)** ← Fixed
- Attendance, Shifts
- Locations, Floors, Tables
- Promotions, Loyalty
- Audit Logs
