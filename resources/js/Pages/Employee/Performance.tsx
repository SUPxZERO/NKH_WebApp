import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import { apiGet } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import {
    Clock,
    DollarSign,
    TrendingUp,
    Star,
    Loader2,
    Activity,
} from 'lucide-react';

type Period = 'day' | 'week' | 'month' | 'year';

interface PerformanceStats {
    hours_worked: number;
    hours_goal: number;
    earnings: number;
    tips: number;
    rating: number;
    chart_data: { name: string; hours: number }[];
    rank_percentile: number;
    period: string;
    period_label: string;
}

export default function Performance() {
    const { t } = useLanguage();
    const [period, setPeriod] = useState<Period>('week');

    const { data: stats, isLoading } = useQuery<PerformanceStats>({
        queryKey: ['employeePerformance', period],
        queryFn: async () => {
            const res = await apiGet(`/api/employee/performance?period=${period}`) as PerformanceStats;
            return res;
        },
    });

    // Get today's index for chart highlight (Monday = 0)
    const getTodayIndex = () => {
        const day = new Date().getDay();
        return (day + 6) % 7;
    };

    return (
        <EmployeeLayout>
            <Head title={t('employee.performance.title')} />

            <div className="space-y-6 h-screen">
                {/* Header with Period Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div>
                        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 sm:w-8 sm:h-8 text-purple-500" />
                            {t('employee.performance.title')}
                        </h1>
                        <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                            {stats?.period_label || t('employee.performance.track')}
                        </p>
                    </div>

                    {/* Period Tabs - Matches Schedule.tsx pattern */}
                    <div className="flex bg-white/5 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
                        {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={cn(
                                    'px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all',
                                    period === p
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                )}
                            >
                                {t(`employee.performance.period.${p}`)}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {isLoading ? (
                    /* Loading State - Using Skeleton Component */
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-24 sm:h-28 rounded-xl" />
                            ))}
                        </div>
                        <Skeleton className="h-80 rounded-xl" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Stats Grid - Gradient Cards Matching Dashboard */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                            {/* Hours Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
                                    <Clock className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10" />
                                    <div className="relative z-10">
                                        <p className="text-[10px] sm:text-xs font-medium text-blue-100 uppercase tracking-wide">{t('employee.performance.labels.hours')}</p>
                                        <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">
                                            {stats?.hours_worked ?? 0}h
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-blue-200 mt-1">
                                            {t('employee.performance.goal', { goal: stats?.hours_goal ?? 40 })}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Earnings Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden">
                                    <DollarSign className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10" />
                                    <div className="relative z-10">
                                        <p className="text-[10px] sm:text-xs font-medium text-emerald-100 uppercase tracking-wide">{t('employee.performance.labels.earnings')}</p>
                                        <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">
                                            ${stats?.earnings ?? 0}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-emerald-200 mt-1">
                                            {t('employee.performance.labels.base_wage')}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Tips Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-purple-500/10 relative overflow-hidden">
                                    <TrendingUp className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10" />
                                    <div className="relative z-10">
                                        <p className="text-[10px] sm:text-xs font-medium text-purple-100 uppercase tracking-wide">{t('employee.performance.labels.tips')}</p>
                                        <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">
                                            ${stats?.tips ?? 0}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-purple-200 mt-1">
                                            {t('employee.performance.labels.estimated')}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Rating Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                            >
                                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-amber-500/10 relative overflow-hidden">
                                    <Star className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10" />
                                    <div className="relative z-10">
                                        <p className="text-[10px] sm:text-xs font-medium text-amber-100 uppercase tracking-wide">{t('employee.performance.labels.rating')}</p>
                                        <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">
                                            {stats?.rating && stats.rating > 0 ? stats.rating : t('employee.performance.labels.na')}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-amber-200 mt-1">
                                            {stats?.rank_percentile
                                                ? t('employee.performance.labels.top_percentile', { percentile: stats.rank_percentile })
                                                : t('employee.performance.labels.customer_feedback')
                                            }
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Activity Chart - Simple Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <CardHeader className="py-3 px-4 sm:px-6 border-b border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {period === 'week'
                                                ? t('employee.performance.period.week')
                                                : period === 'month'
                                                    ? t('employee.performance.period.month')
                                                    : period === 'year'
                                                        ? t('employee.performance.period.year')
                                                        : t('employee.performance.period.day')
                                            } {t('employee.performance.activity')}
                                        </h3>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {stats?.period_label}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 sm:p-6">
                                    {stats?.chart_data && stats.chart_data.length > 0 ? (
                                        <div className="h-64 sm:h-80 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={stats.chart_data}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-20" />
                                                    <XAxis
                                                        dataKey="name"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 12 }}
                                                        width={30}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                                        contentStyle={{
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                            backgroundColor: 'white'
                                                        }}
                                                        formatter={(value: number | undefined) => [`${value ?? 0}h`, t('employee.performance.labels.hours')]}
                                                    />
                                                    <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                                                        {stats.chart_data.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={period === 'week' && index === getTodayIndex() ? '#a855f7' : '#cbd5e1'}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-64 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                            <div className="text-center">
                                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                <p className="text-sm">{t('employee.performance.no_activity')}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}
