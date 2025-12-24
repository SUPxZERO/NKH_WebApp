import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Banknote, CreditCard, Wallet, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/app/utils/cn';

export interface PaymentMethodOption {
    id: number;
    code: string;
    name: string;
    type: string;
    description: string;
    processing_fee: number;
    icon: string;
}

interface PaymentMethodSelectorProps {
    methods: PaymentMethodOption[];
    selectedMethod: string | null;
    onSelect: (code: string) => void;
    isLoading?: boolean;
    disabled?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
    'qr-code': QrCode,
    'banknotes': Banknote,
    'credit-card': CreditCard,
    'currency-dollar': Wallet,
};

export default function PaymentMethodSelector({
    methods,
    selectedMethod,
    onSelect,
    isLoading = false,
    disabled = false,
}: PaymentMethodSelectorProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
            </div>
        );
    }

    if (methods.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                No payment methods available
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wide">
                Select Payment Method
            </h3>
            <div className="grid gap-2 sm:gap-3">
                {methods.map((method, index) => {
                    const IconComponent = iconMap[method.icon] || Wallet;
                    const isSelected = selectedMethod === method.code;

                    return (
                        <motion.button
                            key={method.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => !disabled && onSelect(method.code)}
                            disabled={disabled}
                            className={cn(
                                'relative w-full p-3 sm:p-4 rounded-xl border-2 transition-all duration-200',
                                'flex items-center gap-2 sm:gap-4 text-left',
                                'hover:scale-[1.01] active:scale-[0.99]',
                                isSelected
                                    ? 'border-fuchsia-500 bg-fuchsia-500/10 shadow-lg shadow-fuchsia-500/20'
                                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
                                disabled && 'opacity-50 cursor-not-allowed hover:scale-100'
                            )}
                        >
                            {/* Icon */}
                            <div
                                className={cn(
                                    'w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                                    isSelected
                                        ? 'bg-fuchsia-500 text-white'
                                        : 'bg-white/10 text-gray-300'
                                )}
                            >
                                <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={cn(
                                        'font-semibold text-sm sm:text-lg',
                                        isSelected ? 'text-white' : 'text-gray-200'
                                    )}>
                                        {method.name}
                                    </span>
                                    {method.processing_fee > 0 && (
                                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                                            +${method.processing_fee.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 truncate hidden sm:block">
                                    {method.description}
                                </p>
                            </div>

                            {/* Selection Indicator */}
                            <div
                                className={cn(
                                    'w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0',
                                    isSelected
                                        ? 'border-fuchsia-500 bg-fuchsia-500'
                                        : 'border-white/20 bg-transparent'
                                )}
                            >
                                {isSelected && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Method Type Legend */}
            <div className="flex flex-wrap gap-2 sm:gap-4 pt-2">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Scan to pay</span>
                    <span className="sm:hidden">QR</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Banknote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Pay at counter</span>
                    <span className="sm:hidden">Cash</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Card payment</span>
                    <span className="sm:hidden">Card</span>
                </div>
            </div>
        </div>
    );
}
