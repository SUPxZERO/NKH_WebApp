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
    Filter,
    Search,
    X,
    Check,
} from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { RequireAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';
import { apiGet, apiPost, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { formatDistanceToNow, format } from 'date-fns';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Notification {
    id: number;
    type: 'order' | 'promotion' | 'reward' | 'system';
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
        case 'promotion':
            return Gift;
        case 'reward':
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
        case 'promotion':
            return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
        case 'reward':
            return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'system':
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
    }
};

export default function Notifications() {
    const queryClient = useQueryClient();
    const translationContext = useTranslation();
    const t = translationContext?.t || ((key: string) => key);

    const [filter, setFilter] = useState<'all' | Notification['type']>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const typeLabels = {
        all: t('customer.notifications.types.all'),
        order: t('customer.notifications.types.order'),
        promotion: t('customer.notifications.types.promotion'),
        reward: t('customer.notifications.types.reward'),
        system: t('customer.notifications.types.system'),
    };

    // Fetch notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['notifications', 'customer'],
        queryFn: async () => {
            const response = await apiGet('/api/customer/notifications') as {
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
            return apiPost(`/api/customer/notifications/${notificationId}/read`, {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toastSuccess(t('customer.notifications.messages.marked_read'));
        },
    });

    // Mark all as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            return apiPost('/api/customer/notifications/mark-all-read', {});
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toastSuccess(t('customer.notifications.messages.all_marked_read'));
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (notificationId: number) => {
            return apiDelete(`/api/customer/notifications/${notificationId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toastSuccess(t('customer.notifications.messages.deleted'));
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
        <RequireAuth roles={['customer']}>
            <CustomerLayout>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                                {t('customer.notifications.title')}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {unreadCount > 0 ? t('customer.notifications.unread', { count: unreadCount }) : t('customer.notifications.all_caught_up')}
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <CheckCheck className="w-4 h-4" />
                                {t('customer.notifications.mark_all_read')}
                            </Button>
                        )}
                    </div>

                    {/* Filters */}
                    <Card hover={false}>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Search */}
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={t('customer.notifications.search_placeholder')}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-fuchsia-500/50 focus:outline-none text-gray-900 dark:text-white placeholder-gray-500"
                                    />
                                </div>

                                {/* Type Filter */}
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(typeLabels).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => setFilter(key as typeof filter)}
                                            className={cn(
                                                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                                                filter === key
                                                    ? 'bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications List */}
                    {isLoading ? (
                        <Card hover={false}>
                            <CardContent className="p-12 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                            </CardContent>
                        </Card>
                    ) : filteredNotifications.length === 0 ? (
                        <Card hover={false}>
                            <CardContent className="p-12 text-center">
                                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    {t('customer.notifications.empty.title')}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {searchQuery ? t('customer.notifications.empty.search') : t('customer.notifications.empty.all_caught_up')}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            <AnimatePresence>
                                {filteredNotifications.map((notification: Notification, index: number) => {
                                    const Icon = getNotificationIcon(notification.type);
                                    return (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -100 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Card hover={false} className={cn(
                                                'cursor-pointer transition-all',
                                                !notification.read && 'ring-2 ring-fuchsia-500/20 bg-fuchsia-50/50 dark:bg-fuchsia-900/10'
                                            )}>
                                                <CardContent className="p-4">
                                                    <div className="flex gap-4">
                                                        <div className={cn(
                                                            'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                                                            getNotificationColor(notification.type)
                                                        )}>
                                                            <Icon className="w-6 h-6" />
                                                        </div>

                                                        <div
                                                            className="flex-1 min-w-0"
                                                            onClick={() => handleNotificationClick(notification)}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <h3 className={cn(
                                                                        'font-medium',
                                                                        notification.read
                                                                            ? 'text-gray-700 dark:text-gray-300'
                                                                            : 'text-gray-900 dark:text-white'
                                                                    )}>
                                                                        {notification.title}
                                                                    </h3>
                                                                    {!notification.read && (
                                                                        <span className="w-2 h-2 rounded-full bg-fuchsia-500" />
                                                                    )}
                                                                </div>
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                                {notification.message}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2">
                                                            {!notification.read && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        markAsReadMutation.mutate(notification.id);
                                                                    }}
                                                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                                                                    title={t('customer.notifications.actions.mark_read')}
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    deleteMutation.mutate(notification.id);
                                                                }}
                                                                className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 transition-colors"
                                                                title={t('customer.notifications.actions.delete')}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </CustomerLayout>
        </RequireAuth>
    );
}
