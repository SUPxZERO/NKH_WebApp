import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { OrderItem } from '@/app/types/domain';
import { QuantitySelector } from './QuantitySelector';

interface CartItemProps {
    item: OrderItem;
    onUpdateQuantity: (menuItemId: number, quantity: number) => void;
    onRemove: (menuItemId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const itemTotal = item.unit_price * item.quantity;

    return (
        <motion.div
            className="relative flex gap-4 p-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:border-fuchsia-500/30 transition-all duration-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            layout
        >
            <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                <img
                    src={item.menu_item?.image_path ?? ""}
                    alt={item.menu_item?.name || item.name || `Item #${item.menu_item_id}`}
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1">
                            {item.name || `Item #${item.menu_item_id}`}
                        </h3>

                        <motion.button
                            onClick={() => onRemove(item.menu_item_id)}
                            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Remove item"
                        >
                            <X className="w-5 h-5" />
                        </motion.button>
                    </div>

                    {item.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-2">
                            Note: {item.notes}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                            ${itemTotal.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                            ${item.unit_price.toFixed(2)} each
                        </span>
                    </div>

                    <QuantitySelector
                        quantity={item.quantity}
                        onIncrease={() => onUpdateQuantity(item.menu_item_id, item.quantity + 1)}
                        onDecrease={() => onUpdateQuantity(item.menu_item_id, Math.max(1, item.quantity - 1))}
                        min={1}
                        max={99}
                        size="md"
                    />
                </div>
            </div>
        </motion.div>
    );
}

export default CartItem;
