import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Heart, Clock, TrendingUp, Flame, Leaf } from 'lucide-react';
import { MenuItem } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';
import Button from '@/app/components/ui/Button';
import { useFoodDetailSafe } from '@/app/providers/FoodDetailProvider';

interface MenuItemCardProps {
    item: MenuItem;
    onAddToCart?: (item: MenuItem) => void;
    onQuickView?: (item: MenuItem) => void;
    layout?: 'grid' | 'list';
    isFavorite?: boolean;
    onToggleFavorite?: () => void;
}

const dietaryIcons: Record<string, React.ReactNode> = {
    vegetarian: <Leaf className="w-3 h-3" />,
    vegan: <Leaf className="w-3 h-3" />,
    'gluten-free': <Flame className="w-3 h-3" />,
    spicy: <Flame className="w-3 h-3" />,
};

export function MenuItemCard({ item, onAddToCart, onQuickView, layout = 'grid', isFavorite = false, onToggleFavorite }: MenuItemCardProps) {
    const hasDiscount = item.original_price && item.original_price > item.price;

    // Get global food detail modal context (safe version returns null if not in provider)
    const foodDetailContext = useFoodDetailSafe();

    // Handle card click - open detail modal
    const handleCardClick = useCallback(() => {
        // If custom handler provided, use it
        if (onQuickView) {
            onQuickView(item);
            return;
        }

        // Otherwise use global modal if available
        if (foodDetailContext) {
            foodDetailContext.openFoodDetail(item.id, {
                onAddToCart: onAddToCart ? (menuItem, qty) => onAddToCart(menuItem) : undefined,
                onToggleFavorite: onToggleFavorite ? () => onToggleFavorite() : undefined,
                isFavorite,
            });
        }
    }, [item, onQuickView, foodDetailContext, onAddToCart, onToggleFavorite, isFavorite]);

    const discountPercent = hasDiscount
        ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
        : 0;

    if (layout === 'list') {
        return (
            <motion.div
                className="group relative flex flex-col md:flex-row gap-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 cursor-pointer"
                whileHover={{ y: -2 }}
                onClick={handleCardClick}
                layout
            >
                {/* Image */}
                <div className="relative w-full md:w-32 h-40 md:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                    {item.image_path ? (
                        <img
                            src={item.image_path || ''}
                            alt={item.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-100 dark:bg-gray-700">
                            🍽️
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {item.is_popular && (
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md">
                                <TrendingUp className="w-3 h-3" />
                                Popular
                            </span>
                        )}
                        {hasDiscount && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold shadow-md">
                                -{discountPercent}%
                            </span>
                        )}
                    </div>

                    {/* Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.();
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
                    >
                        <Heart
                            className={cn(
                                'w-4 h-4',
                                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-400'
                            )}
                        />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                                {item.name}
                            </h3>

                            {item.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                    {item.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tags */}
                    {item.dietary_restrictions && item.dietary_restrictions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {item.dietary_restrictions.slice(0, 3).map((restriction) => (
                                <span
                                    key={restriction}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs border border-green-200 dark:border-green-800"
                                >
                                    {dietaryIcons[restriction.toLowerCase()]}
                                    {restriction}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-auto pt-3 gap-3">
                        <div className="flex items-center gap-3">
                            {item.rating && (
                                <div className="flex items-center gap-1 text-sm">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {item.rating.toFixed(1)}
                                    </span>
                                </div>
                            )}

                            {item.prep_time && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>{item.prep_time}m</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                {hasDiscount && (
                                    <div className="text-sm text-gray-400 dark:text-gray-500 line-through">
                                        ${item.original_price?.toFixed(2)}
                                    </div>
                                )}
                                <div className="text-2xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                                    ${item.price.toFixed(2)}
                                </div>
                            </div>

                            <Button
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToCart?.(item);
                                }}
                                leftIcon={<Plus className="w-4 h-4" />}
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }


    // Grid layout (default)
    return (
        <motion.div
            className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 cursor-pointer"
            whileHover={{ y: -6 }}
            onClick={handleCardClick}
            layout
        >
            {/* Image */}
            <div className="relative h-52 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                {item.image_path ? (
                    <img
                        src={item.image_path || ''}
                        alt={item.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl bg-gray-100 dark:bg-gray-700">
                        🍽️
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {item.is_popular && (
                        <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold shadow-md flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Popular
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-semibold shadow-md">
                            -{discountPercent}% OFF
                        </span>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite?.();
                    }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 flex items-center justify-center hover:scale-110 transition-transform shadow-md z-10"
                >
                    <Heart
                        className={cn(
                            'w-5 h-5',
                            isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500 dark:text-gray-400'
                        )}
                    />
                </button>

                {/* Quick Add Button (shows on hover) */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <Button
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart?.(item);
                        }}
                        leftIcon={<Plus className="w-4 h-4" />}
                        className="shadow-xl"
                    >
                        Add to Cart
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 flex-1 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                        {item.name}
                    </h3>
                </div>

                {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {item.description}
                    </p>
                )}

                {/* Tags */}
                {item.dietary_restrictions && item.dietary_restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {item.dietary_restrictions.slice(0, 2).map((restriction) => (
                            <span
                                key={restriction}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs border border-green-200 dark:border-green-800"
                            >
                                {dietaryIcons[restriction.toLowerCase()]}
                                {restriction}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col gap-1">
                        {/* Rating */}
                        {item.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {item.rating.toFixed(1)}
                                </span>
                            </div>
                        )}

                        {/* Prep Time */}
                        {item.prep_time && (
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span>{item.prep_time}min</span>
                            </div>
                        )}
                    </div>

                    {/* Price */}
                    <div className="text-right">
                        {hasDiscount && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 line-through">
                                ${item.original_price?.toFixed(2)}
                            </div>
                        )}
                        <div className="text-xl font-bold text-fuchsia-600 dark:text-fuchsia-400">
                            ${item.price.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default MenuItemCard;
