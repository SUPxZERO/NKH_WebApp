import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { OrderItem } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';

interface CartItemProps {
    item: OrderItem;
    onUpdateQuantity: (menuItemId: number, quantity: number) => void;
    onRemove: (menuItemId: number) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
    const itemTotal = item.unit_price * item.quantity;

    return (
        <motion.div
            className="flex gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.2 }}
            layout
        >
            {/* Image */}
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                {item.image_path ? (
                    <img
                        src={item.image_path}
                        alt={item.name || 'Menu item'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                        🍽️
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 flex-1">
                        {item.name || `Item #${item.menu_item_id}`}
                    </h3>
                    <button
                        onClick={() => onRemove(item.menu_item_id)}
                        className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400">
                        ${itemTotal.toFixed(2)}
                    </span>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                        <button
                            onClick={() => onUpdateQuantity(item.menu_item_id, Math.max(1, item.quantity - 1))}
                            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                            <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                            onClick={() => onUpdateQuantity(item.menu_item_id, item.quantity + 1)}
                            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default CartItem;
