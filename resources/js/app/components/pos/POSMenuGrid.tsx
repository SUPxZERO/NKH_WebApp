import React, { memo } from 'react';
import { MenuItem } from '@/app/types/domain';
import Button from '@/app/components/ui/Button';
import { ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/app/components/ui/Loading';

interface POSMenuGridProps {
    items: MenuItem[];
    isLoading: boolean;
    viewMode: 'grid' | 'list';
    onItemClick: (item: MenuItem) => void;
}

const MenuItemCard = memo(({ item, viewMode, onClick }: { item: MenuItem, viewMode: 'grid' | 'list', onClick: () => void }) => {
    if (viewMode === 'grid') {
        return (
            <div
                className="group rounded-2xl overflow-hidden border-2 border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl hover:border-fuchsia-500/30 transition-all hover:scale-102"
            >
                {item.image_path ? (
                    <img src={item.image_path} alt={item.name} className="h-32 w-full object-cover" loading="lazy" />
                ) : (
                    <div className="h-32 bg-gradient-to-br from-fuchsia-600/30 to-rose-500/30 flex items-center justify-center text-5xl">
                        🍽️
                    </div>
                )}
                <div className="p-4">
                    <div className="font-medium truncate text-base">{item.name}</div>
                    <div className="text-sm text-fuchsia-600 dark:text-fuchsia-400 font-bold mt-1">
                        ${item.price.toFixed(2)}
                    </div>
                    <div className="mt-3">
                        <Button
                            size="sm"
                            className="w-full h-12 text-base"
                            onClick={onClick}
                            leftIcon={<ShoppingCart className="w-5 h-5" />}
                        >
                            Add
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all"
        >
            {item.image_path && (
                <img src={item.image_path} alt={item.name} className="w-16 h-16 rounded-lg object-cover" loading="lazy" />
            )}
            <div className="flex-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">${item.price.toFixed(2)}</div>
            </div>
            <Button
                size="sm"
                onClick={onClick}
                leftIcon={<ShoppingCart className="w-4 h-4" />}
            >
                Add
            </Button>
        </div>
    );
});

MenuItemCard.displayName = 'MenuItemCard';

export const POSMenuGrid = memo(({ items, isLoading, viewMode, onItemClick }: POSMenuGridProps) => {
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
            ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
            : "space-y-2"
        }>
            {items.map((m) => (
                <MenuItemCard
                    key={m.id}
                    item={m}
                    viewMode={viewMode}
                    onClick={() => onItemClick(m)}
                />
            ))}
        </div>
    );
});

POSMenuGrid.displayName = 'POSMenuGrid';
