import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Banknote,
    Clock,
    CheckCircle2,
    XCircle,
    Calculator,
    User,
    Hash,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
    usePendingCashPayments,
    useConfirmCashPayment,
    useRejectCashPayment,
    useCashPaymentStats,
    PendingCashPayment
} from '@/app/hooks/usePayment';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/app/utils/cn';

interface CashConfirmModalProps {
    payment: PendingCashPayment;
    onClose: () => void;
    onConfirmed: () => void;
}

function CashConfirmModal({ payment, onClose, onConfirmed }: CashConfirmModalProps) {
    const [cashReceived, setCashReceived] = useState<string>('');
    const [notes, setNotes] = useState('');
    const confirmMutation = useConfirmCashPayment();

    const amountDue = payment.amount;
    const received = parseFloat(cashReceived) || 0;
    const change = Math.max(0, received - amountDue);
    const isValid = received >= amountDue;

    const quickAmounts = [
        Math.ceil(amountDue),
        Math.ceil(amountDue / 5) * 5,
        Math.ceil(amountDue / 10) * 10,
        Math.ceil(amountDue / 20) * 20,
        50,
        100,
    ].filter((v, i, a) => a.indexOf(v) === i && v >= amountDue).slice(0, 4);

    const handleConfirm = async () => {
        if (!isValid) return;

        try {
            await confirmMutation.mutateAsync({
                paymentId: payment.id,
                cashReceived: received,
                notes: notes || undefined,
            });
            toastSuccess('Payment confirmed!');
            onConfirmed();
        } catch (error: any) {
            toastError(error?.message || 'Failed to confirm payment');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-gray-900 rounded-2xl border border-white/10 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-center">
                    <Banknote className="w-12 h-12 mx-auto mb-3 text-white" />
                    <h2 className="text-xl font-bold text-white">Confirm Cash Payment</h2>
                    <p className="text-white/80">Order #{payment.order.order_number}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Amount Due */}
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Amount Due</p>
                        <p className="text-4xl font-bold text-white">
                            ${amountDue.toFixed(2)}
                        </p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {quickAmounts.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setCashReceived(amount.toString())}
                                className={cn(
                                    'py-2 px-3 rounded-lg font-medium text-sm transition-all',
                                    parseFloat(cashReceived) === amount
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                )}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>

                    {/* Cash Received Input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Cash Received
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                                $
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                min={amountDue}
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-2xl font-bold text-white text-center focus:border-emerald-500 focus:outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Change Display */}
                    <div className={cn(
                        'p-4 rounded-xl text-center transition-all',
                        isValid ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    )}>
                        <p className="text-sm text-gray-400">Change to Give</p>
                        <p className={cn(
                            'text-3xl font-bold',
                            isValid ? 'text-emerald-400' : 'text-red-400'
                        )}>
                            ${change.toFixed(2)}
                        </p>
                        {!isValid && received > 0 && (
                            <p className="text-sm text-red-400 mt-1">
                                Insufficient amount
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Notes (optional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes..."
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-fuchsia-500 focus:outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!isValid || confirmMutation.isPending}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {confirmMutation.isPending ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Confirm
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function CashPaymentQueue() {
    const queryClient = useQueryClient();
    const { data: pendingPayments, isLoading, refetch } = usePendingCashPayments();
    const { data: stats } = useCashPaymentStats();
    const rejectMutation = useRejectCashPayment();

    const [selectedPayment, setSelectedPayment] = useState<PendingCashPayment | null>(null);
    const [rejectingId, setRejectingId] = useState<number | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const handleConfirmed = () => {
        setSelectedPayment(null);
        queryClient.invalidateQueries({ queryKey: ['pending-cash-payments'] });
        queryClient.invalidateQueries({ queryKey: ['cash-payment-stats'] });
    };

    const handleReject = async (paymentId: number) => {
        if (!rejectReason.trim()) {
            toastError('Please provide a reason');
            return;
        }

        try {
            await rejectMutation.mutateAsync({
                paymentId,
                reason: rejectReason,
            });
            toastSuccess('Payment rejected');
            setRejectingId(null);
            setRejectReason('');
            queryClient.invalidateQueries({ queryKey: ['pending-cash-payments'] });
        } catch (error: any) {
            toastError(error?.message || 'Failed to reject');
        }
    };

    return (
        <div className="space-y-6">
            {/* Stats Bar */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-amber-400">{stats.pending_count}</p>
                            <p className="text-sm text-gray-400">Pending</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-emerald-400">{stats.total_confirmed}</p>
                            <p className="text-sm text-gray-400">Confirmed Today</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/30">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-400">${stats.total_amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-400">Total Collected</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border-purple-500/30">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-purple-400">${stats.total_change_given.toFixed(2)}</p>
                            <p className="text-sm text-gray-400">Change Given</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Pending Cash Payments</h2>
                        <p className="text-sm text-gray-400">
                            {pendingPayments?.length || 0} payment{pendingPayments?.length !== 1 ? 's' : ''} waiting
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => refetch()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Payment List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-fuchsia-400 animate-spin" />
                </div>
            ) : pendingPayments?.length === 0 ? (
                <Card className="bg-white/5 border-dashed border-white/20">
                    <CardContent className="py-12 text-center">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                        <p className="text-lg font-medium text-white">All caught up!</p>
                        <p className="text-sm text-gray-400">No pending cash payments</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {pendingPayments?.map((payment, index) => (
                            <motion.div
                                key={payment.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="hover:border-white/20 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            {/* Order Info */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
                                                    <Hash className="w-6 h-6 text-fuchsia-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-lg">
                                                        #{payment.order.order_number}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {payment.order.customer_name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {payment.waiting_time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Amount & Actions */}
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-white">
                                                        ${payment.amount.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        {payment.order.items_count} item{payment.order.items_count !== 1 ? 's' : ''}
                                                    </p>
                                                </div>

                                                {rejectingId === payment.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={rejectReason}
                                                            onChange={(e) => setRejectReason(e.target.value)}
                                                            placeholder="Reason..."
                                                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white w-32"
                                                            autoFocus
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleReject(payment.id)}
                                                            className="text-red-400"
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setRejectingId(null);
                                                                setRejectReason('');
                                                            }}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setRejectingId(payment.id)}
                                                            className="text-red-400 hover:bg-red-500/10"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => setSelectedPayment(payment)}
                                                            className="bg-emerald-600 hover:bg-emerald-700"
                                                        >
                                                            <Banknote className="w-4 h-4 mr-2" />
                                                            Confirm
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Confirmation Modal */}
            <AnimatePresence>
                {selectedPayment && (
                    <CashConfirmModal
                        payment={selectedPayment}
                        onClose={() => setSelectedPayment(null)}
                        onConfirmed={handleConfirmed}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
