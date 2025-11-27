import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, ShoppingBag, Settings, 
  BarChart3, Calendar, MapPin, FileText, Menu as MenuIcon,
  X, Bell, User, LogOut, ChefHat, Building, Grid3X3,
  Tag, Star, Package, Shield, MessageSquare, DollarSign
} from 'lucide-react';
import { cn } from '@/app/utils/cn';

type Props = { children: React.ReactNode };

const navigation = [
  // Main
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },

  // Operations
  { name: 'Orders', href: '/admin/orders', icon: Package },
  { name: 'Reservations', href: '/admin/reservations', icon: Calendar },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },

  // Menu Management
  { name: 'Categories', href: '/admin/categories', icon: ShoppingBag },
  { name: 'Menu Items', href: '/admin/menu-items', icon: ChefHat },
  { name: 'Promotions', href: '/admin/promotions', icon: Tag },

  // People
  { name: 'Employees', href: '/admin/employees', icon: Users },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Loyalty Points', href: '/admin/loyalty-points', icon: Star },

  // Finance
  { name: 'Expenses', href: '/admin/expenses', icon: DollarSign },
  { name: 'Invoices', href: '/admin/invoices', icon: FileText },

  // Restaurant Layout
  { name: 'Floors', href: '/admin/floors', icon: Building },
  { name: 'Tables', href: '/admin/tables', icon: Grid3X3 },

  // System
  { name: 'Inventory', href: '/admin/inventory', icon: Package },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: Shield },

  // Settings
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];


export default function AdminLayout({ children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { url } = usePage();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
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
          'bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700',
          'transition-all duration-300 ease-out',
          sidebarCollapsed ? 'w-20' : 'w-72',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 288 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <AnimatePresence mode="wait">
              {!sidebarCollapsed ? (
                <motion.div
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      NKH Restaurant
                    </h1>
                    <p className="text-sm text-gray-500">Admin Portal</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChefHat className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex w-8 h-8 items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MenuIcon className="w-4 h-4" />
            </button>

            {/* Mobile Close */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = url.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group',
                      isActive 
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600'
                    )}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          className="font-medium truncate"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {isActive && (
                      <motion.div
                        className="absolute right-2 w-1 h-8 bg-white rounded-full"
                        layoutId="activeIndicator"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className={cn(
              'flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800',
              sidebarCollapsed && 'justify-center'
            )}>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    className="flex-1 min-w-0"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      Admin User
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      admin@nkh.com
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Page Title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </button>

              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
