# Admin Keyboard Shortcuts Summary

Generated: 2025-12-22

This document summarizes all keyboard shortcuts implemented for admin pages in the NKH WebApp.

---

## 📍 Navigation Shortcuts (G + Key Sequences)

Press `G` followed by the indicated key to navigate to that page.

### Primary Navigation (Most Used)
| Shortcut | Page | Route |
|----------|------|-------|
| `G D` | Dashboard | `/admin/dashboard` |
| `G O` | Orders | `/admin/orders` |
| `G M` | Menu Items | `/admin/menu-items` |
| `G I` | Inventory | `/admin/inventory` |
| `G E` | Employees | `/admin/employees` |
| `G R` | Reports / Analytics | `/admin/sales-analytics` |
| `G C` | Customers | `/admin/customers` |
| `G S` | Settings | `/admin/settings` |

### Financial & Payments
| Shortcut | Page | Route |
|----------|------|-------|
| `G F` | Financial Dashboard | `/admin/financial-dashboard` |
| `G P` | Payments Dashboard | `/admin/payments` |
| `G V` | Invoices | `/admin/invoices` |
| `G X` | Expenses | `/admin/expenses` |

### Staff Management
| Shortcut | Page | Route |
|----------|------|-------|
| `G H` | Shifts / Schedule | `/admin/shifts` |
| `G J` | Positions | `/admin/positions` |
| `G T` | Time Off Requests | `/admin/time-off-requests` |

### Inventory & Supply Chain
| Shortcut | Page | Route |
|----------|------|-------|
| `G N` | Ingredients | `/admin/ingredients` |
| `G B` | Recipes | `/admin/recipes` |
| `G U` | Suppliers | `/admin/suppliers` |
| `G Q` | Purchase Orders | `/admin/purchase-orders` |
| `G A` | Stock Alerts | `/admin/stock-alerts` |

### Restaurant Layout
| Shortcut | Page | Route |
|----------|------|-------|
| `G G` | Categories | `/admin/categories` |
| `G W` | Tables | `/admin/tables` |
| `G L` | Floors | `/admin/floors` |
| `G Z` | Locations | `/admin/locations` |

### Reservations & Marketing
| Shortcut | Page | Route |
|----------|------|-------|
| `G 1` | Reservations | `/admin/reservations` |
| `G 2` | Promotions | `/admin/promotions` |
| `G 3` | Loyalty Points | `/admin/loyalty-points` |

### System Administration
| Shortcut | Page | Route |
|----------|------|-------|
| `G 4` | Admins | `/admin/admins` |
| `G 5` | Roles & Permissions | `/admin/roles` |
| `G 6` | Audit Logs | `/admin/audit-logs` |
| `G 7` | Notifications | `/admin/notifications` |
| `G 8` | Translations | `/admin/translations` |
| `G 9` | Units | `/admin/units` |
| `G 0` | Operating Hours | `/admin/operating-hours` |

---

## ⚡ Page Action Shortcuts

These shortcuts work on most admin pages without needing modifier keys.

| Shortcut | Action | Description |
|----------|--------|-------------|
| `N` | Create New | Opens create modal/form for the current page |
| `R` | Refresh | Refreshes the current page data |
| `F` | Filter | Toggles filter panel on the current page |
| `E` | Export | Triggers export action if available |

---

## 🎯 Command Palette Actions

Access via `Ctrl+K` / `⌘K` - These can be searched and executed from the command palette.

### Create Actions
- Create Order
- Create Menu Item
- Create Employee
- Create Category
- Create Reservation
- Create Shift
- Create Promotion
- Create Ingredient
- Create Supplier
- Create Purchase Order

### Export Actions
- Export Financial PDF
- Export Sales Excel

### Quick Views
- View Pending Orders
- View Today's Reservations
- View Low Stock Items

---

## 🔧 Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `⌘K` | Open Command Palette |
| `Shift+?` | Show Keyboard Shortcuts Help |
| `Ctrl+/` / `⌘/` | Focus Search Bar |
| `Ctrl+Shift+Q` / `⌘+Shift+Q` | Logout |

---

## 📋 Table Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` / `⌘A` | Select All Rows |
| `Ctrl+C` / `⌘C` | Copy Selected |
| `Delete` | Delete Selected |
| `Ctrl+R` / `⌘R` | Refresh Table |
| `↑` / `↓` | Navigate Rows |

---

## 📝 Form Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `⌘S` | Save Form |
| `Ctrl+Enter` / `⌘Enter` | Submit Form |
| `Escape` | Cancel / Close |

---

## 🪟 Modal Shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Close Modal |
| `Ctrl+Enter` / `⌘Enter` | Confirm Action |

---

## 📊 Page Coverage

### Pages with Full Shortcut Support
All 36 admin pages now have navigation shortcuts:

1. Dashboard
2. Orders
3. Menu Items
4. Inventory
5. Employees
6. Categories
7. Customers
8. Sales Analytics
9. Financial Dashboard
10. Payments Dashboard
11. Invoices
12. Expenses
13. Shifts
14. Positions
15. Time Off Requests
16. Ingredients
17. Recipes
18. Suppliers
19. Purchase Orders
20. Stock Alerts
21. Tables
22. Floors
23. Locations
24. Reservations
25. Promotions
26. Loyalty Points
27. Admins
28. Roles
29. Audit Logs
30. Notifications
31. Translations
32. Units
33. Operating Hours
34. Settings
35. Inventory Adjustments
36. Inventory Reports

---

## 🔐 Role-Based Access

Shortcuts respect user roles:
- **Super Admin**: Access to all shortcuts
- **Admin**: Most shortcuts except super-admin specific (Admins, Roles)
- **Manager**: Access to all operational shortcuts
- **Employee**: Limited to employee-specific shortcuts

---

## 💡 Tips

1. **Sequence Shortcuts**: Press `G`, release, then press the next key (don't hold)
2. **Command Palette**: Use `Ctrl+K` to search for any action by name
3. **Help Overlay**: Press `?` anytime to see available shortcuts
4. **Input Fields**: Shortcuts don't trigger when typing in input fields (except form save shortcuts)
