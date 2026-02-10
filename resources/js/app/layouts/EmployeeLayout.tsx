import React, { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  ChefHat,
  CalendarDays,
  Settings,
  Truck,
  Banknote,
  Menu as MenuIcon,
  X,
  Bell,
  User,
  LogOut,
  HelpCircle,
  MessageSquare,
  Activity,
  Home,
  Clock,
  TrendingUp,
  Briefcase,
  Search,
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import UserProfileDropdown from '@/app/components/ui/UserProfileDropdown';
import NotificationDropdown from '@/app/components/ui/NotificationDropdown';
import { GlobalSearch, useGlobalSearch } from '@/app/components/ui/GlobalSearch';
import { useSmartPolling } from '@/app/hooks/useSmartPolling';
import { LanguageSwitcher } from '@/app/components/common/LanguageSwitcher';
import { useLanguage } from '@/app/context/LanguageContext';

type Props = { children: React.ReactNode };

const navigation = [
  { name: 'employee.nav.dashboard', href: '/employee/dashboard', icon: Home },
  { name: 'employee.nav.pos', href: '/employee/pos', icon: CreditCard },
  { name: 'employee.nav.kitchen', href: '/employee/kitchen', icon: ChefHat },
  { name: 'employee.nav.delivery', href: '/employee/delivery-orders', icon: Truck },
  { name: 'employee.nav.schedule', href: '/employee/schedule', icon: CalendarDays },
  { name: 'employee.nav.performance', href: '/employee/performance', icon: Activity },
];

const secondaryNav = [
  { name: 'employee.nav.support', href: '/employee/support', icon: HelpCircle },
  { name: 'employee.nav.feedback', href: '/employee/feedback', icon: MessageSquare },
];

export default function EmployeeLayout({ children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { url, props } = usePage<{ auth: { user: any } }>();
  const user = props.auth?.user;
  const search = useGlobalSearch();
  const { t } = useLanguage();

  // Smart Polling for Notifications - 60s
  useSmartPolling(['admin-notifications'], 60000);

  const handleLogout = () => {
    router.post('/logout');
  };

  // Get current time for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('employee.greeting.morning');
    if (hour < 17) return t('employee.greeting.afternoon');
    return t('employee.greeting.evening');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
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
            className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 lg:hidden"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 p-1.5 border border-fuchsia-500/30">
                      <img
                        src="/Nkhlogo.png"
                        alt="NKH"
                        className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]"
                      />
                    </div>
                    <div className="hidden lg:block text-left">
                      <h2 className="font-bold text-gray-900 dark:text-white leading-tight">{t('employee.portal_title')}</h2>
                      <p className="text-xs text-fuchsia-500 font-medium">{t('footer.brand_title')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = url.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{t(item.name)}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('employee.more')}</p>
                  <div className="space-y-1">
                    {secondaryNav.map((item) => {
                      const Icon = item.icon;
                      const isActive = url.startsWith(item.href);
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors',
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{t(item.name)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </nav>

              {/* Mobile Menu Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                >
                  <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                  {t('employee.sign_out')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Using Actual NKH Logo */}
            <Link href="/employee/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
                {/* Logo container */}
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20 p-1.5 backdrop-blur-sm">
                  <img
                    src="/Nkhlogo.png"
                    alt={t('layout.footer.brand_title')}
                    className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(217,70,239,0.4)]"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                  {t('layout.footer.brand_title')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">{t('employee.portal_title')}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center bg-gray-100/60 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = url.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium',
                      isActive
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-gray-600'
                        : 'hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t(item.name)}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={search.open}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                title={t('employee.search_title')}
              >
                <Search className="w-5 h-5" />
              </button>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

              <LanguageSwitcher />

              {/* Quick Stats Badge (Desktop Only) */}
              <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{t('employee.on_duty')}</span>
              </div>

              {/* Notifications */}
              <NotificationDropdown variant="employee" />

              {/* User Profile Dropdown */}
              <UserProfileDropdown variant="employee" />

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('employee.footer', { year: String(new Date().getFullYear()) })}
            </p>
            <div className="flex items-center gap-4">
              {secondaryNav.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {t(item.name)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Global Search Modal */}
      <GlobalSearch variant="employee" isOpen={search.isOpen} onClose={search.close} />
    </div>
  );
}
