import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Star, Heart, Clock, TrendingUp, Flame, Leaf } from 'lucide-react';
import { MenuItem } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';
import Button from '@/app/components/ui/Button';

interface MenuItemCardProps {
    item: MenuItem;
    onAddToCart?: (item: MenuItem) => void;
    onQuickView?: (item: MenuItem) => void;
    layout?: 'grid' | 'list';
}

const dietaryIcons: Record<string, React.ReactNode> = {
    vegetarian: <Leaf className="w-3 h-3" />,
    vegan: <Leaf className="w-3 h-3" />,
    'gluten-free': <Flame className="w-3 h-3" />,
    spicy: <Flame className="w-3 h-3" />,
};

export function MenuItemCard({ item, onAddToCart, onQuickView, layout = 'grid' }: MenuItemCardProps) {
    const [isFavorite, setIsFavorite] = React.useState(false);
    const hasDiscount = item.original_price && item.original_price > item.price;
    const discountPercent = hasDiscount
        ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
        : 0;

    if (layout === 'list') {
        return (
            <motion.div
                className="group relative flex gap-4 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:border-fuchsia-500/30 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-fuchsia-500/10"
                whileHover={{ y: -2 }}
                layout
            >
                {/* Image */}
                <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                    {item.image_path ? (
                        <img
                            src={item.image_path || ''}
                            alt={item.name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">
                            🍽️
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {item.is_popular && (
                            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Popular
                            </span>
                        )}
                        {hasDiscount && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                                -{discountPercent}%
                            </span>
                        )}
                    </div>

                    {/* Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsFavorite(!isFavorite);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform"
                    >
                        <Heart
                            className={cn(
                                'w-4 h-4',
                                isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
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
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs"
                                >
                                    {dietaryIcons[restriction.toLowerCase()]}
                                    {restriction}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-auto pt-3">
                        <div className="flex items-center gap-3">
                            {/* Rating */}
                            {item.rating && (
                                <div className="flex items-center gap-1 text-sm">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-gray-900 dark:text-white">{item.rating.toFixed(1)}</span>
                                </div>
                            )}

                            {/* Prep Time */}
                            {item.prep_time && (
                                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>{item.prep_time}m</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Price */}
                            <div>
                                {hasDiscount && (
                                    <div className="text-sm text-gray-400 line-through">
                                        ${item.original_price?.toFixed(2)}
                                    </div>
                                )}
                                <div className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                                    ${item.price.toFixed(2)}
                                </div>
                            </div>

                            {/* Add Button */}
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
            className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:border-fuchsia-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-fuchsia-500/10 cursor-pointer"
            whileHover={{ y: -8 }}
            onClick={() => onQuickView?.(item)}
            layout
        >
            {/* Image */}
            <div className="relative h-56 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                {item.image_path ? (
                    <img
                        src={item.image_path || ''}
                        alt={item.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl">
                        🍽️
                    </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {item.is_popular && (
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold shadow-lg flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Popular
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold shadow-lg">
                            -{discountPercent}% OFF
                        </span>
                    )}
                </div>

                {/* Favorite Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsFavorite(!isFavorite);
                    }}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform shadow-lg z-10"
                >
                    <Heart
                        className={cn(
                            'w-5 h-5',
                            isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'
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
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs"
                            >
                                {dietaryIcons[restriction.toLowerCase()]}
                                {restriction}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col gap-1">
                        {/* Rating */}
                        {item.rating && (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
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
                            <div className="text-xs text-gray-400 line-through">
                                ${item.original_price?.toFixed(2)}
                            </div>
                        )}
                        <div className="text-xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                            ${item.price.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default MenuItemCard;
