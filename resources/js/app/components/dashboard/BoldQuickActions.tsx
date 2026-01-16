import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface QuickAction {
    label: string;
    icon: string;
    href: string;
}

interface BoldQuickActionsProps {
    actions: QuickAction[];
    iconMap: Record<string, React.ComponentType<{ className?: string }>>;
    className?: string;
}

const actionGradients = [
    'from-fuchsia-500 via-purple-500 to-pink-500',
    'from-blue-500 via-cyan-500 to-teal-500',
    'from-orange-500 via-amber-500 to-yellow-500',
    'from-emerald-500 via-green-500 to-teal-500',
    'from-rose-500 via-red-500 to-orange-500',
    'from-indigo-500 via-purple-500 to-fuchsia-500',
];

const actionShadows = [
    'shadow-fuchsia-500/40',
    'shadow-blue-500/40',
    'shadow-orange-500/40',
    'shadow-emerald-500/40',
    'shadow-rose-500/40',
    'shadow-indigo-500/40',
];

const actionLightBgs = [
    'from-fuchsia-50 to-purple-50',
    'from-blue-50 to-cyan-50',
    'from-orange-50 to-amber-50',
    'from-emerald-50 to-green-50',
    'from-rose-50 to-red-50',
    'from-indigo-50 to-purple-50',
];

export function BoldQuickActions({ actions, iconMap, className }: BoldQuickActionsProps) {
    if (!actions || actions.length === 0) return null;

    return (
        <div className={cn('flex sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 justify-center sm:justify-normal gap-4 sm:gap-4', className)}>
            {actions.map((action, index) => {
                const IconComponent = iconMap[action.icon] || iconMap['chart-bar'];
                const gradient = actionGradients[index % actionGradients.length];
                const shadow = actionShadows[index % actionShadows.length];
                const lightBg = actionLightBgs[index % actionLightBgs.length];

                return (
                    <motion.div
                        key={action.label}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.05, type: 'spring', stiffness: 100 }}
                        whileHover={{ y: -8, scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group "
                    >
                        {/* Glow effect - dark mode only */}
                        <div className={cn(
                            'absolute inset-0 rounded-xl sm:rounded-2xl blur-xl opacity-0 dark:group-hover:opacity-50 transition-opacity duration-300',
                            `bg-gradient-to-r ${gradient}`
                        )} />

                        <Link
                            href={action.href}
                            className={cn(
                                'relative flex flex-col items-center gap-1.5 sm:gap-3 p-2.5 sm:p-5 rounded-xl sm:rounded-2xl',
                                // Light mode
                                `bg-gradient-to-br ${lightBg}`,
                                'border border-gray-200',
                                // Dark mode
                                'dark:bg-gradient-to-br dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95',
                                'dark:border-white/10 dark:backdrop-blur-xl',
                                'shadow-lg dark:shadow-2xl transition-all duration-300',
                                'group-hover:border-gray-300 dark:group-hover:border-white/20',
                                `dark:${shadow}`
                            )}
                        >
                            {/* Animated border on hover - dark mode only */}
                            <motion.div
                                className={cn(
                                    'absolute inset-0 rounded-xl sm:rounded-2xl p-[1px] opacity-0 dark:group-hover:opacity-100 transition-opacity',
                                    `bg-gradient-to-r ${gradient}`
                                )}
                            >
                                <div className="w-full h-full rounded-xl sm:rounded-2xl bg-gray-900" />
                            </motion.div>

                            {/* Icon */}
                            <motion.div
                                whileHover={{ rotate: 10 }}
                                className={cn(
                                    'relative z-10 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl',
                                    'bg-gradient-to-br shadow-lg',
                                    gradient,
                                    shadow
                                )}
                            >
                                {IconComponent && <IconComponent className="w-4 h-4 sm:w-6 sm:h-6 text-white" />}

                                {/* Icon pulse - dark mode only */}
                                <motion.div
                                    animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className={cn('absolute inset-0 rounded-lg sm:rounded-xl opacity-0 dark:opacity-100', `bg-gradient-to-br ${gradient}`)}
                                />
                            </motion.div>

                            {/* Label */}
                            <span className="relative z-10 text-[10px] sm:text-sm font-bold text-gray-700 dark:text-white text-center leading-tight">
                                {action.label}
                            </span>

                            {/* Arrow indicator */}
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 0, x: -10 }}
                                whileHover={{ opacity: 1, x: 0 }}
                                className="absolute right-1.5 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/60"
                            >
                                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                            </motion.div>
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default BoldQuickActions;
