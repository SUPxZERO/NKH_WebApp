import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, Loader2, AlertTriangle } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { useCreateRefund, usePaymentRefunds } from '@/app/hooks/useRefunds';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { useLanguage } from '@/app/context/LanguageContext';

interface RefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    paymentId: number;
    paymentAmount: number;
    orderNumber?: string;
}

export default function RefundModal({ isOpen, onClose, paymentId, paymentAmount, orderNumber }: RefundModalProps) {
    const { t } = useLanguage();
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [notes, setNotes] = useState('');

    const { data: refundData, isLoading: loadingRefunds } = usePaymentRefunds(isOpen ? paymentId : null);
    const createRefund = useCreateRefund();

    const refundableAmount = refundData?.summary?.refundable_amount || paymentAmount;

    useEffect(() => {
        if (isOpen) {
            setAmount(refundableAmount.toFixed(2));
            setReason('');
            setCustomReason('');
            setNotes('');
        }
    }, [isOpen, refundableAmount]);

    const refundReasons = [
        { value: 'customer_request', label: t('admin.refunds.reasons.customer_request') },
        { value: 'wrong_order_delivered', label: t('admin.refunds.reasons.wrong_order_delivered') },
        { value: 'food_quality_issue', label: t('admin.refunds.reasons.food_quality_issue') },
        { value: 'service_complaint', label: t('admin.refunds.reasons.service_complaint') },
        { value: 'order_cancelled', label: t('admin.refunds.reasons.order_cancelled') },
        { value: 'duplicate_charge', label: t('admin.refunds.reasons.duplicate_charge') },
        { value: 'other', label: t('admin.refunds.reasons.other') },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const finalReason = reason === 'other' ? customReason : reason;
        const refundAmount = parseFloat(amount);

        if (isNaN(refundAmount) || refundAmount <= 0) {
            toastError(t('admin.refunds.request_modal.toasts.invalid_amount'));
            return;
        }

        if (refundAmount > refundableAmount) {
            toastError(t('admin.refunds.request_modal.toasts.max_refundable', { amount: formatCurrency(refundableAmount) }));
            return;
        }

        if (!finalReason.trim()) {
            toastError(t('admin.refunds.request_modal.toasts.reason_required'));
            return;
        }

        try {
            await createRefund.mutateAsync({
                payment_id: paymentId,
                amount: refundAmount,
                reason: finalReason,
                notes: notes || undefined,
            });
            toastSuccess(t('admin.refunds.request_modal.toasts.created'));
            onClose();
        } catch (error: any) {
            toastError(error.response?.data?.error || t('admin.refunds.request_modal.toasts.create_failed'));
        }
    };

    const formatCurrency = (value: number) => `${t('common.currency_symbol')}${value.toFixed(2)}`;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('admin.refunds.request_modal.title')}>
            {loadingRefunds ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Payment Info */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">{t('admin.refunds.request_modal.order')}</span>
                            <span className="font-medium">{orderNumber || `#${paymentId}`}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-400">{t('admin.refunds.request_modal.payment_amount')}</span>
                            <span className="font-medium">{formatCurrency(paymentAmount)}</span>
                        </div>
                        {(refundData?.summary?.total_refunded ?? 0) > 0 && (
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-400">{t('admin.refunds.request_modal.already_refunded')}</span>
                                <span className="font-medium text-amber-400">
                                    -{formatCurrency(refundData?.summary?.total_refunded ?? 0)}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <span className="text-sm font-medium">{t('admin.refunds.request_modal.refundable_amount')}</span>
                            <span className="font-bold text-green-400">{formatCurrency(refundableAmount)}</span>
                        </div>
                    </div>

                    {/* Previous Refunds Warning */}
                    {(refundData?.refunds?.length ?? 0) > 0 && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-amber-300">
                                    {t('admin.refunds.request_modal.previous_requests', { count: refundData?.refunds?.length ?? 0 })}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {t('admin.refunds.request_modal.pending_completed', {
                                        pending: refundData?.refunds?.filter((r: any) => r.status === 'pending').length ?? 0,
                                        completed: refundData?.refunds?.filter((r: any) => r.status === 'completed').length ?? 0,
                                    })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Refund Amount */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('admin.refunds.request_modal.refund_amount_label')}</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={refundableAmount}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-10"
                                placeholder={t('admin.refunds.request_modal.refund_amount_placeholder')}
                                required
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setAmount(refundableAmount.toFixed(2))}
                            >
                                {t('admin.refunds.request_modal.full_refund')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setAmount((refundableAmount / 2).toFixed(2))}
                            >
                                {t('admin.refunds.request_modal.half_refund')}
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => setAmount((refundableAmount * 0.25).toFixed(2))}
                            >
                                {t('admin.refunds.request_modal.quarter_refund')}
                            </Button>
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('admin.refunds.request_modal.reason_label')}</label>
                        <select
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        >
                            <option value="">{t('admin.refunds.request_modal.reason_placeholder')}</option>
                            {refundReasons.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Custom Reason */}
                    {reason === 'other' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                        >
                            <label className="block text-sm text-gray-400 mb-2">{t('admin.refunds.request_modal.custom_reason_label')}</label>
                            <Input
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder={t('admin.refunds.request_modal.custom_reason_placeholder')}
                                required={reason === 'other'}
                            />
                        </motion.div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">{t('admin.refunds.request_modal.notes_label')}</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white resize-none"
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('admin.refunds.request_modal.notes_placeholder')}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            {t('admin.refunds.request_modal.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            className="bg-violet-600 hover:bg-violet-700"
                            disabled={createRefund.isPending}
                        >
                            {createRefund.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    {t('admin.refunds.request_modal.creating')}
                                </>
                            ) : (
                                t('admin.refunds.request_modal.create_request')
                            )}
                        </Button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
