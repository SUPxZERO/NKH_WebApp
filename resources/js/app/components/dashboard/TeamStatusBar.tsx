import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import { Users, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useTranslation } from '@/app/hooks/useTranslation';

interface TeamMember {
    position: string;
    count: number;
}

interface TeamStatusProps {
    total: number;
    byPosition: Record<string, number>;
    className?: string;
}

const positionColors: Record<string, string> = {
    'Kitchen': 'from-orange-500 to-red-500',
    'Chef': 'from-orange-500 to-red-500',
    'Service': 'from-blue-500 to-cyan-500',
    'Waiter': 'from-blue-500 to-cyan-500',
    'Cashier': 'from-green-500 to-emerald-500',
    'Manager': 'from-purple-500 to-fuchsia-500',
    'Staff': 'from-gray-500 to-gray-600',
};

export function TeamStatusBar({ total, byPosition, className }: TeamStatusProps) {
    const { t } = useTranslation();
    const positions = Object.entries(byPosition).map(([position, count]) => ({
        position,
        count,
        color: positionColors[position] || 'from-gray-500 to-gray-600',
    }));

    return (
        <div className={cn(
            'rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 p-6',
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.dashboard.team_status.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.team_status.subtitle')}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{total}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.dashboard.team_status.staff_members')}</p>
                </div>
            </div>

            {/* Position breakdown */}
            {positions.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {positions.map((item, index) => (
                        <motion.div
                            key={item.position}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4 border border-gray-200/50 dark:border-gray-700/50"
                        >
                            <div className={cn(
                                'absolute inset-0 opacity-10 bg-gradient-to-br',
                                item.color
                            )} />
                            <p className="text-2xl font-bold text-gray-900 dark:text-white relative z-10">
                                {item.count}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 relative z-10">
                                {item.position}
                            </p>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{t('admin.dashboard.team_status.no_shifts')}</p>
                </div>
            )}

            {/* View schedule link */}
            <div className="mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                <Link
                    href="/admin/shifts"
                    className="flex items-center justify-center gap-2 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-700 dark:hover:text-fuchsia-300 transition-colors"
                >
                    {t('admin.dashboard.team_status.view_schedule')}
                    <CheckCircle2 className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}

export default TeamStatusBar;
