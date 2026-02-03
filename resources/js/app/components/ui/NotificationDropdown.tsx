import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Bell,
    Check,
    CheckCheck,
    X,
    ShoppingBag,
    Gift,
    AlertCircle,
    Clock,
    Loader2,
    Settings,
    Trash2,
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { apiGet, apiPost, apiDelete } from '@/app/utils/api';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
    id: number;
    type: 'order' | 'promotion' | 'reward' | 'system';
    title: string;
    message: string;
    read: boolean;
    action_url?: string;
    created_at: string;
}

interface NotificationDropdownProps {
    className?: string;
    variant?: 'customer' | 'admin' | 'employee';
}

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'order':
            return ShoppingBag;
        case 'promotion':
            return Gift;
        case 'reward':
            return Gift;
        case 'system':
        default:
            return AlertCircle;
    }
};

const getNotificationColor = (type: Notification['type'], variant: string) => {
    switch (type) {
        case 'order':
            return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        case 'promotion':
            return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
        case 'reward':
            return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'system':
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
};

export default function NotificationDropdown({ className, variant = 'customer' }: NotificationDropdownProps) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // Determine API prefix based on variant
    const apiPrefix = variant === 'admin' ? '/api/admin' : variant === 'employee' ? '/api/employee' : '/api/customer';

    // Fetch notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['notifications', variant],
        queryFn: async () => {
            try {
                const response = await apiGet(`${apiPrefix}/notifications`) as {
                    success: boolean;
                    data: Notification[];
                    unread_count: number
                };
                return response;
            } catch (error) {
                // Return empty data if API not available
                return { data: [], unread_count: 0 };
            }
        },
        staleTime: 0,
    });

    const notifications = notificationsData?.data || [];
    const unreadCount = notificationsData?.unread_count || notifications.filter((n: Notification) => !n.read).length;

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: number) => {
            return apiPost(`${apiPrefix}/notifications/${notificationId}/read`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', variant] });
        },
    });

    // Mark all as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            return apiPost(`${apiPrefix}/notifications/mark-all-read`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', variant] });
        },
    });

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get accent color based on variant
    const getAccentColor = () => {
        switch (variant) {
            case 'admin':
                return 'text-purple-600 dark:text-purple-400';
            case 'employee':
                return 'text-blue-600 dark:text-blue-400';
            default:
                return 'text-fuchsia-600 dark:text-fuchsia-400';
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsReadMutation.mutate(notification.id);
        }
        if (notification.action_url) {
            setIsOpen(false);
            router.visit(notification.action_url);
        }
    };

    return (
        <div className={cn('relative z-[9999]', className)} ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'relative p-2.5 rounded-xl transition-colors',
                    'hover:bg-black/5 dark:hover:bg-white/10',
                    isOpen && 'bg-black/5 dark:bg-white/10'
                )}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </button>

            {/* Dropdown */}
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

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className={cn(
                                'absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] z-[9999]',
                                'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl',
                                'border border-gray-100 dark:border-gray-800',
                                'overflow-hidden'
                            )}
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className={cn('w-5 h-5', getAccentColor())} />
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('common.ui.notifications.title')}</h3>
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                            {t('common.ui.notifications.new', { count: unreadCount.toString() })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllReadMutation.mutate()}
                                            disabled={markAllReadMutation.isPending}
                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                                            title={t('common.ui.notifications.mark_all_read') as string}
                                        >
                                            <CheckCheck className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-[400px] overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                        <p className="text-gray-500 dark:text-gray-400">{t('common.ui.notifications.empty')}</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {notifications.slice(0, 10).map((notification) => {
                                            const Icon = getNotificationIcon(notification.type);
                                            return (
                                                <button
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={cn(
                                                        'w-full p-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                                        !notification.read && 'bg-blue-50/50 dark:bg-blue-900/10'
                                                    )}
                                                >
                                                    <div className="flex gap-3">
                                                        <div className={cn(
                                                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                                                            getNotificationColor(notification.type, variant)
                                                        )}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className={cn(
                                                                    'text-sm',
                                                                    notification.read
                                                                        ? 'text-gray-700 dark:text-gray-300'
                                                                        : 'font-medium text-gray-900 dark:text-white'
                                                                )}>
                                                                    {notification.title}
                                                                </p>
                                                                {!notification.read && (
                                                                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    <Link
                                        href={variant === 'admin' ? '/admin/notifications' : variant === 'employee' ? '/employee/notifications' : '/customer/notifications'}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            'block w-full text-center py-2 text-sm font-medium rounded-xl transition-colors',
                                            'hover:bg-gray-100 dark:hover:bg-gray-700',
                                            getAccentColor()
                                        )}
                                    >
                                        {t('common.ui.notifications.view_all')}
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
