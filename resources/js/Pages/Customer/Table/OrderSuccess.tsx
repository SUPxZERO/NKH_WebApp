import React, { useEffect, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, Utensils, Receipt, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TableOrderSuccess() {
    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
            <Head title="Order Sent!" />

            {/* Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[50%] bg-fuchsia-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-20%] w-[60%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]" />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="w-28 h-28 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-500/40 ring-4 ring-green-900/50"
                >
                    <CheckCircle className="w-14 h-14 text-white" strokeWidth={3} />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl font-black mb-3 text-white tracking-tight"
                >
                    Order Received!
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-slate-300 text-lg mb-10 max-w-xs leading-relaxed"
                >
                    The kitchen has started preparing your delicious food.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4 w-full max-w-sm"
                >
                    {/* Primary Action: Order More (Upsell) */}
                    <button
                        onClick={() => router.visit('/customer/table/menu')}
                        className="group w-full py-4 bg-white text-slate-950 rounded-2xl font-bold text-lg shadow-xl shadow-white/10 active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Utensils className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Order More Items</span>
                    </button>

                    {/* Secondary Action: View Bill/Status */}
                    <button
                        onClick={() => router.visit('/customer/table/orders')}
                        className="w-full py-4 bg-slate-800/80 backdrop-blur-md border border-white/10 text-white rounded-2xl font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-slate-800"
                    >
                        <Receipt className="w-5 h-5 text-fuchsia-400" />
                        <span>View Bill & Status</span>
                        <ArrowRight className="w-4 h-4 text-slate-500 ml-1" />
                    </button>

                    <p className="text-xs text-slate-500 mt-6 font-medium">
                        Sit tight! Your food will be served shortly.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
