import React from 'react';
import { motion } from 'framer-motion';
import {
    Clock, CheckCircle, XCircle, ChefHat, Bell,
    Package, Truck, AlertCircle, TrendingUp
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useTranslation } from '@/app/hooks/useTranslation';

interface OrderStatusData {
    status: string;
    count: number;
    color?: string;
}

interface OrderStatusDisplayProps {
    data: OrderStatusData[] | Record<string, number>;
    className?: string;
}

const statusConfig: Record<string, {
    icon: typeof Clock;
    gradient: string;
    shadow: string;
    bgGradient: string;
    label: string;
}> = {
    pending: {
        icon: Clock,
        gradient: 'from-amber-400 via-orange-500 to-amber-600',
        shadow: 'shadow-amber-500/40',
        bgGradient: 'from-amber-500/20 to-orange-500/10',
        label: 'Pending',
    },
    confirmed: {
        icon: CheckCircle,
        gradient: 'from-blue-400 via-cyan-500 to-blue-600',
        shadow: 'shadow-blue-500/40',
        bgGradient: 'from-blue-500/20 to-cyan-500/10',
        label: 'Confirmed',
    },
    preparing: {
        icon: ChefHat,
        gradient: 'from-orange-400 via-red-500 to-orange-600',
        shadow: 'shadow-orange-500/40',
        bgGradient: 'from-orange-500/20 to-red-500/10',
        label: 'Preparing',
    },
    ready: {
        icon: Bell,
        gradient: 'from-emerald-400 via-green-500 to-teal-500',
        shadow: 'shadow-emerald-500/40',
        bgGradient: 'from-emerald-500/20 to-green-500/10',
        label: 'Ready',
    },
    served: {
        icon: Package,
        gradient: 'from-purple-400 via-violet-500 to-purple-600',
        shadow: 'shadow-purple-500/40',
        bgGradient: 'from-purple-500/20 to-violet-500/10',
        label: 'Served',
    },
    completed: {
        icon: CheckCircle,
        gradient: 'from-green-400 via-emerald-500 to-teal-600',
        shadow: 'shadow-green-500/40',
        bgGradient: 'from-green-500/20 to-emerald-500/10',
        label: 'Completed',
    },
    cancelled: {
        icon: XCircle,
        gradient: 'from-red-400 via-rose-500 to-red-600',
        shadow: 'shadow-red-500/40',
        bgGradient: 'from-red-500/20 to-rose-500/10',
        label: 'Cancelled',
    },
    delivered: {
        icon: Truck,
        gradient: 'from-indigo-400 via-blue-500 to-indigo-600',
        shadow: 'shadow-indigo-500/40',
        bgGradient: 'from-indigo-500/20 to-blue-500/10',
        label: 'Delivered',
    },
};

const defaultConfig = {
    icon: AlertCircle,
    gradient: 'from-gray-400 via-gray-500 to-gray-600',
    shadow: 'shadow-gray-500/40',
    bgGradient: 'from-gray-500/20 to-gray-500/10',
    label: 'Unknown',
};

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';

export function OrderStatusDisplay({ data: initialData = [], className }: OrderStatusDisplayProps) {
    const { t } = useTranslation();

    const { data: fetchedData } = useQuery({
        queryKey: ['order-stats'],
        queryFn: () => apiGet('/api/admin/dashboard/orders/stats'),
        initialData: { status_counts: initialData },
        refetchInterval: 30000,
    });

    const activeData = fetchedData?.status_counts || initialData;

    // Normalize data to array format (handle null/undefined)
    const normalizedData: OrderStatusData[] = !activeData
        ? []
        : Array.isArray(activeData)
            ? activeData
            : Object.entries(activeData).map(([status, count]) => ({ status, count: Number(count) }));

    const totalOrders = normalizedData.reduce((acc, item) => acc + item.count, 0);
    const maxCount = Math.max(...normalizedData.map(item => item.count), 1);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6',
                // Light mode
                'bg-white border border-gray-200',
                // Dark mode
                'dark:bg-gradient-to-br dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95',
                'dark:border-white/10 dark:backdrop-blur-xl',
                'shadow-xl dark:shadow-2xl',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <motion.div
                        animate={{
                            rotate: [0, 360],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        className="relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500 shadow-lg shadow-fuchsia-500/40"
                    >
                        <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </motion.div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{t('admin.dashboard.order_status.title')}</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.order_status.subtitle')}</p>
                    </div>
                </div>
                <div className="text-right">
                    <motion.span
                        key={totalOrders}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-xl sm:text-3xl font-black bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 dark:from-fuchsia-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
                    >
                        {totalOrders}
                    </motion.span>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('admin.dashboard.order_status.total_orders')}</p>
                </div>
            </div>

            {/* Status bars */}
            <div className="space-y-2.5 sm:space-y-4">
                {normalizedData.map((item, index) => {
                    const config = statusConfig[item.status.toLowerCase()] || defaultConfig;
                    const Icon = config.icon;
                    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                    // Determine translation key
                    const statusKey = item.status.toLowerCase();
                    const label = statusConfig[statusKey]
                        ? t(`admin.dashboard.order_status.${statusKey}`)
                        : (config.label === 'Unknown' ? t('admin.dashboard.order_status.unknown') : item.status);

                    return (
                        <motion.div
                            key={item.status}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.08, type: 'spring', stiffness: 100 }}
                            className="group"
                        >
                            <div className="flex items-center gap-3 sm:gap-4">
                                {/* Icon */}
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 10 }}
                                    className={cn(
                                        'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl',
                                        'bg-gradient-to-br',
                                        config.gradient,
                                        'shadow-lg',
                                        config.shadow
                                    )}
                                >
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </motion.div>

                                {/* Bar container */}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                        <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-white capitalize">
                                            {label}
                                        </span>
                                        <motion.span
                                            key={item.count}
                                            initial={{ scale: 1.5 }}
                                            animate={{ scale: 1 }}
                                            className={cn(
                                                'text-xs sm:text-sm font-bold bg-gradient-to-r bg-clip-text text-transparent',
                                                config.gradient
                                            )}
                                        >
                                            {item.count}
                                        </motion.span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="relative h-2 sm:h-3 rounded-full bg-gray-100 dark:bg-gray-800/80 overflow-hidden">
                                        {/* Glow effect - dark mode only */}
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                                            className={cn(
                                                'absolute inset-y-0 left-0 rounded-full blur-sm opacity-0 dark:opacity-60',
                                                'bg-gradient-to-r',
                                                config.gradient
                                            )}
                                        />
                                        {/* Main bar */}
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                                            className={cn(
                                                'relative h-full rounded-full',
                                                'bg-gradient-to-r',
                                                config.gradient,
                                                'shadow-lg',
                                                config.shadow
                                            )}
                                        >
                                            {/* Animated shine effect */}
                                            <motion.div
                                                animate={{ x: ['-100%', '200%'] }}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                            />
                                        </motion.div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Empty state */}
            {normalizedData.length === 0 && (
                <div className="text-center py-6 sm:py-8">
                    <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-gray-400 dark:text-gray-600 mb-2 sm:mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.order_status.no_orders')}</p>
                </div>
            )}

            {/* Decorative corner gradient */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-fuchsia-500/10 dark:from-fuchsia-500/20 to-purple-500/5 dark:to-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-blue-500/10 dark:from-blue-500/20 to-cyan-500/5 dark:to-cyan-500/10 rounded-full blur-3xl" />
        </motion.div>
    );
}

export default OrderStatusDisplay;
