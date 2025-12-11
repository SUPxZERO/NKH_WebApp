import React, { useState, useEffect } from 'react';
import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { CreditCard, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { toastSuccess, toastError } from '@/app/utils/toast';

// Stripe promise will be initialized with the publishable key
let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = (publishableKey: string) => {
    if (!stripePromise && publishableKey) {
        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
};

interface StripeCardFormProps {
    clientSecret: string;
    publishableKey: string;
    amount: number;
    currency: string;
    orderNumber: string;
    onSuccess: () => void;
    onError: (message: string) => void;
    onCancel: () => void;
}

// Inner form component that uses Stripe hooks
function CheckoutForm({
    clientSecret,
    amount,
    currency,
    orderNumber,
    onSuccess,
    onError,
    onCancel,
}: Omit<StripeCardFormProps, 'publishableKey'>) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    const formatCurrency = (value: number) => {
        return currency.toUpperCase() === 'KHR'
            ? `៛${value.toLocaleString()}`
            : `$${value.toFixed(2)}`;
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            return;
        }

        setIsProcessing(true);
        setCardError(null);

        try {
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (error) {
                setCardError(error.message || 'Payment failed');
                onError(error.message || 'Payment failed');
            } else if (paymentIntent?.status === 'succeeded') {
                toastSuccess('Payment successful!');
                onSuccess();
            } else if (paymentIntent?.status === 'requires_action') {
                // 3D Secure handling is automatic with confirmCardPayment
                toastSuccess('Payment requires additional verification');
            }
        } catch (err: any) {
            setCardError(err.message || 'An unexpected error occurred');
            onError(err.message || 'An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                '::placeholder': {
                    color: '#6b7280',
                },
            },
            invalid: {
                color: '#ef4444',
                iconColor: '#ef4444',
            },
        },
        hidePostalCode: true,
    };

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            {/* Header */}
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Secure Card Payment</h2>
                <p className="text-gray-400">Order #{orderNumber}</p>
            </div>

            {/* Amount */}
            <div className="text-center py-4 bg-white/5 rounded-xl">
                <p className="text-sm text-gray-400">Total Amount</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(amount)}</p>
            </div>

            {/* Card Element */}
            <div className="space-y-2">
                <label className="block text-sm text-gray-400">Card Details</label>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 focus-within:border-violet-500 transition-colors">
                    <CardElement
                        options={cardElementOptions}
                        onChange={(e) => {
                            setCardComplete(e.complete);
                            setCardError(e.error?.message || null);
                        }}
                    />
                </div>
                {cardError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-red-400 text-sm"
                    >
                        <AlertCircle className="w-4 h-4" />
                        {cardError}
                    </motion.div>
                )}
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <Lock className="w-4 h-4" />
                <span>Payments secured by Stripe</span>
            </div>

            {/* Card Brands */}
            <div className="flex items-center justify-center gap-3">
                <div className="px-3 py-1.5 rounded bg-white/10 text-xs font-medium text-gray-300">
                    VISA
                </div>
                <div className="px-3 py-1.5 rounded bg-white/10 text-xs font-medium text-gray-300">
                    Mastercard
                </div>
                <div className="px-3 py-1.5 rounded bg-white/10 text-xs font-medium text-gray-300">
                    AMEX
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={!stripe || !cardComplete || isProcessing}
                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Lock className="w-5 h-5 mr-2" />
                            Pay {formatCurrency(amount)}
                        </>
                    )}
                </Button>
            </div>

            {/* Test Card Info (for development) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-amber-400 font-medium mb-1">Test Mode</p>
                    <p className="text-xs text-gray-400">
                        Use card: <code className="text-amber-300">4242 4242 4242 4242</code>
                        <br />
                        Any future date, any CVC, any ZIP
                    </p>
                </div>
            )}
        </motion.form>
    );
}

// Wrapper component that loads Stripe
export default function StripeCardForm(props: StripeCardFormProps) {
    const { publishableKey, ...formProps } = props;
    const [stripeLoaded, setStripeLoaded] = useState(false);

    useEffect(() => {
        if (publishableKey) {
            getStripe(publishableKey);
            setStripeLoaded(true);
        }
    }, [publishableKey]);

    if (!publishableKey) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                        Stripe Not Configured
                    </h3>
                    <p className="text-gray-400">
                        Card payments are not available. Please contact support.
                    </p>
                    <Button variant="outline" onClick={props.onCancel} className="mt-4">
                        Go Back
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!stripeLoaded) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
        );
    }

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <Elements stripe={getStripe(publishableKey)} options={{ clientSecret: props.clientSecret }}>
                    <CheckoutForm {...formProps} />
                </Elements>
            </CardContent>
        </Card>
    );
}
