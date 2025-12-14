/**
 * FoodDetailProvider - Global Food Detail Modal State Management
 * Provides a centralized way to open food detail modals from anywhere in the app
 *
 * Usage:
 * 1. Wrap your app with <FoodDetailProvider>
 * 2. Use the useFoodDetail() hook to access openFoodDetail(foodId)
 * 3. Food detail modal will automatically appear when triggered
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { FoodDetailModal } from '@/app/components/food/FoodDetailModal';
import { MenuItem } from '@/app/types/domain';
import { useCartStore } from '@/app/store/cart';

// ============================================================================
// Types
// ============================================================================

interface FoodDetailContextValue {
  /** Open the food detail modal for a specific food item */
  openFoodDetail: (foodId: number, options?: OpenFoodDetailOptions) => void;
  /** Close the food detail modal */
  closeFoodDetail: () => void;
  /** Currently selected food ID (null if modal is closed) */
  selectedFoodId: number | null;
  /** Whether the modal is currently open */
  isOpen: boolean;
}

interface OpenFoodDetailOptions {
  /** Whether to show the "Add to Cart" button (default: true) */
  showAddToCart?: boolean;
  /** Initial quantity for the add to cart (default: 1) */
  initialQuantity?: number;
  /** Callback when item is added to cart */
  onAddToCart?: (item: MenuItem, quantity: number) => void;
  /** Callback when favorite is toggled */
  onToggleFavorite?: (item: MenuItem) => void;
  /** Whether the item is currently favorited */
  isFavorite?: boolean;
}

interface FoodDetailProviderProps {
  children: React.ReactNode;
  /** Default handler for adding items to cart */
  defaultOnAddToCart?: (item: MenuItem, quantity: number) => void;
  /** Default handler for toggling favorites */
  defaultOnToggleFavorite?: (item: MenuItem) => void;
  /** Function to check if an item is favorited */
  checkIsFavorite?: (foodId: number) => boolean;
}

// ============================================================================
// Context
// ============================================================================

const FoodDetailContext = createContext<FoodDetailContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export function FoodDetailProvider({
  children,
  defaultOnAddToCart,
  defaultOnToggleFavorite,
  checkIsFavorite,
}: FoodDetailProviderProps) {
  // State
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<OpenFoodDetailOptions>({});

  // Get cart store for default add to cart behavior
  const cartStore = useCartStore();

  // Open modal handler
  const openFoodDetail = useCallback((foodId: number, opts: OpenFoodDetailOptions = {}) => {
    setSelectedFoodId(foodId);
    setOptions(opts);
    setIsOpen(true);
  }, []);

  // Close modal handler
  const closeFoodDetail = useCallback(() => {
    setIsOpen(false);
    // Delay clearing the food ID to allow exit animation
    setTimeout(() => {
      setSelectedFoodId(null);
      setOptions({});
    }, 300);
  }, []);

  // Default add to cart handler using cart store
  const handleAddToCart = useCallback((item: MenuItem, quantity: number) => {
    if (options.onAddToCart) {
      options.onAddToCart(item, quantity);
    } else if (defaultOnAddToCart) {
      defaultOnAddToCart(item, quantity);
    } else {
      // Use cart store directly
      cartStore.addItem({
        menu_item_id: item.id,
        menu_item: item,
        name: item.name,
        unit_price: item.price,
        quantity,
        image_path: item.image_path || undefined,
      });
    }
  }, [options.onAddToCart, defaultOnAddToCart, cartStore]);

  // Favorite toggle handler
  const handleToggleFavorite = useCallback((item: MenuItem) => {
    if (options.onToggleFavorite) {
      options.onToggleFavorite(item);
    } else if (defaultOnToggleFavorite) {
      defaultOnToggleFavorite(item);
    }
  }, [options.onToggleFavorite, defaultOnToggleFavorite]);

  // Check if item is favorite
  const isFavorite = useMemo(() => {
    if (options.isFavorite !== undefined) {
      return options.isFavorite;
    }
    if (checkIsFavorite && selectedFoodId) {
      return checkIsFavorite(selectedFoodId);
    }
    return false;
  }, [options.isFavorite, checkIsFavorite, selectedFoodId]);

  // Context value
  const contextValue = useMemo<FoodDetailContextValue>(() => ({
    openFoodDetail,
    closeFoodDetail,
    selectedFoodId,
    isOpen,
  }), [openFoodDetail, closeFoodDetail, selectedFoodId, isOpen]);

  return (
    <FoodDetailContext.Provider value={contextValue}>
      {children}

      {/* Global Food Detail Modal */}
      <FoodDetailModal
        foodId={selectedFoodId}
        isOpen={isOpen}
        onClose={closeFoodDetail}
        onAddToCart={handleAddToCart}
        onToggleFavorite={defaultOnToggleFavorite || options.onToggleFavorite ? handleToggleFavorite : undefined}
        isFavorite={isFavorite}
        showAddToCart={options.showAddToCart ?? true}
        initialQuantity={options.initialQuantity}
      />
    </FoodDetailContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access the food detail modal functionality
 * Must be used within a FoodDetailProvider
 *
 * @example
 * const { openFoodDetail } = useFoodDetail();
 *
 * // Open food detail modal
 * openFoodDetail(123);
 *
 * // Open with options
 * openFoodDetail(123, { showAddToCart: false });
 */
export function useFoodDetail(): FoodDetailContextValue {
  const context = useContext(FoodDetailContext);

  if (!context) {
    throw new Error('useFoodDetail must be used within a FoodDetailProvider');
  }

  return context;
}

// ============================================================================
// Utility Hook for checking if provider exists
// ============================================================================

/**
 * Safe version of useFoodDetail that returns null if provider doesn't exist
 * Useful for components that may or may not be within the provider
 */
export function useFoodDetailSafe(): FoodDetailContextValue | null {
  return useContext(FoodDetailContext);
}

export default FoodDetailProvider;
