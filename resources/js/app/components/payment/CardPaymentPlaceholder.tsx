import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';

interface CardPaymentPlaceholderProps {
    amount: number;
    currency: string;
    onBack?: () => void;
}

export default function CardPaymentPlaceholder({
    amount,
    currency,
    onBack,
}: CardPaymentPlaceholderProps) {
    const formatCurrency = (value: number) => {
        return currency === 'KHR'
            ? `៛${value.toLocaleString()}`
            : `$${value.toFixed(2)}`;
    };

    return (
        <Card className="overflow-hidden">
            <CardContent className="p-0">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center"
                    >
                        <CreditCard className="w-10 h-10 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white mb-2">Card Payment</h2>
                    <p className="text-white/80">{formatCurrency(amount)}</p>
                </div>

                {/* Coming Soon Message */}
                <div className="p-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-amber-400" />
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Coming Soon
                            </h3>
                            <p className="text-gray-400">
                                Card payment integration is currently being set up.
                                Please use QR code or cash payment for now.
                            </p>
                        </div>

                        {/* Security Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-sm text-gray-400">
                            <Lock className="w-4 h-4" />
                            <span>Secure payment powered by Stripe</span>
                        </div>

                        {/* Card Brands Preview */}
                        <div className="flex items-center justify-center gap-4 pt-4">
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

                        {/* Back Button */}
                        {onBack && (
                            <div className="pt-4">
                                <Button variant="outline" onClick={onBack}>
                                    ← Choose Another Method
                                </Button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </CardContent>
        </Card>
    );
}
