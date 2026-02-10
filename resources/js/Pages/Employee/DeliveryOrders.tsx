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
import DriverMapView from './DriverMapView';
import { useLanguage } from '@/app/context/LanguageContext';

interface CollectionModalProps {
    order: any;
    onClose: () => void;
    onSuccess: () => void;
}

function CollectionModal({ order, onClose, onSuccess }: CollectionModalProps) {
    const { t } = useLanguage();
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
            toastSuccess(t('employee.delivery.payment_collected'));
            onSuccess();
        } catch (error: any) {
            toastError(error?.message || t('employee.common.error'));
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
                    <h2 className="text-xl font-bold text-white">{t('employee.delivery.collect_payment')}</h2>
                    <p className="text-white/80">{t('employee.delivery.order_number', { number: order.order_number })}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Amount Due */}
                    <div className="text-center">
                        <p className="text-sm text-gray-400">{t('employee.delivery.total_due')}</p>
                        <p className="text-4xl font-bold text-white">
                            {t('employee.common.currency_symbol')}{totalAmount.toFixed(2)}
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
                                {t('employee.common.currency_symbol')}{amount}
                            </button>
                        ))}
                    </div>

                    {/* Cash Received Input */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            {t('employee.delivery.cash_received')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                                {t('employee.common.currency_symbol')}
                            </span>
                            <input
                                type="number"
                                step="0.01"
                                min={totalAmount}
                                value={amountReceived}
                                onChange={(e) => setAmountReceived(e.target.value)}
                                placeholder={t('employee.delivery.amount_placeholder')}
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
                        <p className="text-sm text-gray-400">{t('employee.delivery.change')}</p>
                        <p className={cn(
                            'text-3xl font-bold',
                            isValid ? 'text-emerald-400' : 'text-red-400'
                        )}>
                            {t('employee.common.currency_symbol')}{change.toFixed(2)}
                        </p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">
                            {t('employee.delivery.notes')}
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t('employee.delivery.notes_placeholder')}
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
                            {t('employee.common.cancel')}
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
                                    {t('employee.delivery.collect')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ... (imports remain similar, will need to ensure apiGet/apiPost/apiPut are imported)
import { apiGet, apiPost, apiPut } from '@/app/libs/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ... (Existing CollectionModal ...)

// Driver Mode Component
interface DriverModeProps {
    onCollectPayment: (order: any) => void;
}

function DriverMode({ onCollectPayment }: DriverModeProps) {
    const { t, locale } = useLanguage();
    const qc = useQueryClient();
    const [subTab, setSubTab] = useState<'my_deliveries' | 'available'>('my_deliveries');
    const [viewType, setViewType] = useState<'list' | 'map'>('list');

    const { data, isLoading } = useQuery<{ my_deliveries: any[], available_deliveries: any[] }>({
        queryKey: ['driver.orders'],
        queryFn: () => apiGet('/employee/driver/orders'),
        refetchInterval: 15000 // Poll every 15s for new orders
    });

    const claimMutation = useMutation({
        mutationFn: (orderId: number) => apiPost(`/employee/driver/orders/${orderId}/claim`, {}),
        onSuccess: () => {
            toastSuccess(t('employee.delivery.order_claimed'));
            qc.invalidateQueries({ queryKey: ['driver.orders'] });
        },
        onError: (err: any) => toastError(err?.response?.data?.message || t('employee.delivery.claim_failed'))
    });

    const statusMutation = useMutation({
        mutationFn: (vars: { id: number, status: string }) => apiPut(`/employee/driver/orders/${vars.id}/status`, { status: vars.status }),
        onSuccess: () => {
            toastSuccess(t('employee.delivery.status_updated'));
            qc.invalidateQueries({ queryKey: ['driver.orders'] });
        },
        onError: (err: any) => toastError(err?.response?.data?.message || t('employee.common.error'))
    });

    const openMap = (address: string) => {
        const encoded = encodeURIComponent(address);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
    };

    const handleClaim = (id: number) => {
        if (confirm(t('employee.delivery.confirm_claim'))) {
            claimMutation.mutate(id);
        }
    };

    const handleComplete = (order: any) => {
        // limit logic to pay_on_delivery or pay_on_pickup AND unpaid
        const needsPayment = order.payment_status === 'unpaid' &&
            ['pay_on_delivery', 'pay_on_pickup', 'cod'].includes(order.payment_mode);

        if (needsPayment) {
            onCollectPayment(order);
        } else {
            if (confirm(t('employee.delivery.confirm_complete'))) {
                statusMutation.mutate({ id: order.id, status: 'delivered' });
            }
        }
    };

    const orders = subTab === 'my_deliveries' ? data?.my_deliveries : data?.available_deliveries;

    // If map view selected, render DriverMapView
    if (viewType === 'map') {
        return (
            <div className="space-y-4">
                {/* View Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewType('list')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        ← {t('employee.delivery.back_to_list')}
                    </button>
                </div>

                <DriverMapView onCollectPayment={onCollectPayment} />
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-4">
            {/* Tabs + View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 w-fit">
                    <button
                        onClick={() => setSubTab('my_deliveries')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            subTab === 'my_deliveries' ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
                        )}
                    >
                        {t('employee.delivery.my_deliveries')}
                    </button>
                    <button
                        onClick={() => setSubTab('available')}
                        className={cn(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all",
                            subTab === 'available' ? "bg-blue-600 text-white shadow" : "text-gray-400 hover:text-white"
                        )}
                    >
                        {t('employee.delivery.available_claim')}
                    </button>
                </div>

                {/* View Type Toggle */}
                <button
                    onClick={() => setViewType('map')}
                    className="px-4 py-2 rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all flex items-center gap-2"
                >
                    <MapPin className="w-4 h-4" />
                    {t('employee.delivery.map_view')}
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10"><RefreshCw className="animate-spin inline-block" /> {t('employee.common.loading')}</div>
            ) : !orders || orders.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
                    <Truck className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-400">{t('employee.delivery.no_orders')}</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {orders.map((order: any) => (
                        <Card key={order.id} className="bg-white/5 border-white/10">
                            <CardContent className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="font-bold text-lg text-white">#{order.order_number}</div>
                                        <div className="text-sm text-gray-400">{order.customer?.user?.name}</div>
                                    </div>
                                    <div className={cn(
                                        "px-2 py-1 rounded text-xs font-medium uppercase",
                                        order.status === 'out_for_delivery' ? "bg-yellow-500/20 text-yellow-500" :
                                            order.status === 'delivered' ? "bg-green-500/20 text-green-500" :
                                                "bg-blue-500/20 text-blue-500"
                                    )}>
                                        {t(`employee.delivery.status.${order.status}`, { default: order.status.replace(/_/g, ' ') })}
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 text-sm">
                                    <div className="flex items-start gap-2 text-gray-300">
                                        <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                                        <span
                                            className="underline decoration-dotted hover:text-blue-400 cursor-pointer"
                                            onClick={() => order.delivery_address && openMap(order.delivery_address)}
                                        >
                                            {order.delivery_address || t('employee.delivery.no_address')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Phone className="w-4 h-4 text-gray-500" />
                                        <span>{order.customer_phone || t('employee.delivery.no_phone')}</span>
                                    </div>
                                    {/* Show Payment Status */}
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Banknote className="w-4 h-4 text-gray-500" />
                                        <span className={order.payment_status === 'paid' ? 'text-green-400' : 'text-orange-400'}>
                                            {order.payment_status ? t(`employee.delivery.payment_status.${order.payment_status}`) : t('employee.delivery.payment_status.unpaid')}
                                        </span>
                                    </div>
                                </div>

                                {subTab === 'available' ? (
                                    <Button
                                        onClick={() => handleClaim(order.id)}
                                        className="w-full bg-blue-600 hover:bg-blue-500"
                                        disabled={claimMutation.isPending}
                                    >
                                        {t('employee.delivery.claim_order')}
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => order.delivery_address && openMap(order.delivery_address)}
                                            className="flex-1"
                                        >
                                            {t('employee.delivery.map')}
                                        </Button>
                                        {order.status === 'ready' || order.status === 'preparing' ? (
                                            <Button
                                                className="flex-1 bg-yellow-600 hover:bg-yellow-500"
                                                onClick={() => statusMutation.mutate({ id: order.id, status: 'out_for_delivery' })}
                                                disabled={statusMutation.isPending}
                                            >
                                                {t('employee.delivery.start_delivery')}
                                            </Button>
                                        ) : order.status === 'out_for_delivery' ? (
                                            <Button
                                                className="flex-1 bg-green-600 hover:bg-green-500"
                                                onClick={() => handleComplete(order)}
                                                disabled={statusMutation.isPending}
                                            >
                                                {t('employee.delivery.complete')}
                                            </Button>
                                        ) : null}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function DeliveryOrders() {
    const { t, locale } = useLanguage();
    const qc = useQueryClient();
    const [viewMode, setViewMode] = useState<'collection' | 'driver'>('collection');

    // Existing collection logic
    const { data: collectionOrders, isLoading: collectionLoading, refetch } = usePendingCollection();
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    const handleSuccess = () => {
        setSelectedOrder(null);
        refetch();
        qc.invalidateQueries({ queryKey: ['driver.orders'] });
    };

    return (
        <EmployeeLayout>
            <Head title={t('employee.delivery.page_title')} />

            <div className="max-w-6xl mx-auto space-y-6 p-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t('employee.delivery.title')}</h1>
                        <p className="text-sm text-gray-400">
                            {viewMode === 'collection' ? t('employee.delivery.subtitle_collection') : t('employee.delivery.subtitle_driver')}
                        </p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 self-start">
                        <button
                            onClick={() => setViewMode('collection')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                viewMode === 'collection' ? "bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/50" : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Banknote className="w-4 h-4 inline-block mr-2" />
                            {t('employee.delivery.payments')}
                        </button>
                        <button
                            onClick={() => setViewMode('driver')}
                            className={cn(
                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                viewMode === 'driver' ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50" : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Truck className="w-4 h-4 inline-block mr-2" />
                            {t('employee.delivery.driver_mode')}
                        </button>
                    </div>
                </div>

                {viewMode === 'driver' ? (
                    <DriverMode onCollectPayment={setSelectedOrder} />
                ) : (
                    <>
                        {/* Existing Collection Grid */}
                        <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={() => refetch()}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                {t('employee.common.refresh')}
                            </Button>
                        </div>

                        {collectionLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-8 h-8 text-fuchsia-400 animate-spin" />
                            </div>
                        ) : collectionOrders?.length === 0 ? (
                            <Card className="bg-white/5 border-dashed border-white/20">
                                <CardContent className="py-12 text-center">
                                    <Truck className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                                    <p className="text-lg font-medium text-white">{t('employee.delivery.no_pending')}</p>
                                    <p className="text-sm text-gray-400">{t('employee.delivery.all_set')}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            // ... (Existing list code)
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <AnimatePresence mode="popLayout">
                                    {collectionOrders?.map((order, index) => (
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
                                                                <p className="text-xs text-gray-400 capitalize">{t(`employee.delivery.order_type.${order.order_type}`)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                                                                {t('employee.delivery.unpaid')}
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
                                                            <span>{t('employee.delivery.placed_at', { time: new Date(order.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })}</span>
                                                        </div>
                                                    </div>

                                                    {/* Footer Amount & Action */}
                                                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                                        <div className="text-2xl font-bold text-white">
                                                            {t('employee.common.currency_symbol')}{order.total_amount.toFixed(2)}
                                                        </div>
                                                        <Button
                                                            onClick={() => setSelectedOrder(order)}
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                        >
                                                            {t('employee.delivery.collect')}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
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
