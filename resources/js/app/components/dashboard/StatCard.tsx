import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { Skeleton } from '@/app/components/ui/Loading';

export interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red';
    loading?: boolean;
    onClick?: () => void;
}

const colorClasses = {
    blue: {
        icon: 'from-blue-500 to-blue-600',
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-500/10',
    },
    green: {
        icon: 'from-emerald-500 to-emerald-600',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-500/10',
    },
    purple: {
        icon: 'from-purple-500 to-purple-600',
        text: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-500/10',
    },
    orange: {
        icon: 'from-orange-500 to-orange-600',
        text: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-500/10',
    },
    pink: {
        icon: 'from-fuchsia-500 to-pink-600',
        text: 'text-fuchsia-600 dark:text-fuchsia-400',
        bg: 'bg-fuchsia-500/10',
    },
    red: {
        icon: 'from-red-500 to-red-600',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/10',
    },
};

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    loading = false,
    onClick,
}: StatCardProps) {
    const colors = colorClasses[color];

    return (
        <motion.div
            className={cn(
                'relative overflow-hidden rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 p-6 transition-all duration-300',
                onClick && 'cursor-pointer hover:border-fuchsia-500/30 hover:shadow-xl hover:shadow-fuchsia-500/10'
            )}
            whileHover={onClick ? { y: -4 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {title}
                    </p>
                    {loading ? (
                        <Skeleton className="h-8 w-24" />
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {value}
                            </h3>
                            {trend && (
                                <span
                                    className={cn(
                                        'text-sm font-semibold',
                                        trend.isPositive ? 'text-emerald-600' : 'text-red-600'
                                    )}
                                >
                                    {trend.isPositive ? '+' : ''}
                                    {trend.value}%
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div
                    className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg',
                        colors.icon
                    )}
                >
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Decorative gradient */}
            <div className={cn('absolute -right-8 -bottom-8 h-24 w-24 rounded-full blur-2xl opacity-20', colors.bg)} />
        </motion.div>
    );
}

export default StatCard;
