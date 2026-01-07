import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import TableLayout from '@/app/layouts/TableLayout';
import { useTableStore } from '@/app/store/tableStore';
import { Minus, Plus, Trash2, ChevronRight, Loader2, Utensils, Receipt } from 'lucide-react';
import axios from 'axios';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function TableCart() {
    const cart = useTableStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSendToKitchen = async () => {
        if (cart.cartItems.length === 0) return;
        if (!cart.sessionToken) {
            toastError("Session expired. Please scan QR again.");
            return;
        }

        setIsSubmitting(true);

        // We assume backend middleware will attach the table session context
        try {
            const payload = {
                order_type: 'dine-in',
                location_id: cart.locationId ?? 1, // Use store location, fallback to 1
                order_items: cart.cartItems.map(item => ({
                    menu_item_id: item.menu_item_id,
                    quantity: item.quantity,
                    special_instructions: item.special_instructions
                })),
                // Include session token explicitly if needed by some fallback logic, 
                // though header handles the linking
            };

            await axios.post('/api/customer/online-orders', payload, {
                headers: {
                    'X-Table-Session': cart.sessionToken
                }
            });

            cart.clearCart();
            router.visit('/customer/table/success');

        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || 'Failed to send order.';
            toastError(msg);
            setIsSubmitting(false);
        }
    };

    const EmptyState = () => (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
        >
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-black/20 ring-1 ring-white/10">
                <Utensils className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-2">Your tray is empty</h3>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
                Looks like you haven't added any dishes yet. Browse the menu to get started!
            </p>

            <button
                onClick={() => router.visit('/customer/table/menu')}
                className="px-8 py-4 bg-white text-slate-950 font-bold rounded-2xl mt-8 active:scale-95 transition-transform shadow-lg shadow-white/10"
            >
                Browse Menu
            </button>
        </motion.div>
    );

    return (
        <TableLayout title="Your Tray" showBack={true} hideNav={true}>
            <Head title="Tray" />

            {cart.cartItems.length === 0 ? (
                <EmptyState />
            ) : (
                <>
                    <div className="space-y-4 pb-40">
                        <AnimatePresence mode="popLayout">
                            {cart.cartItems.map((item) => (
                                <motion.div
                                    key={item.menu_item_id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex gap-4 backdrop-blur-sm"
                                >
                                    {/* Simple Image or Placeholder */}
                                    <div className="w-20 h-20 bg-slate-800 rounded-xl flex-shrink-0 overflow-hidden border border-white/5">
                                        {item.image_path ? (
                                            <img src={item.image_path} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                                                <Utensils className="w-6 h-6 opacity-20" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 flex flex-col justify-between py-0.5">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-slate-200 text-sm leading-tight">{item.name}</h4>
                                            <button onClick={() => cart.removeItem(item.menu_item_id)} className="text-slate-600 hover:text-red-400 transition-colors p-1 -mr-2 -mt-2">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="flex items-end justify-between mt-2">
                                            <p className="text-fuchsia-400 font-bold text-sm">${(item.unit_price * item.quantity).toFixed(2)}</p>

                                            <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-white/5">
                                                <button
                                                    onClick={() => cart.updateQuantity(item.menu_item_id, item.quantity - 1)}
                                                    className="w-7 h-7 rounded-md bg-slate-800 text-slate-300 flex items-center justify-center active:bg-slate-700 transition-colors"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="font-bold text-white w-8 text-center text-sm">{item.quantity}</span>
                                                <button
                                                    onClick={() => cart.updateQuantity(item.menu_item_id, item.quantity + 1)}
                                                    className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center active:bg-slate-200 transition-colors"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        <div className="bg-slate-900/30 border border-dotted border-white/10 rounded-xl p-4 text-center">
                            <p className="text-xs text-slate-500">
                                Keep ordering as much as you like! We'll keep adding it to your table's bill.
                            </p>
                        </div>
                    </div>

                    {/* Checkout Bar - Sticky Bottom with Blur */}
                    <div className="fixed bottom-0 left-0 right-0 z-[100] safe-area-bottom">
                        {/* Gradient fade to integrate with float nav */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent -top-20 h-20 pointer-events-none" />

                        <div className="bg-slate-950/90 backdrop-blur-xl border-t border-white/10 p-5 pb-8">
                            <div className="max-w-md mx-auto space-y-4">
                                <div className="flex justify-between items-center text-slate-300">
                                    <span className="text-sm font-medium">Total (Estimated)</span>
                                    <span className="text-2xl font-bold text-white tracking-tight">${cart.getTotalPrice().toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={handleSendToKitchen}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 rounded-xl font-bold text-white shadow-lg shadow-fuchsia-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send to Kitchen
                                            <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </TableLayout>
    );
}
