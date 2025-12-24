import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import QRPaymentDisplay from '@/app/components/payment/QRPaymentDisplay';
import PaymentMethodSelector from '@/app/components/payment/PaymentMethodSelector';
import CashPaymentDisplay from '@/app/components/payment/CashPaymentDisplay';
import CardPaymentPlaceholder from '@/app/components/payment/CardPaymentPlaceholder';
import StripeCardForm from '@/app/components/payment/StripeCardForm';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import {
    useInitiatePayment,
    usePaymentStatus,
    usePaymentMethods,
    useRetryPayment,
    useSimulatePaymentSuccess,
    useSimulatePaymentFailure,
    PaymentInitResponse,
} from '@/app/hooks/usePayment';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { ArrowLeft, CreditCard, ShoppingBag, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentPageProps {
    orderId?: number;
}

type PaymentStep = 'select-method' | 'processing';

export default function Payment({ orderId: propOrderId }: PaymentPageProps) {
    // Get order ID from URL params or props
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = propOrderId || parseInt(urlParams.get('order_id') || '0');

    const [step, setStep] = useState<PaymentStep>('select-method');
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentInitResponse | null>(null);
    const [isPolling, setIsPolling] = useState(false);

    // API hooks
    const { data: paymentMethods, isLoading: methodsLoading } = usePaymentMethods();
    const initPayment = useInitiatePayment();
    const retryPayment = useRetryPayment();
    const simulateSuccess = useSimulatePaymentSuccess();
    const simulateFailure = useSimulatePaymentFailure();

    // Track if we've already handled completion to prevent duplicate redirects
    const [hasRedirected, setHasRedirected] = useState(false);

    // Poll for payment status - always poll when we have a payment ID
    const { data: statusData, refetch: refetchStatus } = usePaymentStatus(
        paymentData?.payment?.id ?? null,
        { refetchInterval: isPolling ? 3000 : undefined }
    );

    // Start polling when payment is initiated
    useEffect(() => {
        if (paymentData?.payment?.id && !hasRedirected) {
            setIsPolling(true);
        }
    }, [paymentData?.payment?.id, hasRedirected]);

    // Handle status changes from polling
    useEffect(() => {
        if (!statusData || hasRedirected) return;

        console.log('[Payment] Status update:', statusData.status);

        if (statusData.status === 'completed') {
            setIsPolling(false);
            setHasRedirected(true);
            toastSuccess('Payment successful! Redirecting...');
            // Redirect to orders page after showing success
            setTimeout(() => {
                window.location.href = '/customer/orders';
            }, 1500);
        } else if (statusData.status === 'failed') {
            // On failure, do not redirect anywhere. Just stop polling and show error.
            setIsPolling(false);
            toastError('Payment failed: ' + (statusData.failure_reason || 'Unknown error'));
        } else if (statusData.status === 'cancelled') {
            setIsPolling(false);
            toastError('Payment was cancelled');
        }

        // Update local payment data with new status
        if (paymentData) {
            setPaymentData({
                ...paymentData,
                payment: {
                    ...paymentData.payment,
                    status: statusData.status,
                },
            });
        }
    }, [statusData?.status, hasRedirected]);

    const handleMethodSelect = (code: string) => {
        setSelectedMethod(code);
    };

    const handleProceed = async () => {
        if (!selectedMethod || !orderId) return;

        try {
            const result = await initPayment.mutateAsync({
                orderId,
                paymentMethod: selectedMethod,
            });
            setPaymentData(result);
            setStep('processing');
        } catch (error: any) {
            toastError(error?.message || 'Failed to initiate payment');
        }
    };

    const handleBack = () => {
        setStep('select-method');
        setPaymentData(null);
        setIsPolling(false);
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
                <Head>
                    <title>Payment - NKH Restaurant</title>
                </Head>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" />
                    <h1 className="text-xl sm:text-2xl font-bold mb-2">No Order Selected</h1>
                    <p className="text-gray-400 mb-6 text-sm">Please place an order first</p>
                    <Button onClick={() => (window.location.href = '/menu')}>Browse Menu</Button>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <Head>
                <title>Payment - NKH Restaurant</title>
            </Head>

            <div className="max-w-lg mx-auto space-y-4 sm:space-y-6 px-3 sm:p-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => step === 'processing' ? handleBack() : window.history.back()}
                        className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold">
                            {step === 'select-method' ? 'Choose Payment' : 'Complete Payment'}
                        </h1>
                        {paymentData?.order && (
                            <p className="text-xs sm:text-sm text-gray-400">Order #{paymentData.order.order_number}</p>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Select Payment Method */}
                    {step === 'select-method' && (
                        <motion.div
                            key="select-method"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-4 sm:space-y-6"
                        >
                            <Card className="overflow-hidden">
                                <CardContent className="p-4 sm:p-6">
                                    <PaymentMethodSelector
                                        methods={paymentMethods || []}
                                        selectedMethod={selectedMethod}
                                        onSelect={handleMethodSelect}
                                        isLoading={methodsLoading}
                                        disabled={initPayment.isPending}
                                    />
                                </CardContent>
                            </Card>

                            {/* Proceed Button */}
                            {selectedMethod && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Button
                                        onClick={handleProceed}
                                        disabled={initPayment.isPending}
                                        className="w-full py-3 sm:py-4 text-sm sm:text-lg"
                                    >
                                        {initPayment.isPending ? (
                                            'Processing...'
                                        ) : (
                                            <>
                                                Continue
                                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* Step 2: Processing Payment */}
                    {step === 'processing' && paymentData && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-3 sm:space-y-6"
                        >
                            {/* QR Payment */}
                            {(paymentData.type === 'qr' || paymentData.qr_code) && paymentData.qr_code && (
                                <QRPaymentDisplay
                                    qrImageBase64={paymentData.qr_code.image_base64}
                                    qrReference={paymentData.qr_code.reference}
                                    amount={paymentData.payment.amount}
                                    currency={paymentData.payment.currency}
                                    expiresAt={paymentData.payment.expires_at ?? null}
                                    status={statusData?.status || paymentData.payment?.status || 'pending'}
                                    onExpired={handleExpired}
                                    onRetry={handleRetry}
                                    isDevMode={isDev}
                                    onSimulateSuccess={handleSimulateSuccess}
                                    onSimulateFailure={handleSimulateFailure}
                                />
                            )}

                            {/* Cash Payment */}
                            {paymentData.type === 'cash' && (
                                <CashPaymentDisplay
                                    orderNumber={paymentData.order.order_number}
                                    amount={paymentData.payment.amount}
                                    currency={paymentData.payment.currency}
                                    status={statusData?.status || paymentData.payment?.status || 'pending'}
                                    onCancel={handleBack}
                                    isPolling={isPolling}
                                />
                            )}

                            {/* Card Payment */}
                            {paymentData.type === 'card' && (
                                (paymentData as any).stripe?.client_secret ? (
                                    <StripeCardForm
                                        clientSecret={(paymentData as any).stripe.client_secret}
                                        publishableKey={(paymentData as any).stripe.publishable_key}
                                        amount={paymentData.payment.amount}
                                        currency={paymentData.payment.currency}
                                        orderNumber={paymentData.order.order_number}
                                        onSuccess={() => {
                                            toastSuccess('Payment successful!');
                                            setTimeout(() => {
                                                window.location.href = '/customer/orders';
                                            }, 2000);
                                        }}
                                        onError={(message) => {
                                            toastError(message);
                                        }}
                                        onCancel={handleBack}
                                    />
                                ) : (
                                    <CardPaymentPlaceholder
                                        amount={paymentData.payment.amount}
                                        currency={paymentData.payment.currency}
                                        onBack={handleBack}
                                    />
                                )
                            )}

                            {/* Order Summary */}
                            <Card className="overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="text-sm sm:text-base font-semibold">Order Summary</div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Total Amount</span>
                                        <span className="text-lg sm:text-xl font-bold">${paymentData.order.total.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Dev Mode Simulation for non-QR payments */}
                            {isDev && paymentData.type !== 'qr' && paymentData.payment.status === 'pending' && (
                                <Card className="overflow-hidden">
                                    <CardContent className="p-3 sm:p-4">
                                        <p className="text-xs text-gray-400 mb-2 sm:mb-3 text-center">Dev Mode</p>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleSimulateSuccess}
                                                className="flex-1 text-emerald-400 border-emerald-400/30 text-xs"
                                            >
                                                Success
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleSimulateFailure}
                                                className="flex-1 text-red-400 border-red-400/30 text-xs"
                                            >
                                                Failure
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Cancel Payment (for non-completed) */}
                            {paymentData.payment.status === 'pending' && (
                                <div className="text-center">
                                    <button
                                        onClick={handleBack}
                                        className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        ← Choose another method
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </CustomerLayout>
    );
}
