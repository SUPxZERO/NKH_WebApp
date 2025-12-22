# Keyboard Shortcuts System - Complete Documentation

## 📖 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Usage Guide](#usage-guide)
5. [API Reference](#api-reference)
6. [Adding Custom Shortcuts](#adding-custom-shortcuts)
7. [Security & Permissions](#security--permissions)gd
8. [Accessibility](#accessibility)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This application implements a **comprehensive, role-aware, context-sensitive keyboard shortcut system** designed to dramatically improve productivity for power users while maintaining security, accessibility, and native browser behavior.

### Key Features

✅ **Centralized Configuration** - All shortcuts defined in one place
✅ **Role-Based Access Control** - Shortcuts respect user roles and permissions
✅ **Context-Aware** - Shortcuts adapt to current page, modal state, and focus
✅ **Input Protection** - Never interferes with text inputs, textareas, or contenteditable
✅ **Platform-Agnostic** - Auto-converts Ctrl↔︎Cmd based on OS
✅ **Command Palette** - Fuzzy search all available actions (Cmd/Ctrl+K)
✅ **Discoverable** - Help overlay shows all shortcuts (Shift+?)
✅ **Clipboard Safety** - Sanitizes sensitive data before copying
✅ **Fully Accessible** - ARIA roles, keyboard navigation, screen reader support
✅ **Zero Memory Leaks** - Proper cleanup on unmount

---

## Architecture

### File Structure

```
resources/js/app/
├── types/
│   └── shortcuts.ts                  # TypeScript definitions
├── config/
│   └── shortcuts.config.ts           # Centralized shortcut registry
├── utils/
│   ├── shortcuts.ts                  # Core utilities
│   └── clipboard.ts                  # Clipboard utilities
├── hooks/
│   └── useShortcuts.ts               # React hooks (global, route, component)
├── components/
│   └── shortcuts/
│       ├── CommandPalette.tsx        # Cmd+K command palette
│       └── HelpOverlay.tsx           # Shift+? help overlay
└── providers/
    └── AppProviders.tsx              # Global integration
```

### Layers

```
┌─────────────────────────────────────────────────┐
│          Command Palette & Help UI              │
│         (User-facing discoverability)           │
├─────────────────────────────────────────────────┤
│              React Hook Layer                    │
│   useGlobalHotkeys, useRouteHotkeys, etc.       │
├─────────────────────────────────────────────────┤
│          react-hotkeys-hook Library             │
│         (Platform normalization)                │
├─────────────────────────────────────────────────┤
│        Shortcut Registry & Configuration        │
│       (Central source of truth)                 │
├─────────────────────────────────────────────────┤
│     Permission System & Context Checks          │
│   (Role-based, input protection, modal state)   │
└─────────────────────────────────────────────────┘
```

---

## Quick Start

### For Users

**Open Command Palette:**
```
⌘K / Ctrl+K
```
Search for any action and execute it instantly.

**View All Shortcuts:**
```
Shift+? (or just "?")
```
See every shortcut available for your role.

**Navigate Quickly (Admin/Manager) - Primary:**
```
G+D → Dashboard
G+O → Orders
G+M → Menu Items
G+I → Inventory
G+E → Employees
G+R → Reports / Analytics
G+C → Customers
G+S → Settings
```

**Navigate Quickly (Admin/Manager) - Extended:**
```
G+F → Financial Dashboard
G+P → Payments Dashboard
G+V → Invoices
G+X → Expenses
G+H → Shifts / Schedule
G+J → Positions
G+T → Time Off Requests
G+N → Ingredients
G+B → Recipes
G+U → Suppliers
G+Q → Purchase Orders
G+A → Stock Alerts
G+G → Categories
G+W → Tables
G+L → Floors
G+Z → Locations
G+1 → Reservations
G+2 → Promotions
G+3 → Loyalty Points
G+4 → Admins
G+5 → Roles & Permissions
G+6 → Audit Logs
G+7 → Notifications
G+8 → Translations
G+9 → Units
G+0 → Operating Hours
```

**Page Action Shortcuts:**
```
N        → Create new item (on current page)
R        → Refresh data
F        → Toggle filters
E        → Export data
```

**Work with Forms:**
```
⌘S / Ctrl+S      → Save
⌘Enter / Ctrl+Enter → Submit
Esc              → Cancel
```

**Work with Tables:**
```
⌘A / Ctrl+A      → Select all rows
⌘C / Ctrl+C      → Copy selected (CSV)
Delete           → Delete selected
⌘R / Ctrl+R      → Refresh data
```

---

## Usage Guide

### 1. Global Shortcuts (Available Everywhere)

These shortcuts work application-wide, regardless of the current page:

```typescript
import { useGlobalHotkeys } from '@/app/hooks/useShortcuts';
import { GLOBAL_SHORTCUTS } from '@/app/config/shortcuts.config';

function MyApp() {
  useGlobalHotkeys(GLOBAL_SHORTCUTS);

  return <div>Your app</div>;
}
```

**Example Global Shortcuts:**
- `Cmd/Ctrl+K` - Open command palette
- `Shift+?` - Show help overlay
- `Cmd/Ctrl+/` - Focus search bar
- `Cmd/Ctrl+Shift+Q` - Logout

### 2. Route-Specific Shortcuts

Shortcuts that only activate on specific routes:

```typescript
import { useRouteHotkeys } from '@/app/hooks/useShortcuts';
import { ADMIN_NAVIGATION_SHORTCUTS } from '@/app/config/shortcuts.config';

function AdminPage() {
  useRouteHotkeys('/admin', ADMIN_NAVIGATION_SHORTCUTS);

  return <div>Admin content</div>;
}
```

### 3. Component-Scoped Shortcuts

Shortcuts specific to a component (auto-cleanup on unmount):

```typescript
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';

function OrderTable() {
  const handleSelectAll = () => {
    // Select all orders
  };

  const handleCopy = () => {
    // Copy selected orders
  };

  useComponentHotkeys(
    TABLE_SHORTCUTS,
    {
      'table-select-all': handleSelectAll,
      'table-copy': handleCopy,
    }
  );

  return <table>...</table>;
}
```

### 4. Form Shortcuts

Forms get special treatment - shortcuts work even in input fields:

```typescript
import { useFormHotkeys } from '@/app/hooks/useShortcuts';

function OrderForm() {
  const handleSave = () => {
    // Save draft
  };

  const handleSubmit = () => {
    // Submit order
  };

  const handleCancel = () => {
    // Cancel and close
  };

  useFormHotkeys({
    onSave: handleSave,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
  });

  return <form>...</form>;
}
```

### 5. Modal Shortcuts

```typescript
import { useModalHotkeys } from '@/app/hooks/useShortcuts';

function ConfirmDialog({ isOpen, onClose, onConfirm }) {
  useModalHotkeys(isOpen, {
    onClose,
    onConfirm,
  });

  return isOpen ? <div>...</div> : null;
}
```

### 6. Table/Data Grid Shortcuts

```typescript
import { useTableHotkeys } from '@/app/hooks/useShortcuts';
import { copyTableData } from '@/app/utils/clipboard';

function DataTable({ data, selectedRows }) {
  const handleCopy = async () => {
    await copyTableData(selectedRows, 'csv');
  };

  const handleDelete = () => {
    // Delete selected
  };

  useTableHotkeys({
    onSelectAll: () => setSelectedRows(data),
    onCopy: handleCopy,
    onDelete: handleDelete,
    onRefresh: () => refetch(),
  });

  return <table>...</table>;
}
```

---

## API Reference

### Hooks

#### `useGlobalHotkeys(shortcuts, options?)`

Registers global shortcuts active everywhere.

**Parameters:**
- `shortcuts` - Array of shortcut definitions
- `options` - Optional configuration
  - `enabled?: boolean` - Enable/disable shortcuts
  - `debug?: boolean` - Enable debug logging

#### `useRouteHotkeys(route, shortcuts, options?)`

Registers shortcuts for a specific route.

**Parameters:**
- `route` - Route path (e.g., `/admin/orders`)
- `shortcuts` - Array of shortcut definitions
- `options` - Same as `useGlobalHotkeys`

#### `useComponentHotkeys(shortcuts, handlers, options?)`

Registers component-scoped shortcuts with custom handlers.

**Parameters:**
- `shortcuts` - Array of shortcut definitions
- `handlers` - Object mapping shortcut IDs to handler functions
- `options` - Same as `useGlobalHotkeys`

#### `useModalHotkeys(isOpen, handlers, options?)`

Registers modal shortcuts (Esc to close, Cmd+Enter to confirm).

**Parameters:**
- `isOpen` - Whether modal is currently open
- `handlers` - Object with `onClose` and `onConfirm` functions
- `options` - Same as `useGlobalHotkeys`

#### `useFormHotkeys(handlers, options?)`

Registers form shortcuts that work even in input fields.

**Parameters:**
- `handlers` - Object with `onSave`, `onSubmit`, `onCancel` functions
- `options` - Same as `useGlobalHotkeys`

#### `useTableHotkeys(handlers, options?)`

Registers table/data grid shortcuts.

**Parameters:**
- `handlers` - Object with table action handlers
  - `onSelectAll?: () => void`
  - `onCopy?: () => void`
  - `onDelete?: () => void`
  - `onRefresh?: () => void`
  - `onNavigateUp?: () => void`
  - `onNavigateDown?: () => void`

### Clipboard Utilities

#### `copyToClipboard(data, options?)`

Safely copy data to clipboard with sanitization.

```typescript
import { copyToClipboard } from '@/app/utils/clipboard';

// Copy as text
await copyToClipboard('Hello world');

// Copy as JSON
await copyToClipboard(userData, { type: 'json' });

// Copy as CSV
await copyToClipboard(tableData, { type: 'csv' });
```

**Options:**
- `type?: 'text' | 'json' | 'csv' | 'html'` - Data format
- `successMessage?: string` - Toast message on success
- `errorMessage?: string` - Toast message on error
- `showToast?: boolean` - Show toast notifications (default: true)

#### `copyTableData(rows, format?)`

Copy table data in CSV or JSON format.

```typescript
import { copyTableData } from '@/app/utils/clipboard';

// Copy as CSV (default)
await copyTableData(selectedRows);

// Copy as JSON
await copyTableData(selectedRows, 'json');
```

---

## Adding Custom Shortcuts

### Step 1: Define Your Shortcut

Add to `resources/js/app/config/shortcuts.config.ts`:

```typescript
export const MY_CUSTOM_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'create-invoice',
    binding: {
      key: 'mod+shift+i',
      description: 'Create new invoice',
    },
    category: 'actions',
    scope: 'route',
    handler: () => router.visit('/admin/invoices/create'),
    allowedRoles: ['admin', 'super-admin'],
    group: 'Actions',
    icon: FileText,
    keywords: ['new', 'create', 'invoice', 'bill'],
    showInPalette: true,
  },
];
```

### Step 2: Register It

```typescript
import { useGlobalHotkeys } from '@/app/hooks/useShortcuts';
import { MY_CUSTOM_SHORTCUTS } from '@/app/config/shortcuts.config';

function MyComponent() {
  useGlobalHotkeys(MY_CUSTOM_SHORTCUTS);
  return <div>...</div>;
}
```

### Step 3: That's It!

Your shortcut is now:
- ✅ Registered globally
- ✅ Visible in Command Palette (Cmd+K)
- ✅ Listed in Help Overlay (Shift+?)
- ✅ Role-aware
- ✅ Context-sensitive

---

## Security & Permissions

### Role-Based Access Control

Every shortcut can specify allowed roles:

```typescript
{
  id: 'delete-user',
  binding: { key: 'mod+shift+delete', description: 'Delete user' },
  handler: () => deleteUser(),
  allowedRoles: ['super-admin'], // Only super-admin can use this
}
```

### Permission Checks

For granular control, use custom permission functions:

```typescript
{
  id: 'approve-order',
  binding: { key: 'mod+shift+a', description: 'Approve order' },
  handler: () => approveOrder(),
  permission: (user) => user.hasPermission('orders.approve'),
}
```

### Backend Validation

**⚠️ CRITICAL:** Always re-validate permissions on the backend!

```php
// Bad - Only frontend check ❌
Route::post('/orders/{order}/approve', [OrderController::class, 'approve']);

// Good - Middleware validation ✅
Route::middleware('permission:orders.approve')
    ->post('/orders/{order}/approve', [OrderController::class, 'approve']);
```

### Data Sanitization

The clipboard utilities automatically redact sensitive fields:

```typescript
const sensitiveData = {
  name: 'John Doe',
  password: 'secret123',
  token: 'abc123',
};

await copyToClipboard(sensitiveData, { type: 'json' });

// Output:
// {
//   "name": "John Doe",
//   "password": "[REDACTED]",
//   "token": "[REDACTED]"
// }
```

**Protected Fields:**
- password
- token, access_token, refresh_token
- secret, api_key, apiKey
- private_key, privateKey
- ssn, credit_card, cvv, pin

---

## Accessibility

### Screen Reader Support

All shortcut UI components include proper ARIA attributes:

```tsx
<div role="dialog" aria-modal="true" aria-label="Command palette">
  {/* Command palette content */}
</div>
```

### Keyboard Navigation

- **Command Palette**: Arrow keys to navigate, Enter to select, Esc to close
- **Help Overlay**: Tab navigation, Esc to close
- **All modals**: Focus trap, Esc to close

### Focus Management

Shortcuts **never** override behavior in:
- `<input>` elements
- `<textarea>` elements
- `contenteditable` elements

Exception: Form shortcuts (Save, Submit) intentionally work in inputs.

### Visual Indicators

- Keyboard hints show platform-specific keys (⌘ on Mac, Ctrl on Windows)
- Focus outlines on all interactive elements
- High contrast support

---

## Testing

### Manual Testing Checklist

#### ✅ Basic Functionality
- [ ] Cmd/Ctrl+K opens command palette
- [ ] Shift+? opens help overlay
- [ ] Navigation shortcuts work (G+D, G+O, etc.)
- [ ] Form shortcuts work (Cmd+S, Cmd+Enter, Esc)
- [ ] Table shortcuts work (Cmd+A, Cmd+C, Delete)

#### ✅ Input Protection
- [ ] Shortcuts DON'T trigger when typing in input fields
- [ ] Form shortcuts (Cmd+S) DO work in input fields
- [ ] Shortcuts DON'T trigger in contenteditable areas
- [ ] Native browser shortcuts still work (Cmd+T, Cmd+W, etc.)

#### ✅ Role-Based Access
- [ ] Admin sees admin-only shortcuts in palette
- [ ] Employee sees employee shortcuts
- [ ] Customer sees customer shortcuts
- [ ] Unauthorized shortcuts don't appear

#### ✅ Platform Compatibility
- [ ] Mac: Cmd key works correctly
- [ ] Windows/Linux: Ctrl key works correctly
- [ ] Keyboard hints show correct modifier (⌘ vs Ctrl)

#### ✅ Accessibility
- [ ] Screen reader announces modals
- [ ] Tab navigation works in command palette
- [ ] Esc closes modals
- [ ] Focus trap works in modals

### Automated Testing (Recommended)

```typescript
// Example: Test shortcut registration
describe('Keyboard Shortcuts', () => {
  it('registers global shortcuts', () => {
    const { result } = renderHook(() => useGlobalHotkeys(GLOBAL_SHORTCUTS));
    // Verify shortcuts are registered
  });

  it('respects role permissions', () => {
    const adminUser = { role: 'admin' };
    const shortcuts = filterShortcutsByRole(ALL_SHORTCUTS, adminUser.role);
    expect(shortcuts).toContainEqual(expect.objectContaining({ id: 'nav-dashboard' }));
  });

  it('blocks shortcuts in input fields', () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    expect(isUserInInputField()).toBe(true);
  });
});
```

---

## Troubleshooting

### Shortcuts Not Working

**Problem:** Pressing a shortcut does nothing.

**Solutions:**
1. Check if you're focused on an input field (shortcuts are intentionally disabled)
2. Open Help Overlay (Shift+?) to see if shortcut is available for your role
3. Check browser console for errors
4. Verify shortcut is enabled: `enabled: true` in config

### Conflict with Browser Shortcuts

**Problem:** Shortcut overrides browser behavior (e.g., Cmd+T for new tab).

**Solutions:**
1. Choose a different key combination
2. Use sequence shortcuts (e.g., "G D" instead of "Cmd+G")
3. Set `preventDefault: false` in shortcut definition

### Shortcuts Not Visible in Command Palette

**Problem:** Custom shortcut doesn't appear in Cmd+K palette.

**Solutions:**
1. Set `showInPalette: true` in shortcut definition
2. Verify user role has permission (`allowedRoles`)
3. Check if shortcut has `binding` property (commands without bindings need explicit `showInPalette`)

### Memory Leaks

**Problem:** Shortcuts persist after component unmount.

**Solutions:**
1. Always use hooks (`useComponentHotkeys`, not direct event listeners)
2. Verify component unmounts properly
3. Check React DevTools for orphaned components

---

## Performance Notes

- **Zero impact on initial load** - Shortcuts load with your component
- **No global listeners** - Uses react-hotkeys-hook's optimized approach
- **Automatic cleanup** - Hooks clean up on unmount
- **Memoized filters** - Role and permission checks are cached

---

## Platform Notes

### Mac
- `Cmd` key is used for shortcuts
- Keyboard hints show `⌘` symbol
- Native Mac shortcuts preserved

### Windows/Linux
- `Ctrl` key is used for shortcuts
- Keyboard hints show `Ctrl` text
- Native shortcuts preserved

### Mobile/Tablet
- Shortcuts gracefully degrade (no error)
- Command Palette accessible via button if needed
- Touch-friendly UI

---

## Admin Shortcuts - Complete Reference

### Primary Navigation Shortcuts (Admin/Manager Only)

These are the 8 most-accessed admin pages:

```
G+D  → Dashboard           # System overview & KPIs
G+O  → Orders              # Order management & tracking
G+M  → Menu Items          # Food menu & items
G+I  → Inventory           # Stock & product inventory
G+E  → Employees           # Staff management
G+R  → Reports/Analytics   # Performance reports
G+C  → Customers           # Customer database
G+S  → Settings            # System configuration
```

### Extended Navigation Shortcuts (Admin/Manager Only)

Access to specialized pages:

```
Financial & Reporting:
  G+F  → Financial Dashboard    # Revenue, expenses, profit
  G+P  → Payments Dashboard     # Payment methods, transactions
  G+V  → Invoices              # Invoice management
  G+X  → Expenses              # Expense tracking

Operations & Scheduling:
  G+H  → Shifts                # Staff scheduling
  G+J  → Positions             # Job titles & roles
  G+T  → Time Off Requests     # Leave management
  G+W  → Tables                # Seating & tables
  G+L  → Floors                # Restaurant layout

Inventory & Products:
  G+N  → Ingredients           # Raw materials
  G+B  → Recipes               # Recipe definitions
  G+U  → Suppliers             # Vendor management
  G+Q  → Purchase Orders       # Buying orders
  G+A  → Stock Alerts          # Low stock warnings
  G+G  → Categories            # Product categories
  G+Z  → Locations             # Warehouse locations

Business Management:
  G+1  → Reservations          # Table reservations
  G+2  → Promotions            # Discounts & offers
  G+3  → Loyalty Points        # Rewards program
  G+4  → Admins                # Admin accounts
  G+5  → Roles & Permissions   # Access control
  G+6  → Audit Logs            # Activity tracking
  G+7  → Notifications         # Alert settings
  G+8  → Translations          # Multi-language
  G+9  → Units                 # Measurement units
  G+0  → Operating Hours       # Business hours
```

### Page Action Shortcuts (Works on Any Admin Page)

Universal shortcuts that adapt to the current page:

```
N     → Create New Item        # Click Create/Add button
R     → Refresh Data           # Reload/refetch data
F     → Toggle Filters         # Show/hide filter panel
E     → Export Data            # Download as CSV/PDF
```

**Smart Behavior:**
- `N` - Finds and clicks the "Create", "Add", or "New" button
- `R` - Finds Refresh button or reloads the page
- `F` - Opens the filter sidebar if available
- `E` - Triggers export in the current format (CSV/PDF/Excel)

### Page-Specific Action Shortcuts

Beyond the universal shortcuts, some pages have specialized shortcuts:

#### Orders Page
```
Ctrl+P  → Print Order        # Print selected order
Ctrl+E  → Mark Exported      # Export to kitchen display
```

#### Menu Items Page
```
Ctrl+B  → Bulk Toggle        # Toggle availability for multiple items
Ctrl+U  → Upload Image       # Upload item image
```

#### Inventory Page
```
Ctrl+T  → Transfer Stock     # Move inventory between locations
Ctrl+W  → Record Wastage     # Log waste/spoilage
```

#### Reports Page
```
Ctrl+J  → Schedule Report    # Email report automatically
Ctrl+G  → Generate Report    # Create custom report
```

### Form Operations (In Any Admin Form)

```
Ctrl+S / Cmd+S               → Save Form
Ctrl+Enter / Cmd+Enter       → Submit & Close
Escape                       → Cancel & Close
```

### Table/List Operations (In Any Admin List)

```
Ctrl+A / Cmd+A  → Select All Rows
Ctrl+C / Cmd+C  → Copy Selected as CSV
Delete          → Delete Selected Rows
Ctrl+R / Cmd+R  → Refresh Table
```

### Command Palette Actions (Ctrl/Cmd+K)

When you open the command palette, you can search for admin actions:

#### Create Actions
```
Type: "create order"          → Open new order form
Type: "create menu"           → Add menu item
Type: "create employee"       → Register employee
Type: "create customer"       → Add customer
Type: "create reservation"    → Make reservation
Type: "create promotion"      → Set up promotion
Type: "create supplier"       → Add supplier
Type: "create invoice"        → Generate invoice
```

#### Quick View Actions
```
Type: "pending orders"        → View orders awaiting action
Type: "low stock"            → Show items below threshold
Type: "today's shifts"       → View today's schedule
Type: "recent transactions"  → Show latest payments
Type: "active promotions"    → List running promotions
```

#### Export Actions
```
Type: "export orders"        → Download orders as CSV/PDF
Type: "export menu"          → Export menu items
Type: "export inventory"     → Export stock report
Type: "export employees"     → Download staff list
Type: "export customers"     → Export customer database
Type: "export financial"     → Export financial report
Type: "export payments"      → Download payment history
```

---

## Change Log

### Version 2.0.0 (Current - Enhanced Admin Shortcuts)
- ✅ Added 30+ admin navigation shortcuts
- ✅ Added 4 universal page action shortcuts
- ✅ Added 50+ command palette actions
- ✅ Added page-specific shortcuts for major pages
- ✅ Added bulk operations support
- ✅ Added export functionality shortcuts
- ✅ Complete admin shortcuts documentation

### Version 1.0.0
- ✅ Initial implementation
- ✅ Command palette with fuzzy search
- ✅ Help overlay with role filtering
- ✅ Global, route, and component hooks
- ✅ Clipboard utilities with sanitization
- ✅ Full accessibility support
- ✅ Input field protection
- ✅ Role-based access control

---

## Support

For questions or issues:
1. Check this documentation
2. Open Help Overlay (Shift+?) to see available shortcuts
3. Press Ctrl+K to search command palette
4. Check browser console for error messages (F12)
5. Review source code in `resources/js/app/hooks/useShortcuts.ts`

---

## License

Part of NKH WebApp. All rights reserved.
