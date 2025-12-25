import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useCategories, useMenuItems } from '@/app/hooks/useMenu';
import { useFavorites } from '@/app/hooks/useFavorites';
import { MenuItem } from '@/app/types/domain';
import MenuItemCard from '@/app/components/customer/MenuItemCard';
import CategoryFilter from '@/app/components/customer/CategoryFilter';
import MenuSkeleton from '@/app/components/customer/MenuSkeleton';
import { useCartStore } from '@/app/store/cart';
import { toastSuccess, toastError } from '@/app/utils/toast';
import {
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
  ArrowUpDown,
  X,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import Button from '@/app/components/ui/Button';

type SortOption = 'popular' | 'price-low' | 'price-high' | 'name' | 'newest';
type LayoutOption = 'grid' | 'list';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'newest', label: 'Newest First' }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const ITEMS_PER_PAGE = 12;

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [layout, setLayout] = useState<LayoutOption>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categories, isLoading: catsLoading } = useCategories(true);
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems({
    category_id: selectedCategory,
    search: searchQuery || undefined
  });

  const { favoriteIds, toggleFavorite } = useFavorites();
  const cart = useCartStore();

  const handleToggleFavorite = async (itemId: number) => {
    try {
      await toggleFavorite(itemId);
    } catch (error) {
      console.error('Favorite toggle failed:', error);
      toastError('Failed to update favorites');
    }
  };

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    if (!menuItems) return [];

    let filtered = [...menuItems];

    if (selectedCategory) {
      filtered = filtered.filter(
        (item) => item.category_id === selectedCategory
      );
    }

    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((item) =>
        (item.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => {
          if (a.is_popular && !b.is_popular) return -1;
          if (!a.is_popular && b.is_popular) return 1;
          return (b.rating || 0) - (a.rating || 0);
        });
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        );
        break;
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        break;
    }

    return filtered;
  }, [menuItems, selectedCategory, searchQuery, sortBy]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  // Pagination calculations
  const totalItems = processedItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = processedItems.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = (item: MenuItem) => {
    cart.addItem({
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: 1,
      image_path: item.image_path || undefined,
    });
    toastSuccess(`${item.name} added to cart`);
  };

  const clearAllFilters = () => {
    setSelectedCategory(undefined);
    setSearchQuery('');
    setSortBy('popular');
  };

  const activeFilterCount = (selectedCategory ? 1 : 0) + (searchQuery ? 1 : 0);

  const isLoading = catsLoading || itemsLoading;
  const hasItems = processedItems && processedItems.length > 0;

  return (
    <CustomerLayout>
      <Head>
        <title>Menu - NKH Restaurant | Browse Our Delicious Selection</title>
        <meta name="description" content="Browse our full menu of delicious dishes. Filter by category, search for your favorites, and order online for delivery or pickup." />
      </Head>

      <div className="space-y-3 sm:space-y-4">
        {/* Filter Section - Only sticky on desktop */}
        <div className="sm:sticky sm:top-[69px] sm:z-30 sm:pb-2">
          {/* Desktop: Premium Filter Bar */}
          <div className="hidden sm:block bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 dark:from-gray-950/95 dark:via-gray-900/95 dark:to-gray-950/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5 shadow-xl">
            {/* Top Row: Search, Sort, Layout Toggle, Cart */}
            <div className="flex items-center gap-4">
              {/* Search Bar - Larger */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 rounded-xl bg-gray-800/80 border border-gray-600/50 text-base text-white placeholder:text-gray-400 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              {/* Sort Dropdown - Larger */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-5 py-3 rounded-xl bg-gray-800/80 border border-gray-600/50 text-base text-gray-200 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Item Count */}
              {!isLoading && (
                <p className="text-base text-gray-400">
                  <span className="font-semibold text-white">{totalItems}</span> items
                  {selectedCategory && ` • ${categories?.find((c) => c.id === selectedCategory)?.name}`}
                </p>
              )}

              {/* Layout Toggle - Larger */}
              <div className="flex items-center gap-1 bg-gray-800/80 rounded-xl p-1.5 border border-gray-600/50">
                <button
                  onClick={() => setLayout('grid')}
                  className={cn(
                    'p-2.5 rounded-lg transition-all',
                    layout === 'grid'
                      ? 'bg-fuchsia-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  )}
                  title="Grid View"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={cn(
                    'p-2.5 rounded-lg transition-all',
                    layout === 'list'
                      ? 'bg-fuchsia-600 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  )}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Button */}
              {cart.items.length > 0 && (
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ShoppingBag className="w-5 h-5" />}
                  onClick={() => window.location.href = '/cart'}
                >
                  Cart ({cart.items.length})
                </Button>
              )}
            </div>

            {/* Category Filter - Scrollable */}
            <div className="mt-4 overflow-x-auto scrollbar-hide">
              <CategoryFilter
                categories={categories || []}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                loading={catsLoading}
              />
            </div>
          </div>

          {/* Mobile: Compact Filter Bar */}
          <div className="sm:hidden">
            {/* Search + Filter Row */}
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-fuchsia-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowMobileFilters(true)}
                className={cn(
                  "relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl border transition-all flex-shrink-0",
                  activeFilterCount > 0
                    ? "bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-600 dark:text-fuchsia-400"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                )}
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-fuchsia-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Category Filter - Scrollable below search */}
            <div className="mt-2 -mx-4 px-4 overflow-x-auto scrollbar-hide">
              <CategoryFilter
                categories={categories || []}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                loading={catsLoading}
              />
            </div>
          </div>
        </div>

        {/* Mobile Results Summary & Layout Toggle */}
        {!isLoading && (
          <motion.div
            className="flex items-center justify-between gap-2 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {hasItems ? (
                <>
                  <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> items
                  {selectedCategory && ` • ${categories?.find((c) => c.id === selectedCategory)?.name}`}
                </>
              ) : (
                'No items found'
              )}
            </p>

            <div className="flex items-center gap-2">
              {/* Layout Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setLayout('grid')}
                  className={cn(
                    'p-1.5 rounded transition-all',
                    layout === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                  title="Grid View"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={cn(
                    'p-1.5 rounded transition-all',
                    layout === 'list'
                      ? 'bg-white dark:bg-gray-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile Cart Button - Fixed Bottom */}
        {cart.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-4 right-4 z-50 sm:hidden"
          >
            <Button
              variant="primary"
              size="lg"
              leftIcon={<ShoppingBag className="w-5 h-5" />}
              onClick={() => window.location.href = '/cart'}
              className="w-full shadow-xl"
            >
              View Cart ({cart.items.length} items)
            </Button>
          </motion.div>
        )}

        {/* Menu Items Grid/List */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <MenuSkeleton count={6} layout={layout} />
          ) : hasItems ? (
            <motion.div
              key={`${layout}-${sortBy}-${selectedCategory}-${searchQuery}-${currentPage}`}
              className={cn(
                layout === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5'
                  : 'flex flex-col gap-3 sm:gap-4'
              )}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {paginatedItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants} layout>
                  <MenuItemCard
                    item={item}
                    onAddToCart={handleAddToCart}
                    layout={layout}
                    isFavorite={favoriteIds.includes(item.id)}
                    onToggleFavorite={() => handleToggleFavorite(item.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                No items found
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Try a different search or category
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
              >
                Clear filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {!isLoading && hasItems && totalPages > 1 && (
          <motion.div
            className="py-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between gap-2">
              {/* Previous */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all",
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Mobile: Simple Page Indicator */}
              <span className="sm:hidden text-sm font-medium text-gray-900 dark:text-white">
                {currentPage} / {totalPages}
              </span>

              {/* Desktop Page Numbers */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-sm font-medium transition-all",
                        pageNum === currentPage
                          ? "bg-fuchsia-600 text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-all",
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Page Info */}
            <p className="hidden sm:block text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
              Page {currentPage} of {totalPages} • {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} items
            </p>
          </motion.div>
        )}
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowMobileFilters(false)}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl z-50 max-h-[80vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters & Sort</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Sort Options */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Sort By
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowMobileFilters(false);
                        }}
                        className={cn(
                          "px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-all border",
                          sortBy === option.value
                            ? "bg-fuchsia-50 dark:bg-fuchsia-900/20 border-fuchsia-300 dark:border-fuchsia-700 text-fuchsia-700 dark:text-fuchsia-400"
                            : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Filters */}
                {(selectedCategory || searchQuery) && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Active Filters</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategory && (
                        <button
                          onClick={() => setSelectedCategory(undefined)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 text-sm font-medium"
                        >
                          {categories?.find((c) => c.id === selectedCategory)?.name}
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 text-sm font-medium"
                        >
                          Search: "{searchQuery}"
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Clear All */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      clearAllFilters();
                      setShowMobileFilters(false);
                    }}
                    className="w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    Clear all filters
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </CustomerLayout>
  );
}
