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
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-6">
                <AnimatePresence mode="wait">
                    {getStatusDisplay()}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 p-3 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400" />
                    <span className="font-semibold text-white text-sm sm:text-base">Scan to Pay</span>
                </div>

                {/* Timer */}
                <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full ${timeLeft < 60 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'
                    }`}>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="font-mono text-xs sm:text-sm">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* QR Code */}
            <div className="relative bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                {isExpired ? (
                    <div className="absolute inset-0 bg-white/90 rounded-lg sm:rounded-xl flex flex-col items-center justify-center">
                        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mb-2" />
                        <div className="text-red-600 font-semibold text-sm sm:text-base">QR Code Expired</div>
                        {onRetry && (
                            <button
                                onClick={onRetry}
                                className="mt-3 px-4 py-2 bg-fuchsia-600 text-white rounded-lg text-xs sm:text-sm"
                            >
                                Generate New
                            </button>
                        )}
                    </div>
                ) : null}

                <img
                    src={qrImageBase64}
                    alt="Payment QR Code"
                    className={`w-full max-w-[200px] sm:max-w-[250px] mx-auto ${isExpired ? 'opacity-20' : ''}`}
                />
            </div>

            {/* Payment Details */}
            <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Amount</span>
                    <span className="font-bold text-white text-base sm:text-lg">
                        {currency} {amount.toFixed(2)}
                    </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-400">Reference</span>
                    <span className="font-mono text-white text-xs">{qrReference}</span>
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="text-xs sm:text-sm text-gray-300 space-y-1.5 sm:space-y-2">
                    <p className="font-medium text-white">How to pay:</p>
                    <ol className="list-decimal list-inside space-y-0.5 sm:space-y-1 text-gray-400 text-[10px] sm:text-sm">
                        <li>Open ABA Mobile app</li>
                        <li>Tap "Scan" or "KHQR"</li>
                        <li>Scan this QR code</li>
                        <li>Confirm payment</li>
                    </ol>
                </div>
            </div>

            {/* Dev Mode Simulation Buttons */}
            {isDevMode && (
                <div className="border-t border-white/10 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <div className="text-[10px] sm:text-xs text-gray-500 mb-2 text-center">Dev Mode</div>
                    <div className="flex gap-2">
                        <button
                            onClick={onSimulateSuccess}
                            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-xs transition-colors"
                        >
                            Success
                        </button>
                        <button
                            onClick={onSimulateFailure}
                            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-xs transition-colors"
                        >
                            Failure
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
