import React, { useState, useEffect, useMemo } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ShoppingBag, Settings,
  BarChart3, Calendar, MapPin, FileText, Menu as MenuIcon,
  X, Bell, User, LogOut, ChefHat, Building, Grid3X3,
  AlertTriangle, Beaker, TrendingUp, ChevronRight, ChevronDown, Circle,
  Sun, Moon, Search, Command, ClipboardList, Package
} from 'lucide-react';
import { LanguageSwitcher } from '@/app/components/common/LanguageSwitcher';
import { GlobalSearch, useGlobalSearch, SearchTrigger } from '@/app/components/ui/GlobalSearch';
import { cn } from '@/app/utils/cn';
import { useThemeStore } from '@/app/store/theme';
import { useAuth } from '@/app/providers/AuthProvider';
import NotificationDropdown from '@/app/components/ui/NotificationDropdown';
import UserProfileDropdown from '@/app/components/ui/UserProfileDropdown';
import BranchSelector from '@/app/components/ui/BranchSelector';
import { useLanguage } from '@/app/context/LanguageContext';

// --- 1. New Hierarchical Navigation Structure ---
const navigationTree = [
  {
    name: 'layout.admin.nav.dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    type: 'link',
    permission: 'dashboard.view'
  },
  {
    name: 'layout.admin.nav.operations',
    icon: ClipboardList,
    type: 'group',
    permission: 'orders.view', // Group permission - any child or group itself
    children: [
      { name: 'layout.admin.nav.orders', href: '/admin/orders', permission: 'orders.view' },
      { name: 'layout.admin.nav.reservations', href: '/admin/reservations', permission: 'reservations.view' },
      { name: 'layout.admin.nav.notifications', href: '/admin/notifications', permission: 'notifications.view' },
    ]
  },
  {
    name: 'layout.admin.nav.menu_management',
    icon: ChefHat,
    type: 'group',
    permission: 'menu.view',
    children: [
      { name: 'layout.admin.nav.categories', href: '/admin/categories', permission: 'categories.view' },
      { name: 'layout.admin.nav.menu_items', href: '/admin/menu-items', permission: 'menu.view' },
      { name: 'layout.admin.nav.recipes', href: '/admin/recipes', permission: 'recipes.view' },
      { name: 'layout.admin.nav.promotions', href: '/admin/promotions', permission: 'promotions.view' },
    ]
  },
  {
    name: 'layout.admin.nav.inventory_procurement',
    icon: Package,
    type: 'group',
    permission: 'inventory.view',
    children: [
      { name: 'layout.admin.nav.purchase_orders', href: '/admin/purchase-orders', permission: 'purchase-orders.view' },
      { name: 'layout.admin.nav.inventory', href: '/admin/inventory', permission: 'inventory.view' },
      { name: 'layout.admin.nav.inventory_reports', href: '/admin/reports/inventory', permission: 'reports.view' },
      { name: 'layout.admin.nav.ingredients', href: '/admin/ingredients', permission: 'inventory.view' },
      { name: 'layout.admin.nav.adjustments', href: '/admin/inventory-adjustments', permission: 'inventory.view' },
      { name: 'layout.admin.nav.stock_alerts', href: '/admin/stock-alerts', permission: 'inventory.view' },
      { name: 'layout.admin.nav.suppliers', href: '/admin/suppliers', permission: 'suppliers.view' },
      { name: 'layout.admin.nav.units', href: '/admin/units', permission: 'inventory.view' },
    ]
  },
  {
    name: 'layout.admin.nav.people_management',
    icon: Users,
    type: 'group',
    permission: 'employees.view',
    children: [
      { name: 'layout.admin.nav.employees', href: '/admin/employees', permission: 'employees.view' },
      { name: 'layout.admin.nav.admins', href: '/admin/admins', permission: 'users.view' },
      { name: 'layout.admin.nav.customers', href: '/admin/customers', permission: 'customers.view' },
      { name: 'layout.admin.nav.positions', href: '/admin/positions', permission: 'employees.view' },
      { name: 'layout.admin.nav.loyalty_points', href: '/admin/loyalty-points', permission: 'loyalty.view' },
    ]
  },
  {
    name: 'layout.admin.nav.scheduling',
    icon: Calendar,
    type: 'group',
    permission: 'shifts.view',
    children: [
      { name: 'layout.admin.nav.shifts', href: '/admin/shifts', permission: 'shifts.view' },
      { name: 'layout.admin.nav.shift_approvals', href: '/admin/shift-approvals', permission: 'shifts.view' },
      { name: 'layout.admin.nav.time_off_requests', href: '/admin/time-off-requests', permission: 'timeoff.view' },
      { name: 'layout.admin.nav.attendance_management', href: '/admin/attendance-management', permission: 'attendance.view' },
      { name: 'layout.admin.nav.payroll_management', href: '/admin/payroll-management', permission: 'payroll.view' },
    ]
  },
  {
    name: 'layout.admin.nav.restaurant_layout',
    icon: MapPin,
    type: 'group',
    permission: 'locations.view',
    children: [
      { name: 'layout.admin.nav.locations', href: '/admin/locations', permission: 'locations.view' },
      { name: 'layout.admin.nav.floors', href: '/admin/floors', permission: 'floors.manage' },
      { name: 'layout.admin.nav.tables', href: '/admin/tables', permission: 'tables.manage' },
    ]
  },
  {
    name: 'layout.admin.nav.finance_analytics',
    icon: TrendingUp,
    type: 'group',
    permission: 'reports.view',
    children: [
      { name: 'layout.admin.nav.sales_analytics', href: '/admin/reports/sales', permission: 'reports.view' },
      { name: 'layout.admin.nav.advanced_analytics', href: '/admin/analytics', permission: 'dashboard.view' },
      { name: 'layout.admin.nav.financial_dashboard', href: '/admin/financial-dashboard', permission: 'payments.view' },
      { name: 'layout.admin.nav.expenses', href: '/admin/expenses', permission: 'expenses.view' },
      { name: 'layout.admin.nav.invoices', href: '/admin/invoices', permission: 'invoices.view' },
    ]
  },
  {
    name: 'layout.admin.nav.system',
    icon: Settings,
    type: 'group',
    permission: 'settings.view',
    children: [
      { name: 'layout.admin.nav.operating_hours', href: '/admin/operating-hours', permission: 'locations.manage' },
      { name: 'layout.admin.nav.roles_permissions', href: '/admin/roles', permission: 'roles.manage' },
      { name: 'layout.admin.nav.translations', href: '/admin/translations', permission: 'translations.manage' },
      { name: 'layout.admin.nav.audit_logs', href: '/admin/audit-logs', permission: 'audit.view' },
      { name: 'layout.admin.nav.payment_methods', href: '/admin/payment-methods', permission: 'manage_payment_methods' },
      { name: 'layout.admin.nav.settings', href: '/admin/settings', permission: 'settings.view' },
    ]
  },
];

const handleLogout = () => {
  router.post('/logout');
};

// --- 2. Sub-Component: Sidebar Item (Recursive) ---
const SidebarItem = ({ item, collapsed, currentUrl, expandedGroups, toggleGroup, t }: any) => {
  const Icon = item.icon;

  // Helper function to check if URL matches (handles query params and trailing slashes)
  const isUrlMatch = (href: string, url: string) => {
    const normalizedUrl = url.split('?')[0].replace(/\/$/, '');
    const normalizedHref = href.replace(/\/$/, '');
    return normalizedUrl === normalizedHref;
  };

  // Check if this specific item is active
  const isLinkActive = item.type === 'link' && isUrlMatch(item.href, currentUrl);

  // Check if any child of this group is active
  const isGroupActive = item.type === 'group' && item.children?.some((child: any) => isUrlMatch(child.href, currentUrl));

  // Is this group currently expanded?
  const isExpanded = expandedGroups.includes(item.name);

  // --- COLLAPSED MODE RENDER ---
  if (collapsed) {
    return (
      <div className="relative group flex justify-center py-2">
        {/* Main Icon Trigger */}
        <div className={cn(
          "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer relative",
          isLinkActive || isGroupActive
            ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
            : "text-gray-500 hover:bg-purple-50 hover:text-purple-600 dark:text-gray-400 dark:hover:bg-gray-800"
        )}>
          <Icon className="w-5 h-5" />
          {(isLinkActive || isGroupActive) && (
            <motion.div layoutId="activeDot" className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
          )}
        </div>

        {/* Floating Menu (Tooltip style for Collapsed) */}
        <div className="absolute left-full top-0 ml-4 hidden group-hover:block z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 p-2 min-w-[200px] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
              <span className="font-semibold text-gray-900 dark:text-white">{t(item.name)}</span>
            </div>

            {/* Children Links */}
            {item.type === 'group' ? (
              <div className="flex flex-col gap-1">
                {item.children.map((child: any) => {
                  const isChildActive = isUrlMatch(child.href, currentUrl);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between",
                        isChildActive
                          ? "bg-purple-50 text-purple-700 font-medium dark:bg-purple-900/20 dark:text-purple-300"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                      )}
                    >
                      {t(child.name)}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <Link href={item.href} className="block px-3 py-2 text-sm text-gray-600 hover:text-purple-600">
                {t('layout.admin.open_dashboard')}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- EXPANDED MODE RENDER ---
  if (item.type === 'link') {
    return (
      <Link href={item.href} className="block mb-1">
        <motion.div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
            isLinkActive
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600'
          )}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{t(item.name)}</span>
        </motion.div>
      </Link>
    );
  }

  return (
    <div className="mb-1">
      {/* Group Header */}
      <button
        onClick={() => toggleGroup(item.name)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group',
          isGroupActive
            ? 'bg-purple-50 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        )}
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5 transition-colors", isGroupActive ? "text-purple-600 dark:text-purple-400" : "text-gray-500")} />
          <span className={cn("font-medium text-sm", isGroupActive && "font-semibold")}>{t(item.name)}</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 opacity-50" />
        </motion.div>
      </button>

      {/* Children Dropdown */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pl-4 pr-2 py-2 space-y-1">
              {item.children.map((child: any) => {
                const isChildActive = isUrlMatch(child.href, currentUrl);
                return (
                  <Link key={child.href} href={child.href} className="block">
                    <motion.div
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-lg text-sm transition-colors relative",
                        isChildActive
                          ? "text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
                          : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                      whileHover={{ x: 2 }}
                    >
                      {/* Active Indicator Dot */}
                      {isChildActive && (
                        <motion.div
                          layoutId="activeChildIndicator"
                          className="absolute left-0 w-1 h-full bg-purple-600 rounded-full"
                        />
                      )}

                      {/* Visual Hierarchy Line */}
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full border",
                        isChildActive ? "bg-purple-600 border-purple-600" : "border-gray-300 dark:border-gray-600"
                      )} />

                      <span>{t(child.name)}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


// --- 3. Main Layout Component ---
type Props = { children: React.ReactNode };

// Helper function to check if URL matches (handles query params and trailing slashes)
const isUrlMatchFn = (href: string, url: string) => {
  const normalizedUrl = url.split('?')[0].replace(/\/$/, '');
  const normalizedHref = href.replace(/\/$/, '');
  return normalizedUrl === normalizedHref;
};

import { useSmartPolling } from '@/app/hooks/useSmartPolling';
import { useRouteHotkeys } from '@/app/hooks/useShortcuts';
import {
  ADMIN_NAVIGATION_SHORTCUTS,
  ADMIN_EXTENDED_NAVIGATION_SHORTCUTS,
  ADMIN_PAGE_ACTION_SHORTCUTS
} from '@/app/config/shortcuts.config';

export default function AdminLayout({ children }: Props) {
  const { url } = usePage();
  const { user, hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const search = useGlobalSearch();
  const { t, locale } = useLanguage();
  const dateLocale = locale === 'km' ? 'km-KH' : 'en-US';

  // --- Filter Navigation Tree ---
  const filteredNav = useMemo(() => {
    if (!user) return [];

    return navigationTree.map(item => {
      // If it's a link, check permission
      if (item.type === 'link') {
        const linkItem = item as any;
        return hasPermission(linkItem.permission) ? item : null;
      }

      // If it's a group, filter its children
      if (item.type === 'group') {
        const groupItem = item as any;
        const visibleChildren = groupItem.children?.filter((child: any) => hasPermission(child.permission)) || [];

        // Only show group if it has visible children OR user has permission for the group itself
        if (visibleChildren.length > 0 || hasPermission(groupItem.permission)) {
          return {
            ...groupItem,
            children: visibleChildren
          };
        }
      }
      return null;
    }).filter(Boolean) as any[];
  }, [user, hasPermission]);

  // Enable admin keyboard shortcuts on all admin pages
  useRouteHotkeys('/admin', [
    ...ADMIN_NAVIGATION_SHORTCUTS,
    ...ADMIN_EXTENDED_NAVIGATION_SHORTCUTS,
    ...ADMIN_PAGE_ACTION_SHORTCUTS,
  ]);

  // Smart Polling for Notifications (Global) - 60s
  useSmartPolling(['admin-notifications'], 60000);

  // Get current page title from URL
  const pageTitle = useMemo(() => {
    // Find the active item in navigation tree
    for (const item of filteredNav) { // Changed from navigationTree to filteredNav
      if (item.type === 'link' && item.href && isUrlMatchFn(item.href, url)) {
        return t(item.name);
      }
      if (item.type === 'group' && item.children) {
        const child = item.children.find((c: any) => c.href && isUrlMatchFn(c.href, url));
        if (child) return t(child.name);
      }
    }
    return t('layout.admin.nav.dashboard');
  }, [url, filteredNav, t]); // Added filteredNav to dependencies

  // Auto-expand groups based on active URL
  useEffect(() => {
    const activeGroup = filteredNav.find(item => // Changed from navigationTree to filteredNav
      item.type === 'group' && item.children?.some((child: any) => isUrlMatchFn(child.href, url))
    );
    if (activeGroup) {
      setExpandedGroups(prev => Array.from(new Set([...prev, activeGroup.name])));
    }
  }, [url, filteredNav]); // Added filteredNav to dependencies

  const toggleGroup = (name: string) => {
    setExpandedGroups(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden w-full">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          'fixed left-0 top-0 h-full z-50 lg:relative lg:z-auto',
          'bg-gradient-to-b from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900/50',
          'shadow-2xl shadow-gray-200/50 dark:shadow-black/20 border-r border-gray-100 dark:border-gray-700/50',
          'flex flex-col',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        initial={false}
        animate={{ width: collapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700/50 h-[72px] bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {!collapsed ? (
              <motion.div
                className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/20">
                  <img
                    src="/Nkhlogo.png"
                    alt="NKH"
                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent leading-tight">
                    {t('layout.footer.brand_title')}
                  </h1>
                  <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400 font-semibold tracking-wide">{t('layout.admin.portal')}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="w-full flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 p-1.5 border border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/20">
                  <img
                    src="/Nkhlogo.png"
                    alt="NKH"
                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Scroll Area */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-visible py-4 space-y-1 custom-scrollbar",
            collapsed ? "px-2" : "px-3"
          )}
        >
          {filteredNav.map((item: any) => (
            <SidebarItem
              key={item.name}
              item={item}
              collapsed={collapsed}
              currentUrl={url}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              t={t}
            />
          ))}
        </div>

        {/* User Footer - Simplified */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700/50 bg-gradient-to-t from-gray-50/80 to-transparent dark:from-gray-900/30 dark:to-transparent">
          <div className={cn(
            'flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 hover:bg-white dark:hover:bg-gray-700/50 cursor-pointer group',
            collapsed && 'justify-center'
          )}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 flex items-center justify-center border-2 border-purple-200/50 dark:border-purple-700/30 shadow-sm flex-shrink-0 group-hover:shadow-md group-hover:border-purple-300 dark:group-hover:border-purple-600/50 transition-all">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {t('layout.admin.user_name')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    {t('layout.admin.status_online')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 dark:border-gray-700/50 px-6 h-[72px] flex items-center z-[100] sticky top-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{pageTitle}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {new Date().toLocaleDateString(dateLocale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Button */}
              <SearchTrigger onClick={search.open} variant="admin" className="hidden md:flex" />

              {/* Branch Selector */}
              <BranchSelector
                branches={user?.locations ?? []}
                activeBranchId={user?.active_branch_id ?? null}
                canSwitchBranch={user?.can_switch_branch ?? false}
              />

              <LanguageSwitcher />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200"
                title={isDark ? t('layout.admin.theme.light') : t('layout.admin.theme.dark')}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

              <NotificationDropdown variant="admin" />
              <UserProfileDropdown variant="admin" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto relative z-0 bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950/50">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full min-h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch variant="admin" isOpen={search.isOpen} onClose={search.close} />
    </div>
  );
}
