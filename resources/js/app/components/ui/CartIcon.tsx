import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { apiGet } from '@/app/utils/api';

interface CartIconProps {
    className?: string;
}

interface CartData {
    items: Array<{
        id: number;
        quantity: number;
    }>;
    total: number;
}

export default function CartIcon({ className }: CartIconProps) {
    // Fetch cart data
    const { data: cartData } = useQuery({
        queryKey: ['cart'],
        queryFn: async () => {
            try {
                const response = await apiGet('/api/customer/cart') as { success: boolean; data: CartData };
                return response.data;
            } catch (error) {
                // Return empty cart if not logged in or error
                return { items: [], total: 0 };
            }
        },
        refetchInterval: 10000, // Refetch every 10 seconds
        staleTime: 5000,
    });

    // Calculate total items count
    const itemCount = cartData?.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0;

    return (
        <Link
            href="/cart"
            className={cn(
                'relative p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors',
                className
            )}
        >
            <ShoppingCart className="w-5 h-5" />
            {itemCount > 0 && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    key={itemCount}
                    className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                >
                    {itemCount > 99 ? '99+' : itemCount}
                </motion.span>
            )}
        </Link>
    );
}
