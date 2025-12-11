import React, { useState } from 'react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck,
    ShoppingBag,
    MapPin,
    Phone,
    User,
    CheckCircle2,
    Banknote,
    Clock,
    RefreshCw,
    Info
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { usePendingCollection, useCollectPayment } from '@/app/hooks/useOrderPayment';
import { cn } from '@/app/utils/cn';

interface CollectionModalProps {
    order: any;
    onClose: () => void;
    onSuccess: () => void;
}

function CollectionModal({ order, onClose, onSuccess }: CollectionModalProps) {
    const [amountReceived, setAmountReceived] = useState<string>('');
    const [notes, setNotes] = useState('');
    const collectMutation = useCollectPayment();

    const totalAmount = order.total_amount;
    const received = parseFloat(amountReceived) || 0;
    const change = Math.max(0, received - totalAmount);
    // Allow partial payment? No, usually delivery is full payment.
    const isValid = received >= totalAmount;

    // Quick amount suggestions
    const quickAmounts = [
        Math.ceil(totalAmount),
        Math.ceil(totalAmount / 5) * 5,
        Math.ceil(totalAmount / 10) * 10,
        Math.ceil(totalAmount / 20) * 20,
        50,
        100
    ].filter((v, i, a) => a.indexOf(v) === i && v >= totalAmount).slice(0, 4);

    const handleCollect = async () => {
        if (!isValid) return;

        try {
            await collectMutation.mutateAsync({
                orderId: order.id,
                amount: totalAmount,
                cashReceived: received,
                paymentMethod: 'cash',
                notes: notes || undefined
            });
            toastSuccess('Payment collected successfully');
            onSuccess();
        } catch (error: any) {
            toastError(error?.message || 'Failed to collect payment');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-gray-900 rounded-2xl border border-white/10 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center">
                    <Banknote className="w-12 h-12 mx-auto mb-3 text-white" />
                    <h2 className="text-xl font-bold text-white">Collect Payment</h2>
                    <p className="text-white/80">Order #{order.order_number}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Amount Due */}
                    <div className="text-center">
                        <p className="text-sm text-gray-400">Total Due</p>
                        <p className="text-4xl font-bold text-white">
                            ${totalAmount.toFixed(2)}
                        </p>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {quickAmounts.map((amount) => (
                            <button
                                key={amount}
                                onClick={() => setAmountReceived(amount.toString())}
                                className={cn(
                                    'py-2 px-3 rounded-lg font-medium text-sm transition-all',
                                    parseFloat(amountReceived) === amount
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                )}
                            >
                                ${amount}
                            </button>
                        ))}
                    </div>

                    {/* Cash Received Input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Cash Received
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                                $
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                min={totalAmount}
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-2xl font-bold text-white text-center focus:border-blue-500 focus:outline-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Change Display */}
                    <div className={cn(
                        'p-4 rounded-xl text-center transition-all',
                        isValid ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    )}>
                        <p className="text-sm text-gray-400">Change to Give</p>
                        <p className={cn(
                            'text-3xl font-bold',
                            isValid ? 'text-emerald-400' : 'text-red-400'
                        )}>
                            ${change.toFixed(2)}
                        </p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            Notes (optional)
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Exact change, Left at door..."
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCollect}
                            disabled={!isValid || collectMutation.isPending}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            {collectMutation.isPending ? (
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Collect
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function DeliveryOrders() {
    const { data: orders, isLoading, refetch } = usePendingCollection();
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const handleSuccess = () => {
        setSelectedOrder(null);
        refetch();
    };

    return (
        <EmployeeLayout>
            <Head title="Delivery & Pickup Orders" />

            <div className="max-w-6xl mx-auto space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Delivery & Pickup</h1>
                        <p className="text-sm text-gray-400">
                            Collect payments for delivery and pickup orders
                        </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => refetch()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Orders Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="w-8 h-8 text-fuchsia-400 animate-spin" />
                    </div>
                ) : orders?.length === 0 ? (
                    <Card className="bg-white/5 border-dashed border-white/20">
                        <CardContent className="py-12 text-center">
                            <Truck className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                            <p className="text-lg font-medium text-white">No Pending Collections</p>
                            <p className="text-sm text-gray-400">There are no orders waiting for payment collection</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                            {orders?.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="h-full hover:border-white/20 transition-colors">
                                        <CardContent className="p-5 flex flex-col h-full">
                                            {/* Top Row: Type & ID */}
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center",
                                                        order.order_type === 'delivery'
                                                            ? "bg-blue-500/20 text-blue-400"
                                                            : "bg-orange-500/20 text-orange-400"
                                                    )}>
                                                        {order.order_type === 'delivery' ? <Truck className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-white">#{order.order_number}</h3>
                                                        <p className="text-xs text-gray-400 capitalize">{order.order_type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                                                        Unpaid
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-start gap-2 text-sm text-gray-300">
                                                    <User className="w-4 h-4 mt-0.5 text-gray-500" />
                                                    <span>{order.customer_name}</span>
                                                </div>

                                                {order.customer_phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-300">
                                                        <Phone className="w-4 h-4 text-gray-500" />
                                                        <span>{order.customer_phone}</span>
                                                    </div>
                                                )}

                                                {order.order_type === 'delivery' && order.delivery_address && (
                                                    <div className="flex items-start gap-2 text-sm text-gray-300">
                                                        <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                                                        <span className="line-clamp-2">{order.delivery_address}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                                    <Clock className="w-4 h-4 text-gray-500" />
                                                    <span>Placed {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>

                                            {/* Footer Amount & Action */}
                                            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                                <div className="text-2xl font-bold text-white">
                                                    ${order.total_amount.toFixed(2)}
                                                </div>
                                                <Button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Collection
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Collection Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <CollectionModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </EmployeeLayout>
    );
}
