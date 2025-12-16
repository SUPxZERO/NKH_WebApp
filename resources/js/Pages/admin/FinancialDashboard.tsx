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
    Target,
    FileText
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet } from '@/app/utils/api';
import DateRangePicker from '@/app/components/DateRangePicker';
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
    const [startDate, setStartDate] = React.useState<Date | undefined>(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());

    // Build query params based on date range
    const getQueryParams = () => {
        if (startDate && endDate) {
            return `start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
        }
        return 'range=30days';
    };

    // Quick date preset buttons
    const setQuickDate = (days: number) => {
        setEndDate(new Date());
        setStartDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    };

    // Fetch P&L statement
    const { data: profitLoss } = useQuery({
        queryKey: ['profit-loss', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/financial/profit-loss?${getQueryParams()}`)
    });

    // Fetch revenue vs expenses
    const { data: revenueExpenses } = useQuery({
        queryKey: ['revenue-expenses', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/financial/revenue-expenses?${getQueryParams()}`)
    });

    // Fetch COGS
    const { data: cogs } = useQuery({
        queryKey: ['cogs', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/financial/cogs?${getQueryParams()}`)
    });

    // Fetch margins
    const { data: margins } = useQuery({
        queryKey: ['margins', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/financial/margins?${getQueryParams()}`)
    });

    const handleExportPDF = () => {
        window.open(`/api/admin/reports/financial/export/pdf?${getQueryParams()}`, '_blank');
    };

    const handleExportExcel = () => {
        window.location.href = `/api/admin/reports/financial/export/csv?${getQueryParams()}`;
    };

    const stats = [
        {
            label: 'Total Revenue',
            value: `$${Number(profitLoss?.total_revenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-500/20',
            trend: profitLoss?.revenue_change
        },
        {
            label: 'Total Expenses',
            value: `$${Number(profitLoss?.total_expenses || 0).toLocaleString()}`,
            icon: Receipt,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-500/20',
            trend: profitLoss?.expenses_change
        },
        {
            label: 'Net Profit',
            value: `$${Number(profitLoss?.net_profit || 0).toLocaleString()}`,
            icon: profitLoss?.net_profit >= 0 ? TrendingUp : TrendingDown,
            color: profitLoss?.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
            bgColor: profitLoss?.net_profit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20',
            trend: profitLoss?.profit_margin
        },
        {
            label: 'Profit Margin',
            value: `${Number(profitLoss?.profit_margin || 0).toFixed(1)}%`,
            icon: Percent,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-500/20'
        }
    ];

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-6 relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-green-500/10 dark:bg-green-500/20 rounded-full blur-3xl" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-4"
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                                        Financial Dashboard
                                    </h1>
                                    <p className="text-muted-foreground mt-1">Monitor revenue, expenses, and profitability</p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleExportPDF}
                                        className="hover:from-blue-700 hover:to-cyan-700"
                                    >
                                        <FileText className="w-4 h-4 mr-2" /> PDF
                                    </Button>
                                    <Button
                                        onClick={handleExportExcel}
                                        className="hover:from-green-700 hover:to-emerald-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" /> CSV
                                    </Button>
                                </div>
                            </div>

                            {/* Date Range Controls */}
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                <DateRangePicker
                                    startDate={startDate}
                                    endDate={endDate}
                                    onStartDateChange={(date) => setStartDate(date ?? undefined)}
                                    onEndDateChange={(date) => setEndDate(date ?? undefined)}
                                />

                                {/* Quick Presets */}
                                <div className="flex gap-2 flex-wrap">
                                    <button
                                        onClick={() => setQuickDate(7)}
                                        className="px-3 py-1 text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-colors"
                                    >
                                        7 Days
                                    </button>
                                    <button
                                        onClick={() => setQuickDate(30)}
                                        className="px-3 py-1 text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-colors"
                                    >
                                        30 Days
                                    </button>
                                    <button
                                        onClick={() => setQuickDate(90)}
                                        className="px-3 py-1 text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-colors"
                                    >
                                        90 Days
                                    </button>
                                </div>
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
                                <Card className="bg-card border-border backdrop-blur-md">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                                <h3 className="text-2xl font-bold text-foreground mt-1">{stat.value}</h3>
                                                {stat.trend && (
                                                    <p className={`text-xs mt-1 ${stat.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                        <Card className="bg-card border-border backdrop-blur-md lg:col-span-2">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    Revenue vs Expenses Trend
                                </h3>
                                {revenueExpenses?.data && revenueExpenses.data.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <ComposedChart data={revenueExpenses.data}>
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
                                ) : (
                                    <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>No revenue vs expenses data available</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* COGS Breakdown */}
                        <Card className="bg-card border-border backdrop-blur-md">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <PieChartIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                    Cost of Goods Sold
                                </h3>
                                {cogs?.breakdown && cogs.breakdown.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={cogs.breakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                    outerRadius={100}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {cogs.breakdown.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="mt-4 text-center">
                                            <p className="text-sm text-muted-foreground">Total COGS</p>
                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">${Number(cogs?.total || 0).toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{cogs?.percentage_of_revenue || 0}% of Revenue</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <PieChartIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>No COGS data available</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Profit Margins by Category */}
                        <Card className="bg-card border-border backdrop-blur-md">
                            <CardContent className="p-6">
                                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    Margins by Category
                                </h3>
                                {margins?.by_category && margins.by_category.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={margins.by_category} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis type="number" stroke="#9ca3af" />
                                            <YAxis dataKey="category" type="category" stroke="#9ca3af" width={100} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                            <Bar dataKey="margin" fill="#10b981" radius={[0, 8, 8, 0]}>
                                                {margins.by_category.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={
                                                        entry.margin > 30 ? '#10b981' :
                                                            entry.margin > 15 ? '#f59e0b' : '#ef4444'
                                                    } />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <Target className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>No margin data available</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Expense Breakdown */}
                    <Card className="bg-card border-border backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-red-600 dark:text-red-400" />
                                Expense Breakdown
                            </h3>
                            {profitLoss?.expense_categories && profitLoss.expense_categories.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {profitLoss.expense_categories.map((exp: any) => (
                                        <div key={exp.category} className="bg-card rounded-lg p-4 border border-border">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-foreground font-semibold">{exp.category}</h4>
                                                <Badge className="bg-red-500/20 text-red-600 dark:text-red-400">
                                                    {exp.percentage}%
                                                </Badge>
                                            </div>
                                            <p className="text-2xl font-bold text-foreground">${Number(exp.amount).toLocaleString()}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {exp.change >= 0 ? '↑' : '↓'} {Math.abs(exp.change).toFixed(1)}% from last period
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        <p>No expense breakdown available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
