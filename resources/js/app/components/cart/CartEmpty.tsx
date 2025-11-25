import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Sparkles } from 'lucide-react';
import Button from '@/app/components/ui/Button';

interface CartEmptyProps {
    onBrowseMenu?: () => void;
}

export function CartEmpty({ onBrowseMenu }: CartEmptyProps) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Icon */}
            <motion.div
                className="relative mb-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>

                {/* Sparkle decoration */}
                <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                    <Sparkles className="w-6 h-6 text-fuchsia-500" />
                </motion.div>
            </motion.div>

            {/* Text */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                Looks like you haven't added anything to your cart yet. Browse our menu and discover delicious dishes!
            </p>

            {/* CTA Button */}
            <Button
                size="lg"
                onClick={onBrowseMenu || (() => (window.location.href = '/menu'))}
            >
                Browse Menu
            </Button>

            {/* Optional: Recent favorites or recommendations */}
            <div className="mt-12 w-full max-w-2xl">
                <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                    Popular right now
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['🍔', '🍕', '🍝', '🍰'].map((emoji, i) => (
                        <motion.div
                            key={i}
                            className="aspect-square rounded-2xl bg-white/60 dark:bg-white/5 border border-white/20 flex items-center justify-center text-5xl hover:scale-105 transition-transform cursor-pointer"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -4 }}
                        >
                            {emoji}
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default CartEmpty;
