import React, { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ShoppingBag, Settings,
  BarChart3, Calendar, MapPin, FileText, Menu as MenuIcon,
  X, Bell, User, LogOut, ChefHat, Building, Grid3X3,
  Tag, Star, Package, Shield, DollarSign, ClipboardList,
  AlertTriangle, Beaker, TrendingUp, ChevronRight, ChevronDown, Circle
} from 'lucide-react';
import NotificationDropdown from '@/app/components/ui/NotificationDropdown';
import UserProfileDropdown from '@/app/components/ui/UserProfileDropdown';
import { cn } from '@/app/utils/cn'; // Ensure this path matches your project

// --- 1. New Hierarchical Navigation Structure ---
const navigationTree = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    type: 'link' // Single link
  },
  {
    name: 'Operations',
    icon: ClipboardList,
    type: 'group',
    children: [
      { name: 'Orders', href: '/admin/orders' },
      { name: 'Reservations', href: '/admin/reservations' },
      { name: 'Notifications', href: '/admin/notifications' },
    ]
  },
  {
    name: 'Menu Management',
    icon: ChefHat,
    type: 'group',
    children: [
      { name: 'Categories', href: '/admin/categories' },
      { name: 'Menu Items', href: '/admin/menu-items' },
      { name: 'Recipes', href: '/admin/recipes' },
      { name: 'Promotions', href: '/admin/promotions' },
    ]
  },
  {
    name: 'Inventory & Procurement',
    icon: Package,
    type: 'group',
    children: [
      { name: 'Purchase Orders', href: '/admin/purchase-orders' },
      { name: 'Inventory', href: '/admin/inventory' },
      { name: 'Inventory Reports', href: '/admin/inventory-reports' },
      { name: 'Ingredients', href: '/admin/ingredients' },
      { name: 'Adjustments', href: '/admin/inventory-adjustments' },
      { name: 'Stock Alerts', href: '/admin/stock-alerts' },
      { name: 'Suppliers', href: '/admin/suppliers' },
      { name: 'Units', href: '/admin/units' },
    ]
  },
  {
    name: 'People Management',
    icon: Users,
    type: 'group',
    children: [
      { name: 'Employees', href: '/admin/employees' },
      { name: 'Customers', href: '/admin/customers' },
      { name: 'Positions', href: '/admin/positions' },
      { name: 'Loyalty Points', href: '/admin/loyalty-points' },
    ]
  },
  {
    name: 'Scheduling',
    icon: Calendar,
    type: 'group',
    children: [
      { name: 'Shifts', href: '/admin/shifts' },
      { name: 'Time Off Requests', href: '/admin/time-off-requests' },
      { name: 'Attendance Management', href: '/admin/attendance-management' },
      { name: 'Payroll Management', href: '/admin/payroll-management' },
    ]
  },
  {
    name: 'Restaurant Layout',
    icon: MapPin,
    type: 'group',
    children: [
      { name: 'Locations', href: '/admin/locations' },
      { name: 'Floors', href: '/admin/floors' },
      { name: 'Tables', href: '/admin/tables' },
    ]
  },
  {
    name: 'Finance & Analytics',
    icon: TrendingUp,
    type: 'group',
    children: [
      { name: 'Sales Analytics', href: '/admin/sales-analytics' },
      { name: 'Financial Dashboard', href: '/admin/financial-dashboard' },
      { name: 'Expenses', href: '/admin/expenses' },
      { name: 'Invoices', href: '/admin/invoices' },
    ]
  },
  {
    name: 'System',
    icon: Settings,
    type: 'group',
    children: [
      { name: 'Operating Hours', href: '/admin/operating-hours' },
      { name: 'Roles & Permissions', href: '/admin/roles' },
      { name: 'Translations', href: '/admin/translations' },
      { name: 'Audit Logs', href: '/admin/audit-logs' },
      { name: 'Settings', href: '/admin/settings' },
    ]
  },
];

const handleLogout = () => {
  router.post('/logout');
};

// --- 2. Sub-Component: Sidebar Item (Recursive) ---
const SidebarItem = ({ item, collapsed, currentUrl, expandedGroups, toggleGroup }: any) => {
  const Icon = item.icon;
  // Check if this specific item is active
  const isLinkActive = item.type === 'link' && currentUrl.startsWith(item.href);

  // Check if any child of this group is active
  const isGroupActive = item.type === 'group' && item.children?.some((child: any) => currentUrl.startsWith(child.href));

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
              <span className="font-semibold text-gray-900 dark:text-white">{item.name}</span>
            </div>

            {/* Children Links */}
            {item.type === 'group' ? (
              <div className="flex flex-col gap-1">
                {item.children.map((child: any) => {
                  const isChildActive = currentUrl.startsWith(child.href);
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
                      {child.name}
                    </Link>
                  )
                })}
              </div>
            ) : (
              <Link href={item.href} className="block px-3 py-2 text-sm text-gray-600 hover:text-purple-600">
                Open Dashboard
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
          <span className="font-medium text-sm">{item.name}</span>
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
          <span className={cn("font-medium text-sm", isGroupActive && "font-semibold")}>{item.name}</span>
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
                const isChildActive = currentUrl.startsWith(child.href);
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

                      <span>{child.name}</span>
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

export default function AdminLayout({ children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { url } = usePage();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Auto-expand groups based on active URL
  useEffect(() => {
    const activeGroup = navigationTree.find(item =>
      item.type === 'group' && item.children?.some(child => url.startsWith(child.href))
    );
    if (activeGroup) {
      setExpandedGroups(prev => Array.from(new Set([...prev, activeGroup.name])));
    }
  }, [url]);

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
          'bg-white dark:bg-gray-800 shadow-xl border-r border-gray-200 dark:border-gray-700',
          'flex flex-col',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 h-[72px]">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed ? (
              <motion.div
                className="flex items-center gap-3 overflow-hidden whitespace-nowrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    NKH Resto
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">Admin Portal</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="w-full flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Scroll Area */}
        <div
          className={cn(
            "flex-1 overflow-y-auto overflow-x-visible py-4 space-y-1 custom-scrollbar",
            sidebarCollapsed ? "px-2" : "px-3"
          )}
        >
          {navigationTree.map((item, index) => (
            <SidebarItem
              key={index}
              item={item}
              collapsed={sidebarCollapsed}
              currentUrl={url}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
            />
          ))}
        </div>

        {/* User Footer - Simplified */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className={cn(
            'flex items-center gap-3 p-2 rounded-xl transition-colors',
            sidebarCollapsed && 'justify-center'
          )}>
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-600 shadow-sm flex-shrink-0">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>

            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  className="flex-1 min-w-0"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    Admin User
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    admin@nkh.com
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
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 h-[72px] flex items-center z-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Dashboard</h2>
            </div>

            <div className="flex items-center gap-3">
              <NotificationDropdown variant="admin" />
              <UserProfileDropdown variant="admin" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full min-h-full" /* CHANGED: max-w-7xl mx-auto -> w-full min-h-full */
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}