import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/app/libs/apiClient';
import { Card, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { toastSuccess } from '@/app/utils/toast';
import {
    Clock,
    CheckCircle,
    AlertCircle,
    Package,
    ChefHat,
    Flame,
    Bell,
} from 'lucide-react';

interface KitchenOrder {
    id: number;
    order_number: string;
    table_number?: string;
    type: 'dine-in' | 'pickup' | 'delivery';
    status: 'pending' | 'received' | 'preparing' | 'ready' | 'completed';
    items: Array<{
        id: number;
        name: string;
        quantity: number;
        notes?: string;
    }>;
    created_at: string;
    notes?: string;
}

export default function KitchenDisplay() {
    const [soundEnabled, setSoundEnabled] = useState(true);
    const qc = useQueryClient();

    // Fetch orders every 5 seconds
    const { data: orders, isLoading } = useQuery<{ data: KitchenOrder[] }>({
        queryKey: ['kitchen.orders'],
        queryFn: () => apiGet('/kitchen/orders'),
        refetchInterval: 5000, // Auto-refresh every 5 seconds
        staleTime: 0,
    });

    // Update order status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            apiPut(`/kitchen/orders/${id}/status`, { status }),
        onSuccess: () => {
            toastSuccess('Order status updated');
            qc.invalidateQueries({ queryKey: ['kitchen.orders'] });
        },
    });

    // Play sound on new orders
    const previousOrderCount = React.useRef(0);
    useEffect(() => {
        if (orders?.data && soundEnabled) {
            const currentCount = orders.data.filter((o) => o.status === 'pending').length;
            if (currentCount > previousOrderCount.current) {
                // New order arrived - play sound
                const audio = new Audio('/sounds/new-order.mp3');
                audio.play().catch(() => {
                    /* Browser might block auto-play */
                });
            }
            previousOrderCount.current = currentCount;
        }
    }, [orders, soundEnabled]);

    // Group orders by status
    const groupedOrders = React.useMemo(() => {
        if (!orders?.data) return { pending: [], preparing: [], ready: [] };

        return {
            pending: orders.data.filter((o) => o.status === 'pending' || o.status === 'received'),
            preparing: orders.data.filter((o) => o.status === 'preparing'),
            ready: orders.data.filter((o) => o.status === 'ready'),
        };
    }, [orders]);

    // Calculate order age in minutes
    const getOrderAge = (createdAt: string): number => {
        const created = new Date(createdAt);
        const now = new Date();
        return Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
    };

    const handleStartPrep = (orderId: number) => {
        updateStatusMutation.mutate({ id: orderId, status: 'preparing' });
    };

    const handleMarkReady = (orderId: number) => {
        updateStatusMutation.mutate({ id: orderId, status: 'ready' });
    };

    const handleMarkCompleted = (orderId: number) => {
        updateStatusMutation.mutate({ id: orderId, status: 'completed' });
    };

    const OrderCard = ({ order, showAction, actionLabel, onAction, statusColor }: any) => {
        const age = getOrderAge(order.created_at);
        const isUrgent = age >= 15;

        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-4 rounded-xl border-l-4 ${statusColor} bg-white dark:bg-gray-800 shadow-lg`}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            #{order.order_number}
                        </div>
                        {order.table_number && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">Table {order.table_number}</div>
                        )}
                        <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">{order.type}</div>
                    </div>
                    <div className="text-right">
                        <div className={`text-lg font-bold ${isUrgent ? 'text-red-600 animate-pulse' : 'text-gray-700 dark:text-gray-300'}`}>
                            ⏱ {age} min
                        </div>
                        {isUrgent && (
                            <div className="text-xs text-red-600 font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                URGENT
                            </div>
                        )}
                    </div>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {order.items.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2 py-1 border-b border-gray-200 dark:border-gray-700">
                            <div className="w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold">
                                {item.quantity}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                {item.notes && (
                                    <div className="text-xs text-orange-600 dark:text-orange-400 italic">Note: {item.notes}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Notes */}
                {order.notes && (
                    <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Order Note:</strong> {order.notes}
                    </div>
                )}

                {/* Action Button */}
                {showAction && (
                    <Button
                        onClick={() => onAction(order.id)}
                        className="w-full h-12 text-lg font-bold"
                        disabled={updateStatusMutation.isPending}
                    >
                        {actionLabel}
                    </Button>
                )}
            </motion.div>
        );
    };

    return (
        <EmployeeLayout>
            <Head>
                <title>Kitchen Display - NKH Restaurant</title>
            </Head>

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ChefHat className="w-8 h-8 text-fuchsia-600" />
                        <h1 className="text-3xl font-bold">Kitchen Display System</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant={soundEnabled ? 'primary' : 'ghost'}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            leftIcon={<Bell className="w-4 h-4" />}
                        >
                            {soundEnabled ? 'Sound On' : 'Sound Off'}
                        </Button>
                        <div className="text-lg">
                            <span className="text-gray-500">Total: </span>
                            <span className="font-bold">{orders?.data?.length || 0}</span>
                        </div>
                    </div>
                </div>

                {/* 3-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: NEW/WAITING */}
                    <div>
                        <div className="mb-4 p-4 rounded-xl bg-red-500 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6" />
                                    <h2 className="text-xl font-bold">NEW</h2>
                                </div>
                                <div className="text-3xl font-bold">{groupedOrders.pending.length}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {groupedOrders.pending.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 text-gray-500"
                                    >
                                        <Package className="w-16 h-16 mx-auto mb-2 opacity-30" />
                                        <p>No new orders</p>
                                    </motion.div>
                                ) : (
                                    groupedOrders.pending.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            showAction
                                            actionLabel="START PREP"
                                            onAction={handleStartPrep}
                                            statusColor="border-red-500"
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Column 2: PREPARING */}
                    <div>
                        <div className="mb-4 p-4 rounded-xl bg-yellow-500 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Flame className="w-6 h-6" />
                                    <h2 className="text-xl font-bold">PREPARING</h2>
                                </div>
                                <div className="text-3xl font-bold">{groupedOrders.preparing.length}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {groupedOrders.preparing.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 text-gray-500"
                                    >
                                        <ChefHat className="w-16 h-16 mx-auto mb-2 opacity-30" />
                                        <p>No orders cooking</p>
                                    </motion.div>
                                ) : (
                                    groupedOrders.preparing.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            showAction
                                            actionLabel="MARK READY"
                                            onAction={handleMarkReady}
                                            statusColor="border-yellow-500"
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Column 3: READY */}
                    <div>
                        <div className="mb-4 p-4 rounded-xl bg-green-500 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-6 h-6" />
                                    <h2 className="text-xl font-bold">READY</h2>
                                </div>
                                <div className="text-3xl font-bold">{groupedOrders.ready.length}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence mode="popLayout">
                                {groupedOrders.ready.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 text-gray-500"
                                    >
                                        <Clock className="w-16 h-16 mx-auto mb-2 opacity-30" />
                                        <p>No orders ready</p>
                                    </motion.div>
                                ) : (
                                    groupedOrders.ready.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            showAction
                                            actionLabel="DELIVERED"
                                            onAction={handleMarkCompleted}
                                            statusColor="border-green-500"
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
