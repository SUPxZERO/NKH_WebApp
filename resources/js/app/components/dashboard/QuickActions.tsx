import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/app/utils/cn';

export interface QuickAction {
    id: string;
    label: string;
    description?: string;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red';
    onClick: () => void;
}

interface QuickActionsProps {
    actions: QuickAction[];
    columns?: 2 | 3 | 4;
}

const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-fuchsia-500 to-pink-600',
    red: 'from-red-500 to-red-600',
};

export function QuickActions({ actions, columns = 4 }: QuickActionsProps) {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
    };

    return (
        <div className={cn('grid gap-4', gridCols[columns])}>
            {actions.map((action, index) => {
                const Icon = action.icon;

                return (
                    <motion.button
                        key={action.id}
                        className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 p-6 text-left transition-all duration-300 hover:border-fuchsia-500/30 hover:shadow-xl hover:shadow-fuchsia-500/10"
                        onClick={action.onClick}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Icon */}
                        <div className={cn(
                            'mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110',
                            colorClasses[action.color]
                        )}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>

                        {/* Label */}
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {action.label}
                        </h3>

                        {/* Description */}
                        {action.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {action.description}
                            </p>
                        )}

                        {/* Hover arrow indicator */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                            <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
}

export default QuickActions;
