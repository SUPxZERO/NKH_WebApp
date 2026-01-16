import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@inertiajs/react';
import {
    AlertTriangle, Clock, Package, Box, Calendar, CreditCard,
    ChevronRight, X, Bell, AlertCircle, Info
} from 'lucide-react';
import { cn } from '@/app/utils/cn';

export interface Alert {
    type: string;
    severity: 'high' | 'medium' | 'low';
    count: number;
    message: string;
    action: string;
}

interface AlertBannerProps {
    alerts: Alert[];
    onDismiss?: (type: string) => void;
    className?: string;
}

const severityConfig = {
    high: {
        bg: 'bg-gradient-to-r from-red-500/10 to-red-600/10 dark:from-red-500/20 dark:to-red-600/20',
        border: 'border-red-500/30',
        text: 'text-red-700 dark:text-red-300',
        icon: AlertTriangle,
        badge: 'bg-red-500',
        glow: 'shadow-red-500/20',
    },
    medium: {
        bg: 'bg-gradient-to-r from-amber-500/10 to-amber-600/10 dark:from-amber-500/20 dark:to-amber-600/20',
        border: 'border-amber-500/30',
        text: 'text-amber-700 dark:text-amber-300',
        icon: AlertCircle,
        badge: 'bg-amber-500',
        glow: 'shadow-amber-500/20',
    },
    low: {
        bg: 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20',
        border: 'border-blue-500/30',
        text: 'text-blue-700 dark:text-blue-300',
        icon: Info,
        badge: 'bg-blue-500',
        glow: 'shadow-blue-500/20',
    },
};

const typeIcons: Record<string, typeof AlertTriangle> = {
    order_approval: Package,
    stock_alert: Box,
    time_off: Calendar,
    inventory_adjustment: Box,
    reservation: Calendar,
    payment_failed: CreditCard,
};

export function AlertBanner({ alerts, onDismiss, className }: AlertBannerProps) {
    if (!alerts || alerts.length === 0) {
        return null;
    }

    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Attention Required</h3>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                        {alerts.length}
                    </span>
                </div>
            </div>

            <AnimatePresence mode="popLayout">
                {alerts.map((alert, index) => {
                    const config = severityConfig[alert.severity];
                    const TypeIcon = typeIcons[alert.type] || config.icon;

                    return (
                        <motion.div
                            key={alert.type}
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -100, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                'relative flex items-center gap-4 p-4 rounded-xl border backdrop-blur-sm transition-all',
                                config.bg,
                                config.border
                            )}
                        >
                            {/* Severity indicator dot */}
                            <div className={cn('absolute top-0 left-0 w-1 h-full rounded-l-xl', config.badge)} />

                            {/* Icon */}
                            <div className={cn(
                                'flex items-center justify-center w-10 h-10 rounded-xl shadow-lg',
                                config.badge,
                                config.glow
                            )}>
                                <TypeIcon className="w-5 h-5 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={cn('font-medium text-sm', config.text)}>
                                    {alert.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn(
                                        'px-2 py-0.5 rounded text-xs font-medium',
                                        config.badge,
                                        'text-white'
                                    )}>
                                        {alert.count} pending
                                    </span>
                                </div>
                            </div>

                            {/* Action button */}
                            <Link
                                href={alert.action}
                                className={cn(
                                    'flex items-center gap-1 px-4 py-2 rounded-lg font-medium text-sm transition-all',
                                    'bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800',
                                    'text-gray-900 dark:text-white shadow-sm hover:shadow-md',
                                    'border border-gray-200/50 dark:border-gray-700/50'
                                )}
                            >
                                View
                                <ChevronRight className="w-4 h-4" />
                            </Link>

                            {/* Dismiss button */}
                            {onDismiss && (
                                <button
                                    onClick={() => onDismiss(alert.type)}
                                    className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

export default AlertBanner;
