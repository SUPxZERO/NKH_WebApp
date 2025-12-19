/**
 * Keyboard Shortcut System - Central Configuration
 *
 * This is the single source of truth for all keyboard shortcuts in the application.
 * All shortcuts are defined here with their keys, descriptions, roles, and handlers.
 *
 * Architecture:
 * - Shortcuts are organized by scope (global, route, component)
 * - Each shortcut has role-based permissions
 * - Context-aware availability checks
 * - Platform-agnostic key definitions (automatically adapts Ctrl/Cmd)
 */

import { ShortcutDefinition, CommandDefinition } from '@/app/types/shortcuts';
import { router } from '@inertiajs/react';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Settings,
  BarChart3,
  Calendar,
  Clock,
  Search,
  Plus,
  Save,
  X,
  LogOut,
  HelpCircle,
  Command,
  Trash2,
  Edit,
  Copy,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Archive,
  DollarSign,
  Utensils,
  ShoppingBag,
  ClipboardList,
} from 'lucide-react';

/**
 * Platform detection - automatically use Cmd on Mac, Ctrl on Windows/Linux
 */
export const getModKey = (): 'mod' => 'mod'; // react-hotkeys-hook auto-converts

/**
 * GLOBAL SHORTCUTS
 * Active everywhere in the application
 */
export const GLOBAL_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'command-palette',
    binding: {
      key: 'mod+k',
      description: 'Open command palette',
    },
    category: 'system',
    scope: 'global',
    handler: () => {
      // Handler will be set dynamically by CommandPalette component
    },
    enabled: true,
    priority: 100,
    preventDefault: true,
    group: 'System',
    icon: Command,
  },
  {
    id: 'help',
    binding: {
      key: 'shift+/',
      description: 'Show keyboard shortcuts',
    },
    category: 'system',
    scope: 'global',
    handler: () => {
      // Handler will be set dynamically by HelpOverlay component
    },
    enabled: true,
    priority: 100,
    preventDefault: true,
    group: 'System',
    icon: HelpCircle,
  },
  {
    id: 'search',
    binding: {
      key: 'mod+/',
      description: 'Focus search bar',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input[type="search"], input[placeholder*="Search" i], input[placeholder*="search" i]'
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    enabled: true,
    preventDefault: true,
    group: 'Navigation',
    icon: Search,
  },
  {
    id: 'logout',
    binding: {
      key: 'mod+shift+q',
      description: 'Logout',
    },
    category: 'system',
    scope: 'global',
    handler: () => {
      if (confirm('Are you sure you want to logout?')) {
        router.post('/logout');
      }
    },
    enabled: true,
    preventDefault: true,
    requiresConfirmation: true,
    confirmationMessage: 'Are you sure you want to logout?',
    group: 'System',
    icon: LogOut,
  },
];

/**
 * NAVIGATION SHORTCUTS (ADMIN)
 * Quick navigation between admin pages
 */
export const ADMIN_NAVIGATION_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'nav-dashboard',
    binding: {
      key: 'g d',
      description: 'Go to Dashboard',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/dashboard'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation',
    icon: Home,
  },
  {
    id: 'nav-orders',
    binding: {
      key: 'g o',
      description: 'Go to Orders',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/orders'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation',
    icon: ShoppingCart,
  },
  {
    id: 'nav-menu-items',
    binding: {
      key: 'g m',
      description: 'Go to Menu Items',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/menu-items'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation',
    icon: Utensils,
  },
  {
    id: 'nav-inventory',
    binding: {
      key: 'g i',
      description: 'Go to Inventory',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/inventory'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation',
    icon: Package,
  },
  {
    id: 'nav-employees',
    binding: {
      key: 'g e',
      description: 'Go to Employees',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/employees'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation',
    icon: Users,
  },
  {
    id: 'nav-reports',
    binding: {
      key: 'g r',
      description: 'Go to Reports',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/sales-analytics'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation',
    icon: BarChart3,
  },
  {
    id: 'nav-customers',
    binding: {
      key: 'g c',
      description: 'Go to Customers',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/customers'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation',
    icon: Users,
  },
  {
    id: 'nav-settings',
    binding: {
      key: 'g s',
      description: 'Go to Settings',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/settings'),
    allowedRoles: ['admin', 'super-admin'],
    group: 'Navigation',
    icon: Settings,
  },
];

/**
 * EMPLOYEE NAVIGATION SHORTCUTS
 */
export const EMPLOYEE_NAVIGATION_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'nav-pos',
    binding: {
      key: 'g p',
      description: 'Go to POS',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/employee/pos'),
    allowedRoles: ['employee'],
    group: 'Navigation',
    icon: ShoppingBag,
  },
  {
    id: 'nav-kitchen',
    binding: {
      key: 'g k',
      description: 'Go to Kitchen Display',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/employee/kitchen'),
    allowedRoles: ['employee'],
    group: 'Navigation',
    icon: Utensils,
  },
  {
    id: 'nav-schedule',
    binding: {
      key: 'g s',
      description: 'Go to Schedule',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/employee/schedule'),
    allowedRoles: ['employee'],
    group: 'Navigation',
    icon: Calendar,
  },
  {
    id: 'nav-time-clock',
    binding: {
      key: 'g t',
      description: 'Go to Time Clock',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/employee/time-clock'),
    allowedRoles: ['employee'],
    group: 'Navigation',
    icon: Clock,
  },
];

/**
 * CUSTOMER NAVIGATION SHORTCUTS
 */
export const CUSTOMER_NAVIGATION_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'nav-menu',
    binding: {
      key: 'g m',
      description: 'Go to Menu',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/menu'),
    allowedRoles: ['customer'],
    group: 'Navigation',
    icon: Utensils,
  },
  {
    id: 'nav-cart',
    binding: {
      key: 'g c',
      description: 'Go to Cart',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/cart'),
    allowedRoles: ['customer'],
    group: 'Navigation',
    icon: ShoppingCart,
  },
  {
    id: 'nav-orders-customer',
    binding: {
      key: 'g o',
      description: 'Go to My Orders',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/customer/orders'),
    allowedRoles: ['customer'],
    group: 'Navigation',
    icon: ClipboardList,
  },
];

/**
 * MODAL SHORTCUTS
 * Active when modals are open
 */
export const MODAL_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'modal-close',
    binding: {
      key: 'escape',
      description: 'Close modal',
    },
    category: 'modals',
    scope: 'modal',
    handler: () => {
      // Handler set dynamically by modal components
    },
    enabled: true,
    preventDefault: true,
    group: 'Modals',
    icon: X,
  },
  {
    id: 'modal-confirm',
    binding: {
      key: 'mod+enter',
      description: 'Confirm action',
    },
    category: 'modals',
    scope: 'modal',
    handler: () => {
      // Handler set dynamically by modal components
    },
    enabled: true,
    preventDefault: true,
    group: 'Modals',
    icon: Save,
  },
];

/**
 * FORM SHORTCUTS
 * Active on form pages
 */
export const FORM_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'form-save',
    binding: {
      key: 'mod+s',
      description: 'Save form',
    },
    category: 'forms',
    scope: 'component',
    handler: () => {
      // Handler set dynamically by form components
    },
    preventDefault: true,
    group: 'Forms',
    icon: Save,
  },
  {
    id: 'form-submit',
    binding: {
      key: 'mod+enter',
      description: 'Submit form',
    },
    category: 'forms',
    scope: 'component',
    handler: () => {
      // Handler set dynamically by form components
    },
    preventDefault: true,
    group: 'Forms',
    icon: Save,
  },
  {
    id: 'form-cancel',
    binding: {
      key: 'escape',
      description: 'Cancel form',
    },
    category: 'forms',
    scope: 'component',
    handler: () => {
      // Handler set dynamically by form components
    },
    preventDefault: true,
    group: 'Forms',
    icon: X,
  },
];

/**
 * TABLE SHORTCUTS
 * Active on data table pages
 */
export const TABLE_SHORTCUTS: CommandDefinition[] = [
  {
    id: 'table-select-all',
    binding: {
      key: 'mod+a',
      description: 'Select all rows',
    },
    category: 'tables',
    scope: 'component',
    handler: () => {
      // Handler set dynamically by table components
    },
    preventDefault: true,
    group: 'Tables',
    icon: Copy,
    showInPalette: false,
  },
  {
    id: 'table-copy',
    binding: {
      key: 'mod+c',
      description: 'Copy selected rows',
    },
    category: 'clipboard',
    scope: 'component',
    handler: () => {
      // Handler set dynamically by table components
    },
    preventDefault: true,
    group: 'Tables',
    icon: Copy,
    showInPalette: false,
  },
  {
    id: 'table-delete',
    binding: {
      key: 'delete',
      altKey: 'backspace',
      description: 'Delete selected rows',
    },
    category: 'tables',
    scope: 'component',
    handler: () => {
      // Handler set dynamically by table components
    },
    requiresConfirmation: true,
    group: 'Tables',
    icon: Trash2,
    showInPalette: false,
  },
  {
    id: 'table-refresh',
    binding: {
      key: 'mod+r',
      description: 'Refresh table data',
    },
    category: 'tables',
    scope: 'component',
    handler: () => {
      // Handler set dynamically by table components
    },
    preventDefault: true,
    group: 'Tables',
    icon: RefreshCw,
    showInPalette: false,
  },
];

/**
 * COMMAND PALETTE COMMANDS
 * Commands that appear in palette but may not have shortcuts
 */
export const PALETTE_COMMANDS: CommandDefinition[] = [
  {
    id: 'create-order',
    category: 'actions',
    scope: 'global',
    handler: () => {
      // Navigate to create order page or open modal
    },
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'order'],
    showInPalette: true,
    allowedRoles: ['admin', 'employee', 'super-admin', 'manager'],
  },
  {
    id: 'create-menu-item',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/menu-items?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'menu', 'item', 'food'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'create-employee',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/employees?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'employee', 'staff', 'user'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
];

/**
 * Aggregate all shortcuts for export
 */
export const ALL_SHORTCUTS: (ShortcutDefinition | CommandDefinition)[] = [
  ...GLOBAL_SHORTCUTS,
  ...ADMIN_NAVIGATION_SHORTCUTS,
  ...EMPLOYEE_NAVIGATION_SHORTCUTS,
  ...CUSTOMER_NAVIGATION_SHORTCUTS,
  ...MODAL_SHORTCUTS,
  ...FORM_SHORTCUTS,
  ...TABLE_SHORTCUTS,
  ...PALETTE_COMMANDS,
];

/**
 * Shortcut registry configuration
 */
export const SHORTCUT_CONFIG = {
  debug: false,
  disabled: false,
  modKey: getModKey(),
};
