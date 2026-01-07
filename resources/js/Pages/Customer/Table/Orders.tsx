import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import TableLayout from '@/app/layouts/TableLayout';
import { useTableStore } from '@/app/store/tableStore';
import { Loader2, Receipt, Clock, CheckCircle, ChefHat, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderItem {
    id: number;
    menu_item: {
        name: string;
        image_path?: string;
    };
    quantity: number;
    total_price: number;
    status: string;
}

interface Order {
    id: number;
    order_number: string;
    status: string;
    total_amount: number;
    created_at: string;
    items: OrderItem[];
}

export default function TableOrders() {
    const { sessionToken } = useTableStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOrders();
        // Poll for updates every 10 seconds
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [sessionToken]);

    const fetchOrders = async () => {
        if (!sessionToken) {
            setLoading(false);
            return;
        }

        try {
            // We need a specific endpoint for table session orders or filter the general one
            // Ideally: GET /api/table-session/orders (using header auth)
            // For now, let's assume we use the general customer orders endpoint 
            // but heavily filter or use the session header to context switch on backend?
            // Actually, best to use the token to query specifically.
            // Let's rely on the fact that if we are "guest", the EnsureCustomerAccess 
            // limits us to our session's orders if we implemented that logic.
            // BUT, the standard /api/customer/orders might rely on Auth::user().
            // Let's try the existing public scan endpoint? No.
            // Let's try the standard endpoint with the header, it should work if we updated middleware.

            const response = await axios.get('/api/customer/orders', {
                headers: { 'X-Table-Session': sessionToken }
            });

            // The standard endpoint returns { data: [...] } via resources
            setOrders(response.data.data);
            setError(null);
        } catch (err) {
            console.error(err);
            // Silent error on poll, visible on first load?
            if (loading) setError("Could not load orders.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'served': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'preparing': return <ChefHat className="w-5 h-5 text-orange-500" />;
            case 'received': return <Clock className="w-5 h-5 text-blue-500" />;
            default: return <Clock className="w-5 h-5 text-slate-500" />;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'received': return 'Order Sent';
            case 'preparing': return 'Chef is Cooking';
            case 'served': return 'Served';
            case 'completed': return 'Completed';
            default: return status;
        }
    };

    return (
        <TableLayout title="My Orders">
            <Head title="My Orders" />

            {!sessionToken ? (
                <div className="text-center py-20 text-slate-500">
                    Your session has expired. Please scan the QR code again.
                </div>
            ) : loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin mb-4" />
                    <p className="text-slate-500 text-sm">Loading your orders...</p>
                </div>
            ) : error ? (
                <div className="text-center py-20 text-red-400">
                    <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                    {error}
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                        <Receipt className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">No orders yet</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mb-6">You haven't placed any orders yet. Visit the menu to start!</p>
                </div>
            ) : (
                <div className="space-y-6 pb-24">
                    {/* Total Bill Summary */}
                    <div className="bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40 border border-fuchsia-500/20 rounded-2xl p-5 mb-6">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-slate-300 font-medium">Current Bill</span>
                            <span className="text-3xl font-bold text-white">
                                ${orders.reduce((sum, order) => sum + Number(order.total_amount), 0).toFixed(2)}
                            </span>
                        </div>
                        <p className="text-xs text-fuchsia-300/80 text-right">Includes all sent orders</p>
                    </div>

                    {orders.map((order) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden"
                        >
                            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <span className="text-xs font-mono text-slate-400">#{order.order_number}</span>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/50 border border-white/10">
                                    {getStatusIcon(order.status)}
                                    <span className="text-xs font-bold text-slate-200 capitalize">
                                        {getStatusLabel(order.status)}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-500 text-xs font-bold w-4">{item.quantity}x</span>
                                            <span className="text-slate-200 text-sm font-medium">{item.menu_item.name}</span>
                                        </div>
                                        <span className="text-slate-400 text-sm">${Number(item.total_price).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="px-4 py-3 bg-slate-950/30 flex justify-between items-center text-sm">
                                <span className="text-slate-500">Total</span>
                                <span className="text-white font-bold">${Number(order.total_amount).toFixed(2)}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </TableLayout>
    );
}
