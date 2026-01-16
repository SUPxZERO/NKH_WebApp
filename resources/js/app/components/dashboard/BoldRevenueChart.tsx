import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/app/utils/cn';
import { apiGet } from '@/app/utils/api';

interface RevenueData {
    date: string;
    label?: string;
    total: number;
}

interface BoldRevenueChartProps {
    data?: RevenueData[] | { data: RevenueData[]; total: number; range?: string; count?: number };
    className?: string;
}

const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const timeRanges = [
    { key: 'daily', label: 'Daily', icon: Calendar, description: 'Last 7 days' },
    { key: 'weekly', label: 'Weekly', icon: CalendarDays, description: 'Last 4 weeks' },
    { key: 'monthly', label: 'Monthly', icon: CalendarRange, description: 'Last 6 months' },
] as const;

export function BoldRevenueChart({ data: initialPropData, className }: BoldRevenueChartProps) {
    const [selectedRange, setSelectedRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

    // Normalize initial data to ensure consistent structure
    const normalizedInitialData = React.useMemo(() => {
        if (!initialPropData) return undefined;
        // Check if it's the raw array (legacy) or the full object
        if (Array.isArray(initialPropData)) {
            return {
                data: initialPropData,
                total: initialPropData.reduce((acc, item) => acc + (Number(item.total) || 0), 0),
                range: 'daily', // Assumption for legacy array data
                count: initialPropData.length
            };
        }
        return initialPropData;
    }, [initialPropData]);

    // Only use initial data for hydration if the range matches strictly
    // Since the controller defaults to 'daily', we use it for 'daily' selection.
    const queryInitialData = (normalizedInitialData && normalizedInitialData.range === selectedRange)
        ? normalizedInitialData
        : undefined;

    // Fetch revenue data based on selected range
    const { data: revenueResponse, isLoading, isError, error } = useQuery({
        queryKey: ['dashboard-revenue', selectedRange],
        queryFn: () => apiGet(`/api/admin/dashboard/revenue/${selectedRange}`),
        staleTime: 60000, // Consider data fresh for 1 minute
        refetchOnWindowFocus: false,
        initialData: queryInitialData, // Hydrate directly to prevent flash
    });

    // Safely extract data and total
    const chartData = revenueResponse?.data || [];
    const totalRevenue = revenueResponse?.total ?? 0;

    const avgRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;

    if (isError) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                    'relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6',
                    'bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900',
                    'shadow-xl',
                    className
                )}
            >
                <div className="flex flex-col items-center justify-center h-[300px] text-red-500">
                    <p className="font-bold mb-2">Error loading revenue data</p>
                    <p className="text-sm text-center">{(error as any)?.message || 'Unknown error occurred'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-sm hover:bg-red-200"
                    >
                        Retry
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6',
                'bg-white dark:bg-gradient-to-br dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95',
                'border border-gray-200 dark:border-white/10 backdrop-blur-xl',
                'shadow-xl dark:shadow-2xl dark:shadow-purple-500/20',
                className
            )}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <motion.div
                        animate={{
                            boxShadow: [
                                '0 0 20px rgba(139, 92, 246, 0.4)',
                                '0 0 40px rgba(139, 92, 246, 0.6)',
                                '0 0 20px rgba(139, 92, 246, 0.4)',
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-pink-500 shadow-lg shadow-purple-500/40"
                    >
                        <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </motion.div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">Revenue Overview</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {timeRanges.find(r => r.key === selectedRange)?.description}
                        </p>
                    </div>
                </div>

                <div className="text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-0 pl-10 sm:pl-0">
                    <motion.span
                        key={totalRevenue}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-lg sm:text-2xl font-black bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 dark:from-purple-400 dark:via-fuchsia-400 dark:to-pink-400 bg-clip-text text-transparent"
                    >
                        {formatCurrency(totalRevenue)}
                    </motion.span>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
                </div>
            </div>

            {/* Time Range Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-6 p-1 bg-gray-100 dark:bg-white/5 rounded-lg sm:rounded-xl">
                {timeRanges.map((range) => {
                    const Icon = range.icon;
                    const isSelected = selectedRange === range.key;

                    return (
                        <motion.button
                            key={range.key}
                            onClick={() => setSelectedRange(range.key)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-md sm:rounded-lg',
                                'font-medium text-xs sm:text-sm transition-all duration-200',
                                isSelected
                                    ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                            )}
                        >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{range.label}</span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Chart */}
            <div className="h-[200px] sm:h-[240px] relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-xl z-10">
                        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="boldRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                                <stop offset="50%" stopColor="#d946ef" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="boldLineGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#a855f7" />
                                <stop offset="50%" stopColor="#d946ef" />
                                <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                        </defs>
                        {/* CartesianGrid removed as per user request to hide pattern lines */}
                        <XAxis
                            dataKey={selectedRange === 'daily' ? 'date' : 'label'}
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
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                        />
                        <YAxis
                            tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 11 }}
                            width={50}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            }}
                            labelStyle={{ color: '#9ca3af' }}
                            formatter={(value) => [formatCurrency(typeof value === 'number' ? value : 0), 'Revenue']}
                            labelFormatter={(label) => {
                                if (selectedRange === 'daily') {
                                    try {
                                        return format(new Date(label), 'EEEE, MMM d');
                                    } catch {
                                        return label;
                                    }
                                }
                                return label;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="url(#boldLineGradient)"
                            strokeWidth={3}
                            fill="url(#boldRevenueGradient)"
                            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#d946ef' }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Bottom stats */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-white/5">
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(avgRevenue)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedRange === 'daily' ? 'Daily Avg' : selectedRange === 'weekly' ? 'Weekly Avg' : 'Monthly Avg'}
                    </p>
                </div>
                <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{chartData.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedRange === 'daily' ? 'Days' : selectedRange === 'weekly' ? 'Weeks' : 'Months'}
                    </p>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-purple-500/10 dark:from-purple-500/20 to-fuchsia-500/5 dark:to-fuchsia-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-fuchsia-500/10 dark:from-fuchsia-500/20 to-pink-500/5 dark:to-pink-500/10 rounded-full blur-3xl" />
        </motion.div>
    );
}

export default BoldRevenueChart;
