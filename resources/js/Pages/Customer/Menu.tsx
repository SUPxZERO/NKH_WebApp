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
  ChevronRight
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

const ITEMS_PER_PAGE = 16;

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [layout, setLayout] = useState<LayoutOption>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categories, isLoading: catsLoading } = useCategories(true); // Get only sub-categories
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems({
    category_id: selectedCategory,
    search: searchQuery || undefined
  });


  const { favoriteIds, toggleFavorite } = useFavorites();
  const cart = useCartStore();

  const handleToggleFavorite = async (itemId: number) => {
    try {
      await toggleFavorite(itemId);
      // Success is handled by hook invalidation, but we can toast
      // const isFav = favoriteIds.includes(itemId);
      // toastSuccess(isFav ? 'Removed from favorites' : 'Added to favorites'); // Hook handles state update
    } catch (error) {
      console.error('Favorite toggle failed:', error);
      toastError('Failed to update favorites');
    }
  };

  // Filtered and sorted items
  const processedItems = useMemo(() => {
    if (!menuItems) return [];

    let filtered = [...menuItems];

    // 👉 FILTER BY CATEGORY
    if (selectedCategory) {
      filtered = filtered.filter(
        (item) => item.category_id === selectedCategory
      );
    }

    // 👉 FILTER BY SEARCH
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter((item) =>
        (item.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 👉 SORT
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

  // Quick view is now handled automatically by MenuItemCard via FoodDetailProvider
  // The global FoodDetailModal opens when clicking on any food card

  const isLoading = catsLoading || itemsLoading;
  const hasItems = processedItems && processedItems.length > 0;

  return (
    <CustomerLayout>
      <Head>
        <title>Menu - NKH Restaurant | Browse Our Delicious Selection</title>
        <meta name="description" content="Browse our full menu of delicious dishes. Filter by category, search for your favorites, and order online for delivery or pickup." />
      </Head>

      <div className="space-y-6">
        {/* Header Section */}
        <motion.div
          className="relative rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-pink-600 dark:from-fuchsia-700 dark:via-purple-700 dark:to-pink-700" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />

          {/* Content */}
          {/* <div className="relative z-10 px-6 py-10 md:py-14 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 mb-4"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm font-medium text-white">Fresh & Delicious</span>
            </motion.div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              Explore Our Menu
            </h1>
            <p className="text-base text-white/80 max-w-lg mx-auto">
              Discover our delicious selection of freshly prepared dishes
            </p>
          </div> */}
        </motion.div>

        {/* Search & Filters Bar */}
        <motion.div
          className="sticky top-20 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 -mx-2 px-4 py-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="flex flex-col gap-4">
            {/* Search & Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-fuchsia-500 dark:focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 w-full sm:w-auto">
                {/* Sort Dropdown - Full width on mobile */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-fuchsia-500 dark:focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all outline-none cursor-pointer text-base"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Layout Toggle - Larger touch targets */}
                <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1">
                  <button
                    onClick={() => setLayout('grid')}
                    className={cn(
                      'p-2.5 sm:p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center',
                      layout === 'grid'
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className={cn(
                      'p-2.5 sm:p-2 rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center',
                      layout === 'list'
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <CategoryFilter
              categories={categories || []}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              loading={catsLoading}
            />

            {/* Active Filters */}
            {(selectedCategory || searchQuery) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(undefined)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 text-sm font-medium hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/50 transition-colors border border-fuchsia-200 dark:border-fuchsia-800"
                  >
                    {categories?.find((c) => c.id === selectedCategory)?.name}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 text-sm font-medium hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/50 transition-colors border border-fuchsia-200 dark:border-fuchsia-800"
                  >
                    Search: "{searchQuery}"
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedCategory(undefined);
                    setSearchQuery('');
                  }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Results Summary */}
        {!isLoading && (
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-gray-600 dark:text-gray-400">
              {hasItems ? (
                <>
                  Showing <strong className="text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(endIndex, totalItems)}</strong> of <strong className="text-gray-900 dark:text-white">{totalItems}</strong> {totalItems === 1 ? 'item' : 'items'}
                  {selectedCategory && ` in ${categories?.find((c) => c.id === selectedCategory)?.name}`}
                  {searchQuery && ` matching "${searchQuery}"`}
                </>
              ) : (
                'No items found'
              )}
            </p>

            {cart.items.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ShoppingBag className="w-4 h-4" />}
                onClick={() => window.location.href = '/cart'}
              >
                Cart ({cart.items.length})
              </Button>
            )}
          </motion.div>
        )}

        {/* Menu Items Grid/List */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <MenuSkeleton count={8} />
          ) : hasItems ? (
            <motion.div
              key={`${layout}-${sortBy}-${selectedCategory}-${searchQuery}-${currentPage}`}
              className={cn(
                layout === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-4'
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
              className="text-center py-16 px-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Search className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No items found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                We couldn't find any items matching your criteria. Try adjusting your filters or search query.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(undefined);
                  setSearchQuery('');
                }}
              >
                Clear all filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {!isLoading && hasItems && totalPages > 1 && (
          <motion.div
            className="mt-8 py-6 border-t border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Previous Page */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "group flex items-center gap-3 px-5 py-3 rounded-xl border transition-all",
                  currentPage === 1
                    ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20"
                )}
              >
                <ChevronLeft className={cn(
                  "w-5 h-5 transition-colors",
                  currentPage === 1
                    ? "text-gray-400 dark:text-gray-600"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400"
                )} />
                <div className="text-left">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Previous</p>
                  <p className={cn(
                    "font-semibold transition-colors",
                    currentPage === 1
                      ? "text-gray-400 dark:text-gray-600"
                      : "text-gray-900 dark:text-white group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400"
                  )}>
                    Page {currentPage - 1 || 1}
                  </p>
                </div>
              </button>

              {/* Page Numbers - Simplified on mobile */}
              <div className="hidden sm:flex items-center gap-2">
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => goToPage(1)}
                      className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-all font-medium"
                    >
                      1
                    </button>
                    {currentPage > 4 && (
                      <span className="text-gray-400 dark:text-gray-600 px-1">...</span>
                    )}
                  </>
                )}

                {/* Page numbers around current */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                  .map(page => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={cn(
                        "w-10 h-10 rounded-lg font-medium transition-all",
                        page === currentPage
                          ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg shadow-fuchsia-500/25"
                          : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:text-fuchsia-600 dark:hover:text-fuchsia-400"
                      )}
                    >
                      {page}
                    </button>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="text-gray-400 dark:text-gray-600 px-1">...</span>
                    )}
                    <button
                      onClick={() => goToPage(totalPages)}
                      className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-all font-medium"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Page Indicator */}
              <div className="sm:hidden px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span>
                <span className="text-gray-500 dark:text-gray-400"> / {totalPages}</span>
              </div>

              {/* Next Page */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  "group flex items-center gap-3 px-5 py-3 rounded-xl border transition-all",
                  currentPage === totalPages
                    ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20"
                )}
              >
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Next</p>
                  <p className={cn(
                    "font-semibold transition-colors",
                    currentPage === totalPages
                      ? "text-gray-400 dark:text-gray-600"
                      : "text-gray-900 dark:text-white group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400"
                  )}>
                    Page {currentPage + 1 > totalPages ? totalPages : currentPage + 1}
                  </p>
                </div>
                <ChevronRight className={cn(
                  "w-5 h-5 transition-colors",
                  currentPage === totalPages
                    ? "text-gray-400 dark:text-gray-600"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400"
                )} />
              </button>
            </div>

            {/* Page Info */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page <span className="font-semibold text-gray-900 dark:text-white">{currentPage}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalPages}</span>
                <span className="mx-2">•</span>
                Showing <span className="font-semibold text-gray-900 dark:text-white">{startIndex + 1}-{Math.min(endIndex, totalItems)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> items
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </CustomerLayout>
  );
}
