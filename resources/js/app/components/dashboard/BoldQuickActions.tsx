import React from 'react';
import { motion } from 'framer-motion';
import { router } from '@inertiajs/react';
import {
    ShoppingBag,
    Plus,
    UserPlus,
    Settings,
    Zap,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useTranslation } from '@/app/hooks/useTranslation';



export interface QuickAction {
    label: string;
    icon: string;
    href: string;
}

interface BoldQuickActionsProps {
    className?: string;
    actions?: QuickAction[];
    iconMap?: Record<string, React.ComponentType<{ className?: string }>>;
}

export function BoldQuickActions({ className, actions: propActions, iconMap }: BoldQuickActionsProps) {
    const { t } = useTranslation();

    const defaultActions = [
        {
            label: t('admin.dashboard.quick_actions.actions.new_order'),
            icon: ShoppingBag,
            color: 'from-emerald-400 to-teal-500',
            shadow: 'shadow-emerald-500/30',
            onClick: () => router.visit('/admin/orders')
        },
        {
            label: t('admin.dashboard.quick_actions.actions.add_menu_item'),
            icon: Plus,
            color: 'from-blue-400 to-indigo-500',
            shadow: 'shadow-blue-500/30',
            onClick: () => router.visit('/admin/menu-items')
        },
        {
            label: t('admin.dashboard.quick_actions.actions.staff_schedule'),
            icon: UserPlus,
            color: 'from-purple-400 to-pink-500',
            shadow: 'shadow-purple-500/30',
            onClick: () => router.visit('/admin/shifts')
        },
        {
            label: t('admin.dashboard.quick_actions.actions.settings'),
            icon: Settings,
            color: 'from-orange-400 to-amber-500',
            shadow: 'shadow-orange-500/30',
            onClick: () => router.visit('/admin/settings')
        }
    ];

    // Always use the translated default actions
    // (The props are kept for API compatibility but intentionally ignored
    //  because the backend sends generic role-based actions, not the specific
    //  quick actions we want to display here)

    return (
        <div className={cn(
            'relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6',
            // Light mode: clean white
            'bg-white border border-gray-100',
            // Dark mode: deep gradient
            'dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black',
            'dark:border-white/5',
            'shadow-xl dark:shadow-2xl',
            className
        )}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                    <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                        {t('admin.dashboard.quick_actions.title')}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {t('admin.dashboard.quick_actions.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {defaultActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <motion.button
                            key={action.label + index}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={action.onClick}
                            className={cn(
                                "group relative overflow-hidden p-4 rounded-2xl text-left transition-all duration-300",
                                // Light: colorful but subtle backgrounds
                                "bg-gray-50 hover:bg-white border border-gray-100 hover:border-transparent hover:shadow-xl",
                                // Dark: glassmorphism
                                "dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5",
                            )}
                        >
                            {/* Hover Gradient Overlay */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br",
                                action.color
                            )} />

                            <div className="relative z-10 flex flex-col gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg transform group-hover:scale-110 transition-transform duration-300",
                                    action.color,
                                    action.shadow
                                )}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                    {action.label}
                                </span>
                            </div>

                            {/* Arrow indicator */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
                                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

export default BoldQuickActions;
