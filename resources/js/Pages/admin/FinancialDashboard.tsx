import React from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
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
    const { t, locale } = useLanguage();
    const [startDate, setStartDate] = React.useState<Date | undefined>(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());

    // Build query params based on date range
    const getQueryParams = () => {
        let params = '';
        if (startDate && endDate) {
            params = `start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
        } else {
            params = 'range=30days';
        }
        return `${params}&locale=${locale}`;
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
            label: t('admin.finance.stats.total_revenue'),
            value: `$${Number(profitLoss?.total_revenue || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-500/20',
            trend: profitLoss?.revenue_change
        },
        {
            label: t('admin.finance.stats.total_expenses'),
            value: `$${Number(profitLoss?.total_expenses || 0).toLocaleString()}`,
            icon: Receipt,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-500/20',
            trend: profitLoss?.expenses_change
        },
        {
            label: t('admin.finance.stats.net_profit'),
            value: `$${Number(profitLoss?.net_profit || 0).toLocaleString()}`,
            icon: profitLoss?.net_profit >= 0 ? TrendingUp : TrendingDown,
            color: profitLoss?.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
            bgColor: profitLoss?.net_profit >= 0 ? 'bg-green-500/20' : 'bg-red-500/20',
            trend: profitLoss?.profit_margin
        },
        {
            label: t('admin.finance.stats.profit_margin'),
            value: `${Number(profitLoss?.profit_margin || 0).toFixed(1)}%`,
            icon: Percent,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-500/20'
        }
    ];

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
                {/* Decorative Background Elements - Hidden on mobile */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-green-500/10 dark:bg-green-500/20 rounded-full blur-3xl" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col gap-3 sm:gap-4"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent truncate">
                                        {t('admin.finance.title')}
                                    </h1>
                                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('admin.finance.subtitle')}</p>
                                </div>

                                <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                                    <Button
                                        onClick={handleExportPDF}
                                        className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                                    >
                                        <FileText className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">{t('admin.finance.pdf')}</span>
                                    </Button>
                                    <Button
                                        onClick={handleExportExcel}
                                        className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                                    >
                                        <Download className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">{t('admin.finance.csv')}</span>
                                    </Button>
                                </div>
                            </div>

                            {/* Date Range Controls */}
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
                                <DateRangePicker
                                    startDate={startDate}
                                    endDate={endDate}
                                    onStartDateChange={(date) => setStartDate(date ?? undefined)}
                                    onEndDateChange={(date) => setEndDate(date ?? undefined)}
                                />

                                {/* Quick Presets */}
                                <div className="flex gap-1.5 sm:gap-2">
                                    <button
                                        onClick={() => setQuickDate(7)}
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-[10px] sm:text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-colors"
                                    >
                                        {t('admin.finance.presets.7d')}
                                    </button>
                                    <button
                                        onClick={() => setQuickDate(30)}
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-[10px] sm:text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-colors"
                                    >
                                        {t('admin.finance.presets.30d')}
                                    </button>
                                    <button
                                        onClick={() => setQuickDate(90)}
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-[10px] sm:text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-colors"
                                    >
                                        {t('admin.finance.presets.90d')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-card border-border backdrop-blur-md">
                                    <CardContent className="p-3 sm:p-4 md:p-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
                                                <h3 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mt-0.5 sm:mt-1 truncate">{stat.value}</h3>
                                                {stat.trend && (
                                                    <p className={`text-[10px] sm:text-xs mt-0.5 sm:mt-1 ${stat.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {stat.trend >= 0 ? '↑' : '↓'} {Math.abs(stat.trend).toFixed(1)}%
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`p-2 sm:p-2.5 md:p-3 rounded-full ${stat.bgColor} flex-shrink-0`}>
                                                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${stat.color}`} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                        {/* Revenue vs Expenses */}
                        <Card className="bg-card border-border backdrop-blur-md lg:col-span-2">
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                    <span className="truncate">{t('admin.finance.charts.revenue_vs_expenses')}</span>
                                </h3>
                                {revenueExpenses?.data && revenueExpenses.data.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px] md:!h-[350px]">
                                        <ComposedChart data={revenueExpenses.data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                                            <YAxis stroke="#9ca3af" fontSize={10} width={40} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: '12px' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                                            <Area type="monotone" dataKey="revenue" fill="#10b98150" stroke="#10b981" name={t('admin.finance.charts.revenue')} />
                                            <Area type="monotone" dataKey="expenses" fill="#ef444450" stroke="#ef4444" name={t('admin.finance.charts.expenses')} />
                                            <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={2} name={t('admin.finance.charts.profit')} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[250px] sm:h-[300px] md:h-[350px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs sm:text-sm">{t('admin.finance.empty.revenue_expenses')}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* COGS Breakdown */}
                        <Card className="bg-card border-border backdrop-blur-md">
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                    <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                                    {t('admin.finance.charts.cogs_breakdown')}
                                </h3>
                                {cogs?.breakdown && cogs.breakdown.length > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px] md:!h-[300px]">
                                            <PieChart>
                                                <Pie
                                                    data={cogs.breakdown}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name?.slice(0, 6) || ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                    outerRadius={60}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {cogs.breakdown.map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: '12px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="mt-3 sm:mt-4 text-center">
                                            <p className="text-[10px] sm:text-sm text-muted-foreground">{t('admin.finance.stats.total_cogs')}</p>
                                            <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 dark:text-orange-400">${Number(cogs?.total || 0).toLocaleString()}</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{cogs?.percentage_of_revenue || 0}% {t('admin.finance.stats.of_revenue')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <PieChartIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs sm:text-sm">{t('admin.finance.empty.cogs')}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Profit Margins by Category */}
                        <Card className="bg-card border-border backdrop-blur-md">
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                                    {t('admin.finance.charts.margins_by_category')}
                                </h3>
                                {margins?.by_category && margins.by_category.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={200} className="sm:!h-[250px] md:!h-[300px]">
                                        <BarChart data={margins.by_category} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis type="number" stroke="#9ca3af" fontSize={10} />
                                            <YAxis dataKey="category" type="category" stroke="#9ca3af" width={60} fontSize={9} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: '12px' }} />
                                            <Bar dataKey="margin" fill="#10b981" radius={[0, 4, 4, 0]}>
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
                                    <div className="h-[200px] sm:h-[250px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs sm:text-sm">{t('admin.finance.empty.margins')}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Expense Breakdown */}
                    <Card className="bg-card border-border backdrop-blur-md">
                        <CardContent className="p-3 sm:p-4 md:p-6">
                            <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                                {t('admin.finance.charts.expense_breakdown')}
                            </h3>
                            {profitLoss?.expense_categories && profitLoss.expense_categories.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                                    {profitLoss.expense_categories.map((exp: any) => (
                                        <div key={exp.category} className="bg-card rounded-lg p-2.5 sm:p-3 md:p-4 border border-border">
                                            <div className="flex items-center justify-between gap-2 mb-1.5 sm:mb-2">
                                                <h4 className="text-foreground font-semibold text-xs sm:text-sm truncate">{exp.category}</h4>
                                                <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 text-[10px] sm:text-xs px-1.5 sm:px-2 flex-shrink-0">
                                                    {exp.percentage}%
                                                </Badge>
                                            </div>
                                            <p className="text-base sm:text-lg md:text-2xl font-bold text-foreground">${Number(exp.amount).toLocaleString()}</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                                {exp.change >= 0 ? '↑' : '↓'} {Math.abs(exp.change).toFixed(1)}% {t('admin.finance.stats.from_last_period')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-[150px] sm:h-[180px] md:h-[200px] flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs sm:text-sm">{t('admin.finance.empty.expenses')}</p>
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
