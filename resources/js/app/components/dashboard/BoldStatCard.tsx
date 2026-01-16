import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/app/utils/cn';

export interface BoldStatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: 'revenue' | 'orders' | 'active' | 'average' | 'custom';
    gradient?: string;
    loading?: boolean;
    onClick?: () => void;
}

const variantConfig = {
    revenue: {
        gradient: 'from-emerald-400 via-green-500 to-teal-500',
        shadow: 'shadow-emerald-500/40',
        iconBg: 'from-emerald-500 to-teal-600',
        lightBg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    },
    orders: {
        gradient: 'from-blue-400 via-cyan-500 to-blue-600',
        shadow: 'shadow-blue-500/40',
        iconBg: 'from-blue-500 to-cyan-600',
        lightBg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    },
    active: {
        gradient: 'from-orange-400 via-amber-500 to-orange-600',
        shadow: 'shadow-orange-500/40',
        iconBg: 'from-orange-500 to-amber-600',
        lightBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    },
    average: {
        gradient: 'from-purple-400 via-fuchsia-500 to-pink-500',
        shadow: 'shadow-purple-500/40',
        iconBg: 'from-purple-500 to-fuchsia-600',
        lightBg: 'bg-gradient-to-br from-purple-50 to-fuchsia-50',
    },
    custom: {
        gradient: 'from-gray-400 via-gray-500 to-gray-600',
        shadow: 'shadow-gray-500/40',
        iconBg: 'from-gray-500 to-gray-600',
        lightBg: 'bg-gradient-to-br from-gray-50 to-gray-100',
    },
};

export function BoldStatCard({
    title,
    value,
    icon: Icon,
    trend,
    variant = 'custom',
    gradient,
    loading = false,
    onClick,
}: BoldStatCardProps) {
    const config = variantConfig[variant];
    const gradientClass = gradient || config.gradient;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                'relative group overflow-hidden rounded-xl sm:rounded-2xl',
                onClick && 'cursor-pointer'
            )}
        >
            {/* Outer glow - dark mode only */}
            <div className={cn(
                'absolute inset-0 rounded-xl sm:rounded-2xl blur-xl opacity-0 dark:opacity-30 dark:group-hover:opacity-50 transition-opacity duration-500',
                `bg-gradient-to-r ${gradientClass}`
            )} />

            {/* Card container - light and dark variants */}
            <div className={cn(
                'relative overflow-hidden rounded-xl sm:rounded-2xl p-2.5 sm:p-5',
                // Light mode styles
                config.lightBg,
                'border border-gray-200',
                // Dark mode styles
                'dark:bg-gradient-to-br dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95',
                'dark:border-white/10 dark:backdrop-blur-xl',
                'shadow-lg dark:shadow-2xl',
                `dark:${config.shadow}`
            )}>
                {/* Inner card background - dark mode */}
                <div className="absolute inset-[1px] rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-0 dark:opacity-100" />

                {/* Content */}
                <div className="relative z-10">
                    {/* Top section - Title and Icon */}
                    <div className="flex items-center justify-between mb-1.5 sm:mb-4">
                        <span className="text-[10px] sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate mr-1">
                            {title}
                        </span>
                        <motion.div
                            whileHover={{ rotate: 15, scale: 1.1 }}
                            className={cn(
                                'flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl',
                                'bg-gradient-to-br shadow-lg flex-shrink-0',
                                config.iconBg,
                                config.shadow
                            )}
                        >
                            <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                        </motion.div>
                    </div>

                    {/* Value */}
                    <div className="flex items-end justify-between gap-1 sm:gap-2">
                        <div>
                            {loading ? (
                                <div className="h-6 sm:h-9 w-16 sm:w-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                            ) : (
                                <motion.h3
                                    key={String(value)}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={cn(
                                        'text-lg sm:text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent truncate',
                                        gradientClass
                                    )}
                                >
                                    {value}
                                </motion.h3>
                            )}
                        </div>

                        {/* Trend indicator */}
                        {trend && (
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className={cn(
                                    'flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg',
                                    trend.isPositive
                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                )}
                            >
                                {trend.isPositive ? (
                                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                ) : (
                                    <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                )}
                                <span className="text-[10px] sm:text-xs font-bold">
                                    {trend.isPositive ? '+' : ''}{trend.value}%
                                </span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Bottom decorative line */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className={cn(
                        'absolute bottom-0 left-0 right-0 h-1',
                        'bg-gradient-to-r',
                        gradientClass
                    )}
                    style={{ transformOrigin: 'left' }}
                />

                {/* Corner decoration */}
                <div className={cn(
                    'absolute -top-12 -right-12 w-24 h-24 rounded-full blur-2xl opacity-10 dark:opacity-20',
                    `bg-gradient-to-br ${gradientClass}`
                )} />
            </div>
        </motion.div>
    );
}

export default BoldStatCard;
