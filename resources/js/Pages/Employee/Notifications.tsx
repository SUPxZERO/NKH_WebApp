import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from '@inertiajs/react';
import {
    Bell,
    CheckCheck,
    Trash2,
    ShoppingBag,
    Gift,
    AlertCircle,
    Clock,
    Loader2,
    Search,
    X,
    Check,
    Calendar,
} from 'lucide-react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';
import { apiGet, apiPost, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { formatDistanceToNow, format } from 'date-fns';
import { useLanguage } from '@/app/context/LanguageContext';

interface Notification {
    id: number;
    type: 'order' | 'shift' | 'system' | 'announcement';
    title: string;
    message: string;
    read: boolean;
    action_url?: string;
    created_at: string;
}

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'order':
            return ShoppingBag;
        case 'shift':
            return Calendar;
        case 'announcement':
            return Gift;
        case 'system':
        default:
            return AlertCircle;
    }
};

const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
        case 'order':
            return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        case 'shift':
            return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
        case 'announcement':
            return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
        case 'system':
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
};

export default function Notifications() {
    const queryClient = useQueryClient();
    const { t } = useLanguage();

    const [filter, setFilter] = useState<'all' | Notification['type']>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const typeLabels = {
        all: t('employee.notifications.types.all'),
        order: t('employee.notifications.types.order'),
        shift: t('employee.notifications.types.shift'),
        announcement: t('employee.notifications.types.announcement'),
        system: t('employee.notifications.types.system'),
    };

    // Fetch notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['notifications', 'employee'],
        queryFn: async () => {
            const response = await apiGet('/api/employee/notifications') as {
                success: boolean;
                data: Notification[];
                unread_count: number;
            };
            return response;
        },
    });

    const notifications = notificationsData?.data || [];
    const unreadCount = notificationsData?.unread_count || 0;

    // Filter notifications
    const filteredNotifications = notifications.filter((n: Notification) => {
        const matchesFilter = filter === 'all' || n.type === filter;
        const matchesSearch = searchQuery === '' ||
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (notificationId: number) => {
            return apiPost(`/api/employee/notifications/${notificationId}/read`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toastSuccess(t('employee.notifications.messages.marked_read'));
        },
    });

    // Mark all as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            return apiPost('/api/employee/notifications/mark-all-read', {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toastSuccess(t('employee.notifications.messages.all_marked_read'));
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (notificationId: number) => {
            return apiDelete(`/api/employee/notifications/${notificationId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toastSuccess(t('employee.notifications.messages.deleted'));
        },
    });

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsReadMutation.mutate(notification.id);
        }
        if (notification.action_url) {
            router.visit(notification.action_url);
        }
    };

    return (
        <EmployeeLayout>
            <div className="max-w-4xl mx-auto space-y-8 p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            {t('employee.notifications.title')}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                            {unreadCount > 0 ? t('employee.notifications.unread', { count: unreadCount }) : t('employee.notifications.all_caught_up')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {unreadCount > 0 && (
                            <Button
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                                variant="outline"
                                className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                            >
                                <CheckCheck className="w-4 h-4" />
                                {t('employee.notifications.mark_all_read')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content Card */}
                <Card hover={false} className="border-0 shadow-lg bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
                    <CardContent className="p-6 space-y-6">
                        {/* Search and Filter Bar */}
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Improved Search Input */}
                            <div className="relative flex-1 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('employee.notifications.search_placeholder')}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                                />
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex overflow-x-auto pb-2 lg:pb-0 gap-2 scrollbar-none">
                                {Object.entries(typeLabels).map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setFilter(key as typeof filter)}
                                        className={cn(
                                            'px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap border',
                                            filter === key
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25'
                                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="space-y-4 min-h-[400px]">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                    <p className="text-gray-500 animate-pulse">{t('employee.common.loading')}</p>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex flex-col items-center justify-center h-96 text-center"
                                >
                                    <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                                        <Bell className="w-12 h-12 text-blue-500/50" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {t('employee.notifications.empty.title')}
                                    </h3>
                                    <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                        {searchQuery ? t('employee.notifications.empty.search') : t('employee.notifications.empty.all_caught_up')}
                                    </p>
                                </motion.div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {filteredNotifications.map((notification: Notification, index: number) => {
                                        const Icon = getNotificationIcon(notification.type);
                                        return (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <div
                                                    onClick={() => handleNotificationClick(notification)}
                                                    className={cn(
                                                        'group relative flex gap-4 p-5 rounded-2xl border transition-all cursor-pointer overflow-hidden',
                                                        notification.read
                                                            ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800'
                                                            : 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                    )}
                                                >
                                                    {/* Unread Indicator Bar */}
                                                    {!notification.read && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600" />
                                                    )}

                                                    {/* Icon */}
                                                    <div className={cn(
                                                        'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105',
                                                        getNotificationColor(notification.type)
                                                    )}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>

                                                    <div className="flex-1 min-w-0 py-0.5">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className={cn(
                                                                        'font-semibold text-lg leading-none',
                                                                        notification.read
                                                                            ? 'text-gray-700 dark:text-gray-200'
                                                                            : 'text-gray-900 dark:text-white'
                                                                    )}>
                                                                        {notification.title}
                                                                    </h4>
                                                                    {!notification.read && (
                                                                        <span className="flex h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                                                                    )}
                                                                </div>
                                                                <p className={cn(
                                                                    'text-sm line-clamp-2 leading-relaxed',
                                                                    notification.read
                                                                        ? 'text-gray-500 dark:text-gray-400'
                                                                        : 'text-gray-600 dark:text-gray-300'
                                                                )}>
                                                                    {notification.message}
                                                                </p>
                                                            </div>

                                                            <div className="text-right flex-shrink-0">
                                                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 block">
                                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Footer Actions */}
                                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                                            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                                                            </div>

                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {!notification.read && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            markAsReadMutation.mutate(notification.id);
                                                                        }}
                                                                        className="p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                                                        title={t('employee.notifications.mark_read')}
                                                                    >
                                                                        <Check className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteMutation.mutate(notification.id);
                                                                    }}
                                                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
                                                                    title={t('employee.common.delete')}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </EmployeeLayout>
    );
}
