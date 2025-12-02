import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { Clock, Package, CheckCircle, XCircle, MapPin, Calendar, DollarSign, ChevronDown, Filter } from 'lucide-react';
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
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle },
    delivered: { label: 'Delivered', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: Package },
};

const approvalConfig = {
    pending: { label: 'Awaiting Approval', color: 'text-yellow-600 dark:text-yellow-400' },
    approved: { label: 'Approved', color: 'text-green-600 dark:text-green-400' },
    rejected: { label: 'Rejected', color: 'text-red-600 dark:text-red-400' },
};

export default function Orders() {
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

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

    const handleReorder = (order: Order) => {
        // TODO: Implement reorder functionality
        console.log('Reorder:', order.id);
    };

    const handleCancelOrder = (order: Order) => {
        // TODO: Implement cancel order functionality
        console.log('Cancel order:', order.id);
    };

    const OrderCard = ({ order }: { order: Order }) => {
        const isExpanded = expandedOrder === order.id;
        const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
        const StatusIcon = statusInfo.icon;

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                {/* Header */}
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {order.order_number}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {formatDate(order.ordered_at)} at {formatTime(order.ordered_at)}
                            </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold', statusInfo.color)}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                            </div>
                            {order.approval_status && (
                                <p className={cn('text-xs font-medium', approvalConfig[order.approval_status as keyof typeof approvalConfig]?.color)}>
                                    {approvalConfig[order.approval_status as keyof typeof approvalConfig]?.label}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Order Type & Location */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-300 mb-4">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            <span className="capitalize">{order.order_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{order.location.name}</span>
                        </div>
                        {order.time_slot && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(order.time_slot.date)} at {order.time_slot.time}</span>
                            </div>
                        )}
                    </div>

                    {/* Items Preview */}
                    <div className="flex items-center gap-3 mb-4">
                        {order.preview_image && (
                            <img
                                src={order.preview_image}
                                alt="Order preview"
                                className="w-16 h-16 rounded-lg object-cover"
                            />
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.items_count} {order.items_count === 1 ? 'item' : 'items'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                {order.items.length > 2 && ` +${order.items.length - 2} more`}
                            </p>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">Total</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            ${order.total_amount.toFixed(2)}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                            rightIcon={<ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />}
                        >
                            {isExpanded ? 'Hide' : 'View'} Details
                        </Button>
                        {order.can_reorder && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleReorder(order)}
                            >
                                Reorder
                            </Button>
                        )}
                        {order.can_cancel && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleCancelOrder(order)}
                            >
                                Cancel
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
                            className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                        >
                            <div className="p-6 space-y-4">
                                {/* Items List */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Order Items</h4>
                                    <div className="space-y-2">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                                <div className="flex items-center gap-3 flex-1">
                                                    {item.image_path && (
                                                        <img src={item.image_path} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                                                        {item.special_instructions && (
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 italic">{item.special_instructions}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-gray-900 dark:text-white font-medium">
                                                    ${item.total_price.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Delivery Address */}
                                {order.delivery_address && (
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery Address</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            {order.delivery_address.address_line_1}
                                            {order.delivery_address.address_line_2 && `, ${order.delivery_address.address_line_2}`}
                                            <br />
                                            {order.delivery_address.city}, {order.delivery_address.postal_code}
                                        </p>
                                    </div>
                                )}

                                {/* Price Breakdown */}
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Price Breakdown</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                                            <span className="text-gray-900 dark:text-white">${order.subtotal.toFixed(2)}</span>
                                        </div>
                                        {order.delivery_fee > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">Delivery Fee</span>
                                                <span className="text-gray-900 dark:text-white">${order.delivery_fee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-300">Tax</span>
                                            <span className="text-gray-900 dark:text-white">${order.tax_amount.toFixed(2)}</span>
                                        </div>
                                        {order.discount_amount > 0 && (
                                            <div className="flex justify-between text-green-600">
                                                <span>Discount</span>
                                                <span>-${order.discount_amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                                            <span className="text-gray-900 dark:text-white">Total</span>
                                            <span className="text-gray-900 dark:text-white">${order.total_amount.toFixed(2)}</span>
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

            <div className="space-y-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                        My Orders
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Track and manage your order history
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    className="flex flex-wrap gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Button
                        variant={filterStatus === 'all' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                        leftIcon={<Filter className="w-4 h-4" />}
                    >
                        All Orders
                    </Button>
                    <Button
                        variant={filterStatus === 'pending' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('pending')}
                    >
                        Active
                    </Button>
                    <Button
                        variant={filterStatus === 'completed' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('completed')}
                    >
                        Completed
                    </Button>
                    <Button
                        variant={filterStatus === 'cancelled' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('cancelled')}
                    >
                        Cancelled
                    </Button>
                </motion.div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-fuchsia-500 border-t-transparent"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                        <p className="text-red-800 dark:text-red-400">Failed to load orders. Please try again later.</p>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && data && data.data.length === 0 && (
                    <motion.div
                        className="text-center py-20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Package className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            No orders found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {filterStatus === 'all'
                                ? "You haven't placed any orders yet"
                                : `No ${filterStatus} orders found`}
                        </p>
                        <Button variant="primary" onClick={() => window.location.href = '/menu'}>
                            Browse Menu
                        </Button>
                    </motion.div>
                )}

                {/* Orders List */}
                {!isLoading && !error && data && data.data.length > 0 && (
                    <div className="space-y-4">
                        {data.data.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {data && data.meta.last_page > 1 && (
                    <div className="flex justify-center items-center gap-4 pt-6">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {data.meta.current_page} of {data.meta.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === data.meta.last_page}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
}
