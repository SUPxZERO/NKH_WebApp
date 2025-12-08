import React, { useEffect, useState } from 'react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import QRPaymentDisplay from '@/app/components/payment/QRPaymentDisplay';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import {
    useInitiatePayment,
    usePaymentStatus,
    useRetryPayment,
    useSimulatePaymentSuccess,
    useSimulatePaymentFailure,
    PaymentInitResponse,
} from '@/app/hooks/usePayment';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { ArrowLeft, CreditCard, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

interface PaymentPageProps {
    orderId?: number;
}

export default function Payment({ orderId: propOrderId }: PaymentPageProps) {
    // Get order ID from URL params or props
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = propOrderId || parseInt(urlParams.get('order_id') || '0');

    const [paymentData, setPaymentData] = useState<PaymentInitResponse | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    // API hooks
    const initPayment = useInitiatePayment();
    const retryPayment = useRetryPayment();
    const simulateSuccess = useSimulatePaymentSuccess();
    const simulateFailure = useSimulatePaymentFailure();

    // Poll for payment status
    const { data: statusData, refetch: refetchStatus } = usePaymentStatus(
        paymentData?.payment?.id ?? null,
        { refetchInterval: isPolling ? 3000 : undefined }
    );

    // Initialize payment on mount
    useEffect(() => {
        if (orderId && !paymentData) {
            handleInitiatePayment();
        }
    }, [orderId]);

    // Start polling when payment is pending
    useEffect(() => {
        if (paymentData?.payment?.status === 'pending') {
            setIsPolling(true);
        }
    }, [paymentData]);

    // Handle status changes
    useEffect(() => {
        if (statusData) {
            if (statusData.status === 'completed') {
                setIsPolling(false);
                toastSuccess('Payment successful!');
                setTimeout(() => {
                    window.location.href = '/customer/orders';
                }, 2000);
            } else if (statusData.status === 'failed') {
                setIsPolling(false);
                toastError('Payment failed: ' + (statusData.failure_reason || 'Unknown error'));
            } else if (statusData.status === 'cancelled') {
                setIsPolling(false);
            }

            if (paymentData) {
                setPaymentData({
                    ...paymentData,
                    payment: {
                        ...paymentData.payment,
                        status: statusData.status,
                    },
                });
            }
        }
    }, [statusData]);

    const handleInitiatePayment = async () => {
        try {
            const result = await initPayment.mutateAsync({
                orderId,
                paymentMethod: 'qr',
            });
            setPaymentData(result);
        } catch (error: any) {
            toastError(error?.message || 'Failed to initiate payment');
        }
    };

    const handleRetry = async () => {
        if (!paymentData?.payment?.id) return;
        try {
            const result = await retryPayment.mutateAsync(paymentData.payment.id);
            setPaymentData(result);
            setIsPolling(true);
        } catch (error: any) {
            toastError(error?.message || 'Failed to retry payment');
        }
    };

    const handleSimulateSuccess = async () => {
        if (!paymentData?.payment?.id) return;
        try {
            await simulateSuccess.mutateAsync(paymentData.payment.id);
            refetchStatus();
        } catch (error: any) {
            toastError(error?.message || 'Simulation failed');
        }
    };

    const handleSimulateFailure = async () => {
        if (!paymentData?.payment?.id) return;
        try {
            await simulateFailure.mutateAsync({
                paymentId: paymentData.payment.id,
                reason: 'Simulated failure',
            });
            refetchStatus();
        } catch (error: any) {
            toastError(error?.message || 'Simulation failed');
        }
    };

    const handleExpired = () => {
        setIsPolling(false);
        toastError('Payment QR code has expired');
    };

    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

    if (!orderId) {
        return (
            <CustomerLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
                    <h1 className="text-2xl font-bold mb-2">No Order Selected</h1>
                    <p className="text-gray-400 mb-6">Please place an order first</p>
                    <Button onClick={() => (window.location.href = '/menu')}>Browse Menu</Button>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div className="max-w-lg mx-auto space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => window.history.back()}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">Complete Payment</h1>
                        {paymentData?.order && (
                            <p className="text-sm text-gray-400">Order #{paymentData.order.order_number}</p>
                        )}
                    </div>
                </div>

                {/* Loading state */}
                {initPayment.isPending && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center gap-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                >
                                    <CreditCard className="w-12 h-12 text-fuchsia-400" />
                                </motion.div>
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Error state */}
                {initPayment.isError && (
                    <Card>
                        <CardContent className="py-12">
                            <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <CreditCard className="w-8 h-8 text-red-400" />
                                </div>
                                <h2 className="text-lg font-bold text-red-400">Payment Error</h2>
                                <p className="text-gray-400 text-sm">
                                    {(initPayment.error as any)?.message || 'Failed to initialize payment'}
                                </p>
                                <Button onClick={handleInitiatePayment}>Try Again</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* QR Payment Display */}
                {paymentData && !initPayment.isPending && (
                    <QRPaymentDisplay
                        qrImageBase64={paymentData.qr_code.image_base64}
                        qrReference={paymentData.qr_code.reference}
                        amount={paymentData.payment.amount}
                        currency={paymentData.payment.currency}
                        expiresAt={paymentData.payment.expires_at}
                        status={statusData?.status || paymentData.payment.status}
                        onExpired={handleExpired}
                        onRetry={handleRetry}
                        isDevMode={isDev}
                        onSimulateSuccess={handleSimulateSuccess}
                        onSimulateFailure={handleSimulateFailure}
                    />
                )}

                {/* Order Summary */}
                {paymentData?.order && (
                    <Card>
                        <CardHeader>
                            <div className="font-semibold">Order Summary</div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Total Amount</span>
                                <span className="text-xl font-bold">${paymentData.order.total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Cancel Payment */}
                {paymentData?.payment?.status === 'pending' && (
                    <div className="text-center">
                        <button
                            onClick={() => (window.location.href = '/customer/orders')}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel and return to orders
                        </button>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
