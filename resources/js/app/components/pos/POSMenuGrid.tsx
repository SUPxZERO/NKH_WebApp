import React, { memo } from 'react';
import { MenuItem } from '@/app/types/domain';
import Button from '@/app/components/ui/Button';
import { ShoppingCart, Info } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/Loading';

interface POSMenuGridProps {
    items: MenuItem[];
    isLoading: boolean;
    viewMode: 'grid' | 'list';
    onItemClick: (item: MenuItem) => void;
    onViewDetails?: (item: MenuItem) => void;
}

const MenuItemCard = memo(({ item, viewMode, onClick, onViewDetails }: { item: MenuItem, viewMode: 'grid' | 'list', onClick: () => void, onViewDetails?: () => void }) => {
    if (viewMode === 'grid') {
        return (
            <div
                onClick={onClick}
                className="group relative rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-fuchsia-500/50 dark:hover:border-fuchsia-500/50 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer flex flex-col"
            >
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
                    {item.image_path ? (
                        <img
                            src={item.image_path}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-4xl">
                            🍽️
                        </div>
                    )}

                    {/* Info Button - Top Right */}
                    {onViewDetails && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails();
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center text-white transition-colors z-10"
                            title="View details"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    )}

                    {/* Gradient Overlay for better contrast if needed (optional) */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Content Section */}
                <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-tight line-clamp-2 mb-1">
                            {item.name}
                        </h3>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                        <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400 text-base">
                            ${item.price.toFixed(2)}
                        </span>
                        <div
                            className="h-8 px-3 rounded-full bg-gray-100 dark:bg-gray-700 group-hover:bg-fuchsia-600 group-hover:text-white dark:text-gray-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                            <span>Add</span>
                            <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                                <ShoppingCart className="w-2.5 h-2.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // LIST VIEW
    return (
        <div
            onClick={onClick}
            className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 active:scale-[0.99] transition-all cursor-pointer"
        >
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-900">
                {item.image_path ? (
                    <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">{item.name}</div>
                <div className="text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400">${item.price.toFixed(2)}</div>
            </div>

            <div className="flex items-center gap-2">
                {onViewDetails && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails();
                        }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Info className="w-5 h-5" />
                    </button>
                )}
                <button
                    className="h-9 px-4 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 font-medium text-sm hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/40 transition-colors"
                >
                    Add
                </button>
            </div>
        </div>
    );
});

MenuItemCard.displayName = 'MenuItemCard';

export const POSMenuGrid = memo(({ items, isLoading, viewMode, onItemClick, onViewDetails }: POSMenuGridProps) => {
    if (isLoading) {
        return (
            <div className={viewMode === 'grid'
                ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-2"
            }>
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
        );
    }

    return (
        <div className={viewMode === 'grid'
            ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4"
            : "space-y-2"
        }>
            {items.map((m) => (
                <MenuItemCard
                    key={m.id}
                    item={m}
                    viewMode={viewMode}
                    onClick={() => onItemClick(m)}
                    onViewDetails={onViewDetails ? () => onViewDetails(m) : undefined}
                />
            ))}
        </div>
    );
});

POSMenuGrid.displayName = 'POSMenuGrid';
