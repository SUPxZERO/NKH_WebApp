import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import TableLayout from '@/app/layouts/TableLayout';
import { useCategories, useMenuItems } from '@/app/hooks/useMenu';
import { useTableStore } from '@/app/store/tableStore';
import { Plus, Search, Loader2, X } from 'lucide-react';
import { toastSuccess } from '@/app/utils/toast';
import { MenuItem } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function TableMenu() {
    const { data: categories } = useCategories(true);
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
    const [search, setSearch] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const { data: menuItems, isLoading } = useMenuItems({
        category_id: selectedCategory,
        search: search || undefined
    });

    const addItem = useTableStore(state => state.addItem);

    const handleAddToCart = (item: MenuItem) => {
        addItem({
            menu_item_id: item.id,
            name: item.name ?? "Unknown Item",
            unit_price: item.price,
            quantity: 1,
            image_path: item.image_path || undefined
        });
        // Optional: Visual feedback beyond toast?
        toastSuccess('Added! Check your Tray below to order.');
    };

    return (
        <TableLayout>
            <Head title="Menu" />

            {/* Search Bar - Sticky */}
            <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md pb-4 pt-1 mb-2">
                <div className="relative">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isSearchFocused ? 'text-fuchsia-500' : 'text-slate-500'}`} />
                    <input
                        type="text"
                        placeholder="Search dishes..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-fuchsia-500/50 rounded-2xl py-3 pl-12 pr-10 text-slate-100 placeholder:text-slate-600 focus:ring-4 focus:ring-fuchsia-500/10 transition-all shadow-sm"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 snap-x">
                <button
                    onClick={() => setSelectedCategory(undefined)}
                    className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${!selectedCategory ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                >
                    All Items
                </button>
                {categories?.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${selectedCategory === cat.id ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Menu Grid */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin mb-4" />
                    <p className="text-slate-500 text-sm font-medium">Loading delicious items...</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-24">
                    <AnimatePresence mode="popLayout">
                        {menuItems?.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden group active:scale-[0.98] transition-transform shadow-lg shadow-black/20"
                            >
                                <div className="aspect-[4/3] bg-slate-800 relative overflow-hidden">
                                    {item.image_path ? (
                                        <img
                                            src={item.image_path}
                                            alt={item.name}
                                            loading="lazy"
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-800/50">
                                            <span className="text-4xl mb-2">🍽️</span>
                                            <span className="text-[10px] uppercase tracking-wider font-bold">No Image</span>
                                        </div>
                                    )}

                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(item);
                                        }}
                                        className="absolute bottom-3 right-3 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg shadow-black/30 active:scale-90 transition-transform z-10 hover:bg-fuchsia-50"
                                    >
                                        <Plus className="w-6 h-6 stroke-[2.5]" />
                                    </button>
                                </div>

                                <div className="p-4 pt-2 -mt-2 relative z-0">
                                    <h3 className="font-bold text-slate-100 leading-tight mb-1 line-clamp-2 min-h-[2.5em]">{item.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-fuchsia-400 font-bold text-lg">${Number(item.price).toFixed(2)}</p>
                                        {/* Can add spicy/veg icons here later */}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {menuItems?.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            <p>No items found matching "{search}"</p>
                            <button onClick={() => { setSearch(''); setSelectedCategory(undefined); }} className="text-fuchsia-400 text-sm font-bold mt-2 hover:underline">Clear Filters</button>
                        </div>
                    )}
                </div>
            )}
        </TableLayout>
    );
}
