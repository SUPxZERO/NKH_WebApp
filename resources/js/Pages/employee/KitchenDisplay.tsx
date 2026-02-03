import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/app/libs/apiClient';
import { useLanguage } from '@/app/context/LanguageContext';
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
    X,
    User,
    MapPin,
    Phone,
    FileText,
    UtensilsCrossed,
    QrCode,
    Truck,
} from 'lucide-react';
import { useOrderUpdates } from '@/app/hooks/useRealtime';


interface OrderItem {
    id: number;
    name: string;
    quantity: number;
    notes?: string;
    unit_price?: number;
    total_price?: number;
    status?: string;
}

interface KitchenOrder {
    id: number;
    order_number: string;
    table_number?: string;
    type: 'dine-in' | 'pickup' | 'delivery';
    status: 'pending' | 'received' | 'preparing' | 'ready' | 'completed';
    items: OrderItem[];
    created_at: string;
    notes?: string;
    customer_name?: string;
    customer_phone?: string;
    delivery_address?: string;
    subtotal?: number;
    total_amount?: number;
}

import { useSmartPolling } from '@/app/hooks/useSmartPolling';

export default function KitchenDisplay() {
    const { t } = useLanguage();
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null);
    useOrderUpdates();
    useSmartPolling(['kitchen'], 5000); // Poll every 5s for kitchen updates
    const qc = useQueryClient();


    // Fetch orders
    const { data: orders, isLoading } = useQuery<{ data: KitchenOrder[] }>({
        queryKey: ['kitchen.orders'],
        queryFn: () => apiGet('/kitchen/orders'),
        staleTime: 0,
    });

    // Update order status mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: number; status: string }) =>
            apiPut(`/kitchen/orders/${id}/status`, { status }),
        onSuccess: () => {
            toastSuccess(t('employee.common.success'));
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

    // Order Detail Modal Component
    const OrderDetailModal = ({ order, onClose }: { order: KitchenOrder; onClose: () => void }) => {
        const age = getOrderAge(order.created_at);
        const isUrgent = age >= 15;

        const getStatusColor = () => {
            switch (order.status) {
                case 'pending':
                case 'received':
                    return 'bg-red-500';
                case 'preparing':
                    return 'bg-yellow-500';
                case 'ready':
                    return 'bg-green-500';
                default:
                    return 'bg-gray-500';
            }
        };

        const getStatusLabel = () => {
            switch (order.status) {
                case 'pending':
                case 'received':
                    return 'NEW';
                case 'preparing':
                    return 'PREPARING';
                case 'ready':
                    return 'READY';
                default:
                    return order.status.toUpperCase();
            }
        };

        const getNextAction = () => {
            switch (order.status) {
                case 'pending':
                case 'received':
                    return { label: t('employee.kitchen.start_prep'), action: () => handleStartPrep(order.id) };
                case 'preparing':
                    return { label: t('employee.kitchen.mark_ready'), action: () => handleMarkReady(order.id) };
                case 'ready':
                    return { label: t('employee.kitchen.delivered'), action: () => handleMarkCompleted(order.id) };
                default:
                    return null;
            }
        };

        const nextAction = getNextAction();

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modal Header */}
                    <div className={`${getStatusColor()} p-4 text-white`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <UtensilsCrossed className="w-8 h-8" />
                                <div>
                                    <h2 className="text-2xl font-bold">Order #{order.order_number}</h2>
                                    <div className="flex items-center gap-2 text-sm opacity-90 mt-1">
                                        <span className="capitalize px-2 py-0.5 rounded bg-white/20 font-bold">{order.type.replace('-', ' ')}</span>
                                        {order.table_number && (
                                            <span className="flex items-center gap-1 font-bold bg-white/20 px-2 py-0.5 rounded">
                                                <QrCode className="w-4 h-4" />
                                                Table {order.table_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className={`text-xl font-bold ${isUrgent ? 'animate-pulse' : ''}`}>
                                        ⏱ {age} min
                                    </div>
                                    <div className="text-sm font-semibold px-2 py-0.5 bg-white/20 rounded">
                                        {getStatusLabel()}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {/* Customer Info (for delivery/pickup) */}
                        {(order.type === 'delivery' || order.type === 'pickup') && (
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    {t('employee.kitchen.customer_info')}
                                </h3>
                                <div className="space-y-1 text-sm">
                                    {order.customer_name && (
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <User className="w-4 h-4 text-gray-400" />
                                            {order.customer_name}
                                        </div>
                                    )}
                                    {order.customer_phone && (
                                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            {order.customer_phone}
                                        </div>
                                    )}
                                    {order.delivery_address && order.type === 'delivery' && (
                                        <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                            {order.delivery_address}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Order Notes */}
                        {order.notes && (
                            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                                <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    {t('employee.kitchen.order_notes')}
                                </h3>
                                <p className="text-yellow-700 dark:text-yellow-200">{order.notes}</p>
                            </div>
                        )}

                        {/* Items List */}
                        <div>
                            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                <ChefHat className="w-5 h-5" />
                                {t('employee.kitchen.order_items')} ({order.items.length})
                            </h3>
                            <div className="space-y-3">
                                {order.items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
                                            {item.quantity}x
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="font-semibold text-lg text-gray-900 dark:text-white">
                                                    {item.name}
                                                </div>
                                                {item.status && (
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.status === 'served' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        item.status === 'preparing' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                )}
                                            </div>
                                            {item.notes && (
                                                <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-sm text-orange-700 dark:text-orange-300">
                                                    <strong>{t('employee.kitchen.special_request')}:</strong> {item.notes}
                                                </div>
                                            )}
                                            {item.unit_price && (
                                                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    ${item.unit_price.toFixed(2)} each
                                                    {item.total_price && (
                                                        <span className="ml-2 font-medium">
                                                            • Total: ${item.total_price.toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        {(order.subtotal || order.total_amount) && (
                            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                                    <span>Total Amount</span>
                                    <span>${(order.total_amount || order.subtotal || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Modal Footer - Action Button */}
                    {nextAction && (
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                            <Button
                                onClick={() => {
                                    nextAction.action();
                                    onClose();
                                }}
                                className="w-full h-14 text-xl font-bold"
                                disabled={updateStatusMutation.isPending}
                            >
                                {updateStatusMutation.isPending ? 'Updating...' : nextAction.label}
                            </Button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        );
    };

    const OrderCard = ({ order, showAction, actionLabel, onAction, statusColor }: any) => {
        const age = getOrderAge(order.created_at);
        const isUrgent = age >= 15;
        const itemCount = order.items.length;
        const displayItems = order.items.slice(0, 3);
        const hasMoreItems = itemCount > 3;

        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-4 rounded-xl border-l-4 ${statusColor} bg-white dark:bg-gray-800 shadow-lg cursor-pointer hover:shadow-xl transition-shadow`}
                onClick={() => setSelectedOrder(order)}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            #{order.order_number}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {order.table_number ? (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 font-bold text-sm">
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Table {order.table_number}</span>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-sm font-medium capitalize">
                                    {order.type === 'delivery' ? <Truck className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                                    <span>{order.type}</span>
                                </div>
                            )}
                        </div>
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

                {/* Items Preview */}
                <div className="space-y-2 mb-3">
                    {displayItems.map((item: OrderItem) => (
                        <div key={item.id} className="flex items-center gap-2 py-1 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                            <div className="w-8 h-8 rounded-full bg-fuchsia-500 text-white flex items-center justify-center font-bold text-sm">
                                {item.quantity}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white truncate">{item.name}</div>
                                {item.notes && (
                                    <div className="text-xs text-orange-600 dark:text-orange-400 italic truncate">Note: {item.notes}</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {hasMoreItems && (
                        <div className="text-center py-2 text-sm text-fuchsia-600 dark:text-fuchsia-400 font-medium">
                            + {itemCount - 3} more items (tap to view all)
                        </div>
                    )}
                </div>

                {/* Order Notes Preview */}
                {order.notes && (
                    <div className="mb-3 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 truncate">
                        <strong>Note:</strong> {order.notes}
                    </div>
                )}

                {/* Action Button */}
                {showAction && (
                    <Button
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onAction(order.id);
                        }}
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
                <title>{t('employee.kitchen.title')} - NKH Restaurant</title>
            </Head>

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <ChefHat className="w-8 h-8 text-fuchsia-600" />
                        <h1 className="text-3xl font-bold">{t('employee.kitchen.system')}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            size="sm"
                            variant={soundEnabled ? 'primary' : 'ghost'}
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            leftIcon={<Bell className="w-4 h-4" />}
                        >
                            {soundEnabled ? t('employee.kitchen.sound_on') : t('employee.kitchen.sound_off')}
                        </Button>
                        <div className="text-lg">
                            <span className="text-gray-500">{t('employee.kitchen.total')}: </span>
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
                                    <h2 className="text-xl font-bold">{t('employee.kitchen.new')}</h2>
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
                                        <p>{t('employee.kitchen.no_new_orders')}</p>
                                    </motion.div>
                                ) : (
                                    groupedOrders.pending.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            showAction
                                            actionLabel={t('employee.kitchen.start_prep')}
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
                                    <h2 className="text-xl font-bold">{t('employee.kitchen.preparing')}</h2>
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
                                        <p>{t('employee.kitchen.no_cooking')}</p>
                                    </motion.div>
                                ) : (
                                    groupedOrders.preparing.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            showAction
                                            actionLabel={t('employee.kitchen.mark_ready')}
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
                                    <h2 className="text-xl font-bold">{t('employee.kitchen.ready')}</h2>
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
                                        <p>{t('employee.kitchen.no_ready')}</p>
                                    </motion.div>
                                ) : (
                                    groupedOrders.ready.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            showAction
                                            actionLabel={t('employee.kitchen.delivered')}
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

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )}
            </AnimatePresence>
        </EmployeeLayout>
    );
}
