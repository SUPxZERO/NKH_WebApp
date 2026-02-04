import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/app/utils/cn';
import { useTranslation } from '@/app/hooks/useTranslation';
import { apiGet } from '@/app/utils/api';

interface RevenueData {
    date: string;
    label?: string;
    value: number;
}

interface BoldRevenueChartProps {
    data?: RevenueData[] | { data: RevenueData[]; total?: number; revenue?: number; percentage_change?: number; chart_data?: RevenueData[] };
    className?: string;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

// Custom Tooltip component for Recharts
const CustomTooltip = ({ active, payload, label, formatCurrency }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-3 bg-gray-900/90 backdrop-blur-md rounded-lg shadow-xl border border-gray-700 text-white text-sm">
                <p className="font-bold text-gray-300 mb-1">
                    {data.date ? format(new Date(data.date), 'MMM d, yyyy') : label}
                </p>
                <p className="text-emerald-400 font-semibold">{formatCurrency(data.value)}</p>
            </div>
        );
    }
    return null;
};

export function BoldRevenueChart({ data: initialPropData, className }: BoldRevenueChartProps) {
    const { t } = useTranslation();
    const [selectedRange, setSelectedRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    const timeRanges = [
        { key: 'daily', label: t('admin.dashboard.revenue_chart.ranges.daily'), icon: Calendar, description: t('admin.dashboard.revenue_chart.descriptions.daily') },
        { key: 'weekly', label: t('admin.dashboard.revenue_chart.ranges.weekly'), icon: CalendarDays, description: t('admin.dashboard.revenue_chart.descriptions.weekly') },
        { key: 'monthly', label: t('admin.dashboard.revenue_chart.ranges.monthly'), icon: CalendarRange, description: t('admin.dashboard.revenue_chart.descriptions.monthly') },
    ] as const;

    // Normalize initial data to ensure consistent structure
    const normalizedInitialData = useMemo(() => {
        if (!initialPropData) return null;

        // Check if data is an array (simple data points)
        if (Array.isArray(initialPropData)) {
            const revenue = initialPropData.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
            return {
                revenue,
                percentage_change: 0,
                chart_data: initialPropData
            };
        }

        // Check if data has the expected structure (revenue, percentage_change, chart_data)
        const hasStructure = typeof initialPropData === 'object' && 'revenue' in initialPropData;

        if (hasStructure) {
            return initialPropData;
        }

        // If data is just a number
        return {
            revenue: typeof initialPropData === 'number' ? initialPropData : 0,
            percentage_change: 0,
            chart_data: []
        };
    }, [initialPropData]);

    const { data: revenueData, isLoading, isError, refetch } = useQuery({
        queryKey: ['revenue', selectedRange],
        queryFn: () => apiGet(`/api/admin/dashboard/revenue/${selectedRange}`),
        // Use placeholderData (displays immediately but still fetches) instead of initialData (prevents fetch)
        placeholderData: selectedRange === 'daily' ? normalizedInitialData : undefined,
        staleTime: 0, // Always consider data stale so it refetches on query key change
        refetchOnMount: true,
        enabled: true, // Always allow refetching/switching ranges
    });

    // Determine which data to display
    const currentData = revenueData || normalizedInitialData;

    // Safely access data properties with defaults - handle both 'total' (API) and 'revenue' (initial data)
    const totalRevenue = typeof currentData?.total === 'number' ? currentData.total :
        typeof currentData?.revenue === 'number' ? currentData.revenue : 0;
    // Handle both 'data' (API) and 'chart_data' (legacy) field names
    const rawChartData = Array.isArray(currentData?.data) ? currentData.data :
        Array.isArray(currentData?.chart_data) ? currentData.chart_data : [];
    // Normalize chart items to use 'value' field (API returns 'total' per item)
    const chartData = rawChartData.map((item: any) => ({
        ...item,
        value: item.value ?? item.total ?? 0,
    }));
    const percentageChange = typeof currentData?.percentage_change === 'number' ? currentData.percentage_change : 0;

    // Calculate average based on visible data
    const average = useMemo(() => {
        if (!chartData.length) return 0;
        const sum = chartData.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0);
        return sum / chartData.length;
    }, [chartData]);

    // Handle error state
    if (isError) {
        return (
            <div className={cn("flex flex-col items-center justify-center p-8 rounded-2xl bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900", className)}>
                <p className="text-red-500 mb-2">{t('admin.dashboard.revenue_chart.error_title')}</p>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                    {t('admin.dashboard.revenue_chart.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className={cn(
            'relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-8',
            // Light mode: clean white
            'bg-white border border-gray-100',
            // Dark mode: deep gradient
            'dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-black',
            'dark:border-white/5',
            'shadow-xl dark:shadow-2xl',
            className
        )}>
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 relative z-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                                {t('admin.dashboard.revenue_chart.title')}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {timeRanges.find(r => r.key === selectedRange)?.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-baseline gap-3 mt-4">
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-200">
                            {formatCurrency(totalRevenue)}
                        </h2>
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold shadow-sm backdrop-blur-md",
                            percentageChange >= 0
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        )}>
                            {percentageChange >= 0 ? "+" : ""}{percentageChange}%
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-400 mt-2 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                        {t('admin.dashboard.revenue_chart.total_revenue')}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex p-1.5 bg-gray-100/80 dark:bg-white/5 backdrop-blur-lg rounded-xl border border-gray-200/50 dark:border-white/5">
                    {timeRanges.map((range) => {
                        const Icon = range.icon;
                        const isSelected = selectedRange === range.key;
                        return (
                            <button
                                key={range.key}
                                onClick={() => setSelectedRange(range.key)}
                                className={cn(
                                    'relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-300',
                                    isSelected
                                        ? 'text-emerald-700 dark:text-white shadow-md'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5'
                                )}
                            >
                                {isSelected && (
                                    <motion.div
                                        layoutId="activeRange"
                                        className="absolute inset-0 bg-white dark:bg-emerald-600 rounded-lg"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-2">
                                    <Icon className={cn("w-4 h-4", isSelected ? "text-emerald-500 dark:text-emerald-200" : "opacity-70")} />
                                    {range.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chart Area */}
            <div className="w-full relative group mt-4" style={{ height: 300, minHeight: 300 }}>
                {/* Background Grid - CSS Pattern */}
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }}
                />

                <div style={{ width: '100%', minHeight: 280 }}>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <filter id="shadow" height="200%">
                                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#10b981" floodOpacity="0.3" />
                                </filter>
                            </defs>
                            <CartesianGrid
                                vertical={false}
                                strokeDasharray="3 3"
                                stroke="#e5e7eb"
                                strokeOpacity={0.1}
                            />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                                minTickGap={30}
                                tickFormatter={(val) => {
                                    if (selectedRange === 'daily') {
                                        try {
                                            return format(new Date(val), 'MMM d');
                                        } catch {
                                            return val;
                                        }
                                    }
                                    return val;
                                }}
                            />
                            <YAxis
                                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                width={50}
                            />
                            <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#10b981"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                filter="url(#shadow)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Avg Line Overlay */}
                <div className="absolute top-4 right-4 pointer-events-none flex flex-col items-end">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {t(`admin.dashboard.revenue_chart.${selectedRange}_avg`)}
                        </span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(average)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom stats */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-white/5">
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(average)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t(`admin.dashboard.revenue_chart.${selectedRange}_avg`)}
                    </p>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{chartData.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t(`admin.dashboard.revenue_chart.${selectedRange === 'daily' ? 'days' : selectedRange === 'weekly' ? 'weeks' : 'months'}`)}
                    </p>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/10 dark:from-purple-500/20 to-fuchsia-500/5 dark:to-fuchsia-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-fuchsia-500/10 dark:from-fuchsia-500/20 to-pink-500/5 dark:to-pink-500/10 rounded-full blur-3xl" />
        </div>
    );
}

export default BoldRevenueChart;
