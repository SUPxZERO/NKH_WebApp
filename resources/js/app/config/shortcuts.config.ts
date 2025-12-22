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
  Download,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Percent,
  CreditCard,
  Building,
  MapPin,
  Shield,
  Bell,
  FolderTree,
  Table2,
  ChefHat,
  Receipt,
  Truck,
  AlertTriangle,
  UserCog,
  Languages,
  Bookmark,
  ClipboardCheck,
  Layers,
  Eye,
  Award,
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
 * NAVIGATION SHORTCUTS (ADMIN) - PRIMARY
 * Most frequently used admin pages
 */
export const ADMIN_NAVIGATION_SHORTCUTS: ShortcutDefinition[] = [
  // Primary navigation (most used)
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
    keywords: ['home', 'main', 'overview'],
    showInPalette: true,
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
    keywords: ['orders', 'sales', 'transactions'],
    showInPalette: true,
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
    keywords: ['menu', 'food', 'dishes', 'products'],
    showInPalette: true,
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
    keywords: ['stock', 'warehouse', 'storage'],
    showInPalette: true,
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
    keywords: ['staff', 'team', 'workers'],
    showInPalette: true,
  },
  {
    id: 'nav-reports',
    binding: {
      key: 'g r',
      description: 'Go to Reports / Analytics',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/sales-analytics'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation',
    icon: BarChart3,
    keywords: ['analytics', 'statistics', 'reports', 'charts'],
    showInPalette: true,
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
    keywords: ['clients', 'users', 'guests'],
    showInPalette: true,
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
    keywords: ['preferences', 'configuration', 'options'],
    showInPalette: true,
  },
];

/**
 * EXTENDED NAVIGATION SHORTCUTS (ADMIN)
 * All other admin pages with g + letter sequences
 */
export const ADMIN_EXTENDED_NAVIGATION_SHORTCUTS: ShortcutDefinition[] = [
  // Financial & Payments
  {
    id: 'nav-financial',
    binding: {
      key: 'g f',
      description: 'Go to Financial Dashboard',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/financial-dashboard'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Financial',
    icon: DollarSign,
    keywords: ['finance', 'money', 'revenue', 'profit'],
    showInPalette: true,
  },
  {
    id: 'nav-payments',
    binding: {
      key: 'g p',
      description: 'Go to Payments Dashboard',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/payments'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Financial',
    icon: CreditCard,
    keywords: ['transactions', 'payment', 'billing'],
    showInPalette: true,
  },
  {
    id: 'nav-invoices',
    binding: {
      key: 'g v',
      description: 'Go to Invoices',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/invoices'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Financial',
    icon: Receipt,
    keywords: ['bills', 'receipts'],
    showInPalette: true,
  },
  {
    id: 'nav-expenses',
    binding: {
      key: 'g x',
      description: 'Go to Expenses',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/expenses'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Financial',
    icon: Receipt,
    keywords: ['costs', 'spending'],
    showInPalette: true,
  },
  // Staff Management
  {
    id: 'nav-shifts',
    binding: {
      key: 'g h',
      description: 'Go to Shifts / Schedule',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/shifts'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Staff',
    icon: Calendar,
    keywords: ['schedule', 'timetable', 'roster'],
    showInPalette: true,
  },
  {
    id: 'nav-positions',
    binding: {
      key: 'g j',
      description: 'Go to Positions',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/positions'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Staff',
    icon: UserCog,
    keywords: ['roles', 'jobs', 'titles'],
    showInPalette: true,
  },
  {
    id: 'nav-time-off',
    binding: {
      key: 'g t',
      description: 'Go to Time Off Requests',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/time-off-requests'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Staff',
    icon: Clock,
    keywords: ['leave', 'vacation', 'pto'],
    showInPalette: true,
  },
  // Inventory & Supply Chain
  {
    id: 'nav-ingredients',
    binding: {
      key: 'g n',
      description: 'Go to Ingredients',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/ingredients'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Inventory',
    icon: Package,
    keywords: ['raw materials', 'supplies'],
    showInPalette: true,
  },
  {
    id: 'nav-recipes',
    binding: {
      key: 'g b',
      description: 'Go to Recipes',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/recipes'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Inventory',
    icon: ChefHat,
    keywords: ['preparations', 'cooking'],
    showInPalette: true,
  },
  {
    id: 'nav-suppliers',
    binding: {
      key: 'g u',
      description: 'Go to Suppliers',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/suppliers'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Inventory',
    icon: Truck,
    keywords: ['vendors', 'providers'],
    showInPalette: true,
  },
  {
    id: 'nav-purchase-orders',
    binding: {
      key: 'g q',
      description: 'Go to Purchase Orders',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/purchase-orders'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Inventory',
    icon: ClipboardList,
    keywords: ['po', 'procurement'],
    showInPalette: true,
  },
  {
    id: 'nav-stock-alerts',
    binding: {
      key: 'g a',
      description: 'Go to Stock Alerts',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/stock-alerts'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Inventory',
    icon: AlertTriangle,
    keywords: ['low stock', 'warnings'],
    showInPalette: true,
  },
  // Restaurant Layout
  {
    id: 'nav-categories',
    binding: {
      key: 'g g',
      description: 'Go to Categories',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/categories'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Menu',
    icon: FolderTree,
    keywords: ['groups', 'sections'],
    showInPalette: true,
  },
  {
    id: 'nav-tables',
    binding: {
      key: 'g w',
      description: 'Go to Tables',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/tables'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Restaurant',
    icon: Table2,
    keywords: ['seating', 'dining'],
    showInPalette: true,
  },
  {
    id: 'nav-floors',
    binding: {
      key: 'g l',
      description: 'Go to Floors',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/floors'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Restaurant',
    icon: Layers,
    keywords: ['levels', 'layout'],
    showInPalette: true,
  },
  {
    id: 'nav-locations',
    binding: {
      key: 'g z',
      description: 'Go to Locations',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/locations'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Restaurant',
    icon: MapPin,
    keywords: ['branches', 'stores'],
    showInPalette: true,
  },
  // Reservations & Promotions
  {
    id: 'nav-reservations',
    binding: {
      key: 'g 1',
      description: 'Go to Reservations',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/reservations'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Bookings',
    icon: Bookmark,
    keywords: ['bookings', 'appointments'],
    showInPalette: true,
  },
  {
    id: 'nav-promotions',
    binding: {
      key: 'g 2',
      description: 'Go to Promotions',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/promotions'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Marketing',
    icon: Percent,
    keywords: ['discounts', 'coupons', 'deals'],
    showInPalette: true,
  },
  {
    id: 'nav-loyalty',
    binding: {
      key: 'g 3',
      description: 'Go to Loyalty Points',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/loyalty-points'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Marketing',
    icon: Award,
    keywords: ['rewards', 'points'],
    showInPalette: true,
  },
  // System Administration
  {
    id: 'nav-admins',
    binding: {
      key: 'g 4',
      description: 'Go to Admins',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/admins'),
    allowedRoles: ['super-admin'],
    group: 'Navigation - System',
    icon: Shield,
    keywords: ['administrators', 'super users'],
    showInPalette: true,
  },
  {
    id: 'nav-roles',
    binding: {
      key: 'g 5',
      description: 'Go to Roles & Permissions',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/roles'),
    allowedRoles: ['super-admin'],
    group: 'Navigation - System',
    icon: Shield,
    keywords: ['permissions', 'access'],
    showInPalette: true,
  },
  {
    id: 'nav-audit-logs',
    binding: {
      key: 'g 6',
      description: 'Go to Audit Logs',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/audit-logs'),
    allowedRoles: ['super-admin', 'admin'],
    group: 'Navigation - System',
    icon: ClipboardCheck,
    keywords: ['activity', 'history', 'logs'],
    showInPalette: true,
  },
  {
    id: 'nav-notifications',
    binding: {
      key: 'g 7',
      description: 'Go to Notifications',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/notifications'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - System',
    icon: Bell,
    keywords: ['alerts', 'messages'],
    showInPalette: true,
  },
  {
    id: 'nav-translations',
    binding: {
      key: 'g 8',
      description: 'Go to Translations',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/translations'),
    allowedRoles: ['super-admin'],
    group: 'Navigation - System',
    icon: Languages,
    keywords: ['languages', 'localization', 'i18n'],
    showInPalette: true,
  },
  {
    id: 'nav-units',
    binding: {
      key: 'g 9',
      description: 'Go to Units',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/units'),
    allowedRoles: ['admin', 'super-admin'],
    group: 'Navigation - System',
    icon: Layers,
    keywords: ['measurements', 'uom'],
    showInPalette: true,
  },
  {
    id: 'nav-operating-hours',
    binding: {
      key: 'g 0',
      description: 'Go to Operating Hours',
    },
    category: 'navigation',
    scope: 'global',
    handler: () => router.visit('/admin/operating-hours'),
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Navigation - Restaurant',
    icon: Clock,
    keywords: ['business hours', 'schedule'],
    showInPalette: true,
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
  // More create actions for common pages
  {
    id: 'create-category',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/categories?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'category', 'group'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'create-reservation',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/reservations?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'reservation', 'booking', 'table'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'create-shift',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/shifts?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'shift', 'schedule', 'roster'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'create-promotion',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/promotions?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'promotion', 'discount', 'coupon'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'create-ingredient',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/ingredients?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'ingredient', 'raw material'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'create-supplier',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/suppliers?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'supplier', 'vendor'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'create-purchase-order',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/purchase-orders?action=create'),
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add', 'purchase', 'order', 'po'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  // Export actions for dashboards
  {
    id: 'export-financial-pdf',
    category: 'actions',
    scope: 'global',
    handler: () => {
      // Navigate to financial dashboard with export trigger
      router.visit('/admin/financial-dashboard?export=pdf');
    },
    group: 'Actions',
    icon: Download,
    keywords: ['export', 'pdf', 'financial', 'report', 'download'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'export-sales-excel',
    category: 'actions',
    scope: 'global',
    handler: () => {
      router.visit('/admin/sales-analytics?export=excel');
    },
    group: 'Actions',
    icon: Download,
    keywords: ['export', 'excel', 'sales', 'analytics', 'download'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  // Quick views
  {
    id: 'view-pending-orders',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/orders?status=pending'),
    group: 'Quick View',
    icon: Eye,
    keywords: ['pending', 'orders', 'view', 'filter'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'view-today-reservations',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/reservations?date=today'),
    group: 'Quick View',
    icon: Eye,
    keywords: ['today', 'reservations', 'bookings', 'view'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
  {
    id: 'view-low-stock',
    category: 'actions',
    scope: 'global',
    handler: () => router.visit('/admin/stock-alerts?filter=low'),
    group: 'Quick View',
    icon: AlertTriangle,
    keywords: ['low', 'stock', 'alerts', 'inventory', 'view'],
    showInPalette: true,
    allowedRoles: ['admin', 'super-admin', 'manager'],
  },
];

/**
 * PAGE-SPECIFIC ACTION SHORTCUTS
 * These are shortcuts that trigger actions on particular admin pages
 */
export const ADMIN_PAGE_ACTION_SHORTCUTS: ShortcutDefinition[] = [
  // Universal create new item shortcut (works on most pages)
  {
    id: 'action-create-new',
    binding: {
      key: 'n',
      description: 'Create new item',
    },
    category: 'actions',
    scope: 'route',
    handler: () => {
      // Trigger click on any Add/Create/New button on the current page
      const createBtn = document.querySelector<HTMLButtonElement>(
        'button[aria-label*="Add"], button[aria-label*="Create"], button[aria-label*="New"], ' +
        'button:has(.lucide-plus), [data-action="create"]'
      );
      if (createBtn) {
        createBtn.click();
      }
    },
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Actions',
    icon: Plus,
    keywords: ['new', 'create', 'add'],
    showInPalette: true,
  },
  // Refresh page data
  {
    id: 'action-refresh',
    binding: {
      key: 'r',
      description: 'Refresh data',
    },
    category: 'actions',
    scope: 'route',
    handler: () => {
      // Trigger a page reload or refetch
      const refreshBtn = document.querySelector<HTMLButtonElement>(
        'button[aria-label*="Refresh"], button:has(.lucide-refresh-cw), [data-action="refresh"]'
      );
      if (refreshBtn) {
        refreshBtn.click();
      } else {
        // Fallback: reload current page
        router.reload();
      }
    },
    allowedRoles: ['admin', 'super-admin', 'manager', 'employee'],
    group: 'Actions',
    icon: RefreshCw,
    keywords: ['refresh', 'reload', 'update'],
    showInPalette: true,
  },
  // Toggle filter panel
  {
    id: 'action-toggle-filter',
    binding: {
      key: 'f',
      description: 'Toggle filters',
    },
    category: 'actions',
    scope: 'route',
    handler: () => {
      const filterBtn = document.querySelector<HTMLButtonElement>(
        'button[aria-label*="Filter"], button:has(.lucide-filter), [data-action="filter"]'
      );
      if (filterBtn) {
        filterBtn.click();
      }
    },
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Actions',
    icon: Eye,
    keywords: ['filter', 'search', 'find'],
    showInPalette: true,
  },
  // Export current view
  {
    id: 'action-export',
    binding: {
      key: 'e',
      description: 'Export data',
    },
    category: 'actions',
    scope: 'route',
    handler: () => {
      const exportBtn = document.querySelector<HTMLButtonElement>(
        'button[aria-label*="Export"], button[aria-label*="Download"], ' +
        'button:has(.lucide-download), [data-action="export"]'
      );
      if (exportBtn) {
        exportBtn.click();
      }
    },
    allowedRoles: ['admin', 'super-admin', 'manager'],
    group: 'Actions',
    icon: Download,
    keywords: ['export', 'download', 'save'],
    showInPalette: true,
  },
];

/**
 * Aggregate all shortcuts for export
 */
export const ALL_SHORTCUTS: (ShortcutDefinition | CommandDefinition)[] = [
  ...GLOBAL_SHORTCUTS,
  ...ADMIN_NAVIGATION_SHORTCUTS,
  ...ADMIN_EXTENDED_NAVIGATION_SHORTCUTS,
  ...ADMIN_PAGE_ACTION_SHORTCUTS,
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
