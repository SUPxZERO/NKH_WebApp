import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Package,
    TrendingDown,
    DollarSign,
    AlertTriangle,
    Download,
    Calendar,
    BarChart3,
    PieChart as PieChartIcon,
    ShoppingCart,
    Trash2,
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
    Area,
    AreaChart
} from 'recharts';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4', '#a855f7'];

export default function InventoryReports() {
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

    // Fetch inventory valuation
    const { data: valuation } = useQuery({
        queryKey: ['inventory-valuation', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/valuation?${getQueryParams()}`)
    });

    // Fetch usage rates
    const { data: usageRates } = useQuery({
        queryKey: ['usage-rates', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/usage-rates?${getQueryParams()}`)
    });

    // Fetch waste tracking
    const { data: wasteData } = useQuery({
        queryKey: ['waste-tracking', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/waste-tracking?${getQueryParams()}`)
    });

    // Fetch cost analysis
    const { data: costAnalysis } = useQuery({
        queryKey: ['cost-analysis', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/cost-analysis?${getQueryParams()}`)
    });

    // Fetch turnover
    const { data: turnover } = useQuery({
        queryKey: ['inventory-turnover', startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/turnover?${getQueryParams()}`)
    });

    const handleExportPDF = () => {
        window.open(`/api/admin/reports/inventory/export/pdf?${getQueryParams()}`, '_blank');
    };

    const handleExportExcel = () => {
        window.location.href = `/api/admin/reports/inventory/export/excel?${getQueryParams()}`;
    };

    const stats = [
        {
            label: 'Total Inventory Value',
            value: `$${Number(valuation?.total_value || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
            change: valuation?.change_percent
        },
        {
            label: 'Items in Stock',
            value: valuation?.items_count || 0,
            icon: Package,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20'
        },
        {
            label: 'Waste Value',
            value: `$${Number(wasteData?.total_waste_value || 0).toLocaleString()}`,
            icon: Trash2,
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            change: `-${wasteData?.waste_percent || 0}%`
        },
        {
            label: 'Avg Turnover Rate',
            value: `${Number(turnover?.avg_turnover || 0).toFixed(1)}x`,
            icon: TrendingDown,
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
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                    Inventory Reports
                                </h1>
                                <p className="text-gray-400 mt-1">Track usage, costs, and waste analytics</p>
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
                                            {stat.change && (
                                                <p className={`text-xs mt-1 ${stat.change.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                                                    {stat.change}
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
                    {/* Usage Trends */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                Usage Trends
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={usageRates?.data || []}>
                                    <defs>
                                        <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                    <Area type="monotone" dataKey="usage" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsage)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Cost Breakdown */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-purple-400" />
                                Cost by Category
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={costAnalysis?.categories || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {(costAnalysis?.categories || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Waste Tracking */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Trash2 className="w-5 h-5 text-red-400" />
                                Waste by Reason
                            </h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={wasteData?.by_reason || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="reason" stroke="#9ca3af" />
                                    <YAxis stroke="#9ca3af" />
                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                    <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Top Cost Items */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-400" />
                                Highest Cost Items
                            </h3>
                            <div className="space-y-3">
                                {(costAnalysis?.top_items || []).slice(0, 5).map((item: any, index: number) => (
                                    <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold">{item.name}</h4>
                                                <p className="text-sm text-gray-400">{item.quantity} {item.unit}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-400 font-bold">${Number(item.total_cost).toLocaleString()}</p>
                                            <p className="text-xs text-gray-400">${Number(item.cost_per_unit).toFixed(2)}/unit</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Turnover Analysis */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-orange-400" />
                            Inventory Turnover by Category
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(turnover?.by_category || []).map((cat: any) => (
                                <div key={cat.category} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-white font-semibold">{cat.category}</h4>
                                        <Badge className={
                                            cat.turnover_rate > 10 ? 'bg-green-500/20 text-green-400' :
                                                cat.turnover_rate > 5 ? 'bg-yellow-500/20 text-yellow-400' :
                                                    'bg-red-500/20 text-red-400'
                                        }>
                                            {cat.turnover_rate.toFixed(1)}x
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">
                                        {cat.turnover_rate > 10 ? 'Excellent' : cat.turnover_rate > 5 ? 'Good' : 'Needs Attention'}
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
