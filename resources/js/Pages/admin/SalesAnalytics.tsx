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
        queryFn: () => apiGet(`/api/admin/analytics/sales/overview?${getQueryParams()}`)
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
        { label: 'Total Revenue', value: `$${Number(overview?.total_revenue || 0).toLocaleString()}`, icon: DollarSign, color: 'text-green-400', bgColor: 'bg-green-500/20' },
        { label: 'Total Orders', value: overview?.total_orders || 0, icon: ShoppingCart, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
        { label: 'Avg Order Value', value: `$${Number(overview?.avg_order_value || 0).toFixed(2)}`, icon: TrendingUp, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
        { label: 'Customers', value: overview?.unique_customers || 0, icon: Users, color: 'text-pink-400', bgColor: 'bg-pink-500/20' }
    ];

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                {/* Header */}
                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    Sales Analytics
                                </h1>
                                <p className="text-gray-400 mt-1">Track revenue, trends, and performance insights</p>
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
                                    className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                                >
                                    7 Days
                                </button>
                                <button
                                    onClick={() => setQuickDate(30)}
                                    className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
                                >
                                    30 Days
                                </button>
                                <button
                                    onClick={() => setQuickDate(90)}
                                    className="px-3 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
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
                            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-gray-400">{stat.label}</p>
                                            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
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
                    {/* Revenue Trends */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-400" />
                                Revenue Trends
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={trends?.data || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                                    <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Category Breakdown */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-purple-400" />
                                Sales by Category
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={categories?.data || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {(categories?.data || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Peak Hours */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-orange-400" />
                                Peak Hours
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={peakHours?.data || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="hour" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                    <Bar dataKey="orders" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Selling Items */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                Top Selling Items
                            </h3>
                            <div className="space-y-3">
                                {(topItems?.data || []).slice(0, 5).map((item: any, index: number) => (
                                    <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold">{item.name}</h4>
                                                <p className="text-sm text-gray-400">{item.quantity_sold} sold</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-400 font-bold">${Number(item.revenue).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
