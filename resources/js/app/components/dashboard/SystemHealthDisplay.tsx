import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap, Database, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface SystemHealthProps {
    health?: {
        api: { status: string; uptime: string };
        database: { status: string; connections: string };
        queue: { status: string; pending: number };
    };
    className?: string;
}

const statusColors = {
    healthy: {
        gradient: 'from-emerald-500 via-green-500 to-teal-500',
        shadow: 'shadow-emerald-500/50',
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-100 dark:bg-emerald-500/20',
        pulse: 'bg-emerald-500',
        lightBg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    },
    warning: {
        gradient: 'from-amber-500 via-orange-500 to-yellow-500',
        shadow: 'shadow-amber-500/50',
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-500/20',
        pulse: 'bg-amber-500',
        lightBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    },
    error: {
        gradient: 'from-red-500 via-rose-500 to-pink-500',
        shadow: 'shadow-red-500/50',
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-100 dark:bg-red-500/20',
        pulse: 'bg-red-500',
        lightBg: 'bg-gradient-to-br from-red-50 to-rose-50',
    },
};

export function SystemHealthDisplay({ health, className }: SystemHealthProps) {
    const getStatusType = (status: string) => {
        if (status === 'healthy' || status === 'active') return 'healthy';
        if (status === 'warning' || status === 'degraded') return 'warning';
        return 'error';
    };

    const cards = [
        {
            title: 'API Gateway',
            icon: Zap,
            status: health?.api?.status || 'healthy',
            value: health?.api?.uptime || '99.9%',
            label: 'Uptime',
        },
        {
            title: 'Database',
            icon: Database,
            status: health?.database?.connections === 'active' ? 'healthy' : 'warning',
            value: health?.database?.connections || 'Active',
            label: 'Connection',
        },
        {
            title: 'Job Queue',
            icon: Clock,
            status: (health?.queue?.pending || 0) > 10 ? 'warning' : 'healthy',
            value: String(health?.queue?.pending || 0),
            label: 'Pending',
        },
    ];

    return (
        <div className={cn('hidden sm:grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4', className)}>
            {cards.map((card, index) => {
                const statusType = getStatusType(card.status);
                const colors = statusColors[statusType];
                const Icon = card.icon;

                return (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 30, rotateX: -15 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ delay: index * 0.1, type: 'spring', stiffness: 100 }}
                        whileHover={{
                            y: -8,
                            scale: 1.02,
                            transition: { duration: 0.2 }
                        }}
                        className="relative group perspective-1000"
                    >
                        {/* Glow effect behind card - dark mode only */}
                        <div className={cn(
                            'absolute inset-0 rounded-xl sm:rounded-2xl blur-xl opacity-0 dark:opacity-40 dark:group-hover:opacity-60 transition-opacity duration-300',
                            `bg-gradient-to-r ${colors.gradient}`
                        )} />

                        {/* Main card */}
                        <div className={cn(
                            'relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5',
                            // Light mode
                            colors.lightBg,
                            'border border-gray-200',
                            // Dark mode
                            'dark:bg-gradient-to-br dark:from-gray-900/90 dark:via-gray-800/90 dark:to-gray-900/90',
                            'dark:border-white/10 dark:backdrop-blur-xl',
                            'shadow-lg dark:shadow-2xl',
                            `dark:${colors.shadow}`
                        )}>
                            {/* Top section */}
                            <div className="flex items-center justify-between mb-2 sm:mb-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    {/* Icon container */}
                                    <motion.div
                                        animate={{
                                            boxShadow: [
                                                `0 0 20px rgba(16, 185, 129, 0.4)`,
                                                `0 0 40px rgba(16, 185, 129, 0.6)`,
                                                `0 0 20px rgba(16, 185, 129, 0.4)`,
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className={cn(
                                            'relative flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl',
                                            'bg-gradient-to-br',
                                            colors.gradient,
                                            'shadow-lg',
                                            colors.shadow
                                        )}
                                    >
                                        <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                                        {/* Pulse ring */}
                                        <motion.div
                                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className={cn('absolute inset-0 rounded-lg sm:rounded-xl', colors.pulse)}
                                        />
                                    </motion.div>

                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white text-xs sm:text-sm">{card.title}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                className={cn('w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full', colors.pulse)}
                                            />
                                            <span className={cn('text-[10px] sm:text-xs font-medium capitalize', colors.text)}>
                                                {card.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status checkmark */}
                                <div className={cn(
                                    'p-1 sm:p-1.5 rounded-md sm:rounded-lg',
                                    colors.bg
                                )}>
                                    {statusType === 'healthy' ? (
                                        <CheckCircle className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', colors.text)} />
                                    ) : (
                                        <AlertTriangle className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4', colors.text)} />
                                    )}
                                </div>
                            </div>

                            {/* Value display */}
                            <div className="mt-1 sm:mt-2">
                                <div className="flex items-baseline gap-2">
                                    <span className={cn(
                                        'text-2xl sm:text-3xl font-black bg-gradient-to-r bg-clip-text text-transparent',
                                        colors.gradient
                                    )}>
                                        {card.value}
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">{card.label}</p>
                            </div>

                            {/* Bottom decorative line */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                                className={cn(
                                    'absolute bottom-0 left-0 h-1 rounded-full',
                                    'bg-gradient-to-r',
                                    colors.gradient
                                )}
                            />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default SystemHealthDisplay;
