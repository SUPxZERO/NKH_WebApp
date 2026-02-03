import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { RequireAuth } from '@/app/providers/AuthProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import {
    Clock, Package, CheckCircle, XCircle, MapPin, Calendar, DollarSign,
    ChevronDown, Filter, AlertTriangle, ShoppingBag, Truck, Coffee,
    ChevronLeft, ChevronRight, RefreshCcw, Receipt, Store, Hash, Search
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import Button from '@/app/components/ui/Button';
import { useTranslation } from '@/app/hooks/useTranslation';

interface OrderItem {
    id: number;
    menu_item_id: number;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    special_instructions?: string;
    image_path?: string;
}

interface Order {
    id: number;
    order_number: string;
    order_type: 'pickup' | 'delivery';
    status: string;
    approval_status: string;
    payment_status: string;
    subtotal: number;
    tax_amount: number;
    delivery_fee: number;
    discount_amount: number;
    total_amount: number;
    ordered_at: string;
    pickup_time?: string;
    completed_at?: string;
    location: {
        id: number;
        name: string;
        address?: string;
    };
    time_slot?: {
        id: number;
        date: string;
        time: string;
        type: string;
    };
    delivery_address?: {
        id: number;
        address_line_1: string;
        address_line_2?: string;
        city: string;
        postal_code: string;
    };
    items_count: number;
    items: OrderItem[];
    preview_image?: string;
    special_instructions?: string;
    is_paid: boolean;
    can_cancel: boolean;
    can_reorder: boolean;
}

interface OrdersResponse {
    success: boolean;
    data: Order[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    message?: string;
}

type FilterStatus = 'all' | 'pending' | 'completed' | 'cancelled';

const statusConfig = {
    pending: {
        label: 'customer_pages.orders.status.pending',
        color: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30',
        icon: Clock,
        iconColor: 'text-amber-500'
    },
    received: {
        label: 'customer_pages.orders.status.received',
        color: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30',
        icon: CheckCircle,
        iconColor: 'text-blue-500'
    },
    preparing: {
        label: 'customer_pages.orders.status.preparing',
        color: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30',
        icon: Clock,
        iconColor: 'text-orange-500'
    },
    ready: {
        label: 'customer_pages.orders.status.ready',
        color: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
        icon: CheckCircle,
        iconColor: 'text-emerald-500'
    },
    completed: {
        label: 'customer_pages.orders.status.completed',
        color: 'bg-gradient-to-r from-green-500/20 to-teal-500/20 text-green-600 dark:text-green-400 border border-green-500/30',
        icon: CheckCircle,
        iconColor: 'text-green-500'
    },
    cancelled: {
        label: 'customer_pages.orders.status.cancelled',
        color: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30',
        icon: XCircle,
        iconColor: 'text-red-500'
    },
    delivered: {
        label: 'customer_pages.orders.status.delivered',
        color: 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30',
        icon: Package,
        iconColor: 'text-teal-500'
    },
};

const approvalConfig = {
    pending: {
        label: 'customer_pages.orders.approval.pending',
        color: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
    },
    approved: {
        label: 'customer_pages.orders.approval.approved',
        color: 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
    },
    rejected: {
        label: 'customer_pages.orders.approval.rejected',
        color: 'bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    },
};

// import { useSmartPolling } from '@/app/hooks/useSmartPolling';

export default function Orders() {
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [confirmReorderId, setConfirmReorderId] = useState<number | null>(null);
    const [isReordering, setIsReordering] = useState(false);
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
    const { t } = useTranslation();

    // Poll for order updates every 3 seconds
    // useSmartPolling(['orders'], 3000);

    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery<OrdersResponse>({
        queryKey: ['customer-orders', currentPage, filterStatus],
        queryFn: async () => {
            const params: Record<string, any> = {
                page: currentPage,
                per_page: 10,
            };

            if (filterStatus !== 'all') {
                params.status = filterStatus;
            }

            const response = await apiGet<OrdersResponse>('/customer/orders', { params });
            return response;
        },
        staleTime: 1000 * 30,
    });

    const cancelOrderMutation = useMutation({
        mutationFn: async (orderId: number) => {
            return apiPost(`/customer/orders/${orderId}/cancel`);
        },
        onMutate: (orderId) => {
            setCancellingOrderId(orderId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
            setShowCancelModal(false);
            setOrderToCancel(null);
        },
        onSettled: () => {
            setCancellingOrderId(null);
        },
    });

    const handleCancelClick = (order: Order) => {
        setOrderToCancel(order);
        setShowCancelModal(true);
    };

    const confirmCancel = () => {
        if (orderToCancel) {
            cancelOrderMutation.mutate(orderToCancel.id);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const OrderCard = ({ order }: { order: Order }) => {
        const isExpanded = expandedOrder === order.id;
        const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
        const StatusIcon = statusInfo.icon;
        const approvalInfo = approvalConfig[order.approval_status as keyof typeof approvalConfig];

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl sm:rounded-2xl shadow-theme-md hover:shadow-theme-lg transition-all duration-300 border border-border overflow-hidden group"
            >
                {/* Status Header Bar */}
                <div className={cn(
                    "px-4 py-2 sm:px-6 sm:py-3 flex items-center justify-between gap-2",
                    order.status === 'pending' && "bg-gradient-to-r from-amber-500/10 to-yellow-500/5",
                    order.status === 'preparing' && "bg-gradient-to-r from-orange-500/10 to-amber-500/5",
                    order.status === 'ready' && "bg-gradient-to-r from-emerald-500/10 to-green-500/5",
                    order.status === 'completed' && "bg-gradient-to-r from-green-500/10 to-teal-500/5",
                    order.status === 'cancelled' && "bg-gradient-to-r from-red-500/10 to-rose-500/5",
                    order.status === 'delivered' && "bg-gradient-to-r from-teal-500/10 to-cyan-500/5",
                )}>
                    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold', statusInfo.color)}>
                        <StatusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{t(statusInfo.label)}</span>
                        <span className="sm:hidden">{t(statusInfo.label).slice(0, 4)}</span>
                    </div>
                    {order.approval_status && approvalInfo && (
                        <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', approvalInfo.color)}>
                            {order.approval_status === 'pending' && <Clock className="w-2.5 h-2.5" />}
                            {order.approval_status === 'approved' && <CheckCircle className="w-2.5 h-2.5" />}
                            {order.approval_status === 'rejected' && <XCircle className="w-2.5 h-2.5" />}
                            <span className="hidden sm:inline">{t(approvalInfo.label)}</span>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="p-4 sm:p-6">
                    {/* Order Info Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-5">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center border border-fuchsia-500/30">
                                <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-500" />
                            </div>
                            <div>
                                <h3
                                    className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                    onClick={() => window.location.href = `/customer/orders/${order.id}`}
                                >
                                    {order.order_number}
                                </h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span className="hidden sm:inline">{formatDate(order.ordered_at)} at {formatTime(order.ordered_at)}</span>
                                    <span className="sm:hidden">{formatDate(order.ordered_at)}</span>
                                </p>
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div className={cn(
                            "px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold border flex items-center gap-1",
                            order.is_paid
                                ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        )}>
                            <DollarSign className="w-3 h-3" />
                            <span className="hidden sm:inline">{order.is_paid ? t('customer_pages.orders.payment.paid') : t('customer_pages.orders.payment.pending')}</span>
                        </div>
                    </div>

                    {/* Order Type & Location Tags */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-5">
                        <div className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                            order.order_type === 'pickup' && "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400",
                            order.order_type === 'delivery' && "bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400",
                        )}>
                            {order.order_type === 'pickup' && <ShoppingBag className="w-3.5 h-3.5" />}
                            {order.order_type === 'delivery' && <Truck className="w-3.5 h-3.5" />}
                            <span className="capitalize">{t(`customer_pages.orders.types.${order.order_type}`)}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary text-muted-foreground">
                            <Store className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[80px] sm:max-w-none">{order.location.name}</span>
                        </div>
                        {order.time_slot && (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 text-purple-600 dark:text-purple-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{formatDate(order.time_slot.date)} at {order.time_slot.time}</span>
                                <span className="sm:hidden">{order.time_slot.time}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Preview */}
                    <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-secondary/50 border border-border mb-3 sm:mb-5">
                        {order.preview_image && (
                            <img
                                src={order.preview_image}
                                alt="Order preview"
                                className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl object-cover border border-border shadow-sm"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
                                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                {order.items_count} {t('customer_pages.dashboard.items')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                {order.items.length > 2 && (
                                    <span className="text-primary font-medium"> +{order.items.length - 2}</span>
                                )}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide hidden sm:block">{t('customer_pages.orders.order_card.total')}</p>
                            <p className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                                ${order.total_amount.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="flex-1 h-9 sm:h-11"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            rightIcon={<ChevronDown className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300', isExpanded && 'rotate-180')} />}
                        >
                            {isExpanded ? t('customer_pages.orders.actions.hide') : t('customer_pages.orders.actions.details')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 sm:h-11 px-3"
                            onClick={() => window.location.href = `/customer/orders/${order.id}`}
                            title={t('customer_pages.orders.actions.details')}
                        >
                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        {order.can_reorder && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 sm:h-11 px-3"
                                onClick={() => setConfirmReorderId(order.id)}
                                title={t('customer_pages.orders.actions.reorder')}
                            >
                                <RefreshCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                        )}
                        {order.can_cancel && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="h-9 sm:h-11"
                                onClick={() => handleCancelClick(order)}
                                disabled={cancellingOrderId === order.id}
                            >
                                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">{cancellingOrderId === order.id ? t('customer_pages.orders.actions.cancelling') : t('customer_pages.orders.actions.cancel')}</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border bg-gradient-to-b from-secondary/50 to-secondary/30"
                        >
                            <div className="p-4 sm:p-6 space-y-4">
                                {/* Items List */}
                                <div>
                                    <h4 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm sm:text-base">
                                        <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                        {t('customer_pages.orders.order_card.order_items')}
                                    </h4>
                                    <div className="space-y-2">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-card border border-border">
                                                {item.image_path ? (
                                                    <img src={item.image_path} alt={item.name} className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover border border-border" />
                                                ) : (
                                                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                                        <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-fuchsia-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground text-sm">{item.name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                                            x{item.quantity}
                                                        </span>
                                                        <span>${item.unit_price.toFixed(2)}</span>
                                                    </div>
                                                    {item.special_instructions && (
                                                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                                                            <AlertTriangle className="w-2.5 h-2.5" />
                                                            {item.special_instructions}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-foreground font-bold text-sm sm:text-lg">
                                                    ${item.total_price.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                {order.delivery_address && (
                                    <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/5 border border-emerald-500/20">
                                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 text-sm">
                                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                                            {t('customer_pages.orders.order_card.delivery_address')}
                                        </h4>
                                        <p className="text-foreground text-sm">
                                            {order.delivery_address.address_line_1}
                                            {order.delivery_address.address_line_2 && `, ${order.delivery_address.address_line_2}`}
                                            <br />
                                            <span className="text-muted-foreground">
                                                {order.delivery_address.city}, {order.delivery_address.postal_code}
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {/* Price Breakdown */}
                                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-card border border-border">
                                    <h4 className="font-bold text-foreground mb-3 flex items-center gap-1.5 sm:gap-2 text-sm">
                                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                                        {t('customer_pages.orders.order_card.price_breakdown')}
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('customer_pages.orders.order_card.subtotal')}</span>
                                            <span className="text-foreground font-medium">${order.subtotal.toFixed(2)}</span>
                                        </div>
                                        {order.delivery_fee > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <Truck className="w-3.5 h-3.5" /> {t('customer_pages.orders.order_card.delivery')}
                                                </span>
                                                <span className="text-foreground font-medium">${order.delivery_fee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">{t('customer_pages.orders.order_card.tax')}</span>
                                            <span className="text-foreground font-medium">${order.tax_amount.toFixed(2)}</span>
                                        </div>
                                        {order.discount_amount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-emerald-600 dark:text-emerald-400">{t('customer_pages.orders.order_card.discount')}</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                    -${order.discount_amount.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-2 border-t border-border">
                                            <span className="text-foreground font-bold">{t('customer_pages.orders.order_card.total')}</span>
                                            <span className="font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                                                ${order.total_amount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <RequireAuth roles={['customer']}>
            <CustomerLayout>
                <Head>
                    <title>My Orders - NKH Restaurant</title>
                    <meta name="description" content="View and manage your order history" />
                </Head>

                <div className="space-y-4 sm:space-y-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                                <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {t('customer_pages.orders.title')}
                                </span>
                            </h1>
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                                {t('customer_pages.orders.subtitle')}
                            </p>
                        </div>
                        {data && (
                            <div className="flex items-center gap-2">
                                <div className="h-8 px-3 rounded-lg bg-card border border-border flex items-center gap-1.5 shadow-sm">
                                    <Package className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-bold text-foreground">{data.meta.total}</span>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-wrap gap-1.5 p-1.5 bg-card border border-border rounded-xl shadow-sm"
                    >
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={cn(
                                "px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                                filterStatus === 'all'
                                    ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg"
                                    : "bg-transparent text-muted-foreground hover:bg-secondary"
                            )}
                        >
                            <Filter className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer_pages.orders.filters.all')}</span>
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={cn(
                                "px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                                filterStatus === 'pending'
                                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg"
                                    : "bg-transparent text-muted-foreground hover:bg-secondary"
                            )}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer_pages.orders.filters.active')}</span>
                            <span className="sm:hidden">{t('customer_pages.orders.filters.active')}</span>
                        </button>
                        <button
                            onClick={() => setFilterStatus('completed')}
                            className={cn(
                                "px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                                filterStatus === 'completed'
                                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg"
                                    : "bg-transparent text-muted-foreground hover:bg-secondary"
                            )}
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer_pages.orders.filters.completed')}</span>
                            <span className="sm:hidden">{t('customer_pages.orders.filters.completed')}</span>
                        </button>
                        <button
                            onClick={() => setFilterStatus('cancelled')}
                            className={cn(
                                "px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5",
                                filterStatus === 'cancelled'
                                    ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg"
                                    : "bg-transparent text-muted-foreground hover:bg-secondary"
                            )}
                        >
                            <XCircle className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('customer_pages.orders.filters.cancelled')}</span>
                            <span className="sm:hidden">{t('customer_pages.orders.filters.cancelled')}</span>
                        </button>
                    </motion.div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col justify-center items-center py-16">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                    <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            </div>
                            <p className="mt-4 text-sm text-muted-foreground font-medium">{t('customer_pages.orders.loading')}</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-500/20 rounded-xl p-6 text-center"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center mx-auto mb-3">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <h3 className="text-base font-bold text-foreground mb-1">{t('customer_pages.orders.error.title')}</h3>
                            <p className="text-sm text-muted-foreground mb-3">{t('customer_pages.orders.error.message')}</p>
                            <Button variant="destructive" size="sm" onClick={() => window.location.reload()}>
                                <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                                {t('customer_pages.orders.actions.try_again')}
                            </Button>
                        </motion.div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && data && data.data.length === 0 && (
                        <motion.div
                            className="text-center py-12"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-4 border border-fuchsia-500/30">
                                <Package className="w-8 h-8 text-fuchsia-500" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                {filterStatus === 'all'
                                    ? t('customer_pages.orders.empty.cta_browse')
                                    : t('customer_pages.orders.empty.no_filtered', { status: filterStatus }) + ' ' + t('customer_pages.orders.empty.cta_filter')}
                            </p>
                            <Button variant="primary" onClick={() => window.location.href = '/menu'}>
                                <ShoppingBag className="w-4 h-4 mr-2" />
                                {t('customer_pages.orders.empty.browse_menu')}
                            </Button>
                        </motion.div>
                    )}

                    {/* Orders List */}
                    {!isLoading && !error && data && data.data.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-3"
                        >
                            {data.data.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <OrderCard order={order} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* Pagination */}
                    {data && data.meta.last_page > 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 bg-card border border-border rounded-xl shadow-sm"
                        >
                            <div className="text-xs text-muted-foreground hidden sm:block">
                                {t('customer_pages.orders.pagination.showing')} <span className="font-semibold text-foreground">{data.meta.from}</span> {t('customer_pages.orders.pagination.to')} <span className="font-semibold text-foreground">{data.meta.to}</span> {t('customer_pages.orders.pagination.of')} <span className="font-semibold text-foreground">{data.meta.total}</span> {t('customer_pages.orders.pagination.orders')}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="h-9 px-3"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                                    <span className="hidden sm:inline">{t('customer_pages.orders.pagination.prev')}</span>
                                </Button>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, data.meta.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (data.meta.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= data.meta.last_page - 2) {
                                            pageNum = data.meta.last_page - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={cn(
                                                    "h-9 w-9 rounded-lg text-xs font-semibold transition-all",
                                                    currentPage === pageNum
                                                        ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg"
                                                        : "bg-secondary border border-border text-muted-foreground hover:bg-secondary-hover"
                                                )}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={currentPage === data.meta.last_page}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="h-9 px-3"
                                >
                                    <span className="hidden sm:inline">{t('customer_pages.orders.pagination.next')}</span>
                                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Cancel Order Confirmation Modal */}
                <AnimatePresence>
                    {showCancelModal && orderToCancel && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
                            onClick={() => setShowCancelModal(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-red-500/10 to-rose-500/5 p-4 sm:p-6 border-b border-red-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center border border-red-500/30">
                                            <AlertTriangle className="w-5 h-5 sm:w-7 sm:h-7 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-foreground">
                                                {t('customer_pages.orders.cancel_modal.title')}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                <Hash className="w-3 h-3" />
                                                {orderToCancel.order_number}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-4 sm:p-6">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {t('customer_pages.orders.cancel_modal.warning')}
                                    </p>

                                    {/* Order Summary */}
                                    <div className="p-3 rounded-lg bg-secondary/50 border border-border mb-4">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-muted-foreground">{t('customer_pages.orders.cancel_modal.order_total')}</span>
                                            <span className="text-base font-bold text-foreground">${orderToCancel.total_amount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">{t('customer_pages.orders.cancel_modal.items')}</span>
                                            <span className="text-xs font-medium text-foreground">{orderToCancel.items_count} {t('customer_pages.dashboard.items')}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            className="flex-1 h-10 sm:h-12"
                                            onClick={() => setShowCancelModal(false)}
                                            disabled={cancelOrderMutation.isPending}
                                        >
                                            {t('customer_pages.orders.cancel_modal.keep')}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            className="flex-1 h-10 sm:h-12"
                                            onClick={confirmCancel}
                                            disabled={cancelOrderMutation.isPending}
                                        >
                                            {cancelOrderMutation.isPending ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                    Cancelling...
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4 mr-1.5" />
                                                    {t('customer_pages.orders.cancel_modal.confirm')}
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                    {cancelOrderMutation.isError && (
                                        <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-500/20">
                                            <p className="text-xs text-red-500 text-center font-medium">
                                                Failed to cancel order. Try again.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Reorder Confirmation Modal */}
                <AnimatePresence>
                    {confirmReorderId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
                            onClick={() => setConfirmReorderId(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                transition={{ type: "spring", duration: 0.5 }}
                                className="bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Modal Header */}
                                <div className="bg-gradient-to-r from-fuchsia-500/10 to-purple-500/5 p-4 sm:p-6 border-b border-fuchsia-500/20">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center border border-fuchsia-500/30">
                                            <RefreshCcw className="w-5 h-5 sm:w-7 sm:h-7 text-fuchsia-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg sm:text-xl font-bold text-foreground">
                                                {t('customer_pages.orders.reorder_modal.title')}
                                            </h3>
                                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                                Add all items from this order to your cart
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Body */}
                                <div className="p-4 sm:p-6">
                                    <p className="text-sm text-muted-foreground mb-6">
                                        {t('customer_pages.orders.reorder_modal.message')}
                                    </p>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            className="flex-1 h-10 sm:h-12"
                                            onClick={() => setConfirmReorderId(null)}
                                            disabled={isReordering}
                                        >
                                            {t('customer_pages.orders.reorder_modal.cancel')}
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1 h-10 sm:h-12"
                                            onClick={() => {
                                                if (confirmReorderId) {
                                                    setIsReordering(true);
                                                    apiPost(`/customer/orders/${confirmReorderId}/reorder`)
                                                        .then(() => {
                                                            queryClient.invalidateQueries({ queryKey: ['cart'] });
                                                            window.location.href = '/cart';
                                                        })
                                                        .catch(err => {
                                                            console.error('Reorder failed', err);
                                                            setIsReordering(false);
                                                            setConfirmReorderId(null);
                                                            alert('Failed to reorder items. Please try again.');
                                                        });
                                                }
                                            }}
                                            disabled={isReordering}
                                        >
                                            {isReordering ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                    Adding...
                                                </>
                                            ) : (
                                                <>
                                                    <ShoppingBag className="w-4 h-4 mr-1.5" />
                                                    {t('customer_pages.orders.reorder_modal.confirm')}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CustomerLayout>
        </RequireAuth>
    );
}
