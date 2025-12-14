import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Search, Download, FileText, Filter, Calendar, DollarSign,
    ShoppingCart, TrendingUp, CreditCard, ChevronLeft, ChevronRight,
    Sparkles, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { apiGet } from '@/app/utils/api';
import DateRangePicker from '@/app/components/DateRangePicker';
import { cn } from '@/app/utils/cn';

// Enhanced Stats Card with Gradients
const StatCard = ({ title, value, icon: Icon, color, change, index = 0 }: any) => {
    const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string }> = {
        purple: {
            gradient: 'from-fuchsia-500/20 to-purple-500/10',
            iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
            text: 'text-fuchsia-600 dark:text-fuchsia-400',
            border: 'border-fuchsia-500/30',
        },
        emerald: {
            gradient: 'from-emerald-500/20 to-green-500/10',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-500/30',
        },
        amber: {
            gradient: 'from-amber-500/20 to-orange-500/10',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-500/30',
        },
        blue: {
            gradient: 'from-blue-500/20 to-cyan-500/10',
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-500/30',
        },
    };

    const styles = colorStyles[color] || colorStyles.purple;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative overflow-hidden bg-card border rounded-2xl p-5",
                "hover:shadow-lg transition-all duration-300",
                styles.border
            )}
        >
            <div className={cn("absolute inset-0 opacity-50", `bg-gradient-to-br ${styles.gradient}`)} />
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{title}</p>
                    <p className={cn("text-2xl font-extrabold mt-1", styles.text)}>{value}</p>
                    {change !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1 mt-1 text-xs font-medium",
                            change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}>
                            {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(change).toFixed(1)}% vs last period
                        </div>
                    )}
                </div>
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-lg", styles.iconBg)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </motion.div>
    );
};

interface SaleRecord {
    id: number;
    date: string;
    order_count: number;
    total_revenue: number;
    avg_order_value: number;
    top_category: string;
    payment_methods: Record<string, number>;
}

export default function SalesReport() {
    const [startDate, setStartDate] = useState<Date | undefined>(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    // Build query params
    const getQueryParams = () => {
        let params = `page=${page}&per_page=${perPage}`;
        if (startDate && endDate) {
            params += `&start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`;
        }
        if (categoryFilter !== 'all') params += `&category=${categoryFilter}`;
        if (paymentFilter !== 'all') params += `&payment_method=${paymentFilter}`;
        if (search) params += `&search=${search}`;
        return params;
    };

    // Quick date presets
    const setQuickDate = (days: number) => {
        setEndDate(new Date());
        setStartDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000));
        setPage(1);
    };

    // Fetch sales data
    const { data: salesData, isLoading } = useQuery({
        queryKey: ['sales-report', page, startDate, endDate, categoryFilter, paymentFilter, search],
        queryFn: () => apiGet(`/api/admin/analytics/sales/daily-summary?${getQueryParams()}`)
    });

    // Fetch overview stats
    const { data: overview } = useQuery({
        queryKey: ['sales-overview', startDate, endDate],
        queryFn: () => {
            const params = startDate && endDate
                ? `start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
                : 'range=30days';
            return apiGet(`/api/admin/analytics/sales/overview?${params}`);
        }
    });

    // Fetch categories for filter
    const { data: categories } = useQuery({
        queryKey: ['menu-categories'],
        queryFn: () => apiGet('/api/categories')
    });

    const salesList = useMemo(() => salesData?.data || [], [salesData]);

    const handleExportPDF = () => {
        const params = startDate && endDate
            ? `start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
            : 'range=30days';
        window.open(`/api/admin/analytics/sales/export/pdf?${params}`, '_blank');
    };

    const handleExportCSV = () => {
        const params = startDate && endDate
            ? `start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`
            : 'range=30days';
        window.location.href = `/api/admin/analytics/sales/export/excel?${params}`;
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-6 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Sales Report
                            </h1>
                            <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Detailed daily sales breakdown and analytics
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleExportPDF} variant="secondary">
                                <FileText className="w-4 h-4 mr-2" /> PDF
                            </Button>
                            <Button onClick={handleExportCSV} variant="secondary">
                                <Download className="w-4 h-4 mr-2" /> CSV
                            </Button>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Revenue"
                            value={`$${Number(overview?.total_revenue || 0).toLocaleString()}`}
                            icon={DollarSign}
                            color="emerald"
                            change={overview?.revenue_change}
                            index={0}
                        />
                        <StatCard
                            title="Total Orders"
                            value={overview?.total_orders || 0}
                            icon={ShoppingCart}
                            color="blue"
                            change={overview?.orders_change}
                            index={1}
                        />
                        <StatCard
                            title="Avg Order Value"
                            value={`$${Number(overview?.avg_order_value || 0).toFixed(2)}`}
                            icon={TrendingUp}
                            color="purple"
                            index={2}
                        />
                        <StatCard
                            title="Customers"
                            value={overview?.unique_customers || 0}
                            icon={CreditCard}
                            color="amber"
                            index={3}
                        />
                    </div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg"
                    >
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onStartDateChange={(date) => { setStartDate(date ?? undefined); setPage(1); }}
                                onEndDateChange={(date) => { setEndDate(date ?? undefined); setPage(1); }}
                            />

                            {/* Quick Presets */}
                            <div className="flex gap-2 flex-wrap">
                                {[
                                    { days: 7, label: '7 Days' },
                                    { days: 30, label: '30 Days' },
                                    { days: 90, label: '90 Days' },
                                ].map(({ days, label }) => (
                                    <button
                                        key={days}
                                        onClick={() => setQuickDate(days)}
                                        className="px-3 py-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors"
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-2 flex-wrap lg:ml-auto">
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none"
                                >
                                    <option value="all">All Categories</option>
                                    {categories?.data?.map((cat: any) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <select
                                    value={paymentFilter}
                                    onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                                    className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none"
                                >
                                    <option value="all">All Payment Methods</option>
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="digital">Digital</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>

                    {/* Sales Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                    >
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-transparent">
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Date</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Orders</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Revenue</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Avg Order</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Top Category</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider text-right">Payment Split</div>
                        </div>

                        <div className="divide-y divide-border/30">
                            {isLoading ? (
                                <div className="p-12 text-center">
                                    <div className="inline-flex items-center gap-3 text-muted-foreground">
                                        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                        Loading sales data...
                                    </div>
                                </div>
                            ) : salesList.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                        <DollarSign className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
                                    </div>
                                    <h3 className="text-foreground font-semibold">No sales data found</h3>
                                    <p className="text-muted-foreground text-sm mt-1">Try adjusting your date range or filters</p>
                                </div>
                            ) : salesList.map((sale: SaleRecord, idx: number) => (
                                <motion.div
                                    key={sale.id || idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-fuchsia-500/5 hover:to-transparent transition-all group"
                                >
                                    <div className="col-span-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="font-medium text-foreground">
                                                {new Date(sale.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-foreground font-semibold">
                                        {sale.order_count}
                                    </div>
                                    <div className="col-span-2 text-emerald-600 dark:text-emerald-400 font-bold">
                                        ${Number(sale.total_revenue).toLocaleString()}
                                    </div>
                                    <div className="col-span-2 text-muted-foreground">
                                        ${Number(sale.avg_order_value).toFixed(2)}
                                    </div>
                                    <div className="col-span-2">
                                        <span className="px-2 py-1 text-xs rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                            {sale.top_category || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-1">
                                        {sale.payment_methods && Object.entries(sale.payment_methods).map(([method, count]) => (
                                            <span
                                                key={method}
                                                className="px-2 py-0.5 text-xs rounded bg-secondary text-muted-foreground"
                                                title={`${method}: ${count}`}
                                            >
                                                {method.charAt(0).toUpperCase()}: {count}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {salesData?.meta?.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-border/50 bg-secondary/30">
                                <div className="text-sm text-muted-foreground">
                                    Page {page} of {salesData.meta.last_page}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => p - 1)}
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Previous
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={page === salesData.meta.last_page}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
