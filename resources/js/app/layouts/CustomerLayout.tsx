import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  User,
  UserCircle,
  Menu as MenuIcon,
  X,
  Home,
  Utensils,
  Heart,
  Star,
  MapPin,
  Settings,
  Phone,
  Mail,
  Clock, ClipboardList,
  LogOut,
  Calendar,
  Search,
  QrCode
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import CartIcon from '@/app/components/ui/CartIcon';
import NotificationDropdown from '@/app/components/ui/NotificationDropdown';
import UserProfileDropdown from '@/app/components/ui/UserProfileDropdown';
import { GlobalSearch, useGlobalSearch, SearchTrigger } from '@/app/components/ui/GlobalSearch';
import { LanguageSwitcher } from '@/app/components/common/LanguageSwitcher';
import { useCustomerNotifications } from '@/app/hooks/useCustomerNotifications';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTelegramAuth } from '@/app/hooks/useTelegramAuth';
import { useTableSession } from '@/app/hooks/useTableSession';

import { useTranslation } from '@/app/hooks/useTranslation';

type Props = {
  children: React.ReactNode;
  className?: string;
};

// Moved navigation array inside component to use translation hook

export default function CustomerLayout({ children, className }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { url } = usePage();
  const search = useGlobalSearch();
  const { t } = useTranslation();

  const navigation = [
    { name: t('layout.nav.home'), href: '/', icon: Home },
    { name: t('layout.nav.menu'), href: '/menu', icon: Utensils },
    { name: t('layout.nav.dashboard'), href: '/dashboard', icon: User },
    // { name: t('layout.nav.profile'), href: '/customer/profile', icon: UserCircle },
    { name: t('layout.nav.cart'), href: '/cart', icon: ShoppingCart },
    { name: t('layout.nav.orders'), href: '/customer/orders', icon: ClipboardList },
    // { name: t('layout.nav.favorites'), href: '/customer/favorites', icon: Heart },
    // { name: t('layout.nav.rewards'), href: '/customer/rewards', icon: Star },
    { name: t('layout.nav.book_table'), href: '/reservation', icon: Calendar },
  ];

  // Get user from AuthContext (supports Telegram fallback)
  const { user } = useAuth();

  const userAvatar = user?.avatar;
  const userName = user?.name || t('layout.nav.user_fallback');
  const userEmail = user?.email || '';

  // Subscribe to real-time customer notifications
  // Pass user ID explicitly to ensure Telegram users are connected
  useCustomerNotifications(user?.id, { showToast: true });

  // Initialize Telegram WebApp session (Sprint P15 - Guest ordering)
  const telegram = useTelegramAuth();

  // Table Session Indicator
  const { isTableOrder, session } = useTableSession();
  // Fallback to cart store display values if session object isn't fully loaded but token exists
  // Fallback to cart store display values if session object isn't fully loaded but token exists
  // (handled by hook matching logic, here we just use what the hook gives or cart store directly if accessible)
  // For display we'll trust the hook's sync or local session data
  const tableDisplay = session?.table?.code || t('layout.table');
  const floorDisplay = session?.table?.floor?.name;

  const handleLogout = () => {
    router.post('/logout');
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-slate-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 overflow-x-hidden",
      className
    )}>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed top-0 right-0 h-full w-[280px] sm:w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-l border-white/20 z-50 xl:hidden overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-bold">{t('layout.nav.mobile_menu_title')}</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="space-y-2">
                {/* User Profile Section in Mobile Menu */}
                <Link
                  href="/customer/account?section=profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = getInitials(userName);
                        }}
                      />
                    ) : (
                      <span className="text-sm">{getInitials(userName)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{userName}</p>
                    <p className="text-xs text-gray-500 truncate">{userEmail || t('layout.nav.view_account')}</p>
                  </div>
                </Link>

                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = url === item.href || (item.href !== '/' && url.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                        isActive
                          ? 'bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}

                {/* Logout Button in Mobile Menu */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 w-full mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  {t('layout.nav.logout')}
                </button>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-white/20">
        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo - Using Actual NKH Logo */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
              <div className="relative">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-xl sm:rounded-2xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                {/* Logo container */}
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20 backdrop-blur-sm">
                  <img
                    src="/Nkhlogo.png"
                    alt={t('layout.footer.brand_title')}
                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(217,70,239,0.4)]"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                  {t('layout.footer.brand_title')}
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('layout.footer.subtitle')}</p>
              </div>
            </Link>


            {/* Table Indicator (Mobile/Desktop) */}
            {isTableOrder && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-full">
                <QrCode className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div className="flex flex-col leading-none">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                    {tableDisplay}
                  </span>
                  {floorDisplay && (
                    <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 font-medium">
                      {floorDisplay}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Desktop Navigation - Hide on mobile/tablet */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = url === item.href || (item.href !== '/' && url.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                      isActive
                        ? 'bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{item.name as string}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Mobile Table Indicator - Icon Only */}
              {isTableOrder && (
                <div className="sm:hidden flex items-center justify-center w-9 h-9 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400">
                  <span className="text-xs font-bold">{String(tableDisplay).replace(t('layout.table') + ' ', '')}</span>
                </div>
              )}

              <LanguageSwitcher />

              {/* Search Button - Show on all sizes */}
              <button
                onClick={search.open}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                title={t('layout.nav.search_title')}
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Cart Button */}
              <CartIcon />

              {/* Notification Dropdown - Show on medium and up */}
              <div className="hidden sm:block">
                <NotificationDropdown variant="customer" />
              </div>

              {/* User Profile - Show on medium and up */}
              <div className="hidden md:block">
                <UserProfileDropdown variant="customer" />
              </div>

              {/* Mobile Profile Button - Show only on mobile */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                title={t('layout.nav.profile_title')}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <MenuIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </header >

      {/* Main Content */}
      < main className="w-full max-w-full overflow-x-hidden" >
        <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main >

      {/* Footer */}
      < footer className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white py-8 sm:py-12 lg:py-16 mt-12 sm:mt-16 lg:mt-20" >
        <div className="w-full max-w-screen-2xl mx-auto px-4">
          {/* Newsletter Section */}
          {/* <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-600 to-pink-600 p-8 md:p-12 mb-12">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">Stay Updated!</h3>
                <p className="text-white/80">Get exclusive offers and new menu alerts</p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 md:w-64 px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <button className="px-6 py-3 rounded-xl bg-white text-fuchsia-600 font-semibold hover:bg-white/90 transition-colors shadow-lg">
                  Subscribe
                </button>
              </div>
            </div>
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          </div> */}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Brand - Using Actual NKH Logo */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30 shadow-lg shadow-fuchsia-500/20">
                  <img
                    src="/Nkhlogo.png"
                    alt={t('layout.footer.brand_title')}
                    className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]"
                  />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white">
                    {t('layout.footer.brand_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-fuchsia-400">{t('layout.footer.brand_subtitle')}</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">
                {t('layout.footer.description')}
              </p>
              {/* Social Media Icons */}
              <div className="flex gap-2 sm:gap-3">
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-fuchsia-600 flex items-center justify-center transition-colors group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 flex items-center justify-center transition-all group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-xl bg-white/10 hover:bg-blue-500 flex items-center justify-center transition-colors group">
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
              </div>
            </div>

            {/* Quick Links - Hide on small mobile */}
            <div className="hidden sm:block">
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('layout.footer.quick_links')}</h4>
              <ul className="space-y-2 sm:space-y-3">
                {navigation.map((item) => (
                  <li key={item.name as string}>
                    <Link href={item.href} className="text-gray-400 hover:text-fuchsia-400 transition-colors flex items-center gap-2 group">
                      <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item.name as string}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('layout.footer.contact_us')}</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-500" />
                  </div>
                  <span className="truncate">{t('layout.footer.phone')}</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-500" />
                  </div>
                  <span className="truncate">{t('layout.footer.email')}</span>
                </li>
                <li className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-400">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-500" />
                  </div>
                  <span className="truncate">{t('layout.footer.address')}</span>
                </li>
              </ul>
            </div>

            {/* Hours */}
            <div>
              <h4 className="font-semibold text-white mb-3 sm:mb-4 text-sm sm:text-base">{t('layout.footer.opening_hours')}</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-400">
                <li className="flex items-center justify-between">
                  <span>{t('layout.footer.days.mon_thu')}</span>
                  <span className="text-white font-medium">{t('layout.footer.hours.mon_thu')}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t('layout.footer.days.fri_sat')}</span>
                  <span className="text-white font-medium">{t('layout.footer.hours.fri_sat')}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>{t('layout.footer.days.sun')}</span>
                  <span className="text-white font-medium">{t('layout.footer.hours.sun')}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <p className="text-gray-400 text-xs sm:text-sm text-center sm:text-left">
              {t('layout.footer.rights_reserved', { year: String(new Date().getFullYear()) })}
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-fuchsia-600 text-gray-400 hover:text-white transition-all group"
            >
              <span className="text-xs sm:text-sm font-medium">{t('layout.footer.back_to_top')}</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 transform group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 15-6-6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </footer >

      {/* Global Search Modal */}
      < GlobalSearch variant="customer" isOpen={search.isOpen} onClose={search.close} />
    </div >
  );
}
