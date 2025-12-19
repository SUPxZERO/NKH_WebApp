/**
 * GlobalSearch - Command Palette Style Search Component
 *
 * A reusable search modal that can be triggered with Cmd+Shift+K / Ctrl+Shift+K
 * Works across Admin, Employee, and Customer layouts
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { router } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { useHotkeys } from 'react-hotkeys-hook';
import {
  Search,
  Command,
  X,
  ArrowRight,
  Clock,
  Star,
  Utensils,
  Users,
  ShoppingBag,
  Settings,
  FileText,
  Home,
  ChefHat,
  CreditCard,
  Package,
  TrendingUp,
  Calendar,
  MapPin,
  LayoutDashboard,
  Loader2,
  Hash,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { apiGet } from '@/app/utils/api';

// Search result types
interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'page' | 'menu_item' | 'order' | 'customer' | 'employee' | 'action';
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  badge?: string;
}

interface SearchGroup {
  name: string;
  results: SearchResult[];
}

// Navigation items by layout type
const adminNavigation: SearchResult[] = [
  { id: 'admin-dashboard', title: 'Dashboard', subtitle: 'Overview & Analytics', type: 'page', icon: <LayoutDashboard className="w-4 h-4" />, href: '/admin/dashboard' },
  { id: 'admin-orders', title: 'Orders', subtitle: 'Manage customer orders', type: 'page', icon: <ShoppingBag className="w-4 h-4" />, href: '/admin/orders' },
  { id: 'admin-menu-items', title: 'Menu Items', subtitle: 'Food & beverages', type: 'page', icon: <Utensils className="w-4 h-4" />, href: '/admin/menu-items' },
  { id: 'admin-categories', title: 'Categories', subtitle: 'Menu categories', type: 'page', icon: <Hash className="w-4 h-4" />, href: '/admin/categories' },
  { id: 'admin-recipes', title: 'Recipes', subtitle: 'Recipe management', type: 'page', icon: <ChefHat className="w-4 h-4" />, href: '/admin/recipes' },
  { id: 'admin-customers', title: 'Customers', subtitle: 'Customer management', type: 'page', icon: <Users className="w-4 h-4" />, href: '/admin/customers' },
  { id: 'admin-employees', title: 'Employees', subtitle: 'Staff management', type: 'page', icon: <Users className="w-4 h-4" />, href: '/admin/employees' },
  { id: 'admin-inventory', title: 'Inventory', subtitle: 'Stock management', type: 'page', icon: <Package className="w-4 h-4" />, href: '/admin/inventory' },
  { id: 'admin-ingredients', title: 'Ingredients', subtitle: 'Ingredient list', type: 'page', icon: <Package className="w-4 h-4" />, href: '/admin/ingredients' },
  { id: 'admin-reservations', title: 'Reservations', subtitle: 'Table bookings', type: 'page', icon: <Calendar className="w-4 h-4" />, href: '/admin/reservations' },
  { id: 'admin-analytics', title: 'Sales Analytics', subtitle: 'Reports & insights', type: 'page', icon: <TrendingUp className="w-4 h-4" />, href: '/admin/sales-analytics' },
  { id: 'admin-promotions', title: 'Promotions', subtitle: 'Discounts & offers', type: 'page', icon: <Star className="w-4 h-4" />, href: '/admin/promotions' },
  { id: 'admin-settings', title: 'Settings', subtitle: 'System configuration', type: 'page', icon: <Settings className="w-4 h-4" />, href: '/admin/settings' },
];

const employeeNavigation: SearchResult[] = [
  { id: 'emp-dashboard', title: 'Dashboard', subtitle: 'Your overview', type: 'page', icon: <Home className="w-4 h-4" />, href: '/employee/dashboard' },
  { id: 'emp-pos', title: 'POS', subtitle: 'Point of Sale', type: 'page', icon: <CreditCard className="w-4 h-4" />, href: '/employee/pos' },
  { id: 'emp-kitchen', title: 'Kitchen Display', subtitle: 'Order preparation', type: 'page', icon: <ChefHat className="w-4 h-4" />, href: '/employee/kitchen' },
  { id: 'emp-delivery', title: 'Delivery Orders', subtitle: 'Manage deliveries', type: 'page', icon: <Package className="w-4 h-4" />, href: '/employee/delivery-orders' },
  { id: 'emp-schedule', title: 'My Schedule', subtitle: 'Shifts & time off', type: 'page', icon: <Calendar className="w-4 h-4" />, href: '/employee/schedule' },
  { id: 'emp-performance', title: 'Performance', subtitle: 'Your stats', type: 'page', icon: <TrendingUp className="w-4 h-4" />, href: '/employee/performance' },
];

const customerNavigation: SearchResult[] = [
  { id: 'cust-home', title: 'Home', subtitle: 'Back to home', type: 'page', icon: <Home className="w-4 h-4" />, href: '/' },
  { id: 'cust-menu', title: 'Menu', subtitle: 'Browse our dishes', type: 'page', icon: <Utensils className="w-4 h-4" />, href: '/menu' },
  { id: 'cust-dashboard', title: 'My Dashboard', subtitle: 'Account overview', type: 'page', icon: <LayoutDashboard className="w-4 h-4" />, href: '/dashboard' },
  { id: 'cust-orders', title: 'My Orders', subtitle: 'Order history', type: 'page', icon: <ShoppingBag className="w-4 h-4" />, href: '/customer/orders' },
  { id: 'cust-cart', title: 'Cart', subtitle: 'View your cart', type: 'page', icon: <ShoppingBag className="w-4 h-4" />, href: '/cart' },
  { id: 'cust-reservation', title: 'Book a Table', subtitle: 'Make a reservation', type: 'page', icon: <Calendar className="w-4 h-4" />, href: '/reservation' },
];

interface GlobalSearchProps {
  variant: 'admin' | 'employee' | 'customer';
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ variant, isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Get base navigation based on variant
  const baseNavigation = useMemo(() => {
    switch (variant) {
      case 'admin': return adminNavigation;
      case 'employee': return employeeNavigation;
      case 'customer': return customerNavigation;
      default: return [];
    }
  }, [variant]);

  // Search for menu items (for customer and admin)
  const { data: menuResults, isLoading: menuLoading } = useQuery({
    queryKey: ['search-menu', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await apiGet(`/menu-items?search=${encodeURIComponent(query)}&per_page=5`);
      return (response?.data || []).map((item: any) => ({
        id: `menu-${item.id}`,
        title: item.name,
        subtitle: `$${item.price} - ${item.category?.name || 'Menu Item'}`,
        type: 'menu_item' as const,
        icon: <Utensils className="w-4 h-4" />,
        href: variant === 'admin' ? `/admin/menu-items` : `/menu?item=${item.id}`,
        badge: item.is_popular ? 'Popular' : undefined,
      }));
    },
    enabled: isOpen && query.length >= 2 && (variant === 'admin' || variant === 'customer'),
    staleTime: 30000,
  });

  // Search for orders (admin only)
  const { data: orderResults, isLoading: orderLoading } = useQuery({
    queryKey: ['search-orders', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const response = await apiGet(`/admin/orders?search=${encodeURIComponent(query)}&per_page=5`);
      return (response?.data || []).map((order: any) => ({
        id: `order-${order.id}`,
        title: `Order #${order.order_number}`,
        subtitle: `${order.status} - $${order.total}`,
        type: 'order' as const,
        icon: <ShoppingBag className="w-4 h-4" />,
        href: `/admin/orders?order=${order.id}`,
        badge: order.status,
      }));
    },
    enabled: isOpen && query.length >= 2 && variant === 'admin',
    staleTime: 30000,
  });

  // Filter navigation results
  const filteredNavigation = useMemo(() => {
    if (!query) return baseNavigation.slice(0, 6); // Show top 6 when no query
    const lowerQuery = query.toLowerCase();
    return baseNavigation.filter(
      item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.subtitle?.toLowerCase().includes(lowerQuery)
    );
  }, [baseNavigation, query]);

  // Combine all results into groups
  const searchGroups = useMemo(() => {
    const groups: SearchGroup[] = [];

    if (filteredNavigation.length > 0) {
      groups.push({ name: 'Pages', results: filteredNavigation });
    }

    if (menuResults && menuResults.length > 0) {
      groups.push({ name: 'Menu Items', results: menuResults });
    }

    if (orderResults && orderResults.length > 0) {
      groups.push({ name: 'Orders', results: orderResults });
    }

    return groups;
  }, [filteredNavigation, menuResults, orderResults]);

  // Flatten results for keyboard navigation
  const flatResults = useMemo(() => {
    return searchGroups.flatMap(group => group.results);
  }, [searchGroups]);

  useHotkeys(
    'down',
    (e) => {
      if (!isOpen) return;
      if (flatResults.length === 0) return;
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, flatResults.length - 1));
    },
    { enabled: isOpen, enableOnFormTags: true, enableOnContentEditable: true },
    [isOpen, flatResults.length]
  );

  useHotkeys(
    'up',
    (e) => {
      if (!isOpen) return;
      if (flatResults.length === 0) return;
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    },
    { enabled: isOpen, enableOnFormTags: true, enableOnContentEditable: true },
    [isOpen, flatResults.length]
  );

  useHotkeys(
    'enter',
    (e) => {
      if (!isOpen) return;
      const selected = flatResults[selectedIndex];
      if (!selected) return;
      e.preventDefault();

      if (selected.action) {
        selected.action();
      } else if (selected.href) {
        router.visit(selected.href);
      }

      onClose();
    },
    { enabled: isOpen, enableOnFormTags: true, enableOnContentEditable: true },
    [isOpen, flatResults, selectedIndex, onClose]
  );

  useHotkeys(
    'esc',
    (e) => {
      if (!isOpen) return;
      e.preventDefault();
      onClose();
    },
    { enabled: isOpen, enableOnFormTags: true, enableOnContentEditable: true },
    [isOpen, onClose]
  );

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleResultClick = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.href) {
      router.visit(result.href);
    }
    onClose();
  };

  const isLoading = menuLoading || orderLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Search Modal */}
          <motion.div
            className="fixed inset-x-4 top-[15%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-[101]"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    variant === 'admin'
                      ? "Search pages, menu items, orders..."
                      : variant === 'employee'
                      ? "Search pages..."
                      : "Search menu, pages..."
                  }
                  className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 outline-none text-lg"
                />
                {isLoading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md border border-gray-200 dark:border-gray-700">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
                {searchGroups.length === 0 && query.length > 0 ? (
                  <div className="px-4 py-12 text-center">
                    <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {searchGroups.map((group, groupIndex) => {
                      // Calculate the starting index for this group
                      const groupStartIndex = searchGroups
                        .slice(0, groupIndex)
                        .reduce((acc, g) => acc + g.results.length, 0);

                      return (
                        <div key={group.name}>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {group.name}
                          </div>
                          {group.results.map((result, resultIndex) => {
                            const absoluteIndex = groupStartIndex + resultIndex;
                            const isSelected = absoluteIndex === selectedIndex;

                            return (
                              <button
                                key={result.id}
                                data-index={absoluteIndex}
                                onClick={() => handleResultClick(result)}
                                onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                  isSelected
                                    ? "bg-purple-50 dark:bg-purple-900/20"
                                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                )}
                              >
                                <div className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                                  isSelected
                                    ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                )}>
                                  {result.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={cn(
                                      "font-medium truncate",
                                      isSelected ? "text-purple-900 dark:text-purple-100" : "text-gray-900 dark:text-white"
                                    )}>
                                      {result.title}
                                    </span>
                                    {result.badge && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                                        {result.badge}
                                      </span>
                                    )}
                                  </div>
                                  {result.subtitle && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                      {result.subtitle}
                                    </p>
                                  )}
                                </div>
                                <ArrowUpRight className={cn(
                                  "w-4 h-4 flex-shrink-0 transition-opacity",
                                  isSelected ? "opacity-100 text-purple-500" : "opacity-0"
                                )} />
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↓</kbd>
                      <span className="ml-1">Navigate</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">↵</kbd>
                      <span className="ml-1">Select</span>
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">ESC</kbd>
                    <span className="ml-1">Close</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to manage global search state and keyboard shortcut
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useHotkeys(
    'mod+shift+k',
    (e) => {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    },
    {},
    []
  );

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}

// Search trigger button component
interface SearchTriggerProps {
  onClick: () => void;
  variant?: 'admin' | 'employee' | 'customer';
  className?: string;
}

export function SearchTrigger({ onClick, variant = 'admin', className }: SearchTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-sm rounded-xl transition-all duration-200",
        variant === 'customer'
          ? "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/10"
          : "bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400",
        className
      )}
    >
      <Search className="w-4 h-4" />
      <span className="hidden lg:inline">Search...</span>
      <kbd className={cn(
        "hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded",
        variant === 'customer'
          ? "bg-white/10 text-white/60"
          : "bg-gray-200 dark:bg-gray-600"
      )}>
        <Command className="w-3 h-3" />⇧K
      </kbd>
    </button>
  );
}

export default GlobalSearch;
