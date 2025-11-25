import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X, Trash2 } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { OrderItem } from '@/app/types/domain';

interface QuantitySelectorProps {
    quantity: number;
    onIncrease: () => void;
    onDecrease: () => void;
    min?: number;
    max?: number;
    size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
    sm: {
        button: 'w-7 h-7',
        text: 'text-sm',
        icon: 'w-3 h-3',
    },
    md: {
        button: 'w-9 h-9',
        text: 'text-base',
        icon: 'w-4 h-4',
    },
    lg: {
        button: 'w-11 h-11',
        text: 'text-lg',
        icon: 'w-5 h-5',
    },
};

export function QuantitySelector({
    quantity,
    onIncrease,
    onDecrease,
    min = 1,
    max = 99,
    size = 'md',
}: QuantitySelectorProps) {
    const classes = sizeClasses[size];

    return (
        <div className="inline-flex items-center gap-2 rounded-xl bg-white/60 dark:bg-white/5 border border-white/20 p-1">
            <motion.button
                onClick={onDecrease}
                disabled={quantity <= min}
                className={cn(
                    'flex items-center justify-center rounded-lg bg-white/50 dark:bg-white/10 hover:bg-fuchsia-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/50 dark:disabled:hover:bg-white/10',
                    classes.button
                )}
                whileTap={{ scale: 0.9 }}
                aria-label="Decrease quantity"
            >
                <Minus className={classes.icon} />
            </motion.button>

            <span className={cn('font-semibold min-w-[2ch] text-center tabular-nums', classes.text)}>
                {quantity}
            </span>

            <motion.button
                onClick={onIncrease}
                disabled={quantity >= max}
                className={cn(
                    'flex items-center justify-center rounded-lg bg-white/50 dark:bg-white/10 hover:bg-fuchsia-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/50 dark:disabled:hover:bg-white/10',
                    classes.button
                )}
                whileTap={{ scale: 0.9 }}
                aria-label="Increase quantity"
            >
                <Plus className={classes.icon} />
            </motion.button>
        </div>
    );
}

export default QuantitySelector;
