import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Award, Star } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface TopItem {
    name: string;
    quantity: number;
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

export function BoldTopItemsChart({ data = [], className }: BoldTopItemsChartProps) {
    // Ensure data is an array before operations
    const safeData = Array.isArray(data) ? data : [];
    const totalQuantity = safeData.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                'relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6',
                // Light mode
                'bg-white border border-gray-200',
                // Dark mode
                'dark:bg-gradient-to-br dark:from-gray-900/95 dark:via-gray-800/95 dark:to-gray-900/95',
                'dark:border-white/10 dark:backdrop-blur-xl',
                'shadow-xl dark:shadow-2xl dark:shadow-fuchsia-500/20',
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 0],
                        }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        className="flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 shadow-lg shadow-orange-500/40"
                    >
                        <Award className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </motion.div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">Top Selling</h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Best performers</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400" />
                    <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">{totalQuantity} sold</span>
                </div>
            </div>

            {/* Chart */}
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={safeData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <defs>
                            {barGradients.map((color, i) => (
                                <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                                    <stop offset="100%" stopColor={color} stopOpacity={1} />
                                </linearGradient>
                            ))}
                        </defs>
                        <XAxis
                            type="number"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                        />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fontWeight: 500 }}
                            tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value}
                            className="fill-gray-700 dark:fill-white"
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            }}
                            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                            formatter={(value) => [`${typeof value === 'number' ? value : 0} sold`, 'Quantity']}
                            cursor={{ fill: 'rgba(156,163,175,0.1)' }}
                        />
                        <Bar
                            dataKey="quantity"
                            radius={[0, 8, 8, 0]}
                            barSize={24}
                        >
                            {safeData.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={`url(#barGrad${index % barGradients.length})`}
                                    style={{
                                        filter: `drop-shadow(0 4px 6px ${barGradients[index % barGradients.length]}40)`,
                                    }}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Top 3 badges */}
            {safeData.length >= 3 && (
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-white/5">
                    {safeData.slice(0, 3).map((item, i) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5"
                        >
                            <span className={cn(
                                'text-xs font-bold',
                                i === 0 && 'text-amber-500 dark:text-amber-400',
                                i === 1 && 'text-gray-500 dark:text-gray-300',
                                i === 2 && 'text-orange-500 dark:text-orange-400'
                            )}>
                                #{i + 1}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[80px]">
                                {item.name}
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-500/10 dark:from-orange-500/20 to-amber-500/5 dark:to-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-amber-500/10 dark:from-amber-500/20 to-red-500/5 dark:to-red-500/10 rounded-full blur-3xl" />
        </motion.div>
    );
}

export default BoldTopItemsChart;
