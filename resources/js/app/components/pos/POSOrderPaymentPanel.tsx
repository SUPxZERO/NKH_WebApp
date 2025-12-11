import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Banknote, CreditCard, QrCode } from 'lucide-react';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { useQuickPay } from '@/app/hooks/useOrderPayment';
import { cn } from '@/app/utils/cn';

interface Props {
    order: any;
    onClose: () => void;
    onSuccess: (result: any) => void;
}

export default function POSOrderPaymentPanel({ order, onClose, onSuccess }: Props) {
    const [method, setMethod] = useState<'cash' | 'card' | 'qr'>('cash');
    const [cashReceived, setCashReceived] = useState<string>('');
    const quickPayMutation = useQuickPay();

    const amountDue = order.total_amount || order.amount_due || 0;
    const received = parseFloat(cashReceived) || 0;
    const change = Math.max(0, received - amountDue);
    const needMore = Math.max(0, amountDue - received);

    const canSubmit = method === 'cash' ? received >= amountDue : true;

    const quickAmounts = [
        Math.ceil(amountDue),
        Math.ceil(amountDue / 5) * 5,
        Math.ceil(amountDue / 10) * 10,
        Math.ceil(amountDue / 20) * 20,
        50,
        100
    ].filter((v, i, a) => a.indexOf(v) === i && v >= amountDue).slice(0, 4);

    const handleSubmit = async () => {
        if (!canSubmit) return;

        try {
            const result = await quickPayMutation.mutateAsync({
                orderId: order.id,
                paymentMethod: method,
                cashReceived: method === 'cash' ? received : undefined,
                notes: 'POS Quick Pay'
            });

            toastSuccess('Payment successful');
            onSuccess(result);
        } catch (error: any) {
            toastError(error?.message || 'Payment failed');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                    <h2 className="text-2xl font-bold">Payment</h2>
                    <p className="opacity-80">Order #{order.order_number}</p>
                    <div className="mt-4 text-4xl font-bold">
                        ${amountDue.toFixed(2)}
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Method Selector */}
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setMethod('cash')}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all",
                                method === 'cash'
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                            )}
                        >
                            <Banknote className="w-6 h-6 mb-2" />
                            <span className="font-medium text-sm">Cash</span>
                        </button>
                        <button
                            onClick={() => setMethod('card')}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all",
                                method === 'card'
                                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                            )}
                        >
                            <CreditCard className="w-6 h-6 mb-2" />
                            <span className="font-medium text-sm">Card</span>
                        </button>
                        <button
                            onClick={() => setMethod('qr')}
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-xl border transition-all",
                                method === 'qr'
                                    ? "bg-purple-500/20 border-purple-500 text-purple-400"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                            )}
                        >
                            <QrCode className="w-6 h-6 mb-2" />
                            <span className="font-medium text-sm">QR Code</span>
                        </button>
                    </div>

                    {/* Cash Interface */}
                    {method === 'cash' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            {/* Cash Received Input */}
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">
                                    $
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={cashReceived}
                                    onChange={(e) => setCashReceived(e.target.value)}
                                    placeholder="Amount Received"
                                    className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-3xl font-bold text-white focus:border-emerald-500 focus:outline-none"
                                    autoFocus
                                />
                            </div>

                            {/* Quick Amount Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                                {quickAmounts.map((amount) => (
                                    <button
                                        key={amount}
                                        onClick={() => setCashReceived(amount.toString())}
                                        className="py-2 px-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium"
                                    >
                                        ${amount}
                                    </button>
                                ))}
                            </div>

                            {/* Status Display */}
                            <div className={cn(
                                "p-4 rounded-xl text-center border",
                                received >= amountDue
                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                    : "bg-red-500/10 border-red-500/30"
                            )}>
                                {received >= amountDue ? (
                                    <div>
                                        <div className="text-gray-400 text-sm mb-1">Change Due</div>
                                        <div className="text-3xl font-bold text-emerald-400">${change.toFixed(2)}</div>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-gray-400 text-sm mb-1">Short By</div>
                                        <div className="text-3xl font-bold text-red-400">${needMore.toFixed(2)}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            className="flex-1 h-12 text-base"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            className={cn(
                                "flex-1 h-12 text-base font-bold",
                                method === 'cash' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-blue-600 hover:bg-blue-700"
                            )}
                            onClick={handleSubmit}
                            disabled={!canSubmit || quickPayMutation.isPending}
                        >
                            {quickPayMutation.isPending ? 'Processing...' : `Pay ${method === 'cash' ? '$' + received.toFixed(2) : ''}`}
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
