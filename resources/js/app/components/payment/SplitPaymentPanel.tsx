import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    CreditCard,
    QrCode,
    Banknote,
    Plus,
    X,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2,
    Split,
    ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
    useSplitPaymentStatus,
    useSplitPaymentSuggestions,
    useAddSplitPayment,
    useCancelSplitPayment,
} from '@/app/hooks/useSplitPayment';
import { usePaymentMethods } from '@/app/hooks/usePayment';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface SplitPaymentPanelProps {
    orderId: number;
    onPaymentInitiated: (paymentData: any) => void;
    onComplete: () => void;
}

const paymentStatusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    pending: { color: 'text-amber-400', bg: 'bg-amber-500/20', icon: <Clock className="w-4 h-4" /> },
    processing: { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: <Loader2 className="w-4 h-4 animate-spin" /> },
    completed: { color: 'text-green-400', bg: 'bg-green-500/20', icon: <CheckCircle2 className="w-4 h-4" /> },
    failed: { color: 'text-red-400', bg: 'bg-red-500/20', icon: <AlertCircle className="w-4 h-4" /> },
    cancelled: { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: <X className="w-4 h-4" /> },
};

const methodIcons: Record<string, React.ReactNode> = {
    qr: <QrCode className="w-5 h-5" />,
    aba_pay: <QrCode className="w-5 h-5" />,
    wing: <QrCode className="w-5 h-5" />,
    card: <CreditCard className="w-5 h-5" />,
    cash: <Banknote className="w-5 h-5" />,
};

export default function SplitPaymentPanel({ orderId, onPaymentInitiated, onComplete }: SplitPaymentPanelProps) {
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [customAmount, setCustomAmount] = useState('');

    const { data: status, isLoading: loadingStatus } = useSplitPaymentStatus(orderId);
    const { data: suggestions } = useSplitPaymentSuggestions(orderId);
    const { data: methods } = usePaymentMethods();

    const addPayment = useAddSplitPayment();
    const cancelPayment = useCancelSplitPayment();

    const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

    const handleAddPayment = async () => {
        if (!selectedMethod || !customAmount) return;

        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount <= 0) {
            toastError('Please enter a valid amount');
            return;
        }

        if (status && amount > status.invoice.remaining_balance) {
            toastError(`Amount exceeds remaining balance of ${formatCurrency(status.invoice.remaining_balance)}`);
            return;
        }

        try {
            const result = await addPayment.mutateAsync({
                orderId,
                paymentMethod: selectedMethod,
                amount,
            });

            if (result.success) {
                toastSuccess('Payment initiated');
                setShowAddPayment(false);
                setSelectedMethod(null);
                setCustomAmount('');
                onPaymentInitiated(result);
            } else {
                toastError(result.error || 'Failed to add payment');
            }
        } catch (error: any) {
            toastError(error.message || 'Failed to add payment');
        }
    };

    const handleCancelPayment = async (paymentId: number) => {
        try {
            await cancelPayment.mutateAsync({ orderId, paymentId });
            toastSuccess('Payment cancelled');
        } catch (error: any) {
            toastError(error.message || 'Failed to cancel payment');
        }
    };

    if (loadingStatus) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="text-center py-8 text-gray-400">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Unable to load payment status</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Progress Header */}
            <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center">
                                <Split className="w-6 h-6 text-violet-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Split Payment</h2>
                                <p className="text-sm text-gray-400">Order #{status.order.order_number}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">{formatCurrency(status.invoice.total_amount)}</p>
                            <p className="text-sm text-gray-400">Total</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Payment Progress</span>
                            <span className="font-medium">{status.invoice.payment_progress.toFixed(0)}%</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${status.invoice.payment_progress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-green-400">
                                Paid: {formatCurrency(status.invoice.amount_paid)}
                            </span>
                            <span className="text-amber-400">
                                Remaining: {formatCurrency(status.invoice.remaining_balance)}
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Payment List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Payments</h3>
                        {status.can_add_payment && (
                            <Button
                                size="sm"
                                onClick={() => setShowAddPayment(true)}
                                className="bg-violet-600 hover:bg-violet-700"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Add Payment
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {status.payments.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
                            <p>No payments yet</p>
                            <p className="text-sm">Click "Add Payment" to start</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {status.payments.map((payment) => {
                                const config = paymentStatusConfig[payment.status] || paymentStatusConfig.pending;

                                return (
                                    <motion.div
                                        key={payment.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                                                {methodIcons[payment.method_code || ''] || <DollarSign className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium">{payment.method || 'Unknown Method'}</p>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className={`flex items-center gap-1 ${config.color}`}>
                                                        {config.icon}
                                                        {payment.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold">
                                                {formatCurrency(payment.amount)}
                                            </span>
                                            {payment.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-400 hover:text-red-300"
                                                    onClick={() => handleCancelPayment(payment.id)}
                                                    disabled={cancelPayment.isPending}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </CardContent>
            </Card>

            {/* Add Payment Modal */}
            <AnimatePresence>
                {showAddPayment && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAddPayment(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-4">Add Payment</h3>

                            {/* Amount Input */}
                            <div className="mb-4">
                                <label className="block text-sm text-gray-400 mb-2">Amount</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={status.invoice.remaining_balance}
                                        value={customAmount}
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        className="pl-10"
                                        placeholder="0.00"
                                    />
                                </div>

                                {/* Quick Amount Buttons */}
                                {suggestions && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {suggestions.suggestions.map((s, i) => (
                                            <Button
                                                key={i}
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setCustomAmount(s.amount.toFixed(2))}
                                            >
                                                {s.label}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Payment Method Selection */}
                            <div className="mb-6">
                                <label className="block text-sm text-gray-400 mb-2">Payment Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {methods?.map((method) => (
                                        <button
                                            key={method.code}
                                            type="button"
                                            onClick={() => setSelectedMethod(method.code)}
                                            className={`p-3 rounded-lg border transition-all flex items-center gap-2 ${selectedMethod === method.code
                                                    ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                                                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                }`}
                                        >
                                            {methodIcons[method.code] || <DollarSign className="w-5 h-5" />}
                                            <span className="text-sm font-medium">{method.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowAddPayment(false);
                                        setSelectedMethod(null);
                                        setCustomAmount('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                                    onClick={handleAddPayment}
                                    disabled={!selectedMethod || !customAmount || addPayment.isPending}
                                >
                                    {addPayment.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : (
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                    )}
                                    Pay {customAmount ? formatCurrency(parseFloat(customAmount) || 0) : ''}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Complete Button */}
            {status.invoice.is_fully_paid && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Button
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-lg"
                        onClick={onComplete}
                    >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Payment Complete!
                    </Button>
                </motion.div>
            )}
        </div>
    );
}
