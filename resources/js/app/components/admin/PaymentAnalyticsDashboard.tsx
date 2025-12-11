import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    CheckCircle2,
    XCircle,
    Users,
    Clock,
    Calendar,
    BarChart3,
    PieChart,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import {
    usePaymentAnalytics,
    useRevenueAnalytics,
    useMethodAnalytics,
    useSuccessRateAnalytics,
    usePeakAnalytics,
    useTopCustomersAnalytics,
    AnalyticsPeriod,
} from '@/app/hooks/usePaymentAnalytics';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '12m', label: '12 Months' },
    { value: 'ytd', label: 'Year to Date' },
];

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color: string;
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
    const isPositive = change !== undefined && change >= 0;

    return (
        <Card className={`bg-gradient-to-br ${color} border-0`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-white/70">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {change !== undefined && (
                            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                                {isPositive ? (
                                    <ArrowUpRight className="w-4 h-4" />
                                ) : (
                                    <ArrowDownRight className="w-4 h-4" />
                                )}
                                <span>{Math.abs(change)}% vs last period</span>
                            </div>
                        )}
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function PaymentAnalyticsDashboard() {
    const [period, setPeriod] = useState<AnalyticsPeriod>('30d');

    const { data: overview, isLoading: loadingOverview, refetch } = usePaymentAnalytics(period);
    const { data: revenue, isLoading: loadingRevenue } = useRevenueAnalytics(period);
    const { data: methods, isLoading: loadingMethods } = useMethodAnalytics(period);
    const { data: successRate } = useSuccessRateAnalytics(period);
    const { data: peaks } = usePeakAnalytics(period);
    const { data: topCustomers } = useTopCustomersAnalytics(period, 5);

    const formatCurrency = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const isLoading = loadingOverview || loadingRevenue || loadingMethods;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Payment Analytics</h1>
                    <p className="text-gray-400">Track revenue, transactions, and trends</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Period Selector */}
                    <div className="flex bg-white/5 rounded-lg p-1">
                        {PERIODS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`px-3 py-1.5 text-sm rounded-md transition-all ${period === p.value
                                        ? 'bg-violet-600 text-white'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <Button variant="ghost" onClick={() => refetch()}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                </div>
            )}

            {!isLoading && overview && (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Revenue"
                            value={formatCurrency(overview.summary.revenue)}
                            change={overview.growth.revenue}
                            icon={<DollarSign className="w-6 h-6 text-white" />}
                            color="from-violet-600 to-purple-600"
                        />
                        <StatCard
                            title="Transactions"
                            value={overview.summary.completed.toLocaleString()}
                            change={overview.growth.transactions}
                            icon={<CreditCard className="w-6 h-6 text-white" />}
                            color="from-blue-600 to-cyan-600"
                        />
                        <StatCard
                            title="Avg. Order Value"
                            value={formatCurrency(overview.summary.avg_order)}
                            change={overview.growth.avg_order}
                            icon={<BarChart3 className="w-6 h-6 text-white" />}
                            color="from-emerald-600 to-teal-600"
                        />
                        <StatCard
                            title="Success Rate"
                            value={`${overview.summary.success_rate}%`}
                            icon={<CheckCircle2 className="w-6 h-6 text-white" />}
                            color="from-amber-600 to-orange-600"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revenue Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-violet-400" />
                                    Revenue Trend
                                </h3>
                            </CardHeader>
                            <CardContent>
                                {revenue?.data && (
                                    <div className="h-64 flex items-end gap-1">
                                        {revenue.data.slice(-30).map((point, i) => {
                                            const maxTotal = Math.max(...revenue.data.map(d => d.total));
                                            const height = maxTotal > 0 ? (point.total / maxTotal) * 100 : 0;

                                            return (
                                                <motion.div
                                                    key={point.period}
                                                    className="flex-1 bg-gradient-to-t from-violet-600 to-purple-500 rounded-t hover:from-violet-500 hover:to-purple-400 transition-all cursor-pointer group relative"
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${height}%` }}
                                                    transition={{ delay: i * 0.02 }}
                                                >
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                                                        <div className="bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                                                            {formatCurrency(point.total)}
                                                            <br />
                                                            <span className="text-gray-400">{point.date}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                                <div className="mt-4 text-center">
                                    <span className="text-2xl font-bold text-violet-400">
                                        {formatCurrency(revenue?.total_revenue || 0)}
                                    </span>
                                    <span className="text-gray-400 ml-2">total revenue</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Payment Methods */}
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-blue-400" />
                                    Payment Methods
                                </h3>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {methods?.breakdown.map((method, i) => {
                                        const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
                                        const color = colors[i % colors.length];

                                        return (
                                            <div key={method.code}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium">{method.method}</span>
                                                    <span className="text-gray-400">{method.percentage_amount}%</span>
                                                </div>
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className={`h-full ${color}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${method.percentage_amount}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                                    <span>{method.transaction_count} transactions</span>
                                                    <span>{formatCurrency(method.total_amount)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Second Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Peak Hours */}
                        {peaks && (
                            <Card>
                                <CardHeader>
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-amber-400" />
                                        Peak Hours
                                    </h3>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-32 flex items-end gap-0.5">
                                        {peaks.hourly.map((hour) => {
                                            const maxAmount = Math.max(...peaks.hourly.map(h => h.amount));
                                            const height = maxAmount > 0 ? (hour.amount / maxAmount) * 100 : 0;
                                            const isPeak = hour.hour === peaks.peaks.hour.hour;

                                            return (
                                                <div
                                                    key={hour.hour}
                                                    className={`flex-1 rounded-t transition-all ${isPeak ? 'bg-amber-500' : 'bg-white/20 hover:bg-white/30'
                                                        }`}
                                                    style={{ height: `${height}%` }}
                                                    title={`${hour.label}: ${formatCurrency(hour.amount)}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 p-3 bg-amber-500/10 rounded-lg">
                                        <p className="text-sm">
                                            <span className="text-amber-400 font-bold">Peak Hour:</span>{' '}
                                            {peaks.peaks.hour.label} with {formatCurrency(peaks.peaks.hour.amount)}
                                        </p>
                                        <p className="text-sm mt-1">
                                            <span className="text-amber-400 font-bold">Peak Day:</span>{' '}
                                            {peaks.peaks.day.label} with {formatCurrency(peaks.peaks.day.amount)}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Customers */}
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Users className="w-5 h-5 text-emerald-400" />
                                    Top Customers
                                </h3>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {topCustomers?.map((customer, i) => (
                                        <div key={customer.customer_id} className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-white/10'
                                                }`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{customer.name || 'Anonymous'}</p>
                                                <p className="text-xs text-gray-500">
                                                    {customer.transaction_count} orders
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-emerald-400">
                                                    {formatCurrency(customer.total_spent)}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Avg: {formatCurrency(customer.avg_order)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Success Rate Summary */}
                    {successRate && (
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold">Transaction Status Breakdown</h3>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-green-500/10 rounded-lg text-center">
                                        <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-green-400">{successRate.summary.completed}</p>
                                        <p className="text-sm text-gray-400">Completed</p>
                                    </div>
                                    <div className="p-4 bg-amber-500/10 rounded-lg text-center">
                                        <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-amber-400">
                                            {successRate.summary.total - successRate.summary.completed - successRate.summary.failed - successRate.summary.cancelled}
                                        </p>
                                        <p className="text-sm text-gray-400">Pending</p>
                                    </div>
                                    <div className="p-4 bg-red-500/10 rounded-lg text-center">
                                        <XCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-red-400">{successRate.summary.failed}</p>
                                        <p className="text-sm text-gray-400">Failed</p>
                                    </div>
                                    <div className="p-4 bg-gray-500/10 rounded-lg text-center">
                                        <XCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                        <p className="text-2xl font-bold text-gray-400">{successRate.summary.cancelled}</p>
                                        <p className="text-sm text-gray-400">Cancelled</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
