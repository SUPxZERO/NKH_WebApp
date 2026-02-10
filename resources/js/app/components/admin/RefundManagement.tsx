import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    RotateCcw,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    DollarSign,
    FileText,
    User,
    ChevronDown,
    ChevronUp,
    Loader2,
    CreditCard,
    Search,
    Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import {
    useRefunds,
    useRefundStats,
    useApproveRefund,
    useRejectRefund,
    useProcessRefund,
    Refund,
    RefundFilters,
} from '@/app/hooks/useRefunds';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { useLanguage } from '@/app/context/LanguageContext';

export default function RefundManagement() {
    const { t } = useLanguage();
    const [filters, setFilters] = useState<RefundFilters>({ per_page: 20 });
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const { data: refundsData, isLoading } = useRefunds(filters);
    const { data: stats } = useRefundStats();
    const approveMutation = useApproveRefund();
    const rejectMutation = useRejectRefund();
    const processMutation = useProcessRefund();

    const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
        pending: {
            color: 'text-amber-400',
            bg: 'bg-amber-500/20',
            icon: <Clock className="w-4 h-4" />,
            label: t('admin.refunds.status.pending'),
        },
        approved: {
            color: 'text-blue-400',
            bg: 'bg-blue-500/20',
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: t('admin.refunds.status.approved'),
        },
        completed: {
            color: 'text-green-400',
            bg: 'bg-green-500/20',
            icon: <CheckCircle2 className="w-4 h-4" />,
            label: t('admin.refunds.status.completed'),
        },
        rejected: {
            color: 'text-red-400',
            bg: 'bg-red-500/20',
            icon: <XCircle className="w-4 h-4" />,
            label: t('admin.refunds.status.rejected'),
        },
    };

    const formatCurrency = (amount: number) => `${t('common.currency_symbol')}${amount.toFixed(2)}`;

    const handleApprove = async (refund: Refund) => {
        try {
            await approveMutation.mutateAsync(refund.id);
            toastSuccess(t('admin.refunds.toasts.approved'));
        } catch (error: any) {
            toastError(error.message || t('admin.refunds.toasts.approve_failed'));
        }
    };

    const handleReject = async () => {
        if (!selectedRefund || !rejectReason.trim()) return;
        try {
            await rejectMutation.mutateAsync({ refundId: selectedRefund.id, reason: rejectReason });
            toastSuccess(t('admin.refunds.toasts.rejected'));
            setShowRejectModal(false);
            setRejectReason('');
            setSelectedRefund(null);
        } catch (error: any) {
            toastError(error.message || t('admin.refunds.toasts.reject_failed'));
        }
    };

    const handleProcess = async (refund: Refund) => {
        try {
            await processMutation.mutateAsync(refund.id);
            toastSuccess(t('admin.refunds.toasts.processed'));
        } catch (error: any) {
            toastError(error.message || t('admin.refunds.toasts.process_failed'));
        }
    };

    const toggleRowExpand = (refundId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(refundId)) {
            newExpanded.delete(refundId);
        } else {
            newExpanded.add(refundId);
        }
        setExpandedRows(newExpanded);
    };

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{t('admin.refunds.stats.pending')}</p>
                                <p className="text-2xl font-bold text-amber-400">{stats?.pending_count || 0}</p>
                                <p className="text-xs text-gray-500">{formatCurrency(stats?.pending_amount || 0)}</p>
                            </div>
                            <Clock className="w-10 h-10 text-amber-400/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-blue-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{t('admin.refunds.stats.approved')}</p>
                                <p className="text-2xl font-bold text-blue-400">{stats?.approved_count || 0}</p>
                                <p className="text-xs text-gray-500">{t('admin.refunds.stats.ready_to_process')}</p>
                            </div>
                            <CheckCircle2 className="w-10 h-10 text-blue-400/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{t('admin.refunds.stats.completed_today')}</p>
                                <p className="text-2xl font-bold text-green-400">{formatCurrency(stats?.completed_amount_today || 0)}</p>
                                <p className="text-xs text-gray-500">{t('admin.refunds.stats.this_month', { amount: formatCurrency(stats?.completed_amount_month || 0) })}</p>
                            </div>
                            <RotateCcw className="w-10 h-10 text-green-400/30" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border-red-500/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400">{t('admin.refunds.stats.rejected')}</p>
                                <p className="text-2xl font-bold text-red-400">{stats?.rejected_count || 0}</p>
                                <p className="text-xs text-gray-500">{t('admin.refunds.stats.all_time')}</p>
                            </div>
                            <XCircle className="w-10 h-10 text-red-400/30" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-200 text-sm"
                            value={filters.status || ''}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                        >
                            <option value="">{t('admin.refunds.filters.all_status')}</option>
                            <option value="pending">{t('admin.refunds.status.pending')}</option>
                            <option value="approved">{t('admin.refunds.status.approved')}</option>
                            <option value="completed">{t('admin.refunds.status.completed')}</option>
                            <option value="rejected">{t('admin.refunds.status.rejected')}</option>
                        </select>
                        <Input
                            type="date"
                            className="w-auto"
                            value={filters.from_date || ''}
                            onChange={(e) => setFilters({ ...filters, from_date: e.target.value || undefined })}
                            placeholder={t('admin.refunds.filters.from_date')}
                        />
                        <Input
                            type="date"
                            className="w-auto"
                            value={filters.to_date || ''}
                            onChange={(e) => setFilters({ ...filters, to_date: e.target.value || undefined })}
                            placeholder={t('admin.refunds.filters.to_date')}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters({ per_page: 20 })}
                        >
                            {t('admin.refunds.filters.clear')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Refunds List */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">{t('admin.refunds.title')}</h2>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                        </div>
                    ) : !refundsData?.data?.length ? (
                        <div className="text-center py-12 text-gray-400">
                            <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>{t('admin.refunds.empty')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.refunds.table.id')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.refunds.table.order')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.refunds.table.amount')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.refunds.table.reason')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.refunds.table.status')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">{t('admin.refunds.table.requested')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">{t('admin.refunds.table.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {refundsData.data.map((refund) => {
                                        const config = statusConfig[refund.status];
                                        const isExpanded = expandedRows.has(refund.id);

                                        return (
                                            <React.Fragment key={refund.id}>
                                                <tr className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => toggleRowExpand(refund.id)}
                                                            className="flex items-center gap-2 text-sm font-mono text-violet-400"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            #{refund.id}
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium">
                                                            {refund.payment?.invoice?.order?.order_number || t('common.na')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-bold text-green-400">
                                                            {formatCurrency(refund.amount)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-300 truncate max-w-xs block">
                                                            {refund.reason}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                                                            {config.icon}
                                                            {config.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm text-gray-400">
                                                            {new Date(refund.created_at).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {refund.status === 'pending' && (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-green-400 hover:text-green-300"
                                                                        onClick={() => handleApprove(refund)}
                                                                        disabled={approveMutation.isPending}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-red-400 hover:text-red-300"
                                                                        onClick={() => {
                                                                            setSelectedRefund(refund);
                                                                            setShowRejectModal(true);
                                                                        }}
                                                                    >
                                                                        <XCircle className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                                    {refund.status === 'approved' && (
                                                                <Button
                                                                    size="sm"
                                                                    className="bg-violet-600 hover:bg-violet-700"
                                                                    onClick={() => handleProcess(refund)}
                                                                    disabled={processMutation.isPending}
                                                                >
                                                                    {processMutation.isPending ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        t('admin.refunds.actions.process')
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={7} className="px-4 py-0 bg-white/5">
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden"
                                                                >
                                                                    <div className="py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">{t('admin.refunds.details.payment_ref')}</p>
                                                                            <p className="text-sm font-mono">{refund.payment?.reference_number || t('common.na')}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">{t('admin.refunds.details.payment_method')}</p>
                                                                            <p className="text-sm">{refund.payment?.payment_method?.name || t('common.na')}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-gray-500">{t('admin.refunds.details.requested_by')}</p>
                                                                            <p className="text-sm">
                                                                                {refund.initiator?.first_name} {refund.initiator?.last_name}
                                                                            </p>
                                                                        </div>
                                                                        {refund.approver && (
                                                                            <div>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {refund.status === 'rejected'
                                                                                        ? t('admin.refunds.details.rejected_by')
                                                                                        : t('admin.refunds.details.approved_by')}
                                                                                </p>
                                                                                <p className="text-sm">
                                                                                    {refund.approver?.first_name} {refund.approver?.last_name}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {refund.notes && (
                                                                            <div className="col-span-2">
                                                                                <p className="text-xs text-gray-500">{t('admin.refunds.details.notes')}</p>
                                                                                <p className="text-sm text-gray-300">{refund.notes}</p>
                                                                            </div>
                                                                        )}
                                                                        {refund.rejection_reason && (
                                                                            <div className="col-span-2">
                                                                                <p className="text-xs text-red-400">{t('admin.refunds.details.rejection_reason')}</p>
                                                                                <p className="text-sm text-red-300">{refund.rejection_reason}</p>
                                                                            </div>
                                                                        )}
                                                                        {refund.gateway_reference && (
                                                                            <div>
                                                                                <p className="text-xs text-gray-500">{t('admin.refunds.details.gateway_ref')}</p>
                                                                                <p className="text-sm font-mono text-green-400">{refund.gateway_reference}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </AnimatePresence>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {refundsData && refundsData.meta.last_page > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                            <p className="text-sm text-gray-400">
                                {t('admin.refunds.pagination.page_of', {
                                    current: refundsData.meta.current_page,
                                    pages: refundsData.meta.last_page,
                                    total: refundsData.meta.total,
                                })}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={refundsData.meta.current_page === 1}
                                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                                >
                                    {t('admin.refunds.pagination.previous')}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={refundsData.meta.current_page === refundsData.meta.last_page}
                                    onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                                >
                                    {t('admin.refunds.pagination.next')}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reject Modal */}
            <Modal
                isOpen={showRejectModal}
                onClose={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                    setSelectedRefund(null);
                }}
                title={t('admin.refunds.modal.reject_title')}
            >
                <div className="space-y-4">
                    <p className="text-gray-400">
                        {t('admin.refunds.modal.confirm_reject', {
                            id: selectedRefund?.id || 0,
                            amount: formatCurrency(selectedRefund?.amount || 0),
                        })}
                    </p>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('admin.refunds.modal.rejection_reason_label')}</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
                            rows={3}
                            placeholder={t('admin.refunds.modal.rejection_reason_placeholder')}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowRejectModal(false);
                                setRejectReason('');
                            }}
                        >
                            {t('admin.refunds.modal.cancel')}
                        </Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            {t('admin.refunds.modal.confirm_button')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
