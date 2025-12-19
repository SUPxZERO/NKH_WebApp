# Shortcut Implementation Guide - Practical Examples

## 🚀 Quick Implementation Examples

This guide provides copy-paste examples for common scenarios.

---

## Example 1: Add Shortcuts to Admin Orders Page

**File:** `resources/js/Pages/admin/Orders.tsx`

```typescript
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';
import { copyTableData } from '@/app/utils/clipboard';
import { ShortcutDefinition } from '@/app/types/shortcuts';
import { RefreshCw, Copy, Trash2 } from 'lucide-react';

export default function Orders() {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const { refetch } = useQuery(['orders'], fetchOrders);

  // Define shortcuts for this page
  const orderShortcuts: ShortcutDefinition[] = [
    {
      id: 'refresh-orders',
      binding: { key: 'mod+r', description: 'Refresh orders' },
      category: 'actions',
      scope: 'component',
      handler: () => refetch(),
      preventDefault: true,
      icon: RefreshCw,
    },
    {
      id: 'copy-orders',
      binding: { key: 'mod+c', description: 'Copy selected orders' },
      category: 'clipboard',
      scope: 'component',
      handler: () => copyTableData(selectedOrders, 'csv'),
      preventDefault: true,
      icon: Copy,
      available: () => selectedOrders.length > 0,
    },
    {
      id: 'delete-orders',
      binding: { key: 'delete', description: 'Delete selected orders' },
      category: 'actions',
      scope: 'component',
      handler: () => handleDelete(selectedOrders),
      icon: Trash2,
      available: () => selectedOrders.length > 0,
      requiresConfirmation: true,
      confirmationMessage: `Delete ${selectedOrders.length} order(s)?`,
    },
  ];

  // Register shortcuts
  useComponentHotkeys(
    orderShortcuts,
    {
      'refresh-orders': () => refetch(),
      'copy-orders': () => copyTableData(selectedOrders, 'csv'),
      'delete-orders': () => handleDelete(selectedOrders),
    }
  );

  return <div>Your orders table...</div>;
}
```

---

## Example 2: Add Shortcuts to a Form

**File:** `resources/js/Pages/admin/MenuItems.tsx`

```typescript
import { useFormHotkeys } from '@/app/hooks/useShortcuts';
import { useForm } from 'react-hook-form';

export default function MenuItemForm({ item, onClose }) {
  const { handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: item,
  });

  const onSave = async (data) => {
    await saveDraft(data);
    toast.success('Draft saved');
  };

  const onSubmit = async (data) => {
    await saveMenuItem(data);
    toast.success('Menu item saved');
    onClose();
  };

  const onCancel = () => {
    if (isDirty) {
      if (confirm('Discard unsaved changes?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Register form shortcuts (work even in input fields!)
  useFormHotkeys({
    onSave,
    onSubmit: handleSubmit(onSubmit),
    onCancel,
  });

  return (
    <form>
      {/* Your form fields */}
    </form>
  );
}
```

---

## Example 3: Add Shortcuts to a Modal

**File:** `resources/js/app/components/modals/ConfirmDialog.tsx`

```typescript
import { useModalHotkeys } from '@/app/hooks/useShortcuts';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  // Register modal shortcuts
  useModalHotkeys(isOpen, {
    onClose,
    onConfirm,
  });

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true">
      <h2>{title}</h2>
      <p>{message}</p>
      <div>
        <button onClick={onClose}>Cancel (Esc)</button>
        <button onClick={onConfirm}>Confirm (⌘Enter)</button>
      </div>
    </div>
  );
}
```

---

## Example 4: Add Table with Full Keyboard Support

**File:** `resources/js/Pages/admin/Employees.tsx`

```typescript
import { useTableHotkeys } from '@/app/hooks/useShortcuts';
import { copyTableData } from '@/app/utils/clipboard';
import { useState } from 'react';

export default function Employees() {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [focusedRow, setFocusedRow] = useState<number>(0);
  const { data: employees, refetch } = useQuery(['employees'], fetchEmployees);

  // Table keyboard shortcuts
  useTableHotkeys({
    onSelectAll: () => setSelectedRows(employees.map((_, i) => i)),
    onCopy: () => {
      const selected = selectedRows.map(i => employees[i]);
      copyTableData(selected, 'csv');
    },
    onDelete: () => {
      const selected = selectedRows.map(i => employees[i]);
      deleteEmployees(selected);
    },
    onRefresh: () => refetch(),
    onNavigateUp: () => {
      setFocusedRow(prev => Math.max(0, prev - 1));
    },
    onNavigateDown: () => {
      setFocusedRow(prev => Math.min(employees.length - 1, prev + 1));
    },
  });

  return (
    <table>
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              checked={selectedRows.length === employees.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedRows(employees.map((_, i) => i));
                } else {
                  setSelectedRows([]);
                }
              }}
            />
          </th>
          <th>Name</th>
          <th>Position</th>
          <th>Email</th>
        </tr>
      </thead>
      <tbody>
        {employees.map((employee, index) => (
          <tr
            key={employee.id}
            className={focusedRow === index ? 'focused' : ''}
            onClick={() => setFocusedRow(index)}
          >
            <td>
              <input
                type="checkbox"
                checked={selectedRows.includes(index)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedRows([...selectedRows, index]);
                  } else {
                    setSelectedRows(selectedRows.filter(i => i !== index));
                  }
                }}
              />
            </td>
            <td>{employee.name}</td>
            <td>{employee.position}</td>
            <td>{employee.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Example 5: POS System with Quick Shortcuts

**File:** `resources/js/Pages/Employee/POS.tsx`

```typescript
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';
import { ShortcutDefinition } from '@/app/types/shortcuts';
import { ShoppingCart, DollarSign, Save, X } from 'lucide-react';

export default function POS() {
  const [cart, setCart] = useState([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const posShortcuts: ShortcutDefinition[] = [
    {
      id: 'pos-focus-search',
      binding: { key: 'mod+f', description: 'Focus search' },
      category: 'navigation',
      scope: 'component',
      handler: () => searchRef.current?.focus(),
      preventDefault: true,
    },
    {
      id: 'pos-view-cart',
      binding: { key: 'mod+shift+c', description: 'View cart' },
      category: 'navigation',
      scope: 'component',
      handler: () => setActiveTab('cart'),
      preventDefault: true,
      icon: ShoppingCart,
    },
    {
      id: 'pos-checkout',
      binding: { key: 'mod+shift+p', description: 'Proceed to payment' },
      category: 'actions',
      scope: 'component',
      handler: () => handleCheckout(),
      preventDefault: true,
      icon: DollarSign,
      available: () => cart.length > 0,
    },
    {
      id: 'pos-hold-order',
      binding: { key: 'mod+h', description: 'Hold order' },
      category: 'actions',
      scope: 'component',
      handler: () => holdOrder(),
      preventDefault: true,
      icon: Save,
      available: () => cart.length > 0,
    },
    {
      id: 'pos-clear-cart',
      binding: { key: 'mod+shift+x', description: 'Clear cart' },
      category: 'actions',
      scope: 'component',
      handler: () => clearCart(),
      preventDefault: true,
      icon: X,
      requiresConfirmation: true,
      available: () => cart.length > 0,
    },
  ];

  useComponentHotkeys(
    posShortcuts,
    {
      'pos-focus-search': () => searchRef.current?.focus(),
      'pos-view-cart': () => setActiveTab('cart'),
      'pos-checkout': handleCheckout,
      'pos-hold-order': holdOrder,
      'pos-clear-cart': clearCart,
    }
  );

  return (
    <div>
      <input ref={searchRef} type="search" placeholder="Search items..." />
      {/* POS UI */}
    </div>
  );
}
```

---

## Example 6: Kitchen Display with Status Updates

**File:** `resources/js/Pages/Employee/KitchenDisplay.tsx`

```typescript
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';
import { ShortcutDefinition } from '@/app/types/shortcuts';

export default function KitchenDisplay() {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: orders, refetch } = useQuery(['kitchen-orders'], fetchOrders);

  const kitchenShortcuts: ShortcutDefinition[] = [
    {
      id: 'kitchen-start',
      binding: { key: 's', description: 'Start preparing' },
      category: 'actions',
      scope: 'component',
      handler: () => updateOrderStatus(selectedOrderId, 'preparing'),
      available: () => selectedOrderId !== null,
    },
    {
      id: 'kitchen-ready',
      binding: { key: 'r', description: 'Mark as ready' },
      category: 'actions',
      scope: 'component',
      handler: () => updateOrderStatus(selectedOrderId, 'ready'),
      available: () => selectedOrderId !== null,
    },
    {
      id: 'kitchen-complete',
      binding: { key: 'c', description: 'Complete order' },
      category: 'actions',
      scope: 'component',
      handler: () => updateOrderStatus(selectedOrderId, 'completed'),
      available: () => selectedOrderId !== null,
    },
    {
      id: 'kitchen-refresh',
      binding: { key: 'mod+r', description: 'Refresh orders' },
      category: 'actions',
      scope: 'component',
      handler: () => refetch(),
      preventDefault: true,
    },
  ];

  useComponentHotkeys(
    kitchenShortcuts,
    {
      'kitchen-start': () => updateOrderStatus(selectedOrderId, 'preparing'),
      'kitchen-ready': () => updateOrderStatus(selectedOrderId, 'ready'),
      'kitchen-complete': () => updateOrderStatus(selectedOrderId, 'completed'),
      'kitchen-refresh': () => refetch(),
    }
  );

  return (
    <div>
      {orders.map(order => (
        <div
          key={order.id}
          onClick={() => setSelectedOrderId(order.id)}
          className={selectedOrderId === order.id ? 'selected' : ''}
        >
          {/* Order card */}
        </div>
      ))}
    </div>
  );
}
```

---

## Example 7: Custom Command in Command Palette

**File:** `resources/js/app/config/shortcuts.config.ts`

Add your custom command to the PALETTE_COMMANDS array:

```typescript
export const PALETTE_COMMANDS: CommandDefinition[] = [
  // ... existing commands

  // Your custom command
  {
    id: 'export-sales-report',
    category: 'actions',
    scope: 'global',
    handler: async () => {
      // Export logic
      const data = await fetchSalesData();
      const csv = convertToCSV(data);
      downloadFile(csv, 'sales-report.csv');
      toast.success('Sales report exported');
    },
    group: 'Reports',
    icon: FileText,
    keywords: ['export', 'download', 'sales', 'report', 'csv'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },

  {
    id: 'open-settings',
    binding: {
      key: 'mod+,',
      description: 'Open settings',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/settings'),
    group: 'Navigation',
    icon: Settings,
    keywords: ['settings', 'preferences', 'config'],
    showInPalette: true,
  },
];
```

---

## Example 8: Role-Specific Navigation

**File:** Your layout component

```typescript
import { useGlobalHotkeys } from '@/app/hooks/useShortcuts';
import {
  ADMIN_NAVIGATION_SHORTCUTS,
  EMPLOYEE_NAVIGATION_SHORTCUTS,
  CUSTOMER_NAVIGATION_SHORTCUTS,
} from '@/app/config/shortcuts.config';
import { useAuth } from '@/app/hooks/useAuth';

export function AppLayout({ children }) {
  const { user } = useAuth();

  // Register role-specific navigation
  if (user?.role === 'admin' || user?.role === 'super-admin') {
    useGlobalHotkeys(ADMIN_NAVIGATION_SHORTCUTS);
  } else if (user?.role === 'employee') {
    useGlobalHotkeys(EMPLOYEE_NAVIGATION_SHORTCUTS);
  } else if (user?.role === 'customer') {
    useGlobalHotkeys(CUSTOMER_NAVIGATION_SHORTCUTS);
  }

  return <div>{children}</div>;
}
```

---

## Example 9: Context-Aware Shortcuts

```typescript
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';
import { ShortcutDefinition } from '@/app/types/shortcuts';

export function OrderDetail({ order }) {
  const canApprove = order.status === 'pending' && user.hasPermission('orders.approve');
  const canCancel = order.status !== 'cancelled' && order.status !== 'completed';

  const shortcuts: ShortcutDefinition[] = [
    {
      id: 'approve-order',
      binding: { key: 'mod+shift+a', description: 'Approve order' },
      category: 'actions',
      scope: 'component',
      handler: () => approveOrder(order.id),
      available: () => canApprove,
      requiresConfirmation: true,
    },
    {
      id: 'cancel-order',
      binding: { key: 'mod+shift+x', description: 'Cancel order' },
      category: 'actions',
      scope: 'component',
      handler: () => cancelOrder(order.id),
      available: () => canCancel,
      requiresConfirmation: true,
    },
  ];

  useComponentHotkeys(
    shortcuts,
    {
      'approve-order': () => approveOrder(order.id),
      'cancel-order': () => cancelOrder(order.id),
    }
  );

  return <div>Order details...</div>;
}
```

---

## Example 10: Clipboard with Custom Formatting

```typescript
import { copyToClipboard } from '@/app/utils/clipboard';

// Copy formatted order summary
const copyOrderSummary = async (order) => {
  const summary = `
Order #${order.id}
Customer: ${order.customer.name}
Total: $${order.total}
Status: ${order.status}
Items: ${order.items.length}
  `.trim();

  await copyToClipboard(summary, {
    type: 'text',
    successMessage: 'Order summary copied',
  });
};

// Copy table as formatted CSV
const copyTable = async (data) => {
  await copyToClipboard(data, {
    type: 'csv',
    successMessage: `Copied ${data.length} rows as CSV`,
  });
};

// Copy JSON for API debugging
const copyAsJSON = async (data) => {
  await copyToClipboard(data, {
    type: 'json',
    successMessage: 'Copied as JSON',
  });
};
```

---

## Common Patterns

### Pattern 1: Searchable List

```typescript
const searchRef = useRef<HTMLInputElement>(null);

useComponentHotkeys(
  [
    {
      id: 'focus-search',
      binding: { key: 'mod+f', description: 'Focus search' },
      category: 'navigation',
      scope: 'component',
      handler: () => searchRef.current?.focus(),
      preventDefault: true,
    },
  ],
  {
    'focus-search': () => searchRef.current?.focus(),
  }
);
```

### Pattern 2: Bulk Actions

```typescript
const [selectedItems, setSelectedItems] = useState([]);

useTableHotkeys({
  onSelectAll: () => setSelectedItems(allItems),
  onCopy: () => copyTableData(selectedItems, 'csv'),
  onDelete: async () => {
    if (confirm(`Delete ${selectedItems.length} items?`)) {
      await bulkDelete(selectedItems.map(i => i.id));
      setSelectedItems([]);
    }
  },
});
```

### Pattern 3: Quick Create

```typescript
const createShortcut: ShortcutDefinition = {
  id: 'quick-create',
  binding: { key: 'mod+n', description: 'Create new' },
  category: 'actions',
  scope: 'component',
  handler: () => setShowCreateModal(true),
  preventDefault: true,
};
```

---

## Tips & Best Practices

1. **Use descriptive IDs:** `'nav-dashboard'` not `'shortcut1'`
2. **Provide clear descriptions:** Show in Help overlay and Command Palette
3. **Add keywords:** Helps users find commands via search
4. **Set appropriate scopes:** Global for app-wide, component for page-specific
5. **Use `available` checks:** Hide irrelevant shortcuts dynamically
6. **Add confirmation for destructive actions:** Prevent accidents
7. **Respect input fields:** Only form shortcuts should work in inputs
8. **Test on both Mac and Windows:** Ensure platform compatibility
9. **Document custom shortcuts:** Update your team's shortcut reference
10. **Keep it simple:** Don't overload users with too many shortcuts

---

## Next Steps

1. Pick a page to add shortcuts (start with high-traffic pages)
2. Copy an example from this guide
3. Test thoroughly (Mac + Windows)
4. Open Command Palette (Cmd/Ctrl+K) to verify it appears
5. Open Help Overlay (Shift+?) to verify it's documented
6. Share with your team!

---

Happy shortcutting! 🚀⌨️
