import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ShoppingCart, MapPin, CreditCard, Check } from 'lucide-react';
import { cn } from '@/app/utils/cn';

import { useTranslation } from '@/app/hooks/useTranslation';

type Step = 'menu' | 'cart' | 'checkout' | 'payment';

interface OrderProgressProps {
    currentStep: Step;
    className?: string;
}

export function OrderProgress({ currentStep, className }: OrderProgressProps) {
    const { t } = useTranslation();

    const steps = [
        { id: 'menu', label: t('layout.nav.mobile_menu_title'), icon: ShoppingBag },
        { id: 'cart', label: t('layout.nav.cart'), icon: ShoppingCart },
        { id: 'checkout', label: t('cart.checkout'), icon: MapPin },
        { id: 'payment', label: t('checkout.payment_title'), icon: CreditCard },
    ] as const;

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className={cn('w-full', className)}>
            {/* Desktop Progress */}
            <div className="hidden sm:flex items-center justify-between relative">
                {/* Progress Line Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />

                {/* Progress Line Fill */}
                <motion.div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                />

                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const isPending = index > currentIndex;

                    return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300',
                                    isCompleted && 'bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg shadow-fuchsia-500/30',
                                    isCurrent && 'bg-gradient-to-br from-fuchsia-600 to-pink-600 shadow-xl shadow-fuchsia-500/40 ring-4 ring-fuchsia-500/20',
                                    isPending && 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5 text-white" />
                                ) : (
                                    <Icon className={cn(
                                        'w-5 h-5',
                                        isCurrent ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                                    )} />
                                )}
                            </motion.div>
                            <span className={cn(
                                'mt-2 text-sm font-medium transition-colors',
                                isCompleted && 'text-fuchsia-600 dark:text-fuchsia-400',
                                isCurrent && 'text-fuchsia-600 dark:text-fuchsia-400 font-semibold',
                                isPending && 'text-gray-400 dark:text-gray-500'
                            )}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Mobile Progress - Compact */}
            <div className="sm:hidden">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Step {currentIndex + 1} of {steps.length}
                    </span>
                    <span className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                        {steps[currentIndex].label}
                    </span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
                {/* Mobile Step Dots */}
                <div className="flex justify-between mt-2">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={cn(
                                'w-2 h-2 rounded-full transition-all',
                                index <= currentIndex
                                    ? 'bg-fuchsia-500'
                                    : 'bg-gray-300 dark:bg-gray-600'
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default OrderProgress;
