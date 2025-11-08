/**
 * 🍽️ FoodCard - Revolutionary Food Presentation Component
 * Appetite-inducing food cards that make users hungry just by looking at them
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Star, 
  Clock, 
  Flame, 
  Leaf, 
  Award,
  Plus,
  Minus,
  ShoppingCart,
  Info,
  ChefHat,
  Zap
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { MenuItem } from '@/app/types/domain';
import { RestaurantButton } from '@/Components/ui/RestaurantButton';
import { animationVariants } from '@/design-system/animations';

export type FoodCardVariant = 'grid' | 'list' | 'featured' | 'special' | 'compact';

interface FoodCardProps {
  item: MenuItem;
  variant?: FoodCardVariant;
  showNutrition?: boolean;
  showIngredients?: boolean;
  appetiteMode?: boolean;
  chefRecommended?: boolean;
  isPopular?: boolean;
  isFavorite?: boolean;
  quantity?: number;
  onAddToCart?: (item: MenuItem, quantity: number) => void;
  onRemoveFromCart?: (item: MenuItem) => void;
  onToggleFavorite?: (item: MenuItem) => void;
  onViewDetails?: (item: MenuItem) => void;
  className?: string;
}

// 🎨 Variant Styles
const variantStyles: Record<FoodCardVariant, string> = {
  grid: 'w-full max-w-sm',
  list: 'w-full flex-row',
  featured: 'w-full max-w-md',
  special: 'w-full max-w-lg',
  compact: 'w-full max-w-xs',
};

// 🌶️ Spice Level Indicators
const spiceLevels = {
  0: { icon: '🥛', label: 'Mild', color: 'text-green-500' },
  1: { icon: '🌶️', label: 'Medium', color: 'text-yellow-500' },
  2: { icon: '🌶️🌶️', label: 'Hot', color: 'text-orange-500' },
  3: { icon: '🌶️🌶️🌶️', label: 'Very Hot', color: 'text-red-500' },
};

// 🥗 Dietary Restriction Icons
const dietaryIcons = {
  vegetarian: { icon: <Leaf className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-100' },
  vegan: { icon: <Leaf className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-200' },
  glutenFree: { icon: '🌾', color: 'text-amber-500', bg: 'bg-amber-100' },
  keto: { icon: '🥑', color: 'text-emerald-500', bg: 'bg-emerald-100' },
  halal: { icon: '🕌', color: 'text-blue-500', bg: 'bg-blue-100' },
};

export function FoodCard({
  item,
  variant = 'grid',
  showNutrition = false,
  showIngredients = false,
  appetiteMode = true,
  chefRecommended = false,
  isPopular = false,
  isFavorite = false,
  quantity = 0,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  onViewDetails,
  className,
}: FoodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // 🎭 Animation variants based on variant
  const cardAnimation = variant === 'featured' || variant === 'special' 
    ? animationVariants.foodHover 
    : animationVariants.scaleIn;

  // 🎨 Dynamic styling based on variant
  const cardStyles = cn(
    'relative group cursor-pointer',
    'bg-white/90 dark:bg-neutral-800/90 backdrop-blur-xl',
    'border border-primary-100 dark:border-primary-800/30',
    'rounded-3xl overflow-hidden',
    'shadow-soft hover:shadow-appetite',
    'transition-all duration-500 ease-out',
    appetiteMode && 'hover:shadow-glow',
    variant === 'list' && 'flex items-center',
    variantStyles[variant],
    className
  );

  const imageContainerStyles = cn(
    'relative overflow-hidden food-image',
    variant === 'list' ? 'w-32 h-32 flex-shrink-0' : 'aspect-[4/3] w-full',
    variant === 'featured' && 'aspect-[16/10]',
    variant === 'special' && 'aspect-[3/2]'
  );

  return (
    <motion.div
      className={cardStyles}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      variants={cardAnimation}
      initial="initial"
      animate="animate"
      whileHover="hover"
      layout
    >
      {/* 🖼️ Food Image Container */}
      <div className={imageContainerStyles}>
        {/* 📸 Food Image */}
        {item.image_url ? (
          <motion.img
            src={item.image_url}
            alt={item.name}
            className={cn(
              'w-full h-full object-cover transition-all duration-700',
              imageLoaded ? 'opacity-100' : 'opacity-0',
              appetiteMode && 'group-hover:scale-110 group-hover:saturate-125'
            )}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <ChefHat className="w-12 h-12 text-primary-400" />
          </div>
        )}

        {/* 🎨 Appetite Overlay */}
        <div className="absolute inset-0 bg-appetite-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* 🏷️ Badges Container */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {/* Chef Recommended Badge */}
          {chefRecommended && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-secondary-600/90 backdrop-blur-sm"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <ChefHat className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">Chef's Choice</span>
            </motion.div>
          )}

          {/* Popular Badge */}
          {isPopular && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/90 backdrop-blur-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              <Flame className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">Popular</span>
            </motion.div>
          )}

          {/* Quick Prep Badge */}
          {item.prep_time && item.prep_time <= 10 && (
            <motion.div
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
            >
              <Zap className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">Quick</span>
            </motion.div>
          )}
        </div>

        {/* 💝 Favorite & Rating Container */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {/* Favorite Button */}
          <motion.button
            className={cn(
              'p-2 rounded-full backdrop-blur-sm transition-all duration-300',
              isFavorite 
                ? 'bg-red-500/90 text-white' 
                : 'bg-white/90 text-neutral-600 hover:bg-red-50 hover:text-red-500'
            )}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onToggleFavorite?.(item);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
          </motion.button>

          {/* Rating Display */}
          {item.rating && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
              <Star className="w-3 h-3 text-yellow-400 fill-current" />
              <span className="text-xs font-medium text-white">{item.rating}</span>
            </div>
          )}
        </div>

        {/* 🛒 Quick Add Button (Hover State) */}
        <AnimatePresence>
          {isHovered && variant !== 'list' && (
            <motion.div
              className="absolute bottom-3 right-3"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <RestaurantButton
                size="sm"
                variant="primary"
                appetiteMode
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onAddToCart?.(item, 1);
                }}
                className="rounded-full w-10 h-10 p-0"
              >
                <Plus className="w-4 h-4" />
              </RestaurantButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 📝 Content Container */}
      <div className={cn(
        'p-4 flex-1',
        variant === 'list' && 'flex flex-col justify-between'
      )}>
        {/* 🏷️ Category & Prep Time */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
            {item.category?.name || 'Main Course'}
          </span>
          {item.prep_time && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <Clock className="w-3 h-3" />
              <span>{item.prep_time}min</span>
            </div>
          )}
        </div>

        {/* 🍽️ Food Name */}
        <h3 className={cn(
          'font-display font-semibold text-neutral-900 dark:text-neutral-100 mb-2',
          variant === 'featured' ? 'text-xl' : 'text-lg',
          variant === 'compact' && 'text-base'
        )}>
          {item.name}
        </h3>

        {/* 📖 Description */}
        {item.description && (
          <p className={cn(
            'text-sm text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2',
            variant === 'list' && 'line-clamp-1'
          )}>
            {item.description}
          </p>
        )}

        {/* 🥗 Dietary Restrictions */}
        {item.dietary_restrictions && (
          <div className="flex items-center gap-1 mb-3">
            {item.dietary_restrictions.map((restriction) => {
              const dietary = dietaryIcons[restriction as keyof typeof dietaryIcons];
              return dietary ? (
                <div
                  key={restriction}
                  className={cn(
                    'flex items-center justify-center w-6 h-6 rounded-full text-xs',
                    dietary.bg,
                    dietary.color
                  )}
                  title={restriction}
                >
                  {typeof dietary.icon === 'string' ? dietary.icon : dietary.icon}
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* 💰 Price & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              ${item.price}
            </span>
            {item.original_price && item.original_price > item.price && (
              <span className="text-sm text-neutral-400 line-through">
                ${item.original_price}
              </span>
            )}
          </div>

          {/* 🛒 Cart Controls */}
          <div className="flex items-center gap-2">
            {quantity > 0 ? (
              <div className="flex items-center gap-2">
                <RestaurantButton
                  size="sm"
                  variant="secondary"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (quantity === 1) {
                      onRemoveFromCart?.(item);
                    } else {
                      onAddToCart?.(item, -1);
                    }
                  }}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Minus className="w-3 h-3" />
                </RestaurantButton>
                
                <span className="text-sm font-medium min-w-[1.5rem] text-center">
                  {quantity}
                </span>
                
                <RestaurantButton
                  size="sm"
                  variant="primary"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    onAddToCart?.(item, 1);
                  }}
                  className="w-8 h-8 p-0 rounded-full"
                >
                  <Plus className="w-3 h-3" />
                </RestaurantButton>
              </div>
            ) : (
              <RestaurantButton
                size="sm"
                variant="primary"
                appetiteMode
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onAddToCart?.(item, 1);
                }}
                leftIcon={<ShoppingCart className="w-4 h-4" />}
              >
                Add
              </RestaurantButton>
            )}
          </div>
        </div>

        {/* 📊 Additional Info Button */}
        {(showNutrition || showIngredients) && (
          <motion.button
            className="mt-3 flex items-center gap-2 text-xs text-primary-600 hover:text-primary-700 transition-colors"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            whileHover={{ x: 2 }}
          >
            <Info className="w-3 h-3" />
            <span>View Details</span>
          </motion.button>
        )}
      </div>

      {/* 📋 Expandable Details */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="border-t border-primary-100 dark:border-primary-800/30 p-4 bg-primary-50/50 dark:bg-primary-900/20"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {showIngredients && item.ingredients && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Ingredients
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {item.ingredients.join(', ')}
                </p>
              </div>
            )}
            
            {showNutrition && item.nutrition && (
              <div>
                <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Nutrition (per serving)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Calories: {item.nutrition.calories}</div>
                  <div>Protein: {item.nutrition.protein}g</div>
                  <div>Carbs: {item.nutrition.carbs}g</div>
                  <div>Fat: {item.nutrition.fat}g</div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🎭 Click Handler for Details */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => onViewDetails?.(item)}
      />
    </motion.div>
  );
}

export default FoodCard;
