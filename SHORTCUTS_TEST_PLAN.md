# Shortcut System Regression Test Plan

This document is a practical, step-by-step test sheet for verifying the refactored keyboard shortcut system across roles, pages, modals, and input contexts.

## Legend

- **Scope**
  - **Global**: anywhere in the app
  - **Layout**: within a layout shell (admin/employee/customer)
  - **Page**: page-specific
  - **Modal**: while a modal is open
  - **Table**: when a data table/grid is active
  - **Form**: within a form

- **Roles**
  - `admin`, `employee`, `customer` (plus `super-admin`/`manager` if present)

## 1) Global behavior & StrictMode

- **StrictMode double-mount safety**
  - **Step**: Run dev build (React 18 StrictMode) and reload the app.
  - **Verify**:
    - No duplicate hotkey behavior (e.g. no double open/close on a single press).
    - No recurring console warnings about handler duplication.

- **Native browser shortcuts**
  - **Step**: Press:
    - `Ctrl+L`, `Ctrl+T`, `Ctrl+W`, `Ctrl+R`, `Ctrl+Shift+T`, `Alt+Left/Right`
  - **Verify**: Browser behavior remains normal.

## 2) Global shortcuts (all pages, all roles)

| Shortcut | Action | Scope | Notes |
|---|---|---|---|
| `mod+k` | Toggle Command Palette | Global | System shortcut; should work even when inputs are focused |
| `Shift+/` | Toggle Help Overlay | Global | Should not trigger while typing in inputs |
| `mod+/` | Focus nearest search input | Global | Focuses a matching input if one exists |
| `mod+shift+q` | Logout (confirm) | Global | Should prompt confirmation |

### Tests

- **Command Palette**
  - Open: `mod+k`
  - Close: `Escape`
  - Toggle: `mod+k` again

- **Help Overlay**
  - Open/toggle: `Shift+/`
  - Close: `Escape`

- **Input protection**
  - Focus a text input and type.
  - Press `Shift+/`.
  - **Verify**: The `?` character is typed and the help overlay does not open.

## 3) Command Palette (mod+k)

- **Open/close & focus**
  - **Step**: Press `mod+k`.
  - **Verify**:
    - Palette opens once.
    - Input is focused.

- **Keyboard navigation**
  - **Step**: With palette open:
    - `ArrowDown` / `ArrowUp` to change selection
    - `Enter` to run selected command
    - `Escape` to close
  - **Verify**:
    - Selection changes correctly.
    - The selected item scrolls into view.
    - `Enter` executes exactly once.

- **Role/permission filtering**
  - **Step**: Log in as different roles.
  - **Verify**:
    - Commands restricted by `allowedRoles` are not visible for other roles.
    - Commands depending on backend permission slugs only appear when `auth.user.permissions` contains the required slug.

## 4) Help Overlay (Shift+/)

- **Open/close**
  - **Step**: `Shift+/` to open.
  - **Verify**:
    - Overlay opens.
    - `Escape` closes.

- **Content correctness**
  - **Verify**:
    - Only shortcuts that are available for the current user (role/permission) are displayed.
    - Categories are grouped and ordered correctly.

## 5) GlobalSearch (mod+shift+k)

> GlobalSearch now uses `mod+shift+k` to avoid conflicting with the Command Palette.

- **Toggle**
  - **Step**: Press `mod+shift+k`.
  - **Verify**:
    - GlobalSearch opens.
    - Pressing `mod+shift+k` again closes it.

- **Navigation**
  - **Step**: With GlobalSearch open:
    - `ArrowUp` / `ArrowDown`
    - `Enter` to navigate/execute
    - `Escape` to close
  - **Verify**:
    - Enter navigates to the selected item and closes the dialog.

## 6) Admin role pages

### Admin Layout shell

- **Verify**: Global shortcuts work.
- **Verify**: Admin navigation shortcuts (sequence shortcuts like `g d`, `g o`, etc.) work as expected.

### Admin table pages

Pages such as:
- `/admin/orders`
- `/admin/reservations`
- `/admin/menu-items`
- `/admin/inventory`

If table shortcuts are wired on a given page/component, verify:

| Shortcut | Action | Scope |
|---|---|---|
| `mod+a` | Select all | Table |
| `mod+c` | Copy selection | Table |
| `delete` | Delete selection (confirm) | Table |
| `mod+r` | Refresh | Table |

## 7) Employee role pages

### Employee Layout shell

- **Verify**: Global shortcuts work.
- **Verify**: GlobalSearch opens with employee-appropriate navigation items.

### POS page (`/employee/pos`)

| Shortcut | Action | Scope | Notes |
|---|---|---|---|
| `/` | Focus POS search | Page | Should not trigger while typing in inputs |
| `mod+shift+n` | Toggle numpad | Page | Should not trigger while typing in inputs |

#### POS tests

- **`/` focus search**
  - **Step**: Ensure focus is not in an input; press `/`.
  - **Verify**: Search input is focused.

- **Input protection**
  - **Step**: Focus any input; press `/`.
  - **Verify**: `/` types into the input and does not move focus.

- **Numpad toggle**
  - **Step**: Press `mod+shift+n`.
  - **Verify**: Numpad toggles open/closed once per press.

## 8) Customer role pages

### Customer Layout shell

- **Verify**: Global shortcuts work.
- **Verify**: GlobalSearch opens with customer-appropriate navigation items only.

### Customer menu (`/menu`)

- **Verify**: If FoodDetailModal is used, `Escape` closes it.

## 9) Modals (Modal + FoodDetailModal)

- **Escape close**
  - **Step**: Open a modal.
  - **Verify**: `Escape` closes it.

- **Escape while typing**
  - **Step**: Focus an input inside the modal; press `Escape`.
  - **Verify**: Modal closes.

- **Body scroll locking**
  - **Step**: With modal open, try scrolling the page.
  - **Verify**: Background does not scroll.
  - **Step**: Close modal.
  - **Verify**: Background scrolling is restored.

## 10) Backend enforcement sanity check

- **Step**: For an action protected by `permission:some.slug`, try triggering it as a user without that permission.
- **Verify**:
  - Backend returns `403`.
  - Frontend should not show the command/shortcut if it relies on `auth.user.permissions`, but backend must remain authoritative.
