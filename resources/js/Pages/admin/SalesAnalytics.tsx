import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Users,
    Calendar,
    Download,
    Filter,
    BarChart3,
    PieChart as PieChartIcon,
    Clock,
    FileText
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet } from '@/app/utils/api';
import DateRangePicker from '@/app/components/DateRangePicker';
import { useLanguage } from '@/app/context/LanguageContext';
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
    ResponsiveContainer
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

export default function SalesAnalytics() {
    const { t } = useLanguage();
    const [startDate, setStartDate] = React.useState<Date | undefined>(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const [endDate, setEndDate] = React.useState<Date | undefined>(new Date());
    const [viewMode, setViewMode] = React.useState<'overview' | 'detailed'>('overview');

    // Build query params based on date range
    const getQueryParams = () => {
        if (startDate && endDate) {
            return `start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
        }
        return 'range=7days';
    };

    // Quick date preset buttons
    const setQuickDate = (days: number) => {
        setEndDate(new Date());
        setStartDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
    };

    // Fetch sales overview
    const { data: overview } = useQuery({
        queryKey: ['sales-overview', startDate, endDate],
        queryFn: async () => {
            console.log('Fetching sales overview...');
            try {
                const res = await apiGet(`/api/admin/analytics/sales/overview?${getQueryParams()}`);
                console.log('Sales Overview:', res);
                return res;
            } catch (e) {
                console.error('Sales Overview Error:', e);
                throw e;
            }
        }
    });

    // Fetch sales trends
    const { data: trends } = useQuery({
        queryKey: ['sales-trends', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/analytics/sales/trends?${getQueryParams()}`)
    });

    // Fetch top items
    const { data: topItems } = useQuery({
        queryKey: ['top-items', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/analytics/sales/top-items?${getQueryParams()}`)
    });

    // Fetch category breakdown
    const { data: categories } = useQuery({
        queryKey: ['sales-by-category', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/analytics/sales/by-category?${getQueryParams()}`)
    });

    // Fetch peak hours
    const { data: peakHours } = useQuery({
        queryKey: ['peak-hours', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/analytics/sales/peak-hours?${getQueryParams()}`)
    });

    const handleExportPDF = () => {
        window.open(`/api/admin/analytics/sales/export/pdf?${getQueryParams()}`, '_blank');
    };

    const handleExportExcel = () => {
        window.location.href = `/api/admin/analytics/sales/export/excel?${getQueryParams()}`;
    };

    const stats = [
        { label: t('admin.analytics.sales.stats.revenue'), value: `$${Number(overview?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/20' },
        { label: t('admin.analytics.sales.stats.orders'), value: overview?.total_orders || 0, icon: ShoppingCart, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: t('admin.analytics.sales.stats.avg_order'), value: `$${Number(overview?.avg_order_value || 0).toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-500/20' },
        { label: t('admin.analytics.sales.stats.customers'), value: overview?.unique_customers || 0, icon: Users, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-500/20' }
    ];

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
                {/* Decorative background elements - Hidden on mobile */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-fuchsia-500/10 dark:bg-fuchsia-500/20 rounded-full blur-3xl" />
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
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                                        {t('admin.analytics.sales.title')}
                                    </h1>
                                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('admin.analytics.sales.subtitle')}</p>
                                </div>

                                <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                                    <Button
                                        onClick={handleExportPDF}
                                        className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                                    >
                                        <FileText className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">{t('admin.analytics.sales.export_pdf')}</span>
                                    </Button>
                                    <Button
                                        onClick={handleExportExcel}
                                        className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                                    >
                                        <Download className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">{t('admin.analytics.sales.export_csv')}</span>
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
                                        {t('admin.analytics.sales.presets.7d')}
                                    </button>
                                    <button
                                        onClick={() => setQuickDate(30)}
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-[10px] sm:text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-colors"
                                    >
                                        {t('admin.analytics.sales.presets.30d')}
                                    </button>
                                    <button
                                        onClick={() => setQuickDate(90)}
                                        className="px-2.5 sm:px-3 py-1.5 sm:py-1 text-[10px] sm:text-xs rounded-lg bg-card hover:bg-accent border border-border text-foreground transition-colors"
                                    >
                                        {t('admin.analytics.sales.presets.90d')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-4 sm:mb-6 md:mb-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-card border-border backdrop-blur-md">
                                    <CardContent className="p-3 sm:p-4 md:p-6">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
                                                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mt-0.5 sm:mt-1 truncate">{stat.value}</h3>
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
                        {/* Revenue Trends */}
                        <Card className="bg-card border-border backdrop-blur-md">
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                                    {t('admin.analytics.sales.charts.revenue_trends')}
                                </h3>
                                {trends?.data && trends.data.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220} className="sm:!h-[260px] md:!h-[300px]">
                                        <LineChart data={trends.data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                                            <YAxis stroke="#9ca3af" fontSize={10} width={40} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: '12px' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px' }} />
                                            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 2 }} />
                                            <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 2 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[220px] sm:h-[260px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs sm:text-sm">{t('admin.analytics.sales.empty.revenue')}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Category Breakdown */}
                        <Card className="bg-card border-border backdrop-blur-md">
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                    <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                                    {t('admin.analytics.sales.charts.by_category')}
                                </h3>
                                {categories?.data && categories.data.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220} className="sm:!h-[260px] md:!h-[300px]">
                                        <PieChart>
                                            <Pie
                                                data={categories.data}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name?.slice(0, 8) || ''}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {categories.data.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[220px] sm:h-[260px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <PieChartIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs sm:text-sm">{t('admin.analytics.sales.empty.category')}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Peak Hours */}
                        <Card className="bg-card border-border backdrop-blur-md">
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                                    {t('admin.analytics.sales.charts.peak_hours')}
                                </h3>
                                {peakHours?.data && peakHours.data.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={220} className="sm:!h-[260px] md:!h-[300px]">
                                        <BarChart data={peakHours.data}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="hour" stroke="#9ca3af" fontSize={10} />
                                            <YAxis stroke="#9ca3af" fontSize={10} width={30} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', fontSize: '12px' }} />
                                            <Bar dataKey="orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[220px] sm:h-[260px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <Clock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs sm:text-sm">{t('admin.analytics.sales.empty.peak_hours')}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Top Selling Items */}
                        <Card className="bg-card border-border backdrop-blur-md">
                            <CardContent className="p-3 sm:p-4 md:p-6">
                                <h3 className="text-sm sm:text-base md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                                    {t('admin.analytics.sales.charts.top_items')}
                                </h3>
                                {topItems?.data && topItems.data.length > 0 ? (
                                    <div className="space-y-2 sm:space-y-3">
                                        {topItems.data.slice(0, 5).map((item: any, index: number) => (
                                            <div key={item.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-2 sm:p-3">
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-foreground font-semibold text-xs sm:text-sm truncate">{item.name}</h4>
                                                        <p className="text-[10px] sm:text-sm text-muted-foreground">{item.quantity_sold} {t('admin.analytics.sales.item_sold')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-green-600 dark:text-green-400 font-bold text-xs sm:text-sm">${Number(item.revenue).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-[220px] sm:h-[260px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                                        <div className="text-center">
                                            <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
                                            <p className="text-xs sm:text-sm">{t('admin.analytics.sales.empty.top_items')}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
