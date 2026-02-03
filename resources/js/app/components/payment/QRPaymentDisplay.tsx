import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Clock, CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface QRPaymentDisplayProps {
    qrImageBase64: string;
    qrReference: string;
    amount: number;
    currency: string;
    expiresAt: string | null;
    status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | string;
    onExpired?: () => void;
    onRetry?: () => void;
    isDevMode?: boolean;
    onSimulateSuccess?: () => void;
    onSimulateFailure?: () => void;
}

export default function QRPaymentDisplay({
    qrImageBase64,
    qrReference,
    amount,
    currency,
    expiresAt,
    status = 'pending',
    onExpired,
    onRetry,
    isDevMode = false,
    onSimulateSuccess,
    onSimulateFailure,
}: QRPaymentDisplayProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    // Countdown timer
    useEffect(() => {
        if (!expiresAt || status !== 'pending') return;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = Math.max(0, Math.floor((expiry - now) / 1000));
            return diff;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const left = calculateTimeLeft();
            setTimeLeft(left);

            if (left <= 0) {
                setIsExpired(true);
                clearInterval(timer);
                onExpired?.();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiresAt, status, onExpired]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusDisplay = () => {
        switch (status) {
            case 'completed':
                return (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-8"
                    >
                        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <div className="text-xl font-bold text-green-500">Payment Successful!</div>
                        <div className="text-sm text-gray-400">Your order is being prepared</div>
                    </motion.div>
                );

            case 'failed':
                return (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-8"
                    >
                        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <div className="text-xl font-bold text-red-500">Payment Failed</div>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="mt-2 px-6 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                        )}
                    </motion.div>
                );

            case 'cancelled':
                return (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-8"
                    >
                        <div className="w-20 h-20 rounded-full bg-gray-500/20 flex items-center justify-center">
                            <XCircle className="w-12 h-12 text-gray-500" />
                        </div>
                        <div className="text-xl font-bold text-gray-400">Payment Cancelled</div>
                    </motion.div>
                );

            case 'processing':
                return (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center gap-4 py-8"
                    >
                        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                <RefreshCw className="w-12 h-12 text-blue-500" />
                            </motion.div>
                        </div>
                        <div className="text-xl font-bold text-blue-500">Processing Payment...</div>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    if (status !== 'pending') {
        return (
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-lg">
                <AnimatePresence mode="wait">
                    {getStatusDisplay()}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="bg-white/10 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/20 p-4 sm:p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                    <span className="font-bold text-gray-900 dark:text-white text-base">Scan to Pay</span>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full border ${timeLeft < 60
                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20'
                        : 'bg-white/50 dark:bg-white/10 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10'
                    }`}>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="font-mono text-sm font-medium">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* QR Code */}
            <div className="relative bg-white rounded-xl p-4 mb-6 shadow-inner border border-gray-100 dark:border-gray-800">
                {isExpired ? (
                    <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                        <div className="text-red-600 font-bold text-base mb-3">QR Code Expired</div>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                            >
                                Generate New
                            </button>
                        )}
                    </div>
                ) : null}

                <img
                    src={qrImageBase64}
                    alt="Payment QR Code"
                    className={`w-full max-w-[220px] mx-auto ${isExpired ? 'opacity-20 blur-sm' : ''} transition-all duration-300`}
                />
            </div>

            {/* Payment Details */}
            <div className="space-y-3 mb-6">
                <div className="flex justify-between items-baseline">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Amount</span>
                    <span className="font-bold text-gray-900 dark:text-white text-2xl tracking-tight">
                        {currency} {amount.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-gray-200 dark:border-white/10 border-dashed">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Reference</span>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded select-all">{qrReference}</span>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-fuchsia-50/50 dark:bg-fuchsia-900/20 rounded-xl p-4 border border-fuchsia-100 dark:border-fuchsia-500/20">
                <div className="space-y-2">
                    <p className="font-semibold text-fuchsia-700 dark:text-fuchsia-300 text-sm flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-500/20 flex items-center justify-center text-xs">ℹ</span>
                        How to pay:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-300 text-sm ml-1">
                        <li>Open <span className="font-medium text-gray-900 dark:text-white">ABA Mobile</span> app</li>
                        <li>Tap "Scan" or "KHQR"</li>
                        <li>Scan this QR code</li>
                        <li>Confirm payment</li>
                    </ol>
                </div>
            </div>

            {/* Dev Mode Simulation Buttons */}
            {isDevMode && (
                <div className="border-t border-gray-200 dark:border-white/10 pt-4 mt-6">
                    <div className="text-[10px] text-gray-400 mb-2 text-center uppercase tracking-widest font-semibold opacity-70">Dev Mode</div>
                    <div className="flex gap-2">
                        <button
                            onClick={onSimulateSuccess}
                            className="flex-1 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                            Success
                        </button>
                        <button
                            onClick={onSimulateFailure}
                            className="flex-1 px-3 py-2 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-xs font-medium transition-colors"
                        >
                            Failure
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
