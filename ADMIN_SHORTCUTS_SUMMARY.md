# Admin Keyboard Shortcuts - Complete Reference

> Last Updated: December 22, 2025
> Status: ✅ Fully Implemented & Integrated

## 📊 Quick Overview

| Category | Count | Details |
|----------|-------|---------|
| 🧭 Primary Navigation | 8 | G+D, G+O, G+M, G+I, G+E, G+R, G+C, G+S |
| 🧭 Extended Navigation | 22 | G+F, G+P, G+V, G+X, G+H, G+J, G+T, etc. |
| ⚡ Page Actions | 4 | N (New), R (Refresh), F (Filter), E (Export) |
| 🔍 Command Palette | 30+ | Ctrl/Cmd+K for fuzzy search |
| 🎯 Global | 4 | Help (?), Logout, Focus Search, etc. |
| 📋 Table Operations | 6 | Select all, Copy, Delete, Refresh |
| 📝 Form Operations | 3 | Save, Submit, Cancel |
| 🪟 Modal Operations | 2 | Close, Confirm |

---

## 🧭 Navigation Shortcuts

### Primary Admin Pages (G + Letter)

Quick access to the 8 most-used admin pages:

```
G+D  → Dashboard           (Overview & Quick Stats)
G+O  → Orders              (Order Management)
G+M  → Menu Items          (Menu & Food Items)
G+I  → Inventory           (Stock & Products)
G+E  → Employees           (Staff Management)
G+R  → Reports/Analytics   (Performance & Insights)
G+C  → Customers           (Customer Database)
G+S  → Settings            (System Settings)
```

**Use Case:** If you're on Orders page and need to check Dashboard stats, press `G+D` instead of clicking menu.

---

### Extended Admin Pages (G + Key)

Secondary pages with specialized functions:

#### Financial & Reporting
```
G+F  → Financial Dashboard  (Revenue, Expenses, Profit)
G+P  → Payments Dashboard   (Payment Methods, Transactions)
G+V  → Invoices            (Invoice Management)
G+X  → Expenses            (Expense Tracking)
G+R  → Reports/Analytics   (Comprehensive Reports)
```

#### Operations & Scheduling
```
G+H  → Shifts              (Staff Schedule)
G+J  → Positions           (Job Titles & Positions)
G+T  → Time Off Requests   (Leave Management)
G+W  → Tables              (Seating/Reservation Tables)
G+L  → Floors              (Restaurant Layout)
```

#### Inventory & Products
```
G+N  → Ingredients         (Raw Materials)
G+B  → Recipes             (Recipe Definitions)
G+U  → Suppliers           (Vendor Management)
G+Q  → Purchase Orders     (Buying Orders)
G+A  → Stock Alerts        (Low Stock Warnings)
G+G  → Categories          (Product Categories)
G+Z  → Locations           (Warehouse/Branch Locations)
```

#### Business Management
```
G+1  → Reservations        (Table Reservations)
G+2  → Promotions          (Discounts & Promotions)
G+3  → Loyalty Points      (Rewards Program)
G+4  → Admins              (Admin Account Management)
G+5  → Roles & Permissions (Access Control)
G+6  → Audit Logs          (Activity Tracking)
G+7  → Notifications       (Alert Configuration)
G+8  → Translations        (Multilingual Support)
G+9  → Units               (Measurement Units)
G+0  → Operating Hours     (Business Hours)
```

---

## ⚡ Page Action Shortcuts

These shortcuts work on **any admin page** that has the relevant buttons:

```
N     → Create New Item      (Click the Add/Create button)
R     → Refresh Data         (Reload or Refetch data)
F     → Toggle Filters       (Show/Hide filter panel)
E     → Export Data          (Download as CSV/PDF/Excel)
```

### How They Work

| Shortcut | Action | Smart Behavior |
|----------|--------|----------------|
| **N** | Create | Finds button with "Add", "Create", "New" label or Plus icon, clicks it |
| **R** | Refresh | Finds Refresh button or reloads the page |
| **F** | Filter | Opens the filter sidebar/panel |
| **E** | Export | Triggers PDF, CSV, or Excel download |

**Example:** On Orders page, press `N` → Opens new order form

---

## 📋 Form Shortcuts

When you're editing data in a form:

```
Ctrl+S / Cmd+S       → Save Form
Ctrl+Enter / Cmd+Enter → Submit Form
Escape               → Cancel/Close
```

### Smart Form Handling

- ✅ Works in modal forms
- ✅ Works in inline edit forms
- ✅ Works in expandable panels
- ✅ Prevents saving when validation errors exist
- ✅ Shows confirmation if unsaved changes

---

## 📊 Table/List Shortcuts

When viewing data in a table:

```
Ctrl+A / Cmd+A  → Select All Rows
Ctrl+C / Cmd+C  → Copy Selected (as CSV)
Delete          → Delete Selected
Ctrl+R / Cmd+R  → Refresh Table
```

### Table Features

| Feature | Shortcut | Result |
|---------|----------|--------|
| Select All | Ctrl+A | Selects all visible & paginated rows |
| Copy | Ctrl+C | Copies selected rows as CSV |
| Delete | Delete | Bulk delete with confirmation |
| Refresh | Ctrl+R | Re-fetches data from server |
| Search | Ctrl+F | Browser native find-in-page |

**Example:** Select multiple orders with Ctrl+A, then Ctrl+C to copy as CSV for Excel

---

## 🔍 Command Palette (Ctrl/Cmd+K)

Press `Ctrl+K` or `Cmd+K` to open the command palette and search for actions:

```
Ctrl+K → Search Bar Opens
Type: "create order"      → Quickly create new order
Type: "export menu"       → Export menu items to CSV
Type: "pending orders"    → Show all pending orders
Type: "low stock"         → View low inventory items
```

### Available Commands

#### Create Actions
- Create Order
- Create Menu Item
- Create Employee
- Create Customer
- Create Reservation
- Create Promotion
- Create Supplier
- Create Ingredient
- Create Category
- Create Shift
- Create Invoice

#### Export Actions
- Export Orders
- Export Menu Items
- Export Inventory
- Export Employees
- Export Customers
- Export Financial Report
- Export Payments Report

#### View Actions
- View Pending Orders
- View Low Stock Items
- View Recent Transactions
- View Scheduled Shifts
- View Scheduled Reservations
- View Active Promotions
- View Audit Trail

---

## 🎯 Global Shortcuts

Always available, everywhere in the app:

```
Ctrl+K / Cmd+K        → Open Command Palette
Shift+? or ?          → Show Help & Shortcuts
Ctrl+Shift+Q / Cmd+Shift+Q → Logout
Ctrl+/ / Cmd+/        → Focus Search Bar
F5 / Cmd+R            → Refresh Page
```

---

## 🔐 Permission-Based Shortcuts

**Important:** Some shortcuts only appear for users with the right permissions:

### Admin & Super-Admin Shortcuts
✅ All navigation shortcuts (G+X)
✅ All action shortcuts (N, R, F, E)
✅ All page actions
✅ Bulk operations
✅ Export functions
✅ Settings access

### Manager Role
✅ Dashboard, Orders, Inventory, Employees
✅ Reports & Analytics
✅ Page action shortcuts
⚠️ Some settings & admin functions hidden

### Employee Role
✅ Limited to role-specific shortcuts
✅ Personal schedule & shifts
✅ Customer interactions
⚠️ No creation/deletion shortcuts

### Custom Roles
✅ Shortcuts match role-based permissions

---

## 📱 Mobile & Accessibility

### Mobile Devices
Most keyboard shortcuts work with **external keyboards** when connected to mobile:
- Tablets with keyboard cases
- Bluetooth keyboard connections
- Stylus with keyboard overlay

### Accessibility Features
✅ **Screen Reader Support** - All shortcuts announced
✅ **Focus Management** - Clear visual focus indicators
✅ **ARIA Labels** - Proper accessibility attributes
✅ **Keyboard-Only Navigation** - No mouse required
✅ **High Contrast** - Works with contrast modes

---

## 🛠️ Customization & Extension

### Creating Page-Specific Shortcuts

For your custom admin page, add to `shortcuts.config.ts`:

```typescript
export const MY_PAGE_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'my-page-action-1',
    binding: {
      key: 'alt+a',
      description: 'Do something on my page',
    },
    category: 'actions',
    scope: 'route',
    handler: () => {
      // Your custom logic here
    },
    allowedRoles: ['admin', 'super-admin'],
    group: 'My Page',
    icon: MyIcon,
  },
];
```

Then in your page component:

```typescript
import { useRouteHotkeys } from '@/app/hooks/useShortcuts';
import { MY_PAGE_SHORTCUTS } from '@/app/config/shortcuts.config';

export function MyPage() {
  useRouteHotkeys('/admin/my-page', MY_PAGE_SHORTCUTS);
  
  return <div>My page content</div>;
}
```

---

## 🧪 Testing Shortcuts

### Verify Shortcuts Work

1. **Navigate Test**
   ```
   Press G+O → Should go to Orders page
   Press G+D → Should go to Dashboard
   ```

2. **Action Test**
   ```
   Go to Orders page
   Press N → Should open "Create Order" form
   Press E → Should show export options
   ```

3. **Form Test**
   ```
   Open any form
   Press Ctrl+S → Should save (or show validation errors)
   Press Escape → Should close the form
   ```

4. **Table Test**
   ```
   Go to any list page
   Press Ctrl+A → Should select all rows
   Ctrl+C → Should copy to clipboard
   ```

5. **Command Palette Test**
   ```
   Press Ctrl+K → Search bar should appear
   Type "create" → Should show create actions
   ```

---

## 🔧 Troubleshooting

### Shortcut Not Working

**Possible Causes:**
1. **Wrong Role** - User lacks permission for this shortcut
2. **Browser Conflict** - Browser shortcut overrides app shortcut
3. **Input Focus** - Shortcut won't trigger inside text inputs
4. **Wrong Page** - Route-specific shortcut not on correct route

**Solution:**
```
1. Check your user role (Admin > Admins section)
2. Try a different shortcut first to verify system works
3. Click outside any input field first
4. Check you're on the correct admin page
5. Check console for errors: Ctrl+Shift+I → Console tab
```

### Command Palette Not Opening

**Ctrl+K Not Working?**
1. Check browser extension conflicts (disable temporarily)
2. Ensure focus is on the page (click somewhere first)
3. Try with Cmd+K if you're on Mac
4. Reload page: F5 or Cmd+R

### Shortcut Help Not Showing

**Shift+? Not Working?**
1. Try ? (just the question mark)
2. Check if help component is enabled in settings
3. Reload page and try again
4. Check browser console for JavaScript errors

---

## 📈 Usage Statistics (Coming Soon)

Track which shortcuts are most used:

```
// In future versions:
- Most used shortcuts per page
- User learning curves
- Shortcut adoption rates
- Pain points and missing features
```

---

## 🔄 Updates & Changes

### Version 1.0 (Current)
✅ 30+ Navigation shortcuts
✅ 4 Universal action shortcuts
✅ Form & table operations
✅ Command palette integration
✅ Help overlay system
✅ Role-based permissions
✅ Mobile & accessibility support

### Planned Features
- 🔜 Customizable shortcuts per user
- 🔜 Shortcut recording & macros
- 🔜 Cheat sheet printing
- 🔜 Shortcut analytics
- 🔜 Context-aware help tips

---

## 📞 Support & Feedback

**Found a bug?** [Report Issue]
**Have a suggestion?** [Feature Request]
**Need help?** Press Shift+? or Ctrl+K for command palette

---

## Quick Reference Card

```
╔════════════════════════════════════════════════════════════╗
║              ADMIN SHORTCUTS - QUICK REFERENCE             ║
╠════════════════════════════════════════════════════════════╣
║ NAVIGATION                  PAGE ACTIONS                    ║
║ G+D → Dashboard             N   → New Item                  ║
║ G+O → Orders                R   → Refresh                   ║
║ G+M → Menu Items            F   → Filters                   ║
║ G+I → Inventory             E   → Export                    ║
║ G+E → Employees                                             ║
║ G+C → Customers             FORM OPERATIONS                 ║
║ G+S → Settings              Ctrl+S → Save                   ║
║ G+R → Reports               Esc → Cancel                    ║
║                                                             ║
║ MORE SHORTCUTS                                              ║
║ Ctrl+K  → Command Palette    Shift+? → Help               ║
║ Ctrl+A  → Select All         Ctrl+C → Copy               ║
╚════════════════════════════════════════════════════════════╝
```

---

## 📚 Related Documentation

- [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) - Detailed technical guide
- [SHORTCUT_SYSTEM_SUMMARY.md](./SHORTCUT_SYSTEM_SUMMARY.md) - Architecture overview
- [useShortcuts Hook](./resources/js/app/hooks/useShortcuts.ts) - Implementation details
- [shortcuts.config.ts](./resources/js/app/config/shortcuts.config.ts) - Full shortcut definitions
