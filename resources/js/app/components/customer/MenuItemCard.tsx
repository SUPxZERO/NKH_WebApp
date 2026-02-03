import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Heart, Clock, TrendingUp, Flame, Leaf } from 'lucide-react';
import { MenuItem } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';
import Button from '@/app/components/ui/Button';
import { useFoodDetailSafe } from '@/app/providers/FoodDetailProvider';
import { useTranslation } from '@/app/hooks/useTranslation';

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
    const { t } = useTranslation();
    const hasDiscount = item.original_price && item.original_price > item.price;
    const foodDetailContext = useFoodDetailSafe();

    const handleCardClick = useCallback(() => {
        if (onQuickView) {
            onQuickView(item);
            return;
        }
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
                className="group relative flex gap-4 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-all cursor-pointer"
                whileHover={{ y: -2 }}
                onClick={handleCardClick}
                layout
            >
                {/* Image */}
                <div className="relative w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                    {item.image_path ? (
                        <img
                            src={item.image_path || ''}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                            🍽️
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {item.is_popular && (
                            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                            </div>
                        )}
                        {hasDiscount && (
                            <div className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                                -{discountPercent}%
                            </div>
                        )}
                    </div>

                    {/* Favorite */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    >
                        <Heart className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-gray-400")} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                            {item.name}
                        </h3>
                        {item.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                {item.description}
                            </p>
                        )}

                        {/* Dietary Tags */}
                        {item.dietary_restrictions && item.dietary_restrictions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.dietary_restrictions.slice(0, 3).map((restriction) => (
                                    <span
                                        key={restriction}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs"
                                    >
                                        {dietaryIcons[restriction.toLowerCase()]}
                                        {restriction}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-4">
                            {item.rating && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.rating.toFixed(1)}</span>
                                </div>
                            )}
                            {item.prep_time && (
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>{item.prep_time} {t('common.minutes_short')}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {hasDiscount && (
                                <span className="text-sm text-gray-400 line-through">${item.original_price?.toFixed(2)}</span>
                            )}
                            <span className="text-xl font-bold text-fuchsia-600 dark:text-fuchsia-400">${item.price.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Add Button */}
                <Button
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onAddToCart?.(item); }}
                    leftIcon={<Plus className="w-4 h-4" />}
                    className="self-center flex-shrink-0"
                >
                    {t('common.add')}
                </Button>
            </motion.div>
        );
    }

    // Grid layout - Optimized for both mobile and desktop
    return (
        <motion.div
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-all cursor-pointer"
            whileHover={{ y: -4 }}
            onClick={handleCardClick}
            layout
        >
            {/* Image Container */}
            <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {item.image_path ? (
                    <img
                        src={item.image_path || ''}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                        🍽️
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {item.is_popular && (
                        <div className="px-2 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg">
                            <TrendingUp className="w-3 h-3" />
                            <span className="hidden sm:inline">{t('menu.badges.popular')}</span>
                        </div>
                    )}
                    {hasDiscount && (
                        <div className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
                            -{discountPercent}%
                        </div>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                    <Heart className={cn("w-5 h-5", isFavorite ? "fill-red-500 text-red-500" : "text-gray-400")} />
                </button>

                {/* Quick Add Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAddToCart?.(item); }}
                    className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-fuchsia-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform hover:bg-fuchsia-700"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">
                    {item.name}
                </h3>

                {item.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1.5 hidden sm:block">
                        {item.description}
                    </p>
                )}

                {/* Dietary Tags */}
                {item.dietary_restrictions && item.dietary_restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.dietary_restrictions.slice(0, 2).map((restriction) => (
                            <span
                                key={restriction}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs"
                            >
                                {dietaryIcons[restriction.toLowerCase()]}
                                {restriction}
                            </span>
                        ))}
                    </div>
                )}

                <div className="flex-1" />

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        {item.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.rating.toFixed(1)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through">${item.original_price?.toFixed(2)}</span>
                        )}
                        <span className="text-lg font-bold text-fuchsia-600 dark:text-fuchsia-400">
                            ${item.price.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default MenuItemCard;
