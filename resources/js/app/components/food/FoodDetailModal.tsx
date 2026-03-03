/**
 * FoodDetailModal - Premium Food Detail Popup
 * A rich, reusable modal for displaying comprehensive food information
 * Works consistently across all pages where food items are displayed
 */

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Clock,
  Flame,
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  ChefHat,
  Leaf,
  AlertTriangle,
  Info,
  Utensils,
  Scale,
  Thermometer,
  Award,
  Check,
  XCircle,
  Timer,
  Users,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { MenuItem } from '@/types';
import { apiGet } from '@/app/utils/api';
import { RestaurantButton } from '@/Components/ui/RestaurantButton';
import { useModalHotkeys } from '@/app/hooks/useShortcuts';
import { useLanguage } from '@/app/context/LanguageContext';

// ============================================================================
// Types
// ============================================================================

interface FoodDetailModalProps {
  foodId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (item: MenuItem, quantity: number) => void;
  onToggleFavorite?: (item: MenuItem) => void;
  isFavorite?: boolean;
  initialQuantity?: number;
  showAddToCart?: boolean; // Hide for admin preview
}

// ============================================================================
// Constants
// ============================================================================

const SPICE_LEVELS = [
  { level: 0, icon: '🥛', color: 'text-gray-500', key: 'not_spicy' },
  { level: 1, icon: '🌶️', color: 'text-green-500', key: 'mild' },
  { level: 2, icon: '🌶️🌶️', color: 'text-yellow-500', key: 'medium' },
  { level: 3, icon: '🌶️🌶️🌶️', color: 'text-orange-500', key: 'hot' },
  { level: 4, icon: '🔥', color: 'text-red-500', key: 'very_hot' },
  { level: 5, icon: '💀', color: 'text-red-700', key: 'extreme' },
];

const ALLERGEN_ICONS: Record<string, string> = {
  nuts: '🥜',
  dairy: '🥛',
  gluten: '🌾',
  eggs: '🥚',
  soy: '🫘',
  shellfish: '🦐',
  fish: '🐟',
  sesame: '🌰',
};

// ============================================================================
// Component
// ============================================================================

export function FoodDetailModal({
  foodId,
  isOpen,
  onClose,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  initialQuantity = 0,
  showAddToCart = true,
}: FoodDetailModalProps) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = React.useState(initialQuantity || 1);
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'nutrition' | 'recipe'>('overview');

  // Fetch food detail when modal opens
  const {
    data: food,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<MenuItem | null>({
    queryKey: ['food-detail', foodId],
    queryFn: async () => {
      if (!foodId) return null;
      const response = await apiGet<{ data: MenuItem }>(`/menu-items/${foodId}`);
      return response?.data ?? null;
    },
    enabled: isOpen && !!foodId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity || 1);
      setImageLoaded(false);
      setActiveTab('overview');
    }
  }, [isOpen, initialQuantity]);

  useModalHotkeys(
    isOpen,
    {
      onClose,
    },
    {
      enableOnFormTags: true,
      enableOnContentEditable: true,
    }
  );

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleQuantityChange = useCallback((delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  }, []);

  const handleAddToCart = useCallback(() => {
    if (food && onAddToCart) {
      onAddToCart(food, quantity);
      onClose();
    }
  }, [food, quantity, onAddToCart, onClose]);

  // Get spice level info
  const spiceInfo = SPICE_LEVELS[food?.spice_level ?? 0] || SPICE_LEVELS[0];
  const spiceLabel = t(`components.food_detail.spice.${spiceInfo.key}`) as string;

  const dietaryIcons: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    vegetarian: { icon: <Leaf className="w-4 h-4" />, label: t('common.components.food_detail.dietary.vegetarian') as string, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    vegan: { icon: <Leaf className="w-4 h-4" />, label: t('common.components.food_detail.dietary.vegan') as string, color: 'text-green-700', bg: 'bg-green-200 dark:bg-green-900/50' },
    'gluten-free': { icon: '🌾', label: t('common.components.food_detail.dietary.gluten_free') as string, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    keto: { icon: '🥑', label: t('common.components.food_detail.dietary.keto_friendly') as string, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    halal: { icon: '🕌', label: t('common.components.food_detail.dietary.halal') as string, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    kosher: { icon: '✡️', label: t('common.components.food_detail.dietary.kosher') as string, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    'dairy-free': { icon: '🥛', label: t('common.components.food_detail.dietary.dairy_free') as string, color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/30' },
    'nut-free': { icon: '🥜', label: t('common.components.food_detail.dietary.nut_free') as string, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  };

  const availabilityLabels: Record<string, string> = {
    available: t('common.components.food_detail.availability.available') as string,
    low_stock: t('common.components.food_detail.availability.low_stock') as string,
    out_of_stock: t('common.components.food_detail.availability.out_of_stock') as string,
    seasonal: t('common.components.food_detail.availability.seasonal') as string,
  };

  // Get availability status styling
  const getAvailabilityStyle = (status?: string) => {
    switch (status) {
      case 'available':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: <Check className="w-4 h-4" /> };
      case 'low_stock':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: <AlertTriangle className="w-4 h-4" /> };
      case 'out_of_stock':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: <XCircle className="w-4 h-4" /> };
      case 'seasonal':
        return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', icon: <Info className="w-4 h-4" /> };
      default:
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: <Check className="w-4 h-4" /> };
    }
  };

  const availabilityStyle = getAvailabilityStyle(food?.availability_status);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Content - Bottom sheet on mobile, centered modal on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'relative w-full sm:max-w-2xl lg:max-w-3xl',
              'bg-white dark:bg-neutral-900',
              'sm:rounded-2xl rounded-t-3xl',
              'max-h-[95vh] sm:max-h-[90vh]',
              'overflow-hidden shadow-2xl',
              'flex flex-col'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="text-neutral-600 dark:text-neutral-400">{t('common.components.food_detail.loading')}</p>
              </div>
            )}

            {/* Error State */}
            {isError && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 px-6">
                <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  {t('common.components.food_detail.error_title')}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 text-center mb-4">
                  {(error as Error)?.message || t('common.components.food_detail.error_fallback')}
                </p>
                <RestaurantButton
                  variant="secondary"
                  onClick={() => refetch()}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  {t('common.components.food_detail.try_again')}
                </RestaurantButton>
              </div>
            )}

            {/* Content */}
            {food && !isLoading && !isError && (
              <>
                {/* Close Button - Floating */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  aria-label={t('common.components.food_detail.close') as string}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Favorite Button - Floating */}
                {onToggleFavorite && (
                  <motion.button
                    onClick={() => onToggleFavorite(food)}
                    className={cn(
                      'absolute top-4 left-4 z-10 p-2 rounded-full transition-colors',
                      isFavorite
                        ? 'bg-red-500 text-white'
                        : 'bg-black/50 text-white hover:bg-red-500'
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label={isFavorite ? t('common.components.food_detail.favorite_remove') as string : t('common.components.food_detail.favorite_add') as string}
                  >
                    <Heart className={cn('w-5 h-5', isFavorite && 'fill-current')} />
                  </motion.button>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Hero Image */}
                  <div className="relative aspect-[16/9] sm:aspect-[2/1] bg-neutral-200 dark:bg-neutral-800">
                    {food.image_path ? (
                      <>
                        <img
                          src={food.image_path}
                          alt={food.name}
                          className={cn(
                            'w-full h-full object-cover transition-opacity duration-500',
                            imageLoaded ? 'opacity-100' : 'opacity-0'
                          )}
                          onLoad={() => setImageLoaded(true)}
                        />
                        {!imageLoaded && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800">
                        <ChefHat className="w-20 h-20 text-primary-400" />
                      </div>
                    )}

                    {/* Badges on Image */}
                    <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                      {food.badge && (
                        <span className="px-3 py-1 rounded-full bg-secondary-500 text-white text-sm font-medium">
                          {food.badge}
                        </span>
                      )}
                      {food.is_popular && (
                        <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-sm font-medium flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {t('common.components.food_detail.badge_popular')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Body */}
                  <div className="p-6">
                    {/* Header Section */}
                    <div className="mb-6">
                      {/* Category & Rating Row */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                          {food.category?.name || t('common.components.food_detail.category_fallback')}
                        </span>
                        {food.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium text-neutral-900 dark:text-white">
                              {food.rating.toFixed(1)}
                            </span>
                            {food.reviews_count !== undefined && (
                              <span className="text-sm text-neutral-500">
                                {t('common.components.food_detail.reviews_count', { count: food.reviews_count.toString() })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mb-3">
                        {food.name}
                      </h2>

                      {/* Price */}
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                          {t('common.currency_symbol')}{food.price.toFixed(2)}
                        </span>
                        {food.original_price && food.original_price > food.price && (
                          <>
                            <span className="text-lg text-neutral-400 line-through">
                              {t('common.currency_symbol')}{food.original_price.toFixed(2)}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium">
                              {t('common.components.food_detail.price_off', { percent: Math.round(((food.original_price - food.price) / food.original_price) * 100).toString() })}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Availability Status */}
                      <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium', availabilityStyle.bg, availabilityStyle.text)}>
                        {availabilityStyle.icon}
                        <span className="capitalize">{availabilityLabels[food.availability_status || ''] || t('common.components.food_detail.availability.available')}</span>
                        {food.availability_note && (
                          <span className="text-xs opacity-75">- {food.availability_note}</span>
                        )}
                      </div>
                    </div>

                    {/* Quick Info Pills */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {food.total_time && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {food.total_time} {t('common.components.food_detail.units.min')}
                          </span>
                        </div>
                      )}
                      {food.calories && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <Flame className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {food.calories} {t('common.components.food_detail.units.cal')}
                          </span>
                        </div>
                      )}
                      {food.serving_size && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                          <Scale className="w-4 h-4 text-neutral-500" />
                          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {food.serving_size}
                          </span>
                        </div>
                      )}
                      {food.spice_level !== undefined && food.spice_level > 0 && (
                        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800', spiceInfo.color)}>
                          <span>{spiceInfo.icon}</span>
                          <span className="text-sm font-medium">{spiceLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* Dietary Tags */}
                    {(food.dietary_tags?.length || food.dietary_restrictions?.length) && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {(food.dietary_tags || food.dietary_restrictions || []).map((tag) => {
                          const tagInfo = dietaryIcons[tag.toLowerCase()];
                          if (!tagInfo) return null;
                          return (
                            <div
                              key={tag}
                              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium', tagInfo.bg, tagInfo.color)}
                            >
                              {typeof tagInfo.icon === 'string' ? <span>{tagInfo.icon}</span> : tagInfo.icon}
                              <span>{tagInfo.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Tab Navigation */}
                    <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-4">
                      {(['overview', 'nutrition', 'recipe'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={cn(
                            'flex-1 py-3 text-sm font-medium transition-colors relative',
                            activeTab === tab
                              ? 'text-primary-600 dark:text-primary-400'
                              : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                          )}
                        >
                          <span className="capitalize">{t(`components.food_detail.tabs.${tab}`)}</span>
                          {activeTab === tab && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                      {activeTab === 'overview' && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {/* Description */}
                          {food.description && (
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                                {t('common.components.food_detail.section.description')}
                              </h3>
                              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {food.description}
                              </p>
                            </div>
                          )}

                          {/* Ingredients */}
                          {food.ingredients && food.ingredients.length > 0 && (
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
                                <Utensils className="w-5 h-5 text-primary-500" />
                                {t('common.components.food_detail.section.ingredients')}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {food.ingredients.map((ingredient, idx) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-700 dark:text-neutral-300"
                                  >
                                    {ingredient}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Allergens Warning */}
                          {food.allergens && food.allergens.length > 0 && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {t('common.components.food_detail.section.allergen_warning')}
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {food.allergens.map((allergen, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-sm flex items-center gap-1"
                                  >
                                    {ALLERGEN_ICONS[allergen.toLowerCase()] && (
                                      <span>{ALLERGEN_ICONS[allergen.toLowerCase()]}</span>
                                    )}
                                    <span className="capitalize">{allergen}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'nutrition' && (
                        <motion.div
                          key="nutrition"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {food.nutrition ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                              {food.nutrition.calories !== undefined && (
                                <NutritionCard label={t('common.components.food_detail.nutrition.calories') as string} value={food.nutrition.calories} unit="kcal" color="orange" />
                              )}
                              {food.nutrition.protein !== undefined && (
                                <NutritionCard label={t('common.components.food_detail.nutrition.protein') as string} value={food.nutrition.protein} unit="g" color="blue" />
                              )}
                              {food.nutrition.carbs !== undefined && (
                                <NutritionCard label={t('common.components.food_detail.nutrition.carbs') as string} value={food.nutrition.carbs} unit="g" color="yellow" />
                              )}
                              {food.nutrition.fat !== undefined && (
                                <NutritionCard label={t('common.components.food_detail.nutrition.fat') as string} value={food.nutrition.fat} unit="g" color="red" />
                              )}
                              {food.nutrition.fiber !== undefined && (
                                <NutritionCard label={t('common.components.food_detail.nutrition.fiber') as string} value={food.nutrition.fiber} unit="g" color="green" />
                              )}
                              {food.nutrition.sodium !== undefined && (
                                <NutritionCard label={t('common.components.food_detail.nutrition.sodium') as string} value={food.nutrition.sodium} unit="mg" color="purple" />
                              )}
                              {food.nutrition.sugar !== undefined && (
                                <NutritionCard label={t('common.components.food_detail.nutrition.sugar') as string} value={food.nutrition.sugar} unit="g" color="pink" />
                              )}
                            </div>
                          ) : food.calories ? (
                            <div className="text-center py-8">
                              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                                <Flame className="w-10 h-10 text-orange-500" />
                              </div>
                              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                                {food.calories}
                              </p>
                              <p className="text-neutral-500">{t('common.components.food_detail.nutrition.per_serving')}</p>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-neutral-500">
                              <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>{t('common.components.food_detail.nutrition.unavailable')}</p>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === 'recipe' && (
                        <motion.div
                          key="recipe"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          {food.recipe ? (
                            <div className="space-y-6">
                              {/* Recipe Stats */}
                              <div className="flex flex-wrap gap-4">
                                {food.recipe.prep_time_minutes && (
                                  <div className="flex items-center gap-2">
                                    <Timer className="w-5 h-5 text-blue-500" />
                                    <div>
                                      <p className="text-xs text-neutral-500">{t('common.components.food_detail.recipe.prep_time')}</p>
                                      <p className="font-medium text-neutral-900 dark:text-white">
                                        {food.recipe.prep_time_minutes} {t('common.components.food_detail.units.min')}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {food.recipe.cook_time_minutes && (
                                  <div className="flex items-center gap-2">
                                    <Thermometer className="w-5 h-5 text-red-500" />
                                    <div>
                                      <p className="text-xs text-neutral-500">{t('common.components.food_detail.recipe.cook_time')}</p>
                                      <p className="font-medium text-neutral-900 dark:text-white">
                                        {food.recipe.cook_time_minutes} {t('common.components.food_detail.units.min')}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                {food.recipe.servings && (
                                  <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-green-500" />
                                    <div>
                                      <p className="text-xs text-neutral-500">{t('common.components.food_detail.recipe.servings')}</p>
                                      <p className="font-medium text-neutral-900 dark:text-white">
                                        {food.recipe.servings}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Instructions */}
                              {food.recipe.instructions && (
                                <div>
                                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                                    {t('common.components.food_detail.section.instructions')}
                                  </h3>
                                  <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
                                      {food.recipe.instructions}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-neutral-500">
                              <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p>{t('common.components.food_detail.recipe.unavailable')}</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Sticky Footer - Add to Cart */}
                {showAddToCart && food.is_available !== false && (
                  <div className="sticky bottom-0 p-4 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 rounded-full p-1">
                        <button
                          onClick={() => handleQuantityChange(-1)}
                          disabled={quantity <= 1}
                          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-neutral-900 dark:text-white">
                          {quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(1)}
                          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Add to Cart Button */}
                      <RestaurantButton
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        onClick={handleAddToCart}
                        leftIcon={<ShoppingCart className="w-5 h-5" />}
                        appetiteMode
                      >
                        {t('common.components.food_detail.add_to_cart', { total: `${t('common.currency_symbol')}${(food.price * quantity).toFixed(2)}` })}
                      </RestaurantButton>
                    </div>
                  </div>
                )}

                {/* Out of Stock Footer */}
                {food.is_available === false && (
                  <div className="sticky bottom-0 p-4 bg-neutral-100 dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-center gap-2 text-neutral-500">
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">{t('common.components.food_detail.unavailable')}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function NutritionCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: 'orange' | 'blue' | 'yellow' | 'red' | 'green' | 'purple' | 'pink';
}) {
  const colorClasses = {
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
  };

  return (
    <div className={cn('p-4 rounded-xl text-center', colorClasses[color])}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-75">{unit}</p>
      <p className="text-sm font-medium mt-1">{label}</p>
    </div>
  );
}

export default FoodDetailModal;
