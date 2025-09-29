/**
 * 🏛️ RestaurantLayout - Revolutionary Layout System
 * Hospitality-focused layouts with role-based optimization
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu as MenuIcon, 
  X, 
  Bell, 
  User, 
  Settings, 
  LogOut,
  ChefHat,
  Users,
  BarChart3,
  ShoppingBag,
  Calendar,
  MapPin,
  Utensils,
  CreditCard,
  Star,
  Heart
} from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/app/utils/cn';
import { RestaurantButton } from '@/components/ui/RestaurantButton';
import { RestaurantCard } from '@/components/ui/RestaurantCard';
import { animationVariants } from '@/design-system/animations';

export type UserRole = 'admin' | 'manager' | 'chef' | 'waiter' | 'customer';

interface RestaurantLayoutProps {
  children: React.ReactNode;
  role?: UserRole;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  className?: string;
}

// 🎨 Role-based navigation configurations
const navigationConfig: Record<UserRole, {
  primary: Array<{ icon: React.ReactNode; label: string; href: string; badge?: number }>;
  secondary: Array<{ icon: React.ReactNode; label: string; href: string }>;
  theme: string;
}> = {
  admin: {
    primary: [
      { icon: <BarChart3 className="w-5 h-5" />, label: 'Dashboard', href: '/admin/dashboard' },
      { icon: <Utensils className="w-5 h-5" />, label: 'Menu Management', href: '/admin/menu' },
      { icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders', href: '/admin/orders', badge: 5 },
      { icon: <Users className="w-5 h-5" />, label: 'Staff', href: '/admin/employees' },
      { icon: <MapPin className="w-5 h-5" />, label: 'Locations', href: '/admin/locations' },
      { icon: <CreditCard className="w-5 h-5" />, label: 'Payments', href: '/admin/payments' },
    ],
    secondary: [
      { icon: <Calendar className="w-5 h-5" />, label: 'Scheduling', href: '/admin/scheduling' },
      { icon: <Star className="w-5 h-5" />, label: 'Reviews', href: '/admin/reviews' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/admin/settings' },
    ],
    theme: 'from-purple-600 to-purple-700'
  },
  manager: {
    primary: [
      { icon: <BarChart3 className="w-5 h-5" />, label: 'Dashboard', href: '/manager/dashboard' },
      { icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders', href: '/manager/orders', badge: 3 },
      { icon: <Users className="w-5 h-5" />, label: 'Staff', href: '/manager/staff' },
      { icon: <Calendar className="w-5 h-5" />, label: 'Scheduling', href: '/manager/scheduling' },
    ],
    secondary: [
      { icon: <Star className="w-5 h-5" />, label: 'Reviews', href: '/manager/reviews' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/manager/settings' },
    ],
    theme: 'from-primary-600 to-primary-700'
  },
  chef: {
    primary: [
      { icon: <ChefHat className="w-5 h-5" />, label: 'Kitchen', href: '/chef/kitchen' },
      { icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders', href: '/chef/orders', badge: 8 },
      { icon: <Utensils className="w-5 h-5" />, label: 'Menu', href: '/chef/menu' },
    ],
    secondary: [
      { icon: <Calendar className="w-5 h-5" />, label: 'Schedule', href: '/chef/schedule' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/chef/settings' },
    ],
    theme: 'from-secondary-600 to-secondary-700'
  },
  waiter: {
    primary: [
      { icon: <ShoppingBag className="w-5 h-5" />, label: 'Orders', href: '/waiter/orders', badge: 4 },
      { icon: <MapPin className="w-5 h-5" />, label: 'Tables', href: '/waiter/tables' },
      { icon: <Utensils className="w-5 h-5" />, label: 'Menu', href: '/waiter/menu' },
    ],
    secondary: [
      { icon: <Calendar className="w-5 h-5" />, label: 'Schedule', href: '/waiter/schedule' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/waiter/settings' },
    ],
    theme: 'from-blue-600 to-blue-700'
  },
  customer: {
    primary: [
      { icon: <Utensils className="w-5 h-5" />, label: 'Menu', href: '/menu' },
      { icon: <ShoppingBag className="w-5 h-5" />, label: 'My Orders', href: '/orders' },
      { icon: <Heart className="w-5 h-5" />, label: 'Favorites', href: '/favorites' },
      { icon: <Star className="w-5 h-5" />, label: 'Rewards', href: '/rewards' },
    ],
    secondary: [
      { icon: <MapPin className="w-5 h-5" />, label: 'Locations', href: '/locations' },
      { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/settings' },
    ],
    theme: 'from-emerald-600 to-emerald-700'
  }
};

// 🎨 Role-based color themes
const roleThemes: Record<UserRole, string> = {
  admin: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10',
  manager: 'bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10',
  chef: 'bg-gradient-to-br from-secondary-50 to-secondary-100 dark:from-secondary-900/20 dark:to-secondary-800/10',
  waiter: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10',
  customer: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/10',
};

export function RestaurantLayout({
  children,
  role = 'customer',
  showSidebar = true,
  sidebarCollapsed: initialCollapsed = false,
  className
}: RestaurantLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialCollapsed);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { url } = usePage();
  
  const navigation = navigationConfig[role];
  const themeClass = roleThemes[role];

  // 📱 Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🎯 Navigation item component
  const NavigationItem = ({ 
    item, 
    isActive 
  }: { 
    item: { icon: React.ReactNode; label: string; href: string; badge?: number };
    isActive: boolean;
  }) => (
    <Link href={item.href}>
      <motion.div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative group',
          isActive 
            ? `bg-gradient-to-r ${navigation.theme} text-white shadow-lg` 
            : 'text-neutral-600 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600'
        )}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="flex-shrink-0">
          {item.icon}
        </span>
        
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              className="font-medium truncate"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* 🔔 Badge */}
        {item.badge && item.badge > 0 && (
          <motion.div
            className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            {item.badge}
          </motion.div>
        )}

        {/* ✨ Active indicator */}
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

  return (
    <div className={cn('min-h-screen flex', themeClass, className)}>
      {/* 📱 Mobile Menu Overlay */}
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

      {/* 🎨 Sidebar */}
      {showSidebar && (
        <motion.aside
          className={cn(
            'fixed left-0 top-0 h-full z-50 lg:relative lg:z-auto',
            'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl',
            'border-r border-neutral-200 dark:border-neutral-700',
            'transition-all duration-300 ease-out',
            sidebarCollapsed ? 'w-20' : 'w-72',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          )}
          initial={false}
          animate={{ width: sidebarCollapsed ? 80 : 288 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex flex-col h-full">
            {/* 🏷️ Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
              <AnimatePresence mode="wait">
                {!sidebarCollapsed ? (
                  <motion.div
                    className="flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-2xl bg-gradient-to-r flex items-center justify-center',
                      navigation.theme
                    )}>
                      <ChefHat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="font-display text-xl font-bold text-neutral-900 dark:text-neutral-100">
                        NKH Restaurant
                      </h1>
                      <p className="text-sm text-neutral-500 capitalize">
                        {role} Portal
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    className={cn(
                      'w-10 h-10 rounded-2xl bg-gradient-to-r flex items-center justify-center mx-auto',
                      navigation.theme
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChefHat className="w-6 h-6 text-white" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 🔄 Collapse Toggle */}
              <RestaurantButton
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex w-8 h-8 p-0 rounded-xl"
              >
                <MenuIcon className="w-4 h-4" />
              </RestaurantButton>

              {/* 📱 Mobile Close */}
              <RestaurantButton
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="lg:hidden w-8 h-8 p-0 rounded-xl"
              >
                <X className="w-4 h-4" />
              </RestaurantButton>
            </div>

            {/* 🧭 Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {/* Primary Navigation */}
              <div className="space-y-1">
                {navigation.primary.map((item) => (
                  <NavigationItem
                    key={item.href}
                    item={item}
                    isActive={url.startsWith(item.href)}
                  />
                ))}
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-neutral-200 dark:border-neutral-700" />

              {/* Secondary Navigation */}
              <div className="space-y-1">
                {navigation.secondary.map((item) => (
                  <NavigationItem
                    key={item.href}
                    item={item}
                    isActive={url.startsWith(item.href)}
                  />
                ))}
              </div>
            </nav>

            {/* 👤 User Profile */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className={cn(
                'flex items-center gap-3 p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800',
                sidebarCollapsed && 'justify-center'
              )}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center">
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
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        John Doe
                      </p>
                      <p className="text-sm text-neutral-500 truncate">
                        {role}@nkh.com
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <RestaurantButton
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 rounded-xl"
                >
                  <LogOut className="w-4 h-4" />
                </RestaurantButton>
              </div>
            </div>
          </div>
        </motion.aside>
      )}

      {/* 📄 Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* 🎯 Top Bar */}
        <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 📱 Mobile Menu Toggle */}
            <RestaurantButton
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden"
            >
              <MenuIcon className="w-5 h-5" />
            </RestaurantButton>

            {/* 🎯 Page Title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-xl font-display font-semibold text-neutral-900 dark:text-neutral-100">
                Dashboard
              </h1>
            </div>

            {/* 🔔 Actions */}
            <div className="flex items-center gap-3">
              <RestaurantButton
                variant="ghost"
                size="sm"
                className="relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs" />
              </RestaurantButton>

              <RestaurantButton
                variant="ghost"
                size="sm"
              >
                <Settings className="w-5 h-5" />
              </RestaurantButton>
            </div>
          </div>
        </header>

        {/* 🎨 Main Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            variants={animationVariants.fadeIn}
            initial="initial"
            animate="animate"
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

export default RestaurantLayout;
