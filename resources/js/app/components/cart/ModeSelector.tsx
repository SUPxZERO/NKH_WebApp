import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ShoppingBag } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useTranslation } from '@/app/hooks/useTranslation';

interface ModeSelectorProps {
    mode: 'delivery' | 'pickup';
    onChange: (mode: 'delivery' | 'pickup') => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
    const { t } = useTranslation();
    return (
        <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {/* Delivery Option */}
            <button
                onClick={() => onChange('delivery')}
                className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                    mode === 'delivery'
                        ? 'bg-white dark:bg-gray-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
            >
                <Truck className="w-4 h-4" />
                <span className="hidden sm:inline">{t('cart.delivery')}</span>
            </button>

            {/* Pickup Option */}
            <button
                onClick={() => onChange('pickup')}
                className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all',
                    mode === 'pickup'
                        ? 'bg-white dark:bg-gray-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                )}
            >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">{t('cart.pickup')}</span>
            </button>
        </div>
    );
}

export default ModeSelector;
