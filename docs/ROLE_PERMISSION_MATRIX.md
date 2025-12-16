# Role & Permission Matrix - NKH Restaurant System

**Last Updated:** 2025-12-16
**Purpose:** Defines all roles, permissions, and their relationships for multi-role admin access control

---

## Roles Overview

| Role | Slug | Description | Access Level |
|------|------|-------------|--------------|
| **Super Admin** | `super-admin` | Full system access, manages all aspects including security | ALL |
| **Admin** | `admin` | General administrative access, cannot modify security settings | HIGH |
| **Chief** | `chief` | Kitchen operations: recipes, inventory viewing, menu planning | KITCHEN |
| **Service Manager** | `service-manager` | Customer-facing operations: orders, reservations, customers | SERVICE |
| **Finance Manager** | `finance-manager` | Financial operations: payments, invoices, expenses, reports | FINANCE |
| **HR Manager** | `hr-manager` | Human resources: employees, payroll, attendance, shifts | HR |
| **Inventory Manager** | `inventory-manager` | Full inventory control: stock, suppliers, purchase orders | INVENTORY |
| **Operations Manager** | `operations-manager` | Operational setup: locations, tables, floors, hours | OPERATIONS |
| **Viewer** | `viewer` | Read-only access to reports, orders, and inventory | READ-ONLY |

---

## Permission Groups

### 1. Dashboard & Analytics
| Permission | Slug | Description |
|------------|------|-------------|
| View Dashboard | `dashboard.view` | Access admin dashboard analytics |
| View Reports | `reports.view` | View all system reports |
| Export Reports | `reports.export` | Export reports to CSV/PDF |

### 2. Content Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Categories | `categories.view` | View category list and details |
| Create Categories | `categories.create` | Create new categories |
| Update Categories | `categories.update` | Edit existing categories |
| Delete Categories | `categories.delete` | Delete categories |
| View Menu Items | `menu.view` | View menu items |
| Create Menu Items | `menu.create` | Create new menu items |
| Update Menu Items | `menu.update` | Edit menu items |
| Delete Menu Items | `menu.delete` | Delete menu items |

### 3. Order Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Orders | `orders.view` | View all orders |
| Update Orders | `orders.update` | Update order status |
| Approve Orders | `orders.approve` | Approve/reject pending orders |
| Delete Orders | `orders.delete` | Delete orders |

### 4. Reservation Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Reservations | `reservations.view` | View all reservations |
| Create Reservations | `reservations.create` | Create new reservations |
| Update Reservations | `reservations.update` | Edit reservations |
| Delete Reservations | `reservations.delete` | Delete reservations |

### 5. Customer Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Customers | `customers.view` | View customer list and profiles |
| Update Customers | `customers.update` | Edit customer information |
| Delete Customers | `customers.delete` | Delete customer accounts |

### 6. Inventory Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Inventory | `inventory.view` | View stock levels and items |
| Adjust Inventory | `inventory.adjust` | Make inventory adjustments |
| Approve Inventory | `inventory.approve` | Approve large adjustments |

### 7. Recipe Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Recipes | `recipes.view` | View all recipes |
| Create Recipes | `recipes.create` | Create new recipes |
| Update Recipes | `recipes.update` | Edit recipes |
| Delete Recipes | `recipes.delete` | Delete recipes |

### 8. Supplier & Purchase Orders
| Permission | Slug | Description |
|------------|------|-------------|
| View Suppliers | `suppliers.view` | View supplier list |
| Manage Suppliers | `suppliers.manage` | Create/edit/delete suppliers |
| View Purchase Orders | `purchase-orders.view` | View purchase orders |
| Manage Purchase Orders | `purchase-orders.manage` | Create/edit purchase orders |
| Approve Purchase Orders | `purchase-orders.approve` | Approve purchase orders |

### 9. Financial Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Payments | `payments.view` | View payment records |
| Process Refunds | `payments.refund` | Process payment refunds |
| View Expenses | `expenses.view` | View expense records |
| Manage Expenses | `expenses.manage` | Create/edit/delete expenses |

### 10. Employee Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Employees | `employees.view` | View employee list |
| Create Employees | `employees.create` | Create new employees |
| Update Employees | `employees.update` | Edit employee information |
| Delete Employees | `employees.delete` | Delete employees |

### 11. HR Operations
| Permission | Slug | Description |
|------------|------|-------------|
| View Attendance | `attendance.view` | View attendance records |
| Manage Attendance | `attendance.manage` | Edit attendance records |
| View Shifts | `shifts.view` | View shift schedules |
| Manage Shifts | `shifts.manage` | Create/edit shift schedules |
| View Payroll | `payroll.view` | View payroll information |
| Process Payroll | `payroll.process` | Process payroll payments |
| View Time Off | `timeoff.view` | View time-off requests |
| Approve Time Off | `timeoff.approve` | Approve/reject time-off requests |

### 12. Operations Management
| Permission | Slug | Description |
|------------|------|-------------|
| View Locations | `locations.view` | View all locations |
| Manage Locations | `locations.manage` | Create/edit/delete locations |
| Manage Floors | `floors.manage` | Manage floor plans |
| Manage Tables | `tables.manage` | Manage table assignments |

### 13. Promotions & Loyalty
| Permission | Slug | Description |
|------------|------|-------------|
| View Promotions | `promotions.view` | View all promotions |
| Manage Promotions | `promotions.manage` | Create/edit/delete promotions |
| View Loyalty | `loyalty.view` | View loyalty points |
| Manage Loyalty | `loyalty.manage` | Adjust loyalty points manually |

### 14. System Administration
| Permission | Slug | Description |
|------------|------|-------------|
| View Settings | `settings.view` | View system settings |
| Update Settings | `settings.update` | Modify system settings |
| Manage Roles | `roles.manage` | Create/edit/delete roles |
| Manage Permissions | `permissions.manage` | Assign permissions to roles |
| Manage Users | `users.view` | View admin users |
| Create Users | `users.create` | Create admin users |
| Update Users | `users.update` | Edit admin users |
| Delete Users | `users.delete` | Delete admin users |
| View Audit Logs | `audit.view` | View system audit logs |
| Manage Translations | `translations.manage` | Manage system translations |

---

## Role-Permission Mapping

### Super Admin
**Access:** ALL PERMISSIONS
**Special:** Bypasses all authorization checks via Gate

### Admin
**Permissions:**
- ✅ Dashboard & Analytics: ALL
- ✅ Content Management: ALL
- ✅ Order Management: ALL
- ✅ Reservation Management: ALL
- ✅ Customer Management: ALL
- ✅ Inventory Management: view, adjust
- ✅ Recipe Management: ALL
- ✅ Supplier & Purchase Orders: view, manage
- ✅ Financial Management: view
- ✅ Employee Management: view, create, update
- ✅ HR Operations: view
- ✅ Operations Management: view, manage
- ✅ Promotions & Loyalty: ALL
- ❌ System Administration: NONE (except audit.view)

### Chief
**Permissions:**
- ✅ `dashboard.view`
- ✅ `menu.view`
- ✅ `categories.view`
- ✅ `orders.view`
- ✅ `inventory.view`
- ✅ `recipes.view`, `recipes.create`, `recipes.update`
- ✅ `suppliers.view`
- ✅ `purchase-orders.view`
- ✅ `reports.view`

### Service Manager
**Permissions:**
- ✅ `dashboard.view`
- ✅ `orders.view`, `orders.update`, `orders.approve`
- ✅ `reservations.view`, `reservations.create`, `reservations.update`, `reservations.delete`
- ✅ `customers.view`, `customers.update`
- ✅ `menu.view`
- ✅ `tables.manage`
- ✅ `reports.view`

### Finance Manager
**Permissions:**
- ✅ `dashboard.view`
- ✅ `payments.view`, `payments.refund`
- ✅ `expenses.view`, `expenses.manage`
- ✅ `orders.view`
- ✅ `reports.view`, `reports.export`
- ✅ `customers.view`

### HR Manager
**Permissions:**
- ✅ `dashboard.view`
- ✅ `employees.view`, `employees.create`, `employees.update`, `employees.delete`
- ✅ `attendance.view`, `attendance.manage`
- ✅ `shifts.view`, `shifts.manage`
- ✅ `payroll.view`, `payroll.process`
- ✅ `timeoff.view`, `timeoff.approve`
- ✅ `reports.view`

### Inventory Manager
**Permissions:**
- ✅ `dashboard.view`
- ✅ `inventory.view`, `inventory.adjust`, `inventory.approve`
- ✅ `recipes.view`
- ✅ `suppliers.view`, `suppliers.manage`
- ✅ `purchase-orders.view`, `purchase-orders.manage`, `purchase-orders.approve`
- ✅ `reports.view`

### Operations Manager
**Permissions:**
- ✅ `dashboard.view`
- ✅ `locations.view`, `locations.manage`
- ✅ `floors.manage`
- ✅ `tables.manage`
- ✅ `reservations.view`
- ✅ `orders.view`
- ✅ `reports.view`

### Viewer (Read-Only)
**Permissions:**
- ✅ `dashboard.view`
- ✅ `orders.view`
- ✅ `inventory.view`
- ✅ `customers.view`
- ✅ `reports.view`, `reports.export`
- ✅ `menu.view`
- ✅ `employees.view`
- ✅ `audit.view`

---

## Route-to-Permission Mapping

### Dashboard Routes
| Route | Method | Permission | Roles |
|-------|--------|------------|-------|
| `/admin/dashboard/analytics` | GET | `dashboard.view` | All |
| `/admin/dashboard/orders/stats` | GET | `dashboard.view` | All |
| `/admin/dashboard/revenue/{period}` | GET | `dashboard.view` | All |

### Category Routes
| Route | Method | Permission | Roles |
|-------|--------|------------|-------|
| `/admin/categories` | GET | `categories.view` | Super Admin, Admin, Chief |
| `/admin/categories` | POST | `categories.create` | Super Admin, Admin |
| `/admin/categories/{id}` | PUT | `categories.update` | Super Admin, Admin |
| `/admin/categories/{id}` | DELETE | `categories.delete` | Super Admin, Admin |

### Menu Item Routes
| Route | Method | Permission | Roles |
|-------|--------|------------|-------|
| `/admin/menu-items` | GET | `menu.view` | All except HR Manager |
| `/admin/menu-items` | POST | `menu.create` | Super Admin, Admin |
| `/admin/menu-items/{id}` | PUT | `menu.update` | Super Admin, Admin |
| `/admin/menu-items/{id}` | DELETE | `menu.delete` | Super Admin, Admin |

### Order Routes
| Route | Method | Permission | Roles |
|-------|--------|------------|-------|
| `/admin/orders` | GET | `orders.view` | All except HR Manager |
| `/admin/orders/{id}/status` | PUT | `orders.update` | Super Admin, Admin, Service Manager |
| `/admin/orders/{id}/approve` | PATCH | `orders.approve` | Super Admin, Admin, Service Manager |
| `/admin/orders/{id}` | DELETE | `orders.delete` | Super Admin, Admin |

### Inventory Routes
| Route | Method | Permission | Roles |
|-------|--------|------------|-------|
| `/admin/inventory` | GET | `inventory.view` | Super Admin, Admin, Chief, Inventory Manager, Viewer |
| `/admin/inventory/{id}/adjust` | POST | `inventory.adjust` | Super Admin, Admin, Inventory Manager |
| `/admin/inventory/{id}/approve` | PATCH | `inventory.approve` | Super Admin, Inventory Manager |

### Payment Routes
| Route | Method | Permission | Roles |
|-------|--------|------------|-------|
| `/admin/payments` | GET | `payments.view` | Super Admin, Admin, Finance Manager |
| `/admin/payments/{id}/refund` | POST | `payments.refund` | Super Admin, Finance Manager |

### Employee Routes
| Route | Method | Permission | Roles |
|-------|--------|------------|-------|
| `/admin/employees` | GET | `employees.view` | Super Admin, Admin, HR Manager, Viewer |
| `/admin/employees` | POST | `employees.create` | Super Admin, Admin, HR Manager |
| `/admin/employees/{id}` | PUT | `employees.update` | Super Admin, Admin, HR Manager |
| `/admin/employees/{id}` | DELETE | `employees.delete` | Super Admin, Admin, HR Manager |

### System Admin Routes (Super Admin Only)
| Route | Method | Permission | Roles |
|-------|--------|------------|-------|
| `/admin/roles` | ALL | `roles.manage` | Super Admin |
| `/admin/permissions` | ALL | `permissions.manage` | Super Admin |
| `/admin/admin-users` | ALL | `users.*` | Super Admin |
| `/admin/settings` | ALL | `settings.*` | Super Admin |
| `/admin/translations` | ALL | `translations.manage` | Super Admin |
| `/admin/audit-logs` | GET | `audit.view` | Super Admin, Viewer |

---

## Security Notes

1. **Super Admin Bypass:** Super admins bypass ALL permission checks via Gate in AuthServiceProvider
2. **Viewer Restrictions:** Viewers can only perform GET requests (enforced in middleware)
3. **Critical Operations:** Refunds, role management, and user deletion require explicit permission checks
4. **Audit Logging:** All permission denials are logged with user_id and attempted action
5. **Production Enforcement:** All admin routes require authentication in production (no bypasses)

---

## Implementation Checklist

- [ ] Create database seeders for all roles
- [ ] Create database seeders for all permissions
- [ ] Assign permissions to roles in seeder
- [ ] Update admin route middleware to support multiple roles
- [ ] Add `dashboard.view` permission to dashboard routes
- [ ] Separate `recipes.*` permissions from `inventory.*`
- [ ] Separate `promotions.*` permissions from `menu.*`
- [ ] Add `loyalty.*` permissions
- [ ] Update frontend to check user permissions before showing UI elements
- [ ] Remove development authentication bypasses
- [ ] Test each role's access thoroughly

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-16 | Initial role & permission matrix created |
