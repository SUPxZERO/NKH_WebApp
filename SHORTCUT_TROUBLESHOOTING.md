# Keyboard Shortcuts - Troubleshooting Guide

## ✅ Issue Fixed: "usePage must be used within the Inertia component"

### Problem
When the app first loaded, you saw this error:
```
Error: usePage must be used within the Inertia component
    at HelpOverlay
    at CommandPalette
```

### Root Cause
The `CommandPalette` and `HelpOverlay` components were using `useAuth()` hook, which internally calls Inertia's `usePage()`. However, these components are rendered at the app provider level, before Inertia is fully initialized.

### Solution Applied ✅
Both components now directly use `usePage()` from `@inertiajs/react` to access the user:

**Before (caused error):**
```typescript
import { useAuth } from '@/app/hooks/useAuth';

export const CommandPalette = () => {
  const { user } = useAuth(); // ❌ Error: useAuth calls usePage
  // ...
};
```

**After (fixed):**
```typescript
import { usePage } from '@inertiajs/react';

export const CommandPalette = () => {
  const { props } = usePage();
  const user = props.auth?.user || null; // ✅ Works correctly
  // ...
};
```

### Files Modified
1. `resources/js/app/components/shortcuts/CommandPalette.tsx`
2. `resources/js/app/components/shortcuts/HelpOverlay.tsx`

---

## Common Issues & Solutions

### Issue 1: Shortcuts Not Working

**Symptom:** Pressing keyboard shortcuts does nothing.

**Possible Causes & Solutions:**

1. **You're focused on an input field**
   - **Expected behavior:** Most shortcuts are intentionally disabled in input fields
   - **Exception:** Form shortcuts (Cmd+S, Cmd+Enter, Esc) work everywhere
   - **Solution:** Click outside the input field and try again

2. **Shortcut not available for your role**
   - Press **Shift+?** to see all shortcuts available to you
   - If a shortcut isn't listed, you don't have permission

3. **Browser extension conflict**
   - Some extensions override keyboard shortcuts
   - Try disabling extensions or use incognito mode
   - Example: Vimium, LastPass, Grammarly

4. **JavaScript error**
   - Open browser console (F12)
   - Look for red error messages
   - Report any shortcut-related errors

### Issue 2: Command Palette Not Opening (Cmd/Ctrl+K)

**Symptom:** Nothing happens when pressing Cmd+K or Ctrl+K.

**Solutions:**

1. **Check if another app is using the shortcut**
   - Mac: System Preferences → Keyboard → Shortcuts
   - Windows: Some apps override Ctrl+K
   - Try using the alternative: Click a "Command Palette" button if added to UI

2. **Check browser console**
   - Press F12 → Console tab
   - Look for errors related to "CommandPalette"

3. **Verify component is mounted**
   - Check `AppProviders.tsx` includes `<CommandPalette />`

### Issue 3: Help Overlay Not Opening (Shift+?)

**Symptom:** Nothing happens when pressing Shift+?.

**Solutions:**

1. **Make sure you're pressing Shift+/ (which types "?")**
   - On some keyboards, this might be different
   - Try just pressing "?" key

2. **Check browser console for errors**

3. **Verify component is mounted**
   - Check `AppProviders.tsx` includes `<HelpOverlay />`

### Issue 4: Shortcuts Execute Twice

**Symptom:** Action happens twice when pressing shortcut once.

**Possible Causes:**

1. **Duplicate registration**
   - Check if you're calling `useGlobalHotkeys()` multiple times
   - Ensure hooks are only called once per component

2. **Component rendered twice (React Strict Mode)**
   - In development, React Strict Mode renders components twice
   - This is normal and won't happen in production
   - Handlers should be idempotent

**Solution:**
```typescript
// ❌ Bad - registering twice
function MyComponent() {
  useGlobalHotkeys(GLOBAL_SHORTCUTS);
  useGlobalHotkeys(ADMIN_SHORTCUTS); // If these overlap, duplicate!
}

// ✅ Good - merge first
function MyComponent() {
  const allShortcuts = [...GLOBAL_SHORTCUTS, ...ADMIN_SHORTCUTS];
  useGlobalHotkeys(allShortcuts);
}
```

### Issue 5: TypeScript Errors

**Symptom:** Build fails with TypeScript errors in shortcut files.

**Solutions:**

1. **Missing type imports**
   ```typescript
   import { ShortcutDefinition } from '@/app/types/shortcuts';
   ```

2. **Type mismatch**
   - Ensure handler returns `void` or `Promise<void>`
   - Check `allowedRoles` is an array of valid role strings

3. **Run type check**
   ```bash
   npm run build
   ```

### Issue 6: Clipboard Copy Not Working

**Symptom:** "Failed to copy to clipboard" toast message.

**Possible Causes:**

1. **Clipboard API not available**
   - Requires HTTPS (or localhost)
   - Not available in some browsers
   - Check browser console for security errors

2. **Browser denied clipboard permission**
   - Browser → Settings → Site Settings → Clipboard
   - Allow clipboard access for your domain

3. **No data selected**
   - Ensure you've selected rows before pressing Cmd+C

**Solutions:**
- Use HTTPS in production
- Test on localhost for development
- Check browser clipboard permissions

### Issue 7: Shortcuts Conflict with Native Browser Shortcuts

**Symptom:** Browser action happens instead of app shortcut.

**Examples:**
- Cmd+T opens new tab instead of your action
- Cmd+N opens new window instead of your action

**Solutions:**

1. **Use different key combinations**
   - Avoid common browser shortcuts
   - Use sequence shortcuts (G+D) instead of modifier shortcuts

2. **Set `preventDefault: true` in shortcut definition**
   ```typescript
   {
     id: 'my-action',
     binding: { key: 'mod+t', description: 'My action' },
     handler: () => { /* ... */ },
     preventDefault: true, // ← Add this
   }
   ```

3. **Choose better shortcuts**
   - Sequence shortcuts are safer: G+D, G+O
   - Double modifiers: Cmd+Shift+X

### Issue 8: Memory Leak / Component Not Unmounting

**Symptom:** Shortcuts continue to work after component unmounts.

**Solution:**
Always use hooks, never raw event listeners:

```typescript
// ❌ Bad - manual listener (memory leak)
useEffect(() => {
  const handler = () => { /* ... */ };
  document.addEventListener('keydown', handler);
  // Missing cleanup!
}, []);

// ✅ Good - use hook (auto cleanup)
useComponentHotkeys(
  MY_SHORTCUTS,
  {
    'my-action': handleAction,
  }
);
```

### Issue 9: Role-Based Filtering Not Working

**Symptom:** User sees shortcuts they shouldn't have access to.

**Solutions:**

1. **Check user role is set correctly**
   ```typescript
   console.log(user?.role); // Should be 'admin', 'employee', or 'customer'
   ```

2. **Verify `allowedRoles` array**
   ```typescript
   {
     id: 'admin-only',
     allowedRoles: ['admin', 'super-admin'], // ← Check this
   }
   ```

3. **Check permission function**
   ```typescript
   {
     id: 'custom-permission',
     permission: (user) => user.hasPermission('orders.approve'),
   }
   ```

### Issue 10: Sequence Shortcuts Not Working (G+D, G+O)

**Symptom:** Pressing G then D doesn't navigate.

**Solutions:**

1. **Press keys quickly (within 1 second)**
   - Sequence shortcuts have a timeout
   - Press G, then immediately press D

2. **Don't hold keys down**
   - Press and release G
   - Then press and release D

3. **Check if you're in an input field**
   - Sequence shortcuts are disabled in input fields

---

## Performance Issues

### Issue: App Feels Slow After Adding Shortcuts

**This should NOT happen!** If it does:

1. **Check browser console for errors**
   - Errors in handlers can slow down the app

2. **Avoid expensive operations in handlers**
   ```typescript
   // ❌ Bad - expensive operation
   handler: () => {
     const result = heavyComputation(); // Blocks UI
     doSomething(result);
   }

   // ✅ Good - async operation
   handler: async () => {
     const result = await heavyComputationAsync(); // Non-blocking
     doSomething(result);
   }
   ```

3. **Check for infinite loops**
   - Ensure handlers don't trigger state updates that re-register shortcuts

---

## Browser-Specific Issues

### Chrome/Edge
- ✅ Full support
- No known issues

### Firefox
- ✅ Full support
- No known issues

### Safari
- ✅ Mostly works
- Some clipboard operations may require extra permission

### Mobile Browsers
- ⚠️ Keyboard shortcuts disabled (no keyboard!)
- Command Palette can still be triggered via UI button if added

---

## Development vs Production

### Development (npm run dev)
- React Strict Mode may cause double renders
- Hot reload preserves shortcut state
- DevTools available for debugging

### Production (npm run build)
- Optimized bundle
- No double renders
- Smaller payload

---

## Debug Mode

Enable debug logging:

```typescript
// In your component
import { useComponentHotkeys } from '@/app/hooks/useShortcuts';

useComponentHotkeys(
  shortcuts,
  handlers,
  { debug: true } // ← Enable debug mode
);
```

This logs:
- Shortcut registrations
- Execution attempts
- Context blocks
- Permission checks

---

## Getting Help

If you encounter an issue not listed here:

1. **Check browser console** (F12 → Console)
2. **Test in incognito mode** (rules out extensions)
3. **Try different browser** (rules out browser-specific issues)
4. **Read full documentation** (`KEYBOARD_SHORTCUTS.md`)
5. **Check source code** (`resources/js/app/hooks/useShortcuts.ts`)

---

## Reporting Bugs

When reporting a bug, include:

1. **What you expected:** "Pressing Cmd+K should open command palette"
2. **What happened:** "Nothing happened"
3. **Browser & OS:** "Chrome 120 on macOS"
4. **User role:** "Admin"
5. **Console errors:** Copy any error messages
6. **Steps to reproduce:**
   - Go to /admin/orders
   - Press Cmd+K
   - Nothing happens

---

## Common Misconceptions

### ❌ "Shortcuts don't work in input fields - is this a bug?"
✅ **No, this is intentional!** We never want to interfere with typing. Exception: Form shortcuts (Cmd+S, Cmd+Enter) are designed to work everywhere.

### ❌ "I added a shortcut but it doesn't appear in Command Palette"
✅ **Check `showInPalette: true`** in your shortcut definition. Also verify `allowedRoles` includes your role.

### ❌ "Why does Cmd+T still open a new tab?"
✅ **Some browser shortcuts can't be overridden** for security reasons. Use different key combinations or sequence shortcuts (G+D).

### ❌ "Shortcuts are slow to register"
✅ **Shortcuts register instantly.** If there's a delay, check for:
- Expensive operations in handlers
- Network requests blocking the UI
- JavaScript errors in console

---

## Quick Diagnostic Checklist

Copy this and check off as you debug:

- [ ] Browser console has no errors (F12)
- [ ] Not focused on an input field
- [ ] User has correct role for shortcut
- [ ] Shortcut appears in Help Overlay (Shift+?)
- [ ] No browser extensions interfering
- [ ] Using correct modifier key (Cmd on Mac, Ctrl on Windows)
- [ ] Pressing keys in correct sequence/combination
- [ ] Component is mounted and visible
- [ ] No infinite loops in handlers

---

**Last Updated:** 2025-12-19
**Version:** 1.0.0
