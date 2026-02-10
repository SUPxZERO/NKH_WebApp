import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { RequireAuth } from '@/app/providers/AuthProvider';
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
import { useTranslation } from '@/app/hooks/useTranslation';
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
    const { t } = useTranslation();

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
            toastSuccess(t('payment.messages.success') as string);
            // Redirect to orders page after showing success
            setTimeout(() => {
                window.location.href = '/customer/orders';
            }, 1500);
        } else if (statusData.status === 'failed') {
            // On failure, do not redirect anywhere. Just stop polling and show error.
            setIsPolling(false);
            toastError(t('payment.messages.failed', { reason: statusData.failure_reason || t('payment.messages.unknown_error') }) as string);
        } else if (statusData.status === 'cancelled') {
            setIsPolling(false);
            toastError(t('payment.messages.cancelled') as string);
        }

        // Update local payment data with new status
        if (paymentData && paymentData.payment) {
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
            toastError(error?.message || t('payment.messages.init_failed') as string);
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
            toastError(error?.message || t('payment.messages.retry_failed') as string);
        }
    };

    const handleSimulateSuccess = async () => {
        if (!paymentData?.payment?.id) return;
        try {
            await simulateSuccess.mutateAsync(paymentData.payment.id);
            refetchStatus();
        } catch (error: any) {
            toastError(error?.message || t('payment.messages.simulation_failed') as string);
        }
    };

    const handleSimulateFailure = async () => {
        if (!paymentData?.payment?.id) return;
        try {
            await simulateFailure.mutateAsync({
                paymentId: paymentData.payment.id,
                reason: t('payment.simulated_failure_reason') as string,
            });
            refetchStatus();
        } catch (error: any) {
            toastError(error?.message || t('payment.messages.simulation_failed') as string);
        }
    };

    const handleExpired = () => {
        setIsPolling(false);
        toastError(t('payment.messages.qr_expired') as string);
    };

    const isDev = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

    if (!orderId) {
        return (
            <RequireAuth roles={['customer']}>
                <CustomerLayout>
                    <Head>
                        <title>{t('payment.page_title')}</title>
                    </Head>
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                        <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" />
                        <h1 className="text-xl sm:text-2xl font-bold mb-2">{t('payment.no_order')}</h1>
                        <p className="text-gray-400 mb-6 text-sm">{t('payment.place_order_first')}</p>
                        <Button onClick={() => (window.location.href = '/menu')}>{t('payment.browse_menu')}</Button>
                    </div>
                </CustomerLayout>
            </RequireAuth>
        );
    }

    return (
        <RequireAuth roles={['customer']}>
            <CustomerLayout>
                <Head>
                    <title>{t('payment.page_title')}</title>
                </Head>
                <div className="flex flex-col items-center justify-center min-h-[80vh] w-full p-4 sm:p-6">
                    <div className="w-full max-w-md space-y-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => step === 'processing' ? handleBack() : window.history.back()}
                                className="p-2.5 -ml-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-800 dark:text-white transition-all hover:scale-105 active:scale-95 backdrop-blur-md"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white drop-shadow-sm">
                                    {step === 'select-method' ? t('payment.choose_payment') : t('payment.complete_payment')}
                                </h1>
                                {paymentData?.order && (
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-200/80 font-medium">{t('payment.order_number', { number: paymentData.order?.order_number })}</p>
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
                                    {/* Glass Card */}
                                    <div className="rounded-2xl overflow-hidden bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 shadow-xl">
                                        <div className="p-4 sm:p-6">
                                            <PaymentMethodSelector
                                                methods={paymentMethods || []}
                                                selectedMethod={selectedMethod}
                                                onSelect={handleMethodSelect}
                                                isLoading={methodsLoading}
                                                disabled={initPayment.isPending}
                                            />
                                        </div>
                                    </div>

                                    {/* Proceed Button */}
                                    {selectedMethod && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <Button
                                                onClick={handleProceed}
                                                disabled={initPayment.isPending}
                                                className="w-full py-4 text-sm sm:text-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white border-0 shadow-lg shadow-fuchsia-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl font-bold"
                                            >
                                                {initPayment.isPending ? (
                                                    t('payment.processing')
                                                ) : (
                                                    <>
                                                        {t('payment.continue')}
                                                        <ChevronRight className="w-5 h-5 ml-2" />
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
                                            qrImageBase64={paymentData.qr_code?.image_base64 || ''}
                                            qrReference={paymentData.qr_code?.reference || ''}
                                            amount={paymentData.payment?.amount || 0}
                                            currency={paymentData.payment?.currency || 'USD'}
                                            expiresAt={paymentData.payment?.expires_at ?? null}
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
                                            orderNumber={paymentData.order?.order_number || t('payment.fallbacks.order_number')}
                                            amount={paymentData.payment?.amount || 0}
                                            currency={paymentData.payment?.currency || 'USD'}
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
                                                amount={paymentData.payment?.amount || 0}
                                                currency={paymentData.payment?.currency || 'USD'}
                                                orderNumber={paymentData.order?.order_number || t('payment.fallbacks.order_number')}
                                                onSuccess={() => {
                                                    toastSuccess(t('payment.messages.success') as string);
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
                                                amount={paymentData.payment?.amount || 0}
                                                currency={paymentData.payment?.currency || 'USD'}
                                                onBack={handleBack}
                                            />
                                        )
                                    )}

                                    {/* Order Summary */}
                                    <div className="rounded-2xl overflow-hidden bg-white/60 dark:bg-gray-900/40 backdrop-blur-xl border border-white/20 shadow-lg">
                                        <div className="p-4 sm:p-5 flex justify-between items-center">
                                            <span className="text-sm sm:text-base text-gray-500 dark:text-gray-200 font-medium">{t('payment.total_amount')}</span>
                                            <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">${paymentData.order?.total?.toFixed(2) || '0.00'}</span>
                                        </div>
                                    </div>

                                    {/* Dev Mode Simulation for non-QR payments */}
                                    {isDev && paymentData.type !== 'qr' && paymentData.payment?.status === 'pending' && (
                                        <div className="rounded-2xl overflow-hidden bg-white/40 dark:bg-white/5 border border-white/10 p-4">
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center uppercase tracking-wider font-semibold">{t('payment.dev_mode')}</p>
                                            <div className="flex gap-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleSimulateSuccess}
                                                    className="flex-1 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 text-xs py-2"
                                                >
                                                    {t('payment.simulate_success')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={handleSimulateFailure}
                                                    className="flex-1 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs py-2"
                                                >
                                                    {t('payment.simulate_failure')}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cancel Payment (for non-completed) */}
                                    {paymentData.payment?.status === 'pending' && (
                                        <div className="text-center mt-4">
                                            <button
                                                onClick={handleBack}
                                                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hover:underline underline-offset-4"
                                            >
                                                {t('payment.change_method')}
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </CustomerLayout>
        </RequireAuth>
    );
}
