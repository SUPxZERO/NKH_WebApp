# 🚀 Keyboard Shortcuts System

A **production-ready, enterprise-grade keyboard shortcut system** for your Laravel + React application.

---

## ✨ What You Get

This system provides:

✅ **Command Palette** (Cmd/Ctrl+K) - Instant access to all actions
✅ **Help Overlay** (Shift+?) - Discoverable shortcut reference
✅ **Role-Based Access** - Shortcuts respect user permissions
✅ **Input Protection** - Never interferes with typing
✅ **Platform-Agnostic** - Auto-adapts Ctrl↔Cmd
✅ **Clipboard Safety** - Auto-sanitizes sensitive data
✅ **Fully Accessible** - ARIA roles, keyboard navigation, screen reader support
✅ **Zero Config** - Works out of the box

---

## 🎯 Quick Start (3 Steps)

### 1. Open Command Palette

Press **Cmd+K** (Mac) or **Ctrl+K** (Windows/Linux):

<img src="https://via.placeholder.com/800x400?text=Command+Palette+Screenshot" alt="Command Palette" />

Search for any action and execute it instantly with fuzzy search.

### 2. View All Shortcuts

Press **Shift+?** to see every available shortcut:

<img src="https://via.placeholder.com/800x400?text=Help+Overlay+Screenshot" alt="Help Overlay" />

All shortcuts are **role-aware** - you only see what you have permission to use.

### 3. Try Navigation (Admin/Manager)

- **G + D** → Dashboard
- **G + O** → Orders
- **G + M** → Menu Items
- **G + I** → Inventory
- **G + E** → Employees
- **G + R** → Reports

These are **sequence shortcuts** - no modifier keys needed!

---

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| **[KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md)** | Complete system documentation, API reference, security guide |
| **[SHORTCUT_IMPLEMENTATION_GUIDE.md](./SHORTCUT_IMPLEMENTATION_GUIDE.md)** | Copy-paste examples for every use case |

---

## 🎨 Features in Detail

### Command Palette

**Trigger:** `Cmd/Ctrl+K`

<img src="https://via.placeholder.com/600x300?text=Fuzzy+Search+Demo" alt="Fuzzy Search" />

- **Fuzzy search** - Type "cre ord" to find "Create Order"
- **Role-aware** - Only shows actions you have permission for
- **Keyboard navigation** - Arrow keys, Enter to select, Esc to close
- **Visual hints** - See keyboard shortcuts next to each command
- **Async execution** - Handles promises gracefully

### Help Overlay

**Trigger:** `Shift+?`

<img src="https://via.placeholder.com/600x300?text=Help+Overlay+Demo" alt="Help Overlay" />

- **Categorized** - Organized by System, Navigation, Actions, Forms, Tables
- **Searchable** - Filter shortcuts in real-time
- **Platform-specific** - Shows ⌘ on Mac, Ctrl on Windows
- **Auto-filtered** - Only shows shortcuts available to your role

### Input Protection

Shortcuts **never** interfere with typing:

```
✅ Typing in <input>        → Shortcuts disabled (except form shortcuts)
✅ Typing in <textarea>     → Shortcuts disabled
✅ Contenteditable areas    → Shortcuts disabled
✅ Native browser shortcuts → Preserved (Cmd+T, Cmd+W, etc.)
```

**Exception:** Form shortcuts (Cmd+S, Cmd+Enter) intentionally work in input fields for better UX.

### Clipboard Safety

Automatically redacts sensitive fields:

```typescript
const data = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret123',      // ← Will be [REDACTED]
  token: 'abc123',             // ← Will be [REDACTED]
};

copyToClipboard(data, { type: 'json' });
```

**Protected fields:** password, token, secret, api_key, credit_card, ssn, cvv, private_key

### Role-Based Access

Every shortcut can specify allowed roles:

```typescript
{
  id: 'delete-user',
  binding: { key: 'mod+shift+delete', description: 'Delete user' },
  handler: () => deleteUser(),
  allowedRoles: ['super-admin'], // ← Only super-admin sees this
}
```

**Important:** Permissions are also validated on the backend! Frontend checks are for UX only.

### Accessibility

- ✅ **Screen reader support** - All modals announce properly
- ✅ **Keyboard navigation** - Tab through command palette
- ✅ **Focus management** - Auto-focus on open, restore on close
- ✅ **High contrast** - Respects user preferences
- ✅ **ARIA roles** - Proper semantic HTML

---

## 🛠️ System Architecture

```
┌──────────────────────────────────────────────────────┐
│                   User Interface                     │
│          Command Palette    Help Overlay             │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│                  React Hook Layer                    │
│  useGlobalHotkeys  useRouteHotkeys  useFormHotkeys   │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│             react-hotkeys-hook Library               │
│          (Platform normalization Ctrl↔Cmd)           │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│            Centralized Configuration                 │
│        shortcuts.config.ts (Single source)           │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│         Permission & Context Validation              │
│    (Role checks, input protection, modal state)      │
└──────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
resources/js/app/
├── types/
│   └── shortcuts.ts                  # TypeScript definitions
├── config/
│   └── shortcuts.config.ts           # ALL shortcuts defined here ← SINGLE SOURCE OF TRUTH
├── utils/
│   ├── shortcuts.ts                  # Core utilities (formatting, filters, etc.)
│   └── clipboard.ts                  # Safe clipboard operations
├── hooks/
│   └── useShortcuts.ts               # React hooks (6 different hooks)
├── components/shortcuts/
│   ├── CommandPalette.tsx            # Cmd+K palette
│   └── HelpOverlay.tsx               # Shift+? help
└── providers/
    └── AppProviders.tsx              # Global integration (already done ✅)
```

**Everything is already integrated!** The Command Palette and Help Overlay are now available app-wide.

---

## 🚀 Usage Examples

### Add Shortcuts to a Page

```typescript
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';
import { copyTableData } from '@/app/utils/clipboard';

function MyPage() {
  const [selectedRows, setSelectedRows] = useState([]);

  useComponentHotkeys(
    TABLE_SHORTCUTS,
    {
      'table-copy': () => copyTableData(selectedRows, 'csv'),
      'table-delete': () => deleteRows(selectedRows),
    }
  );

  return <div>Your page content</div>;
}
```

### Add Shortcuts to a Form

```typescript
import { useFormHotkeys } from '@/app/hooks/useShortcuts';

function MyForm() {
  useFormHotkeys({
    onSave: saveDraft,
    onSubmit: handleSubmit,
    onCancel: closeForm,
  });

  return <form>Your form</form>;
}
```

### Add Shortcuts to a Modal

```typescript
import { useModalHotkeys } from '@/app/hooks/useShortcuts';

function MyModal({ isOpen, onClose, onConfirm }) {
  useModalHotkeys(isOpen, { onClose, onConfirm });

  return isOpen ? <div>Modal content</div> : null;
}
```

**More examples:** See [SHORTCUT_IMPLEMENTATION_GUIDE.md](./SHORTCUT_IMPLEMENTATION_GUIDE.md)

---

## 🎓 Learn More

### For Users

1. Press **Cmd/Ctrl+K** to explore available actions
2. Press **Shift+?** to see all shortcuts
3. Start with navigation: **G+D**, **G+O**, **G+M**
4. Use forms faster: **Cmd+S** to save, **Cmd+Enter** to submit

### For Developers

1. Read [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md) - Complete documentation
2. Read [SHORTCUT_IMPLEMENTATION_GUIDE.md](./SHORTCUT_IMPLEMENTATION_GUIDE.md) - Copy-paste examples
3. Check `resources/js/app/config/shortcuts.config.ts` - See all defined shortcuts
4. Add your own shortcuts following the examples

---

## 🔒 Security Notes

**Frontend checks are for UX only!** Always validate permissions on the backend:

```php
// ❌ Bad - Only frontend check
Route::post('/orders/{order}/approve', [OrderController::class, 'approve']);

// ✅ Good - Backend validation
Route::middleware('permission:orders.approve')
    ->post('/orders/{order}/approve', [OrderController::class, 'approve']);
```

The shortcut system includes:
- Role-based filtering (frontend)
- Permission function checks (frontend)
- Data sanitization (clipboard)
- Input field protection

But your backend **must** re-validate everything!

---

## 🧪 Testing Checklist

Before deploying:

- [ ] Test on Mac (Cmd key)
- [ ] Test on Windows (Ctrl key)
- [ ] Test in Chrome and Edge
- [ ] Verify shortcuts don't trigger in input fields
- [ ] Verify role-based access (admin vs employee vs customer)
- [ ] Test Command Palette (Cmd+K)
- [ ] Test Help Overlay (Shift+?)
- [ ] Verify clipboard sanitizes passwords/tokens
- [ ] Test with keyboard-only navigation
- [ ] Test with screen reader (optional but recommended)

---

## 💡 Tips for Power Users

**Sequence Shortcuts** - No modifier keys needed:
- G+D, G+O, G+M, etc. (like GitHub, Gmail)

**Use Command Palette for Discovery:**
- Don't memorize all shortcuts
- Just remember Cmd+K and search

**Customize for Your Workflow:**
- Check `shortcuts.config.ts`
- Add shortcuts for your frequent actions

**Clipboard Tricks:**
- Cmd+C copies table rows as CSV
- Automatically works in most tables

**Accessibility:**
- Keyboard-only users: Tab navigation works everywhere
- Screen reader users: ARIA labels on all interactive elements

---

## 📊 Performance

- **Zero impact on load time** - Shortcuts load with components
- **No global listeners** - Uses optimized react-hotkeys-hook
- **Auto cleanup** - No memory leaks
- **Memoized checks** - Role/permission filters are cached

---

## 🐛 Troubleshooting

**Shortcut not working?**
1. Check if you're in an input field (intentionally disabled)
2. Open Help Overlay (Shift+?) to see if it's available for your role
3. Check browser console for errors

**Conflict with browser shortcut?**
- Use sequence shortcuts (G+D) instead of modifier shortcuts (Cmd+D)

**Not visible in Command Palette?**
- Check `showInPalette: true` in shortcut definition
- Verify `allowedRoles` includes your role

---

## 📈 What's Next?

1. **Try it out** - Press Cmd+K right now!
2. **Add shortcuts to high-traffic pages** - See implementation guide
3. **Train your team** - Share this README
4. **Customize** - Add shortcuts for your specific workflows

---

## 🎉 Summary

You now have:

✅ A professional keyboard shortcut system
✅ Command Palette (Cmd+K)
✅ Help Overlay (Shift+?)
✅ Role-based access control
✅ Complete documentation
✅ Copy-paste implementation examples

**Start using it:** Press **Cmd/Ctrl+K** now!

**For questions:** Check [KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md)

---

**Built with ❤️ for power users**
