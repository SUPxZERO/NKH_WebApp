import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Utensils,
    ShoppingBag,
    BellRing,
    User,
    LogOut,
    ChevronLeft,
    Receipt
} from 'lucide-react';
import { useTableStore } from '@/app/store/tableStore';
import { cn } from '@/app/utils/cn';

interface TableLayoutProps {
    children: React.ReactNode;
    title?: string;
    showBack?: boolean;
    hideNav?: boolean;
}

export default function TableLayout({ children, title, showBack = false, hideNav = false }: TableLayoutProps) {
    const { tableCode, tableName, getItemCount } = useTableStore();
    const cartCount = getItemCount();

    // Active route detection could be added here if needed for navigation highlighting

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-fuchsia-500/30">
            {/* 
        High-End Background Effect 
        - Subtle gradient mesh that stays fixed
      */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {showBack ? (
                            <button
                                onClick={() => window.history.back()}
                                className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-slate-300" />
                            </button>
                        ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-fuchsia-900/20">
                                <Utensils className="w-5 h-5 text-white" />
                            </div>
                        )}

                        <div>
                            <h1 className="font-bold text-lg leading-tight tracking-wide">
                                NKH<span className="text-fuchsia-500">.</span>
                            </h1>
                            {tableCode && (
                                <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">
                                    Table {tableCode}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-2.5 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                            <BellRing className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 max-w-md mx-auto px-4 py-6 pb-24">
                {title && (
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-bold mb-6"
                    >
                        {title}
                    </motion.h2>
                )}

                {children}
            </main>

            {/* Bottom Floating Navigation (__suppressed if hideNav is true__) */}
            {!hideNav && (
                <div className="fixed bottom-4 left-4 right-4 z-[100] max-w-md mx-auto safe-area-bottom">
                    <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 p-2 flex items-center justify-between ring-1 ring-white/5">
                        <Link
                            href="/customer/table/menu"
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all active:scale-95",
                                window.location.pathname.includes('/menu')
                                    ? "bg-white/10 text-white shadow-inner"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <Utensils className="w-6 h-6 mb-0.5" />
                            <span className="text-[10px] font-bold tracking-wide">Menu</span>
                        </Link>

                        <Link
                            href="/customer/table/orders"
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all active:scale-95",
                                window.location.pathname.includes('/orders')
                                    ? "bg-white/10 text-white shadow-inner"
                                    : "text-slate-400 hover:text-slate-200"
                            )}
                        >
                            <Receipt className="w-6 h-6 mb-0.5" />
                            <span className="text-[10px] font-bold tracking-wide">Orders</span>
                        </Link>

                        {/* Tray Button (Center Highlighted) */}
                        <Link
                            href="/customer/table/cart"
                            className="flex-1 relative group"
                        >
                            <div className={cn(
                                "mx-auto w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-fuchsia-900/50 relative -mt-8 ring-4 ring-slate-950 transition-all active:scale-90 active:ring-slate-900",
                                cartCount > 0
                                    ? "bg-gradient-to-tr from-fuchsia-600 to-purple-600 animate-pulse-gentle"
                                    : "bg-slate-800 border border-white/10"
                            )}>
                                <ShoppingBag className={cn("w-6 h-6 transition-colors", cartCount > 0 ? "text-white" : "text-slate-400 group-hover:text-white")} />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 border-2 border-slate-900 rounded-full text-[10px] font-body font-bold text-white flex items-center justify-center shadow-sm">
                                        {cartCount}
                                    </span>
                                )}
                            </div>
                            <div className="text-center mt-1.5">
                                <span className={cn("text-[10px] font-bold tracking-wide transition-colors", cartCount > 0 ? "text-fuchsia-400" : "text-slate-500 group-hover:text-slate-300")}>Tray</span>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
