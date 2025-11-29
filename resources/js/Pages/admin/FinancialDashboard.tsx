import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Percent,
    Download,
    CreditCard,
    Receipt,
    PieChart as PieChartIcon,
    BarChart3,
    Target
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet } from '@/app/utils/api';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
    Area
} from 'recharts';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function FinancialDashboard() {
    const [dateRange, setDateRange] = React.useState('30days');

    // Fetch P&L statement
    const { data: profitLoss } = useQuery({
        queryKey: ['profit-loss', dateRange],
        queryFn: () => apiGet(`/api/admin/reports/financial/profit-loss?range=${dateRange}`)
    });

    // Fetch revenue vs expenses
    const { data: revenueExpenses } = useQuery({
        queryKey: ['revenue-expenses', dateRange],
        queryFn: () => apiGet(`/api/admin/reports/financial/revenue-expenses?range=${dateRange}`)
    });

    // Fetch COGS
    const { data: cogs } = useQuery({
        queryKey: ['cogs', dateRange],
        queryFn: () => apiGet(`/api/admin/reports/financial/cogs?range=${dateRange}`)
    });

    // Fetch margins
    const { data: margins } = useQuery({
        queryKey: ['margins', dateRange],
        queryFn: () => apiGet(`/api/admin/reports/financial/margins?range=${dateRange}`)
    });

    const stats = [
        {
            label: 'Total Revenue',
            value: `$${Number(profitLoss?.total_revenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            trend: profitLoss?.revenue_change
        },
        {
            label: 'Total Expenses',
            value: `$${Number(profitLoss?.total_expenses || 0).toLocaleString()}`,
            icon: Receipt,
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            trend: profitLoss?.expenses_change
        },
        {
            label: 'Net Profit',
            value: `$${Number(profitLoss?.net_profit || 0).toLocaleString()}`,
            icon: profitLoss?.net_profit >= 0 ? TrendingUp : TrendingDown,
            color: profitLoss?.net_profit >= 0 ? 'text-green-400' : 'text-red-400',
            bgColor: profitLoss?.net_profit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20',
            trend: profitLoss?.profit_margin
        },
        {
            label: 'Profit Margin',
            value: `${Number(profitLoss?.profit_margin || 0).toFixed(1)}%`,
            icon: Percent,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/20'
        }
    ];

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                {/* Header */}
                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Financial Dashboard
                            </h1>
                            <p className="text-gray-400 mt-1">Monitor revenue, expenses, and profitability</p>
                        </div>

                        <div className="flex gap-4">
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white"
                            >
                                <option value="7days" className="text-black">Last 7 Days</option>
                                <option value="30days" className="text-black">Last 30 Days</option>
                                <option value="90days" className="text-black">Last 90 Days</option>
                                <option value="year" className="text-black">This Year</option>
                            </select>

                            <Button className="bg-gradient-to-r from-fuchsia-600 to-pink-600">
                                <Download className="w-4 h-4 mr-2" /> Export P&L
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-400">{stat.label}</p>
                                            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
                                            {stat.trend && (
                                                <p className={`text-xs mt-1 ${stat.trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {stat.trend >= 0 ? '↑' : '↓'} {Math.abs(stat.trend).toFixed(1)}%
                                                </p>
                                            )}
                                        </div>
                                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue vs Expenses */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md lg:col-span-2">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                Revenue vs Expenses Trend
                            </h3>
                            <ResponsiveContainer width="100%" height={350}>
                                <ComposedChart data={revenueExpenses?.data || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" fill="#10b98150" stroke="#10b981" name="Revenue" />
                                    <Area type="monotone" dataKey="expenses" fill="#ef444450" stroke="#ef4444" name="Expenses" />
                                    <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={3} name="Profit" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* COGS Breakdown */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-orange-400" />
                                Cost of Goods Sold
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={cogs?.breakdown || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {(cogs?.breakdown || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-400">Total COGS</p>
                                <p className="text-2xl font-bold text-orange-400">${Number(cogs?.total || 0).toLocaleString()}</p>
                                <p className="text-xs text-gray-500 mt-1">{cogs?.percentage_of_revenue || 0}% of Revenue</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Profit Margins by Category */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-green-400" />
                                Margins by Category
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={margins?.by_category || []} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" stroke="#9ca3af" />
                                    <YAxis dataKey="category" type="category" stroke="#9ca3af" width={100} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                    <Bar dataKey="margin" fill="#10b981" radius={[0, 8, 8, 0]}>
                                        {(margins?.by_category || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={
                                                entry.margin > 30 ? '#10b981' :
                                                    entry.margin > 15 ? '#f59e0b' : '#ef4444'
                                            } />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Expense Breakdown */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-red-400" />
                            Expense Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(profitLoss?.expense_categories || []).map((exp: any) => (
                                <div key={exp.category} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-white font-semibold">{exp.category}</h4>
                                        <Badge className="bg-red-500/20 text-red-400">
                                            {exp.percentage}%
                                        </Badge>
                                    </div>
                                    <p className="text-2xl font-bold text-white">${Number(exp.amount).toLocaleString()}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {exp.change >= 0 ? '↑' : '↓'} {Math.abs(exp.change).toFixed(1)}% from last period
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
