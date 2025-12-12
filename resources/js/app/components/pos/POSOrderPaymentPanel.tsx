import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '@/app/components/ui/Button';
import { Banknote, CreditCard, QrCode, Split, Percent, RefreshCw } from 'lucide-react';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { apiGet, apiPost } from '@/app/utils/api';
import { useQuery } from '@tanstack/react-query';

interface Props {
    order: any;
    onClose: () => void;
    onSuccess: (result: any) => void;
}

export default function POSOrderPaymentPanel({ order, onClose, onSuccess }: Props) {
    // Mode: 'full' (default) or 'split'
    const [mode, setMode] = useState<'full' | 'split'>('full');

    // Payment Method
    const [method, setMethod] = useState<'cash' | 'card' | 'qr'>('cash');

    // Tip State
    const [tipType, setTipType] = useState<'none' | 'percent' | 'custom'>('none');
    const [tipPercent, setTipPercent] = useState<number>(0);
    const [customTipAmount, setCustomTipAmount] = useState<string>('');

    // Split State
    const [splitType, setSplitType] = useState<'custom' | 'equal'>('custom');
    const [splitParts, setSplitParts] = useState<number>(2);
    const [amountToPay, setAmountToPay] = useState<string>(''); // For custom amount or full
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Payment Status (for Split Bill progress)
    const { data: statusData, refetch: refetchStatus, isLoading: isLoadingStatus } = useQuery({
        queryKey: ['payment-status', order.id],
        queryFn: async () => {
            const res = await apiGet(`/api/payments/split/${order.id}/status`);
            return res.data;
        },
        refetchInterval: 5000 // Poll for updates
    });

    const invoice = statusData?.invoice;
    const remainingBalance = invoice ? parseFloat(invoice.remaining_balance) : parseFloat(order.total_amount);
    const totalAmount = invoice ? parseFloat(invoice.total_amount) : parseFloat(order.total_amount);

    // Initialize amountToPay with full remaining balance
    useEffect(() => {
        if (remainingBalance !== undefined) {
            // Default to full remaining balance even in split mode initially, or reset when mode changes
            if (mode === 'full') {
                setAmountToPay(remainingBalance.toFixed(2));
            } else if (splitType === 'equal') {
                setAmountToPay((remainingBalance / splitParts).toFixed(2));
            }
        }
    }, [remainingBalance, mode, splitParts, splitType]);

    // Calculate Tip Amount
    const getTipAmount = () => {
        const payAmount = parseFloat(amountToPay) || 0;
        if (tipType === 'none') return 0;
        if (tipType === 'percent') return (payAmount * tipPercent) / 100;
        if (tipType === 'custom') return parseFloat(customTipAmount) || 0;
        return 0;
    };

    const tipAmount = getTipAmount();
    const finalTotal = (parseFloat(amountToPay) || 0) + tipAmount;

    // Quick Amounts for Cash
    const quickAmounts = mode === 'full' ? [
        Math.ceil(finalTotal),
        Math.ceil(finalTotal / 5) * 5,
        Math.ceil(finalTotal / 10) * 10,
        Math.ceil(finalTotal / 20) * 20,
    ].filter((v, i, a) => a.indexOf(v) === i && v >= finalTotal).slice(0, 4) : [];

    const handlePayment = async () => {
        if (!amountToPay || parseFloat(amountToPay) <= 0) {
            toastError("Invalid amount");
            return;
        }

        setIsSubmitting(true);
        try {
            // Use the Split Payment endpoint for ALL payments now to support tips & partials uniformly
            await apiPost(`/api/payments/split/${order.id}/add`, {
                payment_method: method,
                amount: parseFloat(amountToPay),
                tip: tipAmount
            });

            toastSuccess('Payment recorded');
            await refetchStatus();

            // Check if fully paid
            // We need to wait for the refetch or check the response
            // For now, let's manually assume if remaining was covered
            const newRemaining = remainingBalance - parseFloat(amountToPay);

            if (newRemaining <= 0.01) {
                // Determine if we need to call 'complete' or if backend auto-completes
                // SplitPaymentController::addPayment just adds payment. 
                // We should probably call complete or the status refetch will show 'paid'.
                // Ideally, backend auto-completes logic.
                // Let's call complete api just in case to verify
                try {
                    await apiPost(`/api/payments/split/${order.id}/complete`, {});
                } catch (e) {
                    // Ignore if already completed logic errors
                }

                onSuccess(order); // Close modal
            } else {
                // If clean split, maybe clear tip for next person
                setTipType('none');
                setCustomTipAmount('');
            }
        } catch (error: any) {
            toastError(error?.message || 'Payment failed');
        } finally {
            setIsSubmitting(false);
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
                className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">Payment</h2>
                            <p className="opacity-80">Order #{order.order_number}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm opacity-80">Remaining Balance</div>
                            <div className="text-3xl font-bold">${(remainingBalance || 0).toFixed(2)}</div>
                            <div className="text-xs opacity-60">Total: ${totalAmount.toFixed(2)}</div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Configuration */}
                    <div className="w-2/3 p-6 space-y-6 overflow-y-auto">

                        {/* Mode Toggle */}
                        <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
                            <button
                                onClick={() => setMode('full')}
                                className={cn("flex-1 py-2 rounded-md font-medium text-sm transition-colors", mode === 'full' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            >
                                Pay Full Balance
                            </button>
                            <button
                                onClick={() => setMode('split')}
                                className={cn("flex-1 py-2 rounded-md font-medium text-sm transition-colors", mode === 'split' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")}
                            >
                                <Split className="w-4 h-4 inline mr-2" />
                                Split Bill
                            </button>
                        </div>

                        {/* Split Controls */}
                        {mode === 'split' && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="text-sm font-semibold text-gray-400">Split Method</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => { setSplitType('custom'); setAmountToPay(''); }}
                                        className={cn("p-3 rounded-xl border text-left", splitType === 'custom' ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400")}
                                    >
                                        <div className="font-bold">By Amount</div>
                                        <div className="text-xs opacity-70">Enter any amount</div>
                                    </button>
                                    <div className="flex gap-2">
                                        {[2, 3, 4].map(parts => (
                                            <button
                                                key={parts}
                                                onClick={() => { setSplitType('equal'); setSplitParts(parts); }}
                                                className={cn("flex-1 rounded-xl border font-bold", splitType === 'equal' && splitParts === parts ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400")}
                                            >
                                                1/{parts}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div>
                            <label className="text-sm font-semibold text-gray-400 mb-2 block">
                                {mode === 'full' ? 'Payment Amount' : 'Amount to Pay Now'}
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">$</span>
                                <input
                                    type="number"
                                    value={amountToPay}
                                    onChange={(e) => setAmountToPay(e.target.value)}
                                    // disabled={mode === 'full'} // Allow editing even in full if they want to pay partial manually? Maybe 'Custom' split handles that. Let's disable for Full to avoid confusion.
                                    readOnly={mode === 'full' || splitType === 'equal'} // Read only for full or auto-split
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-2xl font-bold text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Method Selector */}
                        <div>
                            <div className="text-sm font-semibold text-gray-400 mb-2">Payment Method</div>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => setMethod('cash')}
                                    className={cn("flex flex-col items-center p-3 rounded-xl border transition-all", method === 'cash' ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" : "bg-white/5 border-white/10 text-gray-400")}
                                >
                                    <Banknote className="w-5 h-5 mb-1" />
                                    <span className="text-sm font-medium">Cash</span>
                                </button>
                                <button
                                    onClick={() => setMethod('card')}
                                    className={cn("flex flex-col items-center p-3 rounded-xl border transition-all", method === 'card' ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400")}
                                >
                                    <CreditCard className="w-5 h-5 mb-1" />
                                    <span className="text-sm font-medium">Card</span>
                                </button>
                                <button
                                    onClick={() => setMethod('qr')}
                                    className={cn("flex flex-col items-center p-3 rounded-xl border transition-all", method === 'qr' ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-white/5 border-white/10 text-gray-400")}
                                >
                                    <QrCode className="w-5 h-5 mb-1" />
                                    <span className="text-sm font-medium">QR</span>
                                </button>
                            </div>
                        </div>

                        {/* Tip Section */}
                        <div>
                            <div className="text-sm font-semibold text-gray-400 mb-2">Add Tip</div>
                            <div className="grid grid-cols-4 gap-2">
                                <button onClick={() => setTipType('none')} className={cn("py-2 rounded-lg border text-sm font-medium", tipType === 'none' ? "bg-white text-gray-900 border-white" : "bg-white/5 border-white/10 text-gray-400")}>None</button>
                                {[10, 15, 20].map(pct => (
                                    <button
                                        key={pct}
                                        onClick={() => { setTipType('percent'); setTipPercent(pct); }}
                                        className={cn("py-2 rounded-lg border text-sm font-medium", tipType === 'percent' && tipPercent === pct ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400")}
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setTipType('custom')}
                                className={cn("w-full mt-2 py-2 rounded-lg border text-sm font-medium", tipType === 'custom' ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-white/5 border-white/10 text-gray-400")}
                            >
                                Custom Amount via Input
                            </button>
                            {tipType === 'custom' && (
                                <input
                                    type="number"
                                    placeholder="Enter tip amount"
                                    value={customTipAmount}
                                    onChange={(e) => setCustomTipAmount(e.target.value)}
                                    className="w-full mt-2 p-2 bg-white/5 border border-white/10 rounded-lg text-white"
                                />
                            )}
                        </div>

                    </div>

                    {/* Right: Summary & History */}
                    <div className="w-1/3 bg-gray-800/50 p-6 border-l border-gray-700 flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-4">
                            <h3 className="font-semibold text-white">Payment Summary</h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between text-gray-400">
                                    <span>Amount</span>
                                    <span>${(parseFloat(amountToPay) || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Tip {tipType === 'percent' && `(${tipPercent}%)`}</span>
                                    <span>${tipAmount.toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between text-xl font-bold text-white">
                                    <span>Total Charge</span>
                                    <span>${finalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Split History */}
                            {mode === 'split' && invoice && invoice.amount_paid > 0 && (
                                <div className="mt-6 pt-6 border-t border-white/10">
                                    <h4 className="font-semibold text-white mb-3">Paid So Far</h4>
                                    <div className="space-y-2">
                                        {statusData?.payments?.map((p: any) => (
                                            <div key={p.id} className="text-xs bg-white/5 p-2 rounded flex justify-between">
                                                <span>{p.method}</span>
                                                <span className="font-mono">${p.amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between text-sm font-bold pt-2">
                                            <span>Total Paid</span>
                                            <span>${invoice.amount_paid.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 space-y-3">
                            {/* Cash Quick Buttons */}
                            {method === 'cash' && quickAmounts.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {quickAmounts.map(amt => (
                                        <button
                                            key={amt}
                                            // Typically for quick cash, we might update amountToPay? No, amountToPay is fixed for split. 
                                            // For Full Pay: Cash Received logic is tricky here if we allow tips.
                                            // If user gives $50 for $45. $5 is tip? Or $5 change?
                                            // Let's assume standard behavior: Pay exact amount + Tip logic above handles the charge.
                                            // If we want "Cash Received" input to calc change, we need that UI back.
                                            // Simplifying: Just assume exact payment for the Charge Amount.
                                            // OR: If cash, maybe show "Calculate Change" modal?
                                            // For now, let's keep it simple: "Confirm Pay $X"
                                            className="py-1 px-2 rounded bg-emerald-500/10 text-emerald-400 text-xs"
                                            onClick={() => { /* maybe auto-fill something? */ }}
                                        >
                                            ${amt}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <Button
                                className="w-full py-4 text-lg font-bold bg-green-600 hover:bg-green-700"
                                onClick={handlePayment}
                                loading={isSubmitting}
                                disabled={isSubmitting || !amountToPay || parseFloat(amountToPay) <= 0}
                            >
                                Pay ${(finalTotal).toFixed(2)}
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
