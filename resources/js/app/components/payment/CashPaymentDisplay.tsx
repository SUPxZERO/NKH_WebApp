import React from 'react';
import { motion } from 'framer-motion';
import { Banknote, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';

interface CashPaymentDisplayProps {
    orderNumber: string;
    amount: number;
    currency: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | string;
    onCancel?: () => void;
    isPolling?: boolean;
}

export default function CashPaymentDisplay({
    orderNumber,
    amount,
    currency,
    status = 'pending',
    onCancel,
    isPolling = false,
}: CashPaymentDisplayProps) {
    const formatCurrency = (value: number) => {
        return currency === 'KHR'
            ? `៛${value.toLocaleString()}`
            : `$${value.toFixed(2)}`;
    };

    const statusConfig: Record<string, {
        icon: React.ComponentType<{ className?: string }>;
        title: string;
        description: string;
        color: string;
        bgColor: string;
        animate: boolean;
    }> = {
        pending: {
            icon: Clock,
            title: 'Waiting for Payment',
            description: 'Please proceed to the counter to complete your payment',
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/20',
            animate: false,
        },
        processing: {
            icon: Loader2,
            title: 'Processing Payment',
            description: 'Cashier is processing your payment...',
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
            animate: true,
        },
        completed: {
            icon: CheckCircle2,
            title: 'Payment Successful!',
            description: 'Your order is being prepared',
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/20',
            animate: false,
        },
        failed: {
            icon: AlertCircle,
            title: 'Payment Failed',
            description: 'Please try again or choose another payment method',
            color: 'text-red-400',
            bgColor: 'bg-red-500/20',
            animate: false,
        },
        cancelled: {
            icon: AlertCircle,
            title: 'Payment Cancelled',
            description: 'Your payment has been cancelled',
            color: 'text-gray-400',
            bgColor: 'bg-gray-500/20',
            animate: false,
        },
    };

    // Safely get config, fallback to pending if status is unknown
    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.icon;

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
                    >
                        <Banknote className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">Cash Payment</h2>
                    <p className="text-white/80">Order #{orderNumber}</p>
                </div>

                {/* Amount */}
                <div className="p-6 text-center border-b border-white/10">
                    <p className="text-sm text-gray-400 mb-1">Amount to Pay</p>
                    <motion.p
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-bold text-white"
                    >
                        {formatCurrency(amount)}
                    </motion.p>
                </div>

                {/* Status */}
                <div className="p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-4 p-4 rounded-xl ${config.bgColor}`}
                    >
                        <StatusIcon
                            className={`w-8 h-8 ${config.color} ${config.animate ? 'animate-spin' : ''}`}
                        />
                        <div>
                            <h3 className={`font-semibold ${config.color}`}>{config.title}</h3>
                            <p className="text-sm text-gray-400">{config.description}</p>
                        </div>
                    </motion.div>

                    {/* Instructions */}
                    {status === 'pending' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 space-y-4"
                        >
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        1
                                    </div>
                                    <p className="text-gray-300">
                                        Go to the <strong className="text-white">cashier counter</strong>
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        2
                                    </div>
                                    <p className="text-gray-300">
                                        Show your order number: <strong className="text-white">#{orderNumber}</strong>
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-fuchsia-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        3
                                    </div>
                                    <p className="text-gray-300">
                                        Pay <strong className="text-white">{formatCurrency(amount)}</strong> in cash
                                    </p>
                                </div>
                            </div>

                            {/* Polling indicator */}
                            {isPolling && (
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-4">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Waiting for cashier confirmation...</span>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* Success message */}
                    {status === 'completed' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center"
                        >
                            <p className="text-emerald-400">
                                Thank you! Your order is now being prepared.
                            </p>
                        </motion.div>
                    )}

                    {/* Cancel button */}
                    {status === 'pending' && onCancel && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={onCancel}
                                className="text-sm text-gray-400 hover:text-white transition-colors underline"
                            >
                                Cancel and choose another method
                            </button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
