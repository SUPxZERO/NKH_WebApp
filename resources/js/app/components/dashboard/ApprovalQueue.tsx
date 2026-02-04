import React from 'react';
import { motion } from 'framer-motion';
import { Link } from '@inertiajs/react';
import {
    ClipboardList, Clock, CheckCircle, AlertCircle,
    ChevronRight, Timer
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useTranslation } from '@/app/hooks/useTranslation';

interface ApprovalItem {
    type: string;
    count: number;
    href: string;
}

interface ApprovalQueueProps {
    approvals: {
        orders: number;
        time_off: number;
        inventory: number;
    };
    className?: string;
}

const approvalTypes = [
    {
        key: 'orders',
        label: 'Order Approvals',
        icon: ClipboardList,
        href: '/admin/orders?approval_status=pending',
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-500/10',
        textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
        key: 'time_off',
        label: 'Time Off Requests',
        icon: Clock,
        href: '/admin/time-off-requests?status=pending',
        color: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-500/10',
        textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
        key: 'inventory',
        label: 'Inventory Adjustments',
        icon: Timer,
        href: '/admin/inventory-adjustments?status=pending',
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-500/10',
        textColor: 'text-purple-600 dark:text-purple-400',
    },
];

export function ApprovalQueue({ approvals, className }: ApprovalQueueProps) {
    const { t } = useTranslation();
    const totalPending = (approvals?.orders || 0) + (approvals?.time_off || 0) + (approvals?.inventory || 0);

    return (
        <div className={cn(
            'rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 p-6',
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/25">
                        <ClipboardList className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{t('admin.dashboard.approvals.title')}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.approvals.subtitle')}</p>
                    </div>
                </div>
                {totalPending > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                            {t('admin.dashboard.approvals.pending_count', { count: totalPending.toString() })}
                        </span>
                    </div>
                )}
            </div>

            {/* Approval items */}
            <div className="space-y-3">
                {approvalTypes.map((item, index) => {
                    const count = approvals?.[item.key as keyof typeof approvals] || 0;
                    const Icon = item.icon;

                    return (
                        <motion.div
                            key={item.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Link
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-4 p-4 rounded-xl transition-all',
                                    'bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200/50 dark:border-gray-700/50',
                                    'hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:border-transparent',
                                    'group'
                                )}
                            >
                                {/* Icon */}
                                <div className={cn(
                                    'flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br shadow-lg transition-transform group-hover:scale-110',
                                    item.color
                                )}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>

                                {/* Label */}
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {t(`admin.dashboard.approvals.${item.key}`)}
                                    </p>
                                    {count > 0 && (
                                        <p className={cn('text-sm font-medium', item.textColor)}>
                                            {t('admin.dashboard.approvals.awaiting', { count: count.toString() })}
                                        </p>
                                    )}
                                </div>

                                {/* Count badge */}
                                {count > 0 ? (
                                    <div className={cn(
                                        'flex items-center justify-center w-8 h-8 rounded-full font-bold text-white',
                                        'bg-gradient-to-br',
                                        item.color
                                    )}>
                                        {count}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="text-sm font-medium">{t('admin.dashboard.approvals.clear')}</span>
                                    </div>
                                )}

                                {/* Arrow */}
                                <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

export default ApprovalQueue;
