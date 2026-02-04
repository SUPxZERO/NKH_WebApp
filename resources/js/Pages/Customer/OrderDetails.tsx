
import React from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { RequireAuth } from '@/app/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { Clock, Package, CheckCircle, XCircle, MapPin, Calendar, DollarSign, ArrowLeft, Printer, CreditCard, ChevronRight } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import Button from '@/app/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { useTranslation } from '@/app/hooks/useTranslation';

interface OrderDetailsProps {
    orderId: string | number;
}

const statusConfig = {
    pending: { label: 'customer_pages.orders.status.pending', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400', icon: Clock },
    preparing: { label: 'customer_pages.orders.status.preparing', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: Package },
    ready: { label: 'customer_pages.orders.status.ready', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: CheckCircle },
    completed: { label: 'customer_pages.orders.status.completed', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: CheckCircle },
    cancelled: { label: 'customer_pages.orders.status.cancelled', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: XCircle },
    delivered: { label: 'customer_pages.orders.status.delivered', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400', icon: Package },
};

// import { useSmartPolling } from '@/app/hooks/useSmartPolling';

export default function OrderDetails({ orderId }: OrderDetailsProps) {
    const { t } = useTranslation();
    // Poll for order updates every 3 seconds
    // useSmartPolling(['orders'], 3000);

    const { data, isLoading, error } = useQuery({
        queryKey: ['customer-order', orderId],
        queryFn: async () => {
            const res = await apiGet<any>(`/customer/orders/${orderId}`);
            return res.data;
        }
    });

    if (isLoading) {
        return (
            <RequireAuth roles={['customer']}>
                <CustomerLayout>
                    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
                        <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                        <Card><div className="h-64 bg-gray-200 dark:bg-gray-800 rounded"></div></Card>
                    </div>
                </CustomerLayout>
            </RequireAuth>
        );
    }

    if (error || !data) {
        return (
            <RequireAuth roles={['customer']}>
                <CustomerLayout>
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">{t('customer_pages.orders.details.order_not_found')}</h2>
                        <p className="text-gray-500 mb-6">{t('customer_pages.orders.details.order_not_found_desc')}</p>
                        <Button onClick={() => window.location.href = '/customer/orders'}>{t('customer_pages.orders.details.back_to_orders')}</Button>
                    </div>
                </CustomerLayout>
            </RequireAuth>
        );
    }

    const order = data;
    const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
    const StatusIcon = statusInfo.icon;

    return (
        <RequireAuth roles={['customer']}>
            <CustomerLayout>
                <Head title={`Order #${order.order_number}`} />

                <div className="max-w-5xl mx-auto space-y-6">
                    {/* Header & Back Button */}
                    {/* Header & Back Button */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                        <div className="flex items-center justify-between w-full md:w-auto gap-4">
                            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/customer/orders'}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('customer_pages.orders.details.back')}
                            </Button>
                            {/* Mobile-only Pay button could optionally go here, but let's keep it consistent at bottom/right */}
                        </div>

                        <div className="flex-1 w-full">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent break-words">
                                {t('customer_pages.orders.details.order_number', { number: order.order_number })}
                            </h1>
                            <p className="text-sm text-gray-500">{t('customer_pages.orders.details.placed_on', { date: new Date(order.ordered_at).toLocaleString() })}</p>
                        </div>

                        {!order.is_paid && order.status !== 'cancelled' && (
                            <Button
                                variant="primary"
                                onClick={() => window.location.href = `/payment?order_id=${order.id}`}
                                className="w-full md:w-auto"
                                leftIcon={<CreditCard className="w-4 h-4" />}
                            >
                                {t('customer_pages.orders.details.pay_now')}
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content: Items & Status */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Status Card */}
                            <Card className="border-l-4 border-l-fuchsia-500">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-full shrink-0", statusInfo.color)}>
                                                <StatusIcon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">{t(statusInfo.label)}</h3>
                                                <p className="text-sm text-gray-500">
                                                    {order.status === 'completed' ? t('customer_pages.orders.details.status_messages.completed') : t('customer_pages.orders.details.status_messages.default')}
                                                </p>
                                            </div>
                                        </div>
                                        {order.pickup_time && (
                                            <div className="text-left sm:text-right pl-[3.25rem] sm:pl-0">
                                                <div className="text-xs text-gray-500 uppercase tracking-wider">{order.order_type === 'delivery' ? t('customer_pages.orders.details.estimated_arrival') : t('customer_pages.orders.details.estimated_pickup')}</div>
                                                <div className="font-semibold text-lg text-fuchsia-600">
                                                    {new Date(order.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {/* Simple Stepper (Visual only for now) */}
                                    <div className="relative pt-2">
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100 dark:bg-gray-800">
                                            <div style={{ width: order.status === 'pending' ? '25%' : order.status === 'preparing' ? '50%' : order.status === 'ready' ? '75%' : '100%' }}
                                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-fuchsia-500 transition-all duration-1000"></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Items List */}
                            <Card>
                                <CardHeader><div className="font-semibold text-lg">{t('customer_pages.orders.details.order_items')}</div></CardHeader>
                                <CardContent className="space-y-4">
                                    {order.items.map((item: any) => (
                                        <div key={item.id} className="flex gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0">
                                            {item.image_path ? (
                                                <img src={item.image_path} alt={item.name} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl shrink-0" />
                                            ) : (
                                                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                                                    <Package className="w-8 h-8" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                                                    <span className="font-medium">${Number(item.total_price).toFixed(2)}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2">{item.quantity} x ${Number(item.unit_price).toFixed(2)}</p>
                                                {item.special_instructions && (
                                                    <div className="text-xs bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400 p-2 rounded-lg inline-block">
                                                        {t('customer_pages.orders.details.note')}: {item.special_instructions}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Sidebar: Details & Summary */}
                        <div className="space-y-6">
                            {/* Order Summary */}
                            <Card>
                                <CardHeader><div className="font-semibold">{t('customer_pages.orders.details.billed_to')}</div></CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="space-y-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{t('customer_pages.orders.details.subtotal')}</span>
                                            <span>${Number(order.subtotal).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{t('customer_pages.orders.details.delivery_fee')}</span>
                                            <span>${Number(order.delivery_fee).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">{t('customer_pages.orders.details.tax')}</span>
                                            <span>${Number(order.tax_amount).toFixed(2)}</span>
                                        </div>
                                        {Number(order.discount_amount) > 0 && (
                                            <div className="flex justify-between text-green-500">
                                                <span>{t('customer_pages.orders.details.discount')}</span>
                                                <span>-${Number(order.discount_amount).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between font-bold text-lg pt-2">
                                        <span>{t('customer_pages.orders.details.total')}</span>
                                        <span className="text-fuchsia-600">${Number(order.total_amount).toFixed(2)}</span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex justify-between items-center text-xs text-gray-500 uppercase tracking-wider mb-2">{t('customer_pages.orders.details.payment_status')}</div>
                                        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium w-full justify-between",
                                            order.is_paid ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                        )}>
                                            <span className="flex items-center gap-2">
                                                {order.is_paid ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                {order.is_paid ? t('customer_pages.orders.details.paid') : t('customer_pages.orders.details.unpaid')}
                                            </span>
                                            <span className="text-xs opacity-75 capitalize">{(order.payment_mode || 'N/A').replace(/_/g, ' ')}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Delivery/Pickup Details */}
                            <Card>
                                <CardHeader><div className="font-semibold">{order.order_type === 'delivery' ? t('customer_pages.orders.details.delivery_address') : t('customer_pages.orders.details.pickup_location')}</div></CardHeader>
                                <CardContent className="text-sm space-y-3">
                                    {order.order_type === 'delivery' && order.delivery_address ? (
                                        <>
                                            <div className="font-medium">{order.delivery_address.label || 'Home'}</div>
                                            <div className="text-gray-500">
                                                {order.delivery_address.address_line_1}
                                                {order.delivery_address.address_line_2 && <br />}{order.delivery_address.address_line_2}
                                                <br />
                                                {order.delivery_address.city}, {order.delivery_address.postal_code}
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-medium text-fuchsia-600">{order.location?.name || t('customer_pages.orders.details.local_store')}</div>
                                            <div className="text-gray-500 flex items-start gap-2">
                                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span>{order.location?.address || t('customer_pages.orders.details.address_not_available')}</span>
                                            </div>
                                        </>
                                    )}

                                    {order.special_instructions && (
                                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
                                            <div className="text-xs text-gray-500 uppercase font-semibold mb-1">{t('customer_pages.orders.details.instructions')}</div>
                                            <p className="text-gray-600 dark:text-gray-400 italic">"{order.special_instructions}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </CustomerLayout>
        </RequireAuth>
    );
}
