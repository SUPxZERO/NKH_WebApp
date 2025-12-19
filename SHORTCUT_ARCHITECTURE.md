# 🏗️ Keyboard Shortcut System - Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                        │
│                                                                       │
│  ┌──────────────────────┐         ┌──────────────────────┐        │
│  │  Command Palette      │         │   Help Overlay       │        │
│  │  (Cmd/Ctrl+K)        │         │   (Shift+?)          │        │
│  │                      │         │                      │        │
│  │  • Fuzzy Search      │         │  • All Shortcuts     │        │
│  │  • Keyboard Nav      │         │  • Categorized       │        │
│  │  • Visual Hints      │         │  • Searchable        │        │
│  │  • Async Execution   │         │  • Role-Filtered     │        │
│  └──────────────────────┘         └──────────────────────┘        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT HOOK LAYER                            │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ useGlobalHotkeys │  │ useRouteHotkeys  │  │ useModalHotkeys  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │ useFormHotkeys   │  │ useTableHotkeys  │  │useComponentHotkeys│ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│                                                                       │
│  Purpose: Encapsulate shortcut logic, handle cleanup, provide       │
│           simple API for components                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    LIBRARY ABSTRACTION LAYER                        │
│                                                                       │
│              ┌────────────────────────────────┐                     │
│              │    react-hotkeys-hook Library   │                     │
│              │                                 │                     │
│              │  • Platform Detection (Ctrl/Cmd)│                     │
│              │  • Event Normalization          │                     │
│              │  • Sequence Support             │                     │
│              │  • Optimized Listeners          │                     │
│              └────────────────────────────────┘                     │
│                                                                       │
│  Purpose: Handle low-level keyboard events, normalize across        │
│           platforms, manage event listeners efficiently              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   CONFIGURATION & REGISTRY LAYER                    │
│                                                                       │
│              ┌────────────────────────────────┐                     │
│              │   shortcuts.config.ts           │                     │
│              │   (Single Source of Truth)      │                     │
│              │                                 │                     │
│              │  • ALL_SHORTCUTS[]              │                     │
│              │  • GLOBAL_SHORTCUTS[]           │                     │
│              │  • ADMIN_NAVIGATION[]           │                     │
│              │  • EMPLOYEE_NAVIGATION[]        │                     │
│              │  • CUSTOMER_NAVIGATION[]        │                     │
│              │  • FORM_SHORTCUTS[]             │                     │
│              │  • TABLE_SHORTCUTS[]            │                     │
│              │  • MODAL_SHORTCUTS[]            │                     │
│              │  • PALETTE_COMMANDS[]           │                     │
│              └────────────────────────────────┘                     │
│                                                                       │
│  Purpose: Centralize all shortcut definitions, make system          │
│           maintainable, enable discoverability                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      UTILITY & HELPER LAYER                         │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  shortcuts.ts                                                 │  │
│  │                                                               │  │
│  │  • formatKeyBinding()      • isInputField()                  │  │
│  │  • canUseShortcut()        • isModalOpen()                   │  │
│  │  • shouldExecuteShortcut() • detectConflicts()               │  │
│  │  • fuzzySearchShortcuts()  • sanitizeForClipboard()          │  │
│  │  • filterShortcutsByRole() • convertToCSV()                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  clipboard.ts                                                 │  │
│  │                                                               │  │
│  │  • copyToClipboard()       • copyUrl()                       │  │
│  │  • copyTableData()         • copyRichText()                  │  │
│  │  • readFromClipboard()     • isClipboardAvailable()          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Purpose: Provide reusable utilities, handle edge cases,            │
│           format data, ensure safety                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    PERMISSION & CONTEXT LAYER                       │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Permission Checks                                            │  │
│  │                                                               │  │
│  │  • Role-based filtering                                       │  │
│  │  • Custom permission functions                                │  │
│  │  • Backend validation (Laravel middleware)                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Context Awareness                                            │  │
│  │                                                               │  │
│  │  • Input field detection                                      │  │
│  │  • Modal state tracking                                       │  │
│  │  • Route matching                                             │  │
│  │  • Focus management                                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Purpose: Ensure shortcuts only execute when appropriate,           │
│           respect permissions, prevent conflicts                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         TYPE SYSTEM LAYER                           │
│                                                                       │
│              ┌────────────────────────────────┐                     │
│              │    shortcuts.ts (types)         │                     │
│              │                                 │                     │
│              │  • ShortcutDefinition           │                     │
│              │  • CommandDefinition            │                     │
│              │  • ShortcutContext              │                     │
│              │  • KeyBinding                   │                     │
│              │  • ClipboardCopyOptions         │                     │
│              │  • UserRole                     │                     │
│              │  • ShortcutScope                │                     │
│              │  • ShortcutCategory             │                     │
│              └────────────────────────────────┘                     │
│                                                                       │
│  Purpose: Provide type safety, IntelliSense, compile-time checks    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### User Presses Keyboard Shortcut

```
┌─────────────────┐
│  User presses   │
│   Cmd+K         │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Browser captures keyboard event │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  react-hotkeys-hook processes    │
│  - Normalizes Ctrl/Cmd           │
│  - Matches registered shortcuts  │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Hook layer receives event       │
│  - useGlobalHotkeys() or         │
│  - useComponentHotkeys()         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Context checks                  │
│  ✓ Is user in input field?       │
│  ✓ Does user have permission?    │
│  ✓ Is shortcut available?        │
│  ✓ Is modal open?                │
└────────┬────────────────────────┘
         │
         ├─[NO]─→ ❌ Block execution
         │
         └─[YES]─→ ✅ Continue
                    │
                    ▼
         ┌─────────────────────────┐
         │  Confirmation check       │
         │  (if requiresConfirmation)│
         └────────┬─────────────────┘
                  │
                  ├─[CANCEL]─→ ❌ Abort
                  │
                  └─[CONFIRM]─→ ✅ Execute
                                 │
                                 ▼
                  ┌──────────────────────────┐
                  │  Execute handler          │
                  │  - Run shortcut action    │
                  │  - Handle promises        │
                  │  - Show feedback          │
                  └──────────────────────────┘
```

---

## Component Integration Patterns

### Pattern 1: Global Shortcuts (App-Wide)

```typescript
// In AppProviders or Layout
import { useGlobalHotkeys } from '@/app/hooks/useShortcuts';
import { GLOBAL_SHORTCUTS } from '@/app/config/shortcuts.config';

function AppLayout() {
  useGlobalHotkeys(GLOBAL_SHORTCUTS);
  return <div>{children}</div>;
}
```

### Pattern 2: Page-Specific Shortcuts

```typescript
// In Page Component
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';

function OrdersPage() {
  const shortcuts = [
    { id: 'refresh', binding: { key: 'mod+r', ... }, handler: refetch }
  ];

  useComponentHotkeys(shortcuts, {
    'refresh': () => refetch(),
  });

  return <div>Orders</div>;
}
```

### Pattern 3: Form Shortcuts

```typescript
// In Form Component
import { useFormHotkeys } from '@/app/hooks/useShortcuts';

function EditForm() {
  useFormHotkeys({
    onSave: saveDraft,
    onSubmit: handleSubmit,
    onCancel: close,
  });

  return <form>...</form>;
}
```

---

## Permission Flow

```
User attempts shortcut
         │
         ▼
┌─────────────────────┐
│ Check Role Filter   │
│ allowedRoles[]      │
└──────┬──────────────┘
       │
       ├─[NO]─→ ❌ Hide from UI & block execution
       │
       └─[YES]─→ Continue
                  │
                  ▼
       ┌──────────────────────┐
       │ Check Permission Fn   │
       │ permission(user)      │
       └──────┬───────────────┘
              │
              ├─[FALSE]─→ ❌ Block execution
              │
              └─[TRUE]─→ Continue
                          │
                          ▼
              ┌──────────────────────┐
              │ Check Availability    │
              │ available()           │
              └──────┬───────────────┘
                     │
                     ├─[FALSE]─→ ❌ Block execution
                     │
                     └─[TRUE]─→ ✅ Execute
```

---

## Lifecycle Management

### Component Mount
```
Component renders
       │
       ▼
Hook registers shortcuts
       │
       ▼
react-hotkeys-hook adds listeners
       │
       ▼
Shortcuts active ✅
```

### Component Unmount
```
Component unmounts
       │
       ▼
Hook cleanup runs
       │
       ▼
react-hotkeys-hook removes listeners
       │
       ▼
No memory leaks ✅
```

---

## Conflict Resolution

### When Multiple Shortcuts Match Same Key

```
Multiple shortcuts with key "mod+s"
         │
         ▼
┌─────────────────────┐
│ Sort by priority    │
│ (highest first)     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Check scope         │
│ - Component > Route │
│ - Route > Global    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Execute winner      │
└─────────────────────┘
```

---

## Search & Discovery Flow

### Command Palette Search

```
User types query "cre ord"
         │
         ▼
┌─────────────────────────────┐
│ Filter by role & permission │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Fuzzy search                │
│ - Match ID                  │
│ - Match description         │
│ - Match keywords            │
│ - Token matching            │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Score results               │
│ - Exact match = +10         │
│ - Description = +8          │
│ - Keyword = +5              │
│ - Group = +3                │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Sort by score (highest first)│
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Display top 10 results      │
└─────────────────────────────┘
```

---

## Security Boundaries

```
┌──────────────────────────────────────┐
│         FRONTEND (React)              │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ Shortcut Permission Checks     │  │
│  │ (UI filtering only)            │  │
│  └────────────────────────────────┘  │
│                                       │
│  • Role filtering                     │
│  • Custom permission functions        │
│  • Availability checks                │
│                                       │
│  ⚠️  DO NOT RELY ON THIS FOR SECURITY │
└──────────────────────────────────────┘
                  │
                  │ API Request
                  │
                  ▼
┌──────────────────────────────────────┐
│         BACKEND (Laravel)             │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ Laravel Middleware             │  │
│  │ (REAL security layer)          │  │
│  └────────────────────────────────┘  │
│                                       │
│  • RoleMiddleware                     │
│  • PermissionMiddleware               │
│  • Policy checks                      │
│  • Gate checks                        │
│                                       │
│  ✅ TRUST THIS FOR SECURITY           │
└──────────────────────────────────────┘
```

**Critical Rule:** Frontend permission checks are for **UX only**. Backend **must** re-validate everything!

---

## Error Handling Flow

```
Shortcut execution
       │
       ▼
┌─────────────────────┐
│ Try execute handler │
└──────┬──────────────┘
       │
       ├─[Success]─→ ✅ Show success feedback
       │
       └─[Error]──→ Catch error
                      │
                      ▼
           ┌──────────────────────┐
           │ Log to console        │
           └──────┬───────────────┘
                  │
                  ▼
           ┌──────────────────────┐
           │ Show error toast      │
           └──────┬───────────────┘
                  │
                  ▼
           ┌──────────────────────┐
           │ Graceful degradation  │
           │ (app still functional)│
           └──────────────────────┘
```

---

## File Dependencies

```
CommandPalette.tsx
    │
    ├─→ shortcuts.config.ts (ALL_SHORTCUTS)
    ├─→ shortcuts.ts (fuzzySearchShortcuts, formatKeyBinding)
    ├─→ useAuth.ts (user role)
    └─→ types/shortcuts.ts (CommandDefinition)

HelpOverlay.tsx
    │
    ├─→ shortcuts.config.ts (ALL_SHORTCUTS)
    ├─→ shortcuts.ts (formatKeyBinding, groupShortcutsByCategory)
    ├─→ useAuth.ts (user role)
    └─→ types/shortcuts.ts (ShortcutDefinition)

useShortcuts.ts
    │
    ├─→ react-hotkeys-hook (useHotkeys)
    ├─→ shortcuts.ts (shouldExecuteShortcut, getShortcutContext)
    ├─→ useAuth.ts (user)
    └─→ types/shortcuts.ts (ShortcutDefinition, ShortcutContext)

clipboard.ts
    │
    ├─→ shortcuts.ts (sanitizeForClipboard, convertToCSV)
    ├─→ toast.ts (toastSuccess, toastError)
    └─→ types/shortcuts.ts (ClipboardCopyOptions)
```

---

## Extension Points

### Want to Add a New Shortcut?

**Edit:** `resources/js/app/config/shortcuts.config.ts`

```typescript
export const MY_CUSTOM_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'my-action',
    binding: { key: 'mod+shift+m', description: 'My custom action' },
    category: 'actions',
    scope: 'global',
    handler: () => { /* your code */ },
    allowedRoles: ['admin'],
  }
];
```

### Want to Add a New Hook?

**Edit:** `resources/js/app/hooks/useShortcuts.ts`

```typescript
export const useMyCustomHook = (options) => {
  // Your custom hook logic
  useShortcutBase(shortcut, handler, options);
};
```

### Want to Add a New Utility?

**Edit:** `resources/js/app/utils/shortcuts.ts` or `clipboard.ts`

```typescript
export const myNewUtility = () => {
  // Your utility logic
};
```

---

## Performance Characteristics

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Shortcut registration | O(1) | Per shortcut |
| Shortcut lookup | O(1) | Hash map |
| Permission check | O(1) | Memoized |
| Fuzzy search | O(n) | n = number of commands |
| Context check | O(1) | DOM queries cached |

**Memory Usage:**
- ~50KB for shortcut system
- ~100KB for Command Palette UI
- ~50KB for Help Overlay UI
- **Total: ~200KB** (negligible for modern apps)

---

## Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Basic shortcuts | ✅ | ✅ | ✅ | ✅ |
| Clipboard API | ✅ | ✅ | ✅ | ✅ |
| Command Palette | ✅ | ✅ | ✅ | ✅ |
| Help Overlay | ✅ | ✅ | ✅ | ✅ |
| ARIA support | ✅ | ✅ | ✅ | ✅ |

**Minimum versions:**
- Chrome 76+
- Edge 79+
- Firefox 68+
- Safari 13.1+

---

## Summary

This architecture provides:

✅ **Separation of Concerns** - Each layer has a clear purpose
✅ **Extensibility** - Easy to add new shortcuts without refactoring
✅ **Type Safety** - Full TypeScript coverage
✅ **Performance** - Optimized for minimal overhead
✅ **Security** - Multi-layer permission checks
✅ **Maintainability** - Centralized configuration
✅ **Testability** - Pure functions, mockable hooks
✅ **Accessibility** - Built-in from the ground up

---

**Last Updated:** 2025-12-19
