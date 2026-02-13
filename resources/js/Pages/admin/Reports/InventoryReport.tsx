import React, { useState } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Package, RefreshCw, Trash2, TrendingDown,
    Calendar, Download, FileText, ArrowUpRight, ArrowDownRight,
    DollarSign, Activity, AlertTriangle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { apiGet } from '@/app/utils/api';
import DateRangePicker from '@/app/components/DateRangePicker';
import { cn } from '@/app/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';

// Reusing StatCard from SalesReport with modifications
const StatCard = ({ title, value, subValue, icon: Icon, color, index = 0 }: any) => {
    const { t } = useTranslation();
    const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string }> = {
        blue: {
            gradient: 'from-blue-500/20 to-cyan-500/10',
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-500/30',
        },
        emerald: {
            gradient: 'from-emerald-500/20 to-green-500/10',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-500/30',
        },
        rose: {
            gradient: 'from-rose-500/20 to-pink-500/10',
            iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
            text: 'text-rose-600 dark:text-rose-400',
            border: 'border-rose-500/30',
        },
        amber: {
            gradient: 'from-amber-500/20 to-orange-500/10',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-500/30',
        },
    };

    const styles = colorStyles[color] || colorStyles.blue;

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
                    {subValue && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{subValue}</p>
                    )}
                </div>
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-lg", styles.iconBg)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </motion.div>
    );
};

export default function InventoryReport() {
    const { t, locale } = useTranslation();
    const [startDate, setStartDate] = useState<Date | undefined>(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );
    const [endDate, setEndDate] = useState<Date | undefined>(new Date());
    const [range, setRange] = useState('30days');

    const getQueryParams = () => {
        let params = '';
        if (startDate && endDate) {
            params = `start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}&range=custom`;
        } else {
            params = `range=${range}`;
        }
        return `${params}&locale=${locale}`;
    };

    // --- Queries ---

    const { data: valuation } = useQuery({
        queryKey: ['inventory-valuation', range, startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/valuation?${getQueryParams()}`)
    });

    const { data: waste } = useQuery({
        queryKey: ['inventory-waste', range, startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/waste-tracking?${getQueryParams()}`)
    });

    const { data: turnover } = useQuery({
        queryKey: ['inventory-turnover', range, startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/turnover?${getQueryParams()}`)
    });

    const { data: usage } = useQuery({
        queryKey: ['inventory-usage', range, startDate, endDate],
        queryFn: () => apiGet(`/api/admin/reports/inventory/usage-rates?${getQueryParams()}`)
    });

    // --- Actions ---

    const handleExportPDF = () => {
        window.open(`/api/admin/reports/inventory/export/pdf?${getQueryParams()}`, '_blank');
    };

    const handleExportCSV = () => {
        window.location.href = `/api/admin/reports/inventory/export/csv?${getQueryParams()}`;
    };

    // Quick date changes
    const updateRange = (newRange: string) => {
        setRange(newRange);
        if (newRange === '30days') {
            setEndDate(new Date());
            setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        } else if (newRange === '7days') {
            setEndDate(new Date());
            setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        }
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-6 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                                {t('admin.reports.inventory.title')}
                            </h1>
                            <p className="text-muted-foreground mt-1 flex items-center gap-2">
                                <Package className="w-4 h-4 text-emerald-500" />
                                {t('admin.reports.inventory.subtitle')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleExportPDF} variant="secondary">
                                <FileText className="w-4 h-4 mr-2" /> {t('admin.reports.inventory.actions.pdf')}
                            </Button>
                            <Button onClick={handleExportCSV} variant="secondary">
                                <Download className="w-4 h-4 mr-2" /> {t('admin.reports.inventory.actions.csv')}
                            </Button>
                        </div>
                    </motion.div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard
                            title={t('admin.reports.inventory.stats.total_value')}
                            value={`$${Number(valuation?.total_value || 0).toLocaleString()}`}
                            subValue={`${valuation?.items_count || 0} ${t('admin.reports.inventory.stats.items_in_stock')}`}
                            icon={DollarSign}
                            color="emerald"
                            index={0}
                        />
                        <StatCard
                            title={t('admin.reports.inventory.stats.waste_cost')}
                            value={`$${Number(waste?.total_waste_value || 0).toLocaleString()}`}
                            subValue={`${waste?.waste_percent || 0}${t('admin.reports.inventory.stats.percent_revenue')}`}
                            icon={Trash2}
                            color="rose"
                            index={1}
                        />
                        <StatCard
                            title={t('admin.reports.inventory.stats.avg_turnover')}
                            value={`${turnover?.avg_turnover || 0}x`}
                            subValue={t('admin.reports.inventory.stats.replacement_rate')}
                            icon={RefreshCw}
                            color="blue"
                            index={2}
                        />
                    </div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg flex flex-col md:flex-row gap-4 items-center"
                    >
                        <DateRangePicker
                            startDate={startDate}
                            endDate={endDate}
                            onStartDateChange={(d) => setStartDate(d ?? undefined)}
                            onEndDateChange={(d) => setEndDate(d ?? undefined)}
                        />
                        <div className="flex gap-2">
                            <Button size="sm" variant={range === '7days' ? 'primary' : 'secondary'} onClick={() => updateRange('7days')}>{t('admin.reports.inventory.filters.days_7')}</Button>
                            <Button size="sm" variant={range === '30days' ? 'primary' : 'secondary'} onClick={() => updateRange('30days')}>{t('admin.reports.inventory.filters.days_30')}</Button>
                        </div>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Waste Breakdown */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Trash2 className="w-5 h-5 text-rose-500" />
                                        {t('admin.reports.inventory.waste.title')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {waste?.by_reason?.length === 0 ? (
                                            <p className="text-center text-muted-foreground py-8">{t('admin.reports.inventory.waste.empty')}</p>
                                        ) : (
                                            waste?.by_reason?.map((item: any, idx: number) => (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                                        <span className="font-medium capitalize">{item.reason}</span>
                                                    </div>
                                                    <span className="font-bold text-rose-600 dark:text-rose-400">
                                                        ${Number(item.value).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Recent Usage Mock / List */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="w-5 h-5 text-blue-500" />
                                        {t('admin.reports.inventory.usage.title')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-auto max-h-[300px]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3">{t('admin.reports.inventory.usage.table.date')}</th>
                                                    <th className="px-4 py-3 text-right">{t('admin.reports.inventory.usage.table.used_sold')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {usage?.data?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">{t('admin.reports.inventory.usage.empty')}</td>
                                                    </tr>
                                                ) : (
                                                    usage?.data?.map((row: any, idx: number) => (
                                                        <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                                                            <td className="px-4 py-3 font-medium">{new Date(row.date).toLocaleDateString()}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-blue-600 dark:text-blue-400">
                                                                {Number(row.usage).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Turnover Categories */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-amber-500" />
                                    {t('admin.reports.inventory.turnover.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {turnover?.by_category?.map((cat: any, idx: number) => (
                                        <div key={idx} className="p-4 rounded-xl border border-border/50 bg-background/50 hover:border-amber-500/30 transition-colors">
                                            <p className="text-xs text-muted-foreground uppercase">{cat.category}</p>
                                            <div className="flex items-end gap-2 mt-1">
                                                <span className="text-xl font-bold text-foreground">{Number(cat.turnover_rate).toFixed(1)}x</span>
                                                <span className="text-xs text-muted-foreground mb-1">{t('admin.reports.inventory.turnover.rate')}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">{cat.items} {t('admin.reports.inventory.turnover.items')}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                </div>
            </div>
        </AdminLayout>
    );
}
