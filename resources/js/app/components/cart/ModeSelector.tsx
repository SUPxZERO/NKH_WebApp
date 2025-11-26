import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ShoppingBag } from 'lucide-react';

interface ModeSelectorProps {
    mode: 'delivery' | 'pickup';
    onChange: (mode: 'delivery' | 'pickup') => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Order Type
            </h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Delivery Option */}
                <button
                    onClick={() => onChange('delivery')}
                    className={`relative p-6 rounded-xl border-2 transition-all ${mode === 'delivery'
                            ? 'border-fuchsia-500 bg-fuchsia-500/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-fuchsia-300'
                        }`}
                >
                    <div className="flex flex-col items-center gap-3">
                        <Truck className={`w-8 h-8 ${mode === 'delivery' ? 'text-fuchsia-600' : 'text-gray-600'}`} />
                        <span className={`font-semibold ${mode === 'delivery' ? 'text-fuchsia-600' : 'text-gray-700 dark:text-gray-300'}`}>
                            Delivery
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                            Get it delivered to your door
                        </span>
                    </div>

                    {mode === 'delivery' && (
                        <motion.div
                            layoutId="mode-indicator"
                            className="absolute top-2 right-2 w-6 h-6 bg-fuchsia-500 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                    )}
                </button>

                {/* Pickup Option */}
                <button
                    onClick={() => onChange('pickup')}
                    className={`relative p-6 rounded-xl border-2 transition-all ${mode === 'pickup'
                            ? 'border-fuchsia-500 bg-fuchsia-500/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-fuchsia-300'
                        }`}
                >
                    <div className="flex flex-col items-center gap-3">
                        <ShoppingBag className={`w-8 h-8 ${mode === 'pickup' ? 'text-fuchsia-600' : 'text-gray-600'}`} />
                        <span className={`font-semibold ${mode === 'pickup' ? 'text-fuchsia-600' : 'text-gray-700 dark:text-gray-300'}`}>
                            Pickup
                        </span>
                        <span className="text-xs text-gray-500 text-center">
                            Pick it up yourself
                        </span>
                    </div>

                    {mode === 'pickup' && (
                        <motion.div
                            layoutId="mode-indicator"
                            className="absolute top-2 right-2 w-6 h-6 bg-fuchsia-500 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                    )}
                </button>
            </div>

            {/* Info message */}
            <p className="mt-4 text-sm text-gray-500 text-center">
                {mode === 'delivery'
                    ? '📦 Your order will be delivered to your address'
                    : '🏪 You\'ll pick up your order at the restaurant'}
            </p>
        </div>
    );
}
