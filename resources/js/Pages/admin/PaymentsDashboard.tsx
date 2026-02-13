import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { useLanguage } from '@/app/context/LanguageContext';
import {
    CreditCard,
    DollarSign,
    TrendingUp,
    TrendingDown,
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    Calendar,
    Search,
    Filter,
    Download,
    ChevronDown,
    Eye,
    RotateCcw,
    AlertTriangle,
} from 'lucide-react';

interface PaymentStats {
    total_payments: number;
    total_revenue: number;
    completed_count: number;
    failed_count: number;
    pending_count: number;
    success_rate: number;
    average_amount: number;
    period: string;
}

interface Payment {
    id: number;
    uuid: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    amount: number;
    currency: string;
    reference_number: string;
    transaction_id: string;
    qr_reference: string;
    created_at: string;
    processed_at?: string;
    failure_reason?: string;
    invoice?: {
        order?: {
            id: number;
            order_number: string;
            customer?: {
                name: string;
            };
        };
    };
    payment_method?: {
        name: string;
        code: string;
    };
}

export default function PaymentsDashboard() {
    const { t } = useLanguage();
    const [period, setPeriod] = useState<string>('today');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const queryClient = useQueryClient();

    // Fetch payment stats
    const { data: stats, isLoading: statsLoading } = useQuery<PaymentStats>({
        queryKey: ['payment-stats', period],
        queryFn: async () => {
            const res = await apiGet(`/api/admin/payments/stats?period=${period}`);
            return res as PaymentStats;
        },
    });

    // Fetch payments list
    const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
        queryKey: ['admin-payments', statusFilter, searchQuery],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);
            const res = await apiGet(`/api/admin/payments?${params.toString()}`);
            return res as { data: Payment[] };
        },
    });

    const payments = paymentsData?.data || [];

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            completed: 'bg-green-500/20 text-green-400 border-green-500/30',
            pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            failed: 'bg-red-500/20 text-red-400 border-red-500/30',
            cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        };
        const label = t(`finance.payments.status.${status}`, {});
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
                {label}
            </span>
        );
    };

    const formatCurrency = (amount: number, currency = 'USD') => {
        return `${currency} ${amount.toFixed(2)}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{t('admin.finance.payments.title')}</h1>
                        <p className="text-gray-400 mt-1">{t('admin.finance.payments.subtitle')}</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        >
                            <option value="today">{t('admin.dashboard.period.today')}</option>
                            <option value="yesterday">{t('admin.dashboard.period.yesterday')}</option>
                            <option value="week">{t('admin.dashboard.period.this_week')}</option>
                            <option value="month">{t('admin.dashboard.period.this_month')}</option>
                            <option value="year">{t('admin.dashboard.period.this_year')}</option>
                        </select>
                        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['payment-stats'] })}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            {t('admin.finance.payments.refresh')}
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statsLoading ? (
                        <>
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i}>
                                    <CardContent className="p-6">
                                        <Skeleton className="h-4 w-24 mb-3" />
                                        <Skeleton className="h-8 w-32" />
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    ) : (
                        <>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-400 text-sm">{t('admin.finance.stats.total_revenue')}</span>
                                            <DollarSign className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-green-400">
                                            ${stats?.total_revenue?.toFixed(2) || '0.00'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{stats?.completed_count || 0} {t('admin.finance.payments.stats.completed')}</div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <Card className="bg-gradient-to-br from-blue-500/10 to-sky-500/10 border-blue-500/20">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-400 text-sm">{t('admin.finance.payments.stats.total_payments')}</span>
                                            <CreditCard className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-blue-400">{stats?.total_payments || 0}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {t('admin.finance.payments.stats.avg')} ${stats?.average_amount?.toFixed(2) || '0.00'}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <Card className="bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 border-fuchsia-500/20">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-400 text-sm">{t('admin.finance.payments.stats.success_rate')}</span>
                                            <TrendingUp className="w-5 h-5 text-fuchsia-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-fuchsia-400">{stats?.success_rate || 0}%</div>
                                        <div className="text-xs text-gray-500 mt-1">{stats?.failed_count || 0} {t('admin.finance.payments.stats.failed')}</div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                                <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-gray-400 text-sm">{t('admin.finance.payments.stats.pending')}</span>
                                            <Clock className="w-5 h-5 text-yellow-400" />
                                        </div>
                                        <div className="text-2xl font-bold text-yellow-400">{stats?.pending_count || 0}</div>
                                        <div className="text-xs text-gray-500 mt-1">{t('admin.finance.payments.stats.awaiting')}</div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Filters & Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('admin.finance.payments.search_placeholder')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                            >
                                <option value="">{t('admin.finance.payments.status.all')}</option>
                                <option value="completed">{t('admin.finance.payments.status.completed')}</option>
                                <option value="pending">{t('admin.finance.payments.status.pending')}</option>
                                <option value="failed">{t('admin.finance.payments.status.failed')}</option>
                                <option value="cancelled">{t('admin.finance.payments.status.cancelled')}</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 font-semibold">
                            <CreditCard className="w-5 h-5" />
                            {t('admin.finance.payments.table.recent')}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {paymentsLoading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>{t('admin.finance.payments.table.empty')}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10 text-left text-sm text-gray-400">
                                            <th className="pb-3 font-medium">{t('admin.finance.payments.table.reference')}</th>
                                            <th className="pb-3 font-medium">{t('admin.finance.payments.table.order')}</th>
                                            <th className="pb-3 font-medium">{t('admin.finance.payments.table.amount')}</th>
                                            <th className="pb-3 font-medium">{t('admin.finance.payments.table.method')}</th>
                                            <th className="pb-3 font-medium">{t('admin.finance.payments.table.status')}</th>
                                            <th className="pb-3 font-medium">{t('admin.finance.payments.table.date')}</th>
                                            <th className="pb-3 font-medium">{t('admin.finance.payments.table.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                <td className="py-4">
                                                    <div className="font-mono text-sm">{payment.reference_number}</div>
                                                    <div className="text-xs text-gray-500">{payment.qr_reference}</div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="text-sm">{payment.invoice?.order?.order_number || '-'}</div>
                                                    <div className="text-xs text-gray-500">
                                                        {payment.invoice?.order?.customer?.name || t('admin.finance.payments.table.guest')}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <div className="font-semibold">
                                                        {formatCurrency(payment.amount, payment.currency)}
                                                    </div>
                                                </td>
                                                <td className="py-4">
                                                    <span className="text-sm">{payment.payment_method?.name || 'QR'}</span>
                                                </td>
                                                <td className="py-4">{getStatusBadge(payment.status)}</td>
                                                <td className="py-4">
                                                    <div className="text-sm">{formatDate(payment.created_at)}</div>
                                                    {payment.processed_at && (
                                                        <div className="text-xs text-gray-500">
                                                            {t('admin.finance.payments.table.processed')}: {formatDate(payment.processed_at)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4">
                                                    <button
                                                        onClick={() => setSelectedPayment(payment)}
                                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                        title={t('admin.finance.payments.modal.view_details')}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Detail Modal */}
                {selectedPayment && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-lg"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                <h3 className="text-lg font-bold">{t('admin.finance.payments.modal.title')}</h3>
                                <button
                                    onClick={() => setSelectedPayment(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-400">{t('admin.finance.payments.table.reference')}</div>
                                        <div className="font-mono">{selectedPayment.reference_number}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">{t('admin.finance.payments.table.status')}</div>
                                        {getStatusBadge(selectedPayment.status)}
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">{t('admin.finance.payments.table.amount')}</div>
                                        <div className="font-bold text-lg">
                                            {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">{t('admin.finance.payments.modal.transaction_id')}</div>
                                        <div className="font-mono text-sm">{selectedPayment.transaction_id}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">{t('admin.finance.payments.modal.qr_reference')}</div>
                                        <div className="font-mono">{selectedPayment.qr_reference || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-400">{t('admin.finance.payments.modal.created')}</div>
                                        <div>{formatDate(selectedPayment.created_at)}</div>
                                    </div>
                                </div>

                                {selectedPayment.failure_reason && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                                        <div className="flex items-center gap-2 text-red-400 mb-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            <span className="font-medium">{t('admin.finance.payments.modal.failure_reason')}</span>
                                        </div>
                                        <div className="text-sm text-gray-300">{selectedPayment.failure_reason}</div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
