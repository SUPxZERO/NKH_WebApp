import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import {
    Clock, Package, CheckCircle, XCircle, MapPin, Calendar, DollarSign,
    ChevronDown, Filter, AlertTriangle, ShoppingBag, Truck, Coffee,
    ChevronLeft, ChevronRight, RefreshCcw, Receipt, Store, Hash
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import Button from '@/app/components/ui/Button';

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
    status: string;
    data: Order[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

type FilterStatus = 'all' | 'pending' | 'completed' | 'cancelled';

const statusConfig = {
    pending: {
        label: 'Pending',
        color: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30',
        icon: Clock,
        iconColor: 'text-amber-500'
    },
    received: {
        label: 'Received',
        color: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30',
        icon: CheckCircle,
        iconColor: 'text-blue-500'
    },
    preparing: {
        label: 'Preparing',
        color: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30',
        icon: Clock,
        iconColor: 'text-orange-500'
    },
    ready: {
        label: 'Ready',
        color: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
        icon: CheckCircle,
        iconColor: 'text-emerald-500'
    },
    completed: {
        label: 'Completed',
        color: 'bg-gradient-to-r from-green-500/20 to-teal-500/20 text-green-600 dark:text-green-400 border border-green-500/30',
        icon: CheckCircle,
        iconColor: 'text-green-500'
    },
    cancelled: {
        label: 'Cancelled',
        color: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30',
        icon: XCircle,
        iconColor: 'text-red-500'
    },
    delivered: {
        label: 'Delivered',
        color: 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30',
        icon: Package,
        iconColor: 'text-teal-500'
    },
};

const approvalConfig = {
    pending: {
        label: 'Awaiting Approval',
        color: 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
    },
    approved: {
        label: 'Approved',
        color: 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
    },
    rejected: {
        label: 'Rejected',
        color: 'bg-gradient-to-r from-red-500/10 to-rose-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    },
};

export default function Orders() {
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

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
                className="bg-card rounded-2xl shadow-theme-md hover:shadow-theme-lg transition-all duration-300 border border-border overflow-hidden group hover:-translate-y-1"
            >
                {/* Status Header Bar */}
                <div className={cn(
                    "px-6 py-3 flex items-center justify-between",
                    order.status === 'pending' && "bg-gradient-to-r from-amber-500/10 to-yellow-500/5",
                    order.status === 'preparing' && "bg-gradient-to-r from-orange-500/10 to-amber-500/5",
                    order.status === 'ready' && "bg-gradient-to-r from-emerald-500/10 to-green-500/5",
                    order.status === 'completed' && "bg-gradient-to-r from-green-500/10 to-teal-500/5",
                    order.status === 'cancelled' && "bg-gradient-to-r from-red-500/10 to-rose-500/5",
                    order.status === 'delivered' && "bg-gradient-to-r from-teal-500/10 to-cyan-500/5",
                )}>
                    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold', statusInfo.color)}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusInfo.label}
                    </div>
                    {order.approval_status && approvalInfo && (
                        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', approvalInfo.color)}>
                            {order.approval_status === 'pending' && <Clock className="w-3 h-3" />}
                            {order.approval_status === 'approved' && <CheckCircle className="w-3 h-3" />}
                            {order.approval_status === 'rejected' && <XCircle className="w-3 h-3" />}
                            {approvalInfo.label}
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="p-6">
                    {/* Order Info Header */}
                    <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center border border-fuchsia-500/30">
                                <Hash className="w-5 h-5 text-fuchsia-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                    {order.order_number}
                                </h3>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(order.ordered_at)} at {formatTime(order.ordered_at)}
                                </p>
                            </div>
                        </div>

                        {/* Payment Status */}
                        <div className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5",
                            order.is_paid
                                ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        )}>
                            <DollarSign className="w-3.5 h-3.5" />
                            {order.is_paid ? 'Paid' : 'Pending Payment'}
                        </div>
                    </div>

                    {/* Order Type & Location Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                            order.order_type === 'pickup' && "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400",
                            order.order_type === 'delivery' && "bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400",
                        )}>
                            {order.order_type === 'pickup' && <ShoppingBag className="w-4 h-4" />}
                            {order.order_type === 'delivery' && <Truck className="w-4 h-4" />}
                            <span className="capitalize">{order.order_type}</span>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-secondary text-muted-foreground">
                            <Store className="w-4 h-4" />
                            <span>{order.location.name}</span>
                        </div>
                        {order.time_slot && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 text-purple-600 dark:text-purple-400">
                                <Clock className="w-4 h-4" />
                                <span>{formatDate(order.time_slot.date)} at {order.time_slot.time}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Preview */}
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border mb-5">
                        {order.preview_image && (
                            <img
                                src={order.preview_image}
                                alt="Order preview"
                                className="w-16 h-16 rounded-xl object-cover border border-border shadow-sm"
                            />
                        )}
                        <div className="flex-1">
                            <p className="font-semibold text-foreground flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                {order.items.length > 2 && (
                                    <span className="text-primary font-medium"> +{order.items.length - 2} more</span>
                                )}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
                                ${order.total_amount.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            size="md"
                            className="flex-1 h-11"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            rightIcon={<ChevronDown className={cn('w-4 h-4 transition-transform duration-300', isExpanded && 'rotate-180')} />}
                        >
                            {isExpanded ? 'Hide' : 'View'} Details
                        </Button>
                        {order.can_reorder && (
                            <Button
                                variant="outline"
                                size="md"
                                className="h-11 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                leftIcon={<RefreshCcw className="w-4 h-4" />}
                            >
                                Reorder
                            </Button>
                        )}
                        {order.can_cancel && (
                            <Button
                                variant="destructive"
                                size="md"
                                className="h-11"
                                onClick={() => handleCancelClick(order)}
                                disabled={cancellingOrderId === order.id}
                                leftIcon={<XCircle className="w-4 h-4" />}
                            >
                                {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel'}
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
                            <div className="p-6 space-y-6">
                                {/* Items List */}
                                <div>
                                    <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Receipt className="w-5 h-5 text-primary" />
                                        Order Items
                                    </h4>
                                    <div className="space-y-3">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
                                                {item.image_path ? (
                                                    <img src={item.image_path} alt={item.name} className="w-14 h-14 rounded-xl object-cover border border-border" />
                                                ) : (
                                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                                        <Coffee className="w-6 h-6 text-fuchsia-500" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-foreground">{item.name}</p>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                                                            Qty: {item.quantity}
                                                        </span>
                                                        <span>${item.unit_price.toFixed(2)} each</span>
                                                    </div>
                                                    {item.special_instructions && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            {item.special_instructions}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-foreground font-bold text-lg">
                                                    ${item.total_price.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                {order.delivery_address && (
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/5 border border-emerald-500/20">
                                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                                            <MapPin className="w-5 h-5" />
                                            Delivery Address
                                        </h4>
                                        <p className="text-foreground">
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
                                <div className="p-4 rounded-xl bg-card border border-border">
                                    <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                        <DollarSign className="w-5 h-5 text-primary" />
                                        Price Breakdown
                                    </h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="text-foreground font-medium">${order.subtotal.toFixed(2)}</span>
                                        </div>
                                        {order.delivery_fee > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <Truck className="w-3.5 h-3.5" /> Delivery Fee
                                                </span>
                                                <span className="text-foreground font-medium">${order.delivery_fee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span className="text-foreground font-medium">${order.tax_amount.toFixed(2)}</span>
                                        </div>
                                        {order.discount_amount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                    Discount Applied
                                                </span>
                                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                                    -${order.discount_amount.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-3 border-t border-border">
                                            <span className="text-foreground font-bold text-lg">Total</span>
                                            <span className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-purple-600 bg-clip-text text-transparent">
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
        <CustomerLayout>
            <Head>
                <title>My Orders - NKH Restaurant</title>
                <meta name="description" content="View and manage your order history" />
            </Head>

            <div className="space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight">
                            <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                My Orders
                            </span>
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Track and manage your order history
                        </p>
                    </div>
                    {data && (
                        <div className="flex items-center gap-3">
                            <div className="h-10 px-4 rounded-xl bg-card border border-border flex items-center gap-2 shadow-sm">
                                <Package className="w-4 h-4 text-primary" />
                                <span className="text-sm font-bold text-foreground">{data.meta.total}</span>
                                <span className="text-sm text-muted-foreground">total orders</span>
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap gap-2 p-2 bg-card border border-border rounded-2xl shadow-sm"
                >
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                            filterStatus === 'all'
                                ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25"
                                : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <Filter className="w-4 h-4" />
                        All Orders
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                            filterStatus === 'pending'
                                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                                : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <Clock className="w-4 h-4" />
                        Active
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                            filterStatus === 'completed'
                                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25"
                                : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Completed
                    </button>
                    <button
                        onClick={() => setFilterStatus('cancelled')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2",
                            filterStatus === 'cancelled'
                                ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/25"
                                : "bg-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                    >
                        <XCircle className="w-4 h-4" />
                        Cancelled
                    </button>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col justify-center items-center py-20">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        </div>
                        <p className="mt-4 text-muted-foreground font-medium">Loading your orders...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-500/20 rounded-2xl p-8 text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">Failed to load orders</h3>
                        <p className="text-muted-foreground mb-4">Something went wrong. Please try again later.</p>
                        <Button variant="destructive" onClick={() => window.location.reload()}>
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </motion.div>
                )}

                {/* Empty State */}
                {!isLoading && !error && data && data.data.length === 0 && (
                    <motion.div
                        className="text-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6 border border-fuchsia-500/30">
                            <Package className="w-12 h-12 text-fuchsia-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                            {filterStatus === 'all' ? 'No orders yet' : `No ${filterStatus} orders`}
                        </h3>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            {filterStatus === 'all'
                                ? "Ready to order? Browse our menu and place your first order!"
                                : `You don't have any ${filterStatus} orders. Try changing the filter.`}
                        </p>
                        <Button variant="primary" size="lg" onClick={() => window.location.href = '/menu'}>
                            <ShoppingBag className="w-5 h-5 mr-2" />
                            Browse Menu
                        </Button>
                    </motion.div>
                )}

                {/* Orders List */}
                {!isLoading && !error && data && data.data.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-5"
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
                        className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-card border border-border rounded-2xl shadow-sm"
                    >
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{data.meta.from}</span> to <span className="font-semibold text-foreground">{data.meta.to}</span> of <span className="font-semibold text-foreground">{data.meta.total}</span> orders
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="h-10 px-4"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
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
                                                "h-10 w-10 rounded-xl text-sm font-semibold transition-all",
                                                currentPage === pageNum
                                                    ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25"
                                                    : "bg-secondary border border-border text-muted-foreground hover:bg-secondary-hover hover:text-foreground"
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
                                className="h-10 px-4"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowCancelModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-red-500/10 to-rose-500/5 p-6 border-b border-red-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center border border-red-500/30">
                                        <AlertTriangle className="w-7 h-7 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">
                                            Cancel Order?
                                        </h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                            <Hash className="w-3.5 h-3.5" />
                                            {orderToCancel.order_number}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                <p className="text-muted-foreground mb-6">
                                    Are you sure you want to cancel this order? This action <span className="text-red-500 font-semibold">cannot be undone</span>.
                                </p>

                                {/* Order Summary */}
                                <div className="p-4 rounded-xl bg-secondary/50 border border-border mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-muted-foreground">Order Total</span>
                                        <span className="text-lg font-bold text-foreground">${orderToCancel.total_amount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Items</span>
                                        <span className="text-sm font-medium text-foreground">{orderToCancel.items_count} items</span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="secondary"
                                        className="flex-1 h-12"
                                        onClick={() => setShowCancelModal(false)}
                                        disabled={cancelOrderMutation.isPending}
                                    >
                                        Keep Order
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1 h-12"
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
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Cancel Order
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {cancelOrderMutation.isError && (
                                    <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-rose-500/5 border border-red-500/20">
                                        <p className="text-sm text-red-500 text-center font-medium">
                                            Failed to cancel order. Please try again.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </CustomerLayout>
    );
}
