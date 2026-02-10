import React, { useState, useRef, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    LogOut,
    Settings,
    ShoppingBag,
    Heart,
    MapPin,
    Clock,
    CreditCard,
    Bell,
    Moon,
    Sun,
    ChevronRight,
    Gift,
    Star,
    HelpCircle,
    Shield,
    X,
    LayoutDashboard,
    Users,
    BarChart3,
    ClipboardList,
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useThemeStore } from '@/app/store/theme';
import Avatar from '@/app/components/ui/Avatar';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTranslation } from '@/app/hooks/useTranslation';

type UserRole = 'admin' | 'employee' | 'customer';

interface UserProfileDropdownProps {
    className?: string;
    variant?: UserRole;
}

interface MenuItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

// Menu configurations for different roles
const getMenuConfig = (t: (key: string) => any) => {
    const configs: Record<UserRole, { items: MenuItem[]; bottomItems: MenuItem[] }> = {
        customer: {
            items: [
                { label: t('layout.ui.user_menu.items.profile'), href: '/customer/profile', icon: User },
                { label: t('layout.ui.user_menu.items.orders'), href: '/customer/orders', icon: ShoppingBag },
                { label: t('layout.ui.user_menu.items.addresses'), href: '/customer/profile', icon: MapPin },
                { label: t('layout.ui.user_menu.items.loyalty'), href: '/customer/loyalty', icon: Gift },
            ],
            bottomItems: [
                { label: t('layout.ui.user_menu.items.settings'), href: '/customer/settings', icon: Settings },
                { label: t('layout.ui.user_menu.items.help'), href: '/customer/help', icon: HelpCircle },
            ],
        },
        admin: {
            items: [
                { label: t('layout.ui.user_menu.items.dashboard'), href: '/admin/dashboard', icon: LayoutDashboard },
                { label: t('layout.ui.user_menu.items.manage_users'), href: '/admin/customers', icon: Users },
                { label: t('layout.ui.user_menu.items.analytics'), href: '/admin/sales-analytics', icon: BarChart3 },
                { label: t('layout.ui.user_menu.items.manage_orders'), href: '/admin/orders', icon: ClipboardList },
            ],
            bottomItems: [
                { label: t('layout.ui.user_menu.items.system_settings'), href: '/admin/settings', icon: Settings },
                { label: t('layout.ui.user_menu.items.audit_logs'), href: '/admin/audit-logs', icon: Shield },
            ],
        },
        employee: {
            items: [
                { label: t('layout.ui.user_menu.items.profile'), href: '/employee/settings', icon: User },
                { label: t('layout.ui.user_menu.items.schedule'), href: '/employee/schedule', icon: Clock },
                { label: t('layout.ui.user_menu.items.performance'), href: '/employee/performance', icon: Star },
                { label: t('layout.ui.user_menu.items.notifications'), href: '/employee/notifications', icon: Bell },
            ],
            bottomItems: [
                { label: t('layout.ui.user_menu.items.settings'), href: '/employee/settings', icon: Settings },
                { label: t('layout.ui.user_menu.items.help'), href: '/employee/support', icon: HelpCircle },
            ],
        },
    };
    return configs;
};

// Role-based dashboard redirects
const dashboardPaths: Record<UserRole, string> = {
    admin: '/admin/dashboard',
    employee: '/employee/pos',
    customer: '/dashboard',
};

// Role-based profile paths
const profilePaths: Record<UserRole, string> = {
    admin: '/admin/settings',
    employee: '/employee/settings',
    customer: '/customer/profile',
};

export default function UserProfileDropdown({ className, variant }: UserProfileDropdownProps) {
    const { t } = useTranslation();
    const fallbackName = t('common.ui.user_menu.fallback_name') as string;
    const fallbackInitials = t('common.ui.user_menu.fallback_initials') as string;
    const [isOpen, setIsOpen] = useState(false);
    const { isDark, toggle } = useThemeStore();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Get user from AuthContext (Sourced from Inertia OR Telegram)
    const { user } = useAuth();

    // Determine user role with safe fallback
    const userRole: UserRole = variant || (user?.role as UserRole) || 'customer';
    // Ensure config exists, fallback to customer if role is invalid
    const allConfigs = getMenuConfig(t);
    const config = allConfigs[userRole] || allConfigs['customer'];

    // Get initials from name safely
    const getInitials = (name: string) => {
        if (!name) return fallbackInitials;
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Handle logout
    const handleLogout = () => {
        setIsOpen(false);
        router.post('/logout');
    };

    // Get gradient colors based on role
    const getRoleGradient = () => {
        switch (userRole) {
            case 'admin':
                return 'from-purple-600 to-indigo-600';
            case 'employee':
                return 'from-blue-600 to-cyan-600';
            default:
                return 'from-fuchsia-500 to-pink-500';
        }
    };

    // Get role label
    const getRoleLabel = () => {
        switch (userRole) {
            case 'admin':
                return t('common.ui.user_menu.roles.admin');
            case 'employee':
                return t('common.ui.user_menu.roles.employee');
            default:
                return t('common.ui.user_menu.roles.customer');
        }
    };

    if (!user) {
        return (
            <Link
                href="/login"
                className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all',
                    `bg-gradient-to-r ${getRoleGradient()}`
                )}
            >
                {t('common.ui.user_menu.actions.sign_in')}
            </Link>
        );
    }

    return (
        <div className={cn('relative z-[9999]', className)} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full hover:shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                aria-label={t('common.ui.user_menu.actions.toggle_menu') as string}
            >
                <Avatar
                    src={user.avatar}
                    name={user.name || fallbackName}
                    size="md"
                    fallbackColor={userRole === 'admin' ? 'purple' : userRole === 'employee' ? 'blue' : 'rose'}
                    className={cn(isOpen && 'ring-2 ring-offset-2 ring-purple-500/50')}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] lg:hidden"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className={cn(
                                'absolute right-0 top-full mt-2 w-80 z-[9999]',
                                'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
                                'border border-gray-100 dark:border-gray-800',
                                'overflow-hidden'
                            )}
                        >
                            {/* Header - User Info */}
                            <div className={cn(
                                'p-5 border-b border-gray-100 dark:border-gray-800',
                                userRole === 'admin' && 'bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-900/30 dark:to-indigo-900/30',
                                userRole === 'employee' && 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-900/30 dark:to-cyan-900/30',
                                userRole === 'customer' && 'bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 dark:from-fuchsia-900/30 dark:to-pink-900/30'
                            )}>
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <Avatar
                                        src={user.avatar}
                                        name={user.name || fallbackName}
                                        size="lg"
                                        fallbackColor={userRole === 'admin' ? 'purple' : userRole === 'employee' ? 'blue' : 'rose'}
                                    />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                            {t('common.ui.user_menu.greeting', { name: (user.name || fallbackName).split(' ')[0] })}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {user.email}
                                        </p>
                                        <span className={cn(
                                            'inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full',
                                            userRole === 'admin' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
                                            userRole === 'employee' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
                                            userRole === 'customer' && 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300'
                                        )}>
                                            {getRoleLabel()}
                                        </span>
                                    </div>

                                    {/* Close button */}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                        aria-label={t('common.ui.user_menu.actions.close_menu') as string}
                                    >
                                        <X className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                {/* Manage Account Link */}
                                <Link
                                    href={profilePaths[userRole]}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        'inline-flex items-center gap-1 mt-3 text-sm font-medium',
                                        userRole === 'admin' && 'text-purple-600 dark:text-purple-400 hover:text-purple-700',
                                        userRole === 'employee' && 'text-blue-600 dark:text-blue-400 hover:text-blue-700',
                                        userRole === 'customer' && 'text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700'
                                    )}
                                >
                                    {t('common.ui.user_menu.actions.manage_account')}
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* Menu Items */}
                            <div className="py-2 px-2">
                                {(config?.items || []).map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                        >
                                            <div className={cn(
                                                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                                                'bg-gray-100 dark:bg-gray-800',
                                                userRole === 'admin' && 'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30',
                                                userRole === 'employee' && 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
                                                userRole === 'customer' && 'group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900/30'
                                            )}>
                                                <Icon className={cn(
                                                    'w-5 h-5 transition-colors',
                                                    'text-gray-600 dark:text-gray-400',
                                                    userRole === 'admin' && 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
                                                    userRole === 'employee' && 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
                                                    userRole === 'customer' && 'group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400'
                                                )} />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                                {item.label}
                                            </span>
                                            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

                            {/* Dark Mode Toggle */}
                            <div className="py-2 px-2">
                                <button
                                    onClick={toggle}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group w-full"
                                >
                                    <div className={cn(
                                        'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                                        'bg-gray-100 dark:bg-gray-800',
                                        userRole === 'admin' && 'group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30',
                                        userRole === 'employee' && 'group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30',
                                        userRole === 'customer' && 'group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900/30'
                                    )}>
                                        {isDark ? (
                                            <Sun className="w-5 h-5 text-yellow-500" />
                                        ) : (
                                            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        )}
                                    </div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {isDark ? t('common.ui.user_menu.theme.light') : t('common.ui.user_menu.theme.dark')}
                                    </span>
                                    <div className={cn(
                                        'ml-auto w-11 h-6 rounded-full transition-colors relative',
                                        isDark
                                            ? userRole === 'admin' ? 'bg-purple-500' : userRole === 'employee' ? 'bg-blue-500' : 'bg-fuchsia-500'
                                            : 'bg-gray-200'
                                    )}>
                                        <div className={cn(
                                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                                            isDark ? 'left-6' : 'left-1'
                                        )} />
                                    </div>
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

                            {/* Bottom Items */}
                            <div className="py-2 px-2">
                                {config.bottomItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                        >
                                            <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                                {item.label}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Logout */}
                            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                    {t('common.ui.user_menu.actions.sign_out')}
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
