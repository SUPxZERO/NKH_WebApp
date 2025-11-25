import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardFooter } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { cn } from '@/app/utils/cn';

interface CartSummaryProps {
    subtotal: number;
    deliveryFee: number;
    tax: number;
    total: number;
    itemCount: number;
    mode: 'delivery' | 'pickup' | 'dine-in';
    onCheckout: () => void;
    isCheckoutDisabled?: boolean;
    promoCode?: string;
    onApplyPromo?: (code: string) => void;
}

export function CartSummary({
    subtotal,
    deliveryFee,
    tax,
    total,
    itemCount,
    mode,
    onCheckout,
    isCheckoutDisabled = false,
    promoCode,
    onApplyPromo,
}: CartSummaryProps) {
    const [promoInput, setPromoInput] = React.useState('');

    return (
        <Card className="sticky top-24">
            <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Order Summary
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </p>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Promo Code Input (Optional) */}
                {onApplyPromo && !promoCode && (
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Promo Code
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={promoInput}
                                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                                placeholder="Enter code"
                                className="flex-1 px-3 py-2 rounded-lg bg-white/60 dark:bg-white/5 border border-white/20 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 transition-all outline-none text-sm"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (promoInput.trim()) {
                                        onApplyPromo(promoInput.trim());
                                        setPromoInput('');
                                    }
                                }}
                                disabled={!promoInput.trim()}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                )}

                {/* Applied Promo */}
                {promoCode && (
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                            {promoCode} applied
                        </span>
                    </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-3 py-4 border-y border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            ${subtotal.toFixed(2)}
                        </span>
                    </div>

                    {mode === 'delivery' && deliveryFee > 0 && (
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                ${deliveryFee.toFixed(2)}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tax</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            ${tax.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                        ${total.toFixed(2)}
                    </span>
                </div>

                {/* Delivery Estimate (if delivery) */}
                {mode === 'delivery' && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            Estimated delivery: <strong>30-45 min</strong>
                        </p>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
                <Button
                    className="w-full"
                    size="lg"
                    onClick={onCheckout}
                    disabled={isCheckoutDisabled}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                    Proceed to Checkout
                </Button>

                <Button
                    variant="ghost"
                    className="w-full"
                    size="sm"
                    onClick={() => (window.location.href = '/menu')}
                >
                    Continue Shopping
                </Button>
            </CardFooter>
        </Card>
    );
}

export default CartSummary;
