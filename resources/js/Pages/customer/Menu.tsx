import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useCategories, useMenuItems } from '@/app/hooks/useMenu';
import { MenuItem } from '@/app/types/domain';
import MenuItemCard from '@/app/components/customer/MenuItemCard';
import CategoryFilter from '@/app/components/customer/CategoryFilter';
import MenuSkeleton from '@/app/components/customer/MenuSkeleton';
import { useCartStore } from '@/app/store/cart';
import { toastSuccess } from '@/app/utils/toast';
import {
  Search,
  SlidersHorizontal,
  Grid3x3,
  List,
  ArrowUpDown,
  X,
  ShoppingBag
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

export default function Menu() {
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [layout, setLayout] = useState<LayoutOption>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems({
    category_id: selectedCategory,
    search: searchQuery || undefined
  });

  const cart = useCartStore();

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

  const handleAddToCart = (item: MenuItem) => {
    cart.addItem({
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: 1
    });
    toastSuccess(`${item.name} added to cart`);
  };

  const handleQuickView = (item: MenuItem) => {
    // TODO: Implement quick view modal
    console.log('Quick view:', item);
  };

  const isLoading = catsLoading || itemsLoading;
  const hasItems = processedItems && processedItems.length > 0;

  return (
    <CustomerLayout>
      <Head>
        <title>Menu - NKH Restaurant | Browse Our Delicious Selection</title>
        <meta name="description" content="Browse our full menu of delicious dishes. Filter by category, search for your favorites, and order online for delivery or pickup." />
      </Head>

      <div className="space-y-8">
        {/* Header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
            Our Menu
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Discover our delicious selection of freshly prepared dishes
          </p>
        </motion.div>

        {/* Search & Filters Bar */}
        <motion.div
          className="sticky top-20 z-30 bg-gradient-to-br from-slate-50/95 via-white/95 to-fuchsia-50/95 dark:from-gray-900/95 dark:via-gray-800/95 dark:to-purple-900/95 backdrop-blur-xl border-b border-white/20 -mx-4 px-4 py-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="flex flex-col gap-4">
            {/* Search & Actions Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/60 dark:bg-white/5 border border-white/20 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 transition-all outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-3 rounded-xl bg-white/60 dark:bg-white/5 border border-white/20 focus:border-fuchsia-500/50 focus:ring-2 focus:ring-fuchsia-500/20 transition-all outline-none cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-gray-600 dark:text-gray-400">
                      {option.label}
                    </option>
                  ))}
                </select>

                {/* Layout Toggle */}
                <div className="flex rounded-xl bg-white/60 dark:bg-white/5 border border-white/20 p-1">
                  <button
                    onClick={() => setLayout('grid')}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      layout === 'grid'
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10'
                    )}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setLayout('list')}
                    className={cn(
                      'p-2 rounded-lg transition-all',
                      layout === 'list'
                        ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10'
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
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400 text-sm hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/30 transition-colors"
                  >
                    {categories?.find((c) => c.id === selectedCategory)?.name}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-400 text-sm hover:bg-fuchsia-200 dark:hover:bg-fuchsia-900/30 transition-colors"
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
                  className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
                  Showing <strong className="text-gray-900 dark:text-white">{processedItems.length}</strong> {processedItems.length === 1 ? 'item' : 'items'}
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
              key={`${layout}-${sortBy}-${selectedCategory}-${searchQuery}`}
              className={cn(
                layout === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-4'
              )}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {processedItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants} layout>
                  <MenuItemCard
                    item={item}
                    onAddToCart={handleAddToCart}
                    onQuickView={handleQuickView}
                    layout={layout}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No items found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCategory(undefined);
                  setSearchQuery('');
                }}
              >
                Clear filters
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CustomerLayout>
  );
}
