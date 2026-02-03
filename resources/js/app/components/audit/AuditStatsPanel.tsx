import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import {
    FileText, Clock, Users, Activity, TrendingUp, AlertTriangle,
    CheckCircle, XCircle, Globe, Shield
} from 'lucide-react';
import { useLanguage } from '@/app/context/LanguageContext';

interface AuditStats {
    total_logs: number;
    today_logs: number;
    week_logs?: number;
    month_logs?: number;
    unique_users: number;
    active_users_today?: number;
    top_action: string;
    top_actions?: Record<string, number>;
    success_count?: number;
    failed_count?: number;
    by_source?: Record<string, number>;
    by_guard?: Record<string, number>;
    latest_timestamp?: string;
}

interface AuditStatsPanelProps {
    stats: AuditStats;
    className?: string;
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    subValue?: string;
    trend?: { value: number; isPositive: boolean };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, subValue, trend }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-all"
    >
        <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
                <p className="text-[10px] sm:text-xs uppercase tracking-wider font-medium text-muted-foreground truncate">
                    {title}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                    <p className={cn('text-xl sm:text-2xl font-bold', color)}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                    {trend && (
                        <span className={cn(
                            'text-xs font-medium',
                            trend.isPositive ? 'text-emerald-500' : 'text-red-500'
                        )}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </span>
                    )}
                </div>
                {subValue && (
                    <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>
                )}
            </div>
            <div className={cn(
                'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                'bg-gradient-to-br opacity-80',
                color.includes('purple') && 'from-purple-500/20 to-fuchsia-500/20',
                color.includes('blue') && 'from-blue-500/20 to-cyan-500/20',
                color.includes('emerald') && 'from-emerald-500/20 to-green-500/20',
                color.includes('amber') && 'from-amber-500/20 to-orange-500/20',
                color.includes('red') && 'from-red-500/20 to-rose-500/20'
            )}>
                <Icon className={cn('w-5 h-5', color)} />
            </div>
        </div>
    </motion.div>
);

export const AuditStatsPanel: React.FC<AuditStatsPanelProps> = ({ stats, className }) => {
    const { t } = useLanguage();
    const successRate = stats.success_count && stats.failed_count
        ? Math.round((stats.success_count / (stats.success_count + stats.failed_count)) * 100)
        : 100;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Primary Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <StatCard
                    title={t('analytics.audit.stats.total_logs') as string}
                    value={stats.total_logs}
                    icon={FileText}
                    color="text-purple-600 dark:text-purple-400"
                />
                <StatCard
                    title={t('analytics.audit.stats.today') as string}
                    value={stats.today_logs}
                    icon={Clock}
                    color="text-blue-600 dark:text-blue-400"
                    subValue={stats.week_logs ? `${stats.week_logs} ${t('analytics.audit.stats.suffixes.this_week')}` : undefined}
                />
                <StatCard
                    title={t('analytics.audit.stats.active_users') as string}
                    value={stats.unique_users}
                    icon={Users}
                    color="text-emerald-600 dark:text-emerald-400"
                    subValue={stats.active_users_today ? `${stats.active_users_today} ${t('analytics.audit.stats.suffixes.today')}` : undefined}
                />
                <StatCard
                    title={t('analytics.audit.stats.top_action') as string}
                    value={stats.top_action || 'N/A'}
                    icon={Activity}
                    color="text-amber-600 dark:text-amber-400"
                />
                <StatCard
                    title={t('analytics.audit.stats.success_rate') as string}
                    value={`${successRate}%`}
                    icon={successRate >= 95 ? CheckCircle : AlertTriangle}
                    color={successRate >= 95 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
                    subValue={stats.failed_count ? `${stats.failed_count} ${t('analytics.audit.stats.suffixes.failed')}` : undefined}
                />
            </div>

            {/* Secondary Stats - Source/Guard Distribution */}
            {(stats.by_source || stats.by_guard) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* By Source */}
                    {stats.by_source && Object.keys(stats.by_source).length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold text-foreground">{t('analytics.audit.stats.by_source')}</h3>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(stats.by_source).map(([source, count]) => {
                                    const percentage = Math.round((count / stats.total_logs) * 100);
                                    return (
                                        <div key={source} className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground w-16 capitalize">{source}</span>
                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-12 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* By Guard */}
                    {stats.by_guard && Object.keys(stats.by_guard).length > 0 && (
                        <div className="bg-card border border-border rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold text-foreground">{t('analytics.audit.stats.by_guard')}</h3>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(stats.by_guard).map(([guard, count]) => {
                                    const percentage = Math.round((count / stats.total_logs) * 100);
                                    return (
                                        <div key={guard} className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground w-16 capitalize">{guard}</span>
                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full"
                                                />
                                            </div>
                                            <span className="text-xs text-muted-foreground w-12 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Top Actions Bar Chart */}
            {stats.top_actions && Object.keys(stats.top_actions).length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">{t('analytics.audit.stats.top_actions')}</h3>
                    </div>
                    <div className="flex items-end gap-2 h-24">
                        {Object.entries(stats.top_actions).slice(0, 5).map(([action, count], index) => {
                            const maxCount = Math.max(...Object.values(stats.top_actions!));
                            const height = Math.max((count / maxCount) * 100, 10);
                            const colors = [
                                'from-purple-500 to-fuchsia-500',
                                'from-blue-500 to-cyan-500',
                                'from-emerald-500 to-green-500',
                                'from-amber-500 to-orange-500',
                                'from-red-500 to-rose-500'
                            ];
                            return (
                                <div key={action} className="flex-1 flex flex-col items-center gap-1">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${height}%` }}
                                        className={cn(
                                            'w-full rounded-t-md bg-gradient-to-t',
                                            colors[index % colors.length]
                                        )}
                                    />
                                    <span className="text-[10px] text-muted-foreground truncate w-full text-center capitalize">
                                        {action}
                                    </span>
                                    <span className="text-xs font-medium text-foreground">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditStatsPanel;
