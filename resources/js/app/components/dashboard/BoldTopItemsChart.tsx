import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useTranslation } from '@/app/hooks/useTranslation';

interface TopItem {
    name: string;
    count?: number;
    quantity?: number;
}

interface BoldTopItemsChartProps {
    data: TopItem[];
    className?: string;
}

const barGradients = [
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#fb7185', // lighter rose
];

export function BoldTopItemsChart({ data, className }: BoldTopItemsChartProps) {
    const { t } = useTranslation();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Filter out invalid items and sort by count provided by API
    const items = (data || [])
        .map(item => ({
            ...item,
            count: item.count || item.quantity || 0
        }))
        .filter(item => item.name && typeof item.count === 'number')
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Take top 5

    // Normalize counts for bar width calculation
    const maxCount = Math.max(...items.map(i => i.count), 1);

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
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        {t('admin.dashboard.top_items.title')}
                    </h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 pl-7">
                        {t('admin.dashboard.top_items.subtitle')}
                    </p>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3 sm:space-y-4">
                {items.length > 0 ? (
                    items.map((item, index) => {
                        const percentage = (item.count / maxCount) * 100;
                        const isHovered = hoveredIndex === index;

                        return (
                            <motion.div
                                key={`${item.name}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                className="relative group cursor-default"
                            >
                                {/* Background Highlight */}
                                <motion.div
                                    animate={{
                                        opacity: isHovered ? 1 : 0,
                                        scale: isHovered ? 1 : 0.98,
                                    }}
                                    className="absolute inset-0 -mx-2 -my-1.5 rounded-xl bg-gray-50 dark:bg-white/5"
                                />

                                <div className="relative flex items-center gap-3 sm:gap-4 ml-1">
                                    {/* Rank Badge */}
                                    <div className={cn(
                                        "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold shadow-sm transition-all",
                                        index === 0 ? "bg-amber-400 text-amber-900 shadow-amber-400/50 scale-110" :
                                            index === 1 ? "bg-gray-300 text-gray-800 shadow-gray-300/50 scale-105" :
                                                index === 2 ? "bg-orange-300 text-orange-800 shadow-orange-300/50 scale-105" :
                                                    "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                    )}>
                                        {index + 1}
                                    </div>

                                    {/* Item Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className={cn(
                                                "text-sm font-semibold truncate transition-colors",
                                                isHovered ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                                            )}>
                                                {item.name}
                                            </span>
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                                {t('admin.dashboard.top_items.sold', { count: item.count.toString() })}
                                            </span>
                                        </div>

                                        {/* Bar */}
                                        <div className="h-1.5 sm:h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 1, delay: 0.2 + index * 0.1 }}
                                                className={cn(
                                                    "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.3)]",
                                                    index === 0 ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                                                        index === 1 ? "bg-gradient-to-r from-gray-300 to-gray-400" :
                                                            index === 2 ? "bg-gradient-to-r from-orange-300 to-orange-400" :
                                                                "bg-gradient-to-r from-emerald-500 to-teal-500"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                        No data available
                    </div>
                )}
            </div>

            {/* Decorative Overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-black/5 dark:ring-white/5" />
        </div>
    );
}

export default BoldTopItemsChart;
