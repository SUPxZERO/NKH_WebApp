
import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import OrderingModal from '@/app/components/customer/OrderingModal';
import { useCartStore } from '@/app/store/cart';
import { toastSuccess } from '@/app/utils/toast';
import { useTableSession } from '@/app/hooks/useTableSession';
import {
  Truck,
  Store,
  Clock,
  Star,
  ChefHat,
  Heart,
  Zap,
  ArrowRight,
  Search,
  Plus,
  Quote,
  Utensils
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { MenuItem } from '@/app/types/domain';
import {
  BrandDivider,
  GlowCard,
  BrandBlob
} from '@/Components/brand';
import { useTranslation } from '@/app/hooks/useTranslation';

// Types
interface FeaturedItem extends MenuItem { }

interface CategoryCard {
  id: number;
  name: string;
  slug: string;
  icon: string;
  count: number;
  color: string;
}

interface Testimonial {
  id: number;
  customer_name: string;
  customer_role: string;
  content: string;
  rating: number;
  avatar: string;
}

interface HomeStats {
  totalItems: number;
  averageRating: number;
  totalCustomers: number;
  averageDeliveryTime: number;
}

interface HomeProps {
  featuredItems: FeaturedItem[];
  categories: CategoryCard[];
  testimonials: Testimonial[];
  stats: HomeStats;
}

const features = [
  {
    icon: Zap,
    key: 'fast_delivery', // key for translation
    color: 'from-amber-500 to-orange-500' // Adjusted to complimentary colors
  },
  {
    icon: ChefHat,
    key: 'fresh_ingredients',
    color: 'from-emerald-500 to-green-500'
  },
  {
    icon: Heart,
    key: 'made_with_love',
    color: 'from-rose-500 to-pink-500'
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

// Internal Featured Carousel Component
const FeaturedCarousel = ({ items, onItemClick }: { items: FeaturedItem[], onItemClick: () => void }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    if (isHovered || isDragging) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items.length, isHovered, isDragging]);

  const handleSwipe = (swipeDirection: number) => {
    setDirection(swipeDirection);
    if (swipeDirection > 0) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const currentItem = items[currentIndex];

  const slideVariants: Variants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0, scale: 1.05 }),
    center: { x: 0, opacity: 1, scale: 1, transition: { x: { type: 'spring', stiffness: 200, damping: 30 }, opacity: { duration: 0.4 }, scale: { duration: 0.6, ease: 'easeOut' } } },
    exit: (dir: number) => ({ x: dir > 0 ? '-50%' : '50%', opacity: 0, scale: 0.95, transition: { x: { type: 'spring', stiffness: 200, damping: 30 }, opacity: { duration: 0.3 }, scale: { duration: 0.4 } } })
  };

  return (
    <div className="relative group" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="relative w-full max-w-[480px] aspect-[3/4] mx-auto overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl shadow-fuchsia-500/20">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(_, { offset, velocity }) => {
              setIsDragging(false);
              const swipe = offset.x * velocity.x;
              if (swipe < -5000 || offset.x < -100) handleSwipe(1);
              else if (swipe > 5000 || offset.x > 100) handleSwipe(-1);
            }}
            onClick={() => !isDragging && onItemClick()}
            className="absolute inset-0 cursor-pointer"
          >
            <motion.div className="absolute inset-0" animate={{ scale: isHovered ? 1.05 : 1 }} transition={{ duration: 0.4 }}>
              <img src={currentItem?.image_path || '/images/default-food.png'} alt={currentItem?.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
            </motion.div>

            <div className="absolute top-6 right-6 z-20">
              <div className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-lg shadow-xl">
                ${Number(currentItem?.price).toFixed(2)}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
              <motion.h3 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-white mb-2 font-display">{currentItem?.name}</motion.h3>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-200 line-clamp-2 mb-4">{currentItem?.description}</motion.p>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-lg bg-fuchsia-500 text-white text-xs font-bold uppercase tracking-wider">{t('customer.menu.badges.featured')}</div>
                <div className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-medium uppercase tracking-wider backdrop-blur-md">{t('customer.menu.badges.hot_item')}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {items.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); handleSwipe(-1); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-fuchsia-500 hover:border-fuchsia-500 hover:scale-110 z-30">
              <ArrowRight className="w-5 h-5 rotate-180" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleSwipe(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-fuchsia-500 hover:border-fuchsia-500 hover:scale-110 z-30">
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Progress Indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className="relative h-1.5 overflow-hidden rounded-full transition-all duration-500"
              style={{ width: index === currentIndex ? '32px' : '8px', backgroundColor: index === currentIndex ? '#d946ef' : '#e5e7eb' }} // Fuchsia-500 vs Gray-200
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home({ featuredItems, categories, testimonials, stats }: HomeProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'delivery' | 'pickup' | 'dine-in'>('delivery');
  const cart = useCartStore();
  const { isTableOrder } = useTableSession();
  const { t } = useTranslation();

  function openModal(m: 'delivery' | 'pickup' | 'dine-in') {
    setMode(m);
    setOpen(true);
  }

  function addToCartAndOpenModal(item: FeaturedItem) {
    cart.addItem({
      menu_item_id: item.id,
      name: item.name,
      unit_price: item.price,
      quantity: 1,
      image_path: item.image_path || undefined,
    });
    toastSuccess(t('customer.menu.added_to_cart', { name: item.name }));
    setMode(isTableOrder ? 'dine-in' : 'delivery');
    setOpen(true);
  }

  function navigateToMenu(categoryId?: number) {
    if (categoryId) {
      router.visit(route('customer.menu', { category: categoryId }));
    } else {
      router.visit(route('customer.menu'));
    }
  }

  return (
    <CustomerLayout>
      <Head>
        <title>{t('common.meta.home_title') as string}</title>
      </Head>

      <div className="space-y-12 sm:space-y-16 lg:space-y-24 pb-12 sm:pb-16 lg:pb-20">
        {/* NEW HERO SECTION & Brand Background */}
        <div className="rounded-xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 relative bg-gradient-to-br from-indigo-900 to-purple-900">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-center relative z-10 px-4 md:px-8 py-8 lg:py-12">
            <motion.div className="max-w-2xl" variants={itemVariants} initial="hidden" animate="visible">
              {/* Hide rating badge on mobile */}
              <motion.div
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-6 lg:mb-8 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                <span className="text-sm font-semibold text-white">
                  {t('customer.home.rating_badge', { rating: String(stats.averageRating), count: String(stats.totalCustomers) })}
                </span>
              </motion.div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight text-white mb-4 lg:mb-6 font-display">
                {t('customer.hero.title')}
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-white/80 leading-relaxed mb-6 lg:mb-10 max-w-xl">
                {t('customer.hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                {isTableOrder ? (
                  <motion.button
                    onClick={() => openModal('dine-in')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-white text-fuchsia-600 font-bold text-base sm:text-lg shadow-xl shadow-black/10 hover:bg-gray-50 transition-all w-full sm:w-auto"
                  >
                    <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{t('customer.hero.cta_order')}</span>
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      onClick={() => openModal('delivery')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-white text-fuchsia-600 font-bold text-base sm:text-lg shadow-xl shadow-black/10 hover:bg-gray-50 transition-all"
                    >
                      <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{t('customer.hero.cta_order')}</span>
                    </motion.button>

                    <motion.button
                      onClick={() => openModal('pickup')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center justify-center gap-2 h-12 sm:h-14 px-6 sm:px-8 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-base sm:text-lg hover:bg-white/20 transition-all"
                    >
                      <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{t('customer.hero.cta_menu')}</span>
                    </motion.button>
                  </>
                )}
              </div>

              {/* Stats Row - Grid layout for consistent alignment */}
              <div className="mt-8 lg:mt-12 grid grid-cols-3 gap-2 sm:gap-4 lg:gap-8 border-t border-white/10 pt-6 lg:pt-8">
                <div className="flex flex-col text-center sm:text-left">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.averageDeliveryTime}m</span>
                  <span className="text-[10px] sm:text-xs lg:text-sm text-white/60">{t('customer.home.stats.avg_delivery')}</span>
                </div>
                <div className="flex flex-col text-center sm:text-left border-l border-white/10 pl-2 sm:pl-4">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stats.totalCustomers > 1000 ? '1k+' : stats.totalCustomers}</span>
                  <span className="text-[10px] sm:text-xs lg:text-sm text-white/60">{t('customer.home.stats.happy_customers')}</span>
                </div>
                <div className="flex flex-col text-center sm:text-left border-l border-white/10 pl-2 sm:pl-4">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">4.9</span>
                  <span className="text-[10px] sm:text-xs lg:text-sm text-white/60">{t('customer.home.stats.rating')}</span>
                </div>
              </div>
            </motion.div>

            {/* Carousel Area - Now visible on all screens */}
            {/* Hide carousel on mobile, show on desktop */}
            <motion.div
              className="hidden lg:flex justify-center items-center relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BrandBlob className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-40 blur-3xl" />
              <div className="relative z-10 w-full max-w-md">
                {featuredItems.length > 0 ? (
                  <FeaturedCarousel items={featuredItems} onItemClick={() => openModal(isTableOrder ? 'dine-in' : 'delivery')} />
                ) : (
                  <div className="w-full aspect-[3/4] rounded-3xl bg-white/10 animate-pulse border border-white/10" />
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Featured Items Section */}
        <section className="relative">
          <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 lg:mb-12 gap-3 sm:gap-4 lg:gap-6">
              <div>
                <span className="text-fuchsia-600 font-bold uppercase tracking-widest text-sm">{t('customer.home.delicious_choices')}</span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mt-2 text-gray-900 dark:text-white font-display">{t('customer.home.featured_dishes')}</h2>
              </div>
              <motion.button
                onClick={() => navigateToMenu()}
                whileHover={{ x: 5 }}
                className="flex items-center gap-2 text-fuchsia-600 font-bold hover:text-fuchsia-700 transition-colors text-sm lg:text-base"
              >
                {t('customer.home.view_full_menu')} <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5" />
              </motion.button>
            </div>
          </div>

          {/* Mobile: Horizontal Scroll, Desktop: Grid */}
          <div className="lg:hidden overflow-x-auto mobile-scroll">
            <div className="flex gap-3 pb-4 px-3 sm:px-4">
              {featuredItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 w-[280px]"
                >
                  <GlowCard
                    className="h-full overflow-hidden flex flex-col p-0 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 group"
                    glowIntensity="subtle"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image_path || '/images/default-food.png'}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-[10px] font-bold text-gray-900 shadow-lg">
                        ${Number(item.price).toFixed(2)}
                      </div>
                    </div>

                    <div className="p-3 flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1 flex-1">{item.name}</h3>
                        <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold ml-2">
                          <Star className="w-2.5 h-2.5 fill-current" /> 4.9
                        </div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs line-clamp-2 mb-3">{item.description}</p>
                      <button
                        onClick={() => addToCartAndOpenModal(item)}
                        className="w-full py-2 bg-fuchsia-600 text-white rounded-lg font-bold text-xs shadow-md hover:bg-fuchsia-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3 h-3" /> {t('customer.menu.add_to_cart')}
                      </button>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:block w-full max-w-screen-2xl mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
              {featuredItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                >
                  <GlowCard
                    className="h-full overflow-hidden flex flex-col p-0 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 group"
                    glowIntensity="subtle"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={item.image_path || '/images/default-food.png'}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                        <button
                          onClick={() => addToCartAndOpenModal(item)}
                          className="w-full py-3 bg-white text-gray-900 rounded-xl font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> {t('customer.menu.add_to_cart')}
                        </button>
                      </div>
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 shadow-lg">
                        ${Number(item.price).toFixed(2)}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{item.name}</h3>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                          <Star className="w-3 h-3 fill-current" /> 4.9
                        </div>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-4 flex-1">{item.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Clock className="w-3 h-3" /> 15-20 {t('common.minutes_short')} • <Utensils className="w-3 h-3" /> {item.category?.name || t('customer.menu.categories.main_course')}
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={containerVariants}
          >
            {/* Section Header */}
            <div className="text-center mb-12">
              <motion.span
                variants={itemVariants}
                className="inline-block text-fuchsia-600 dark:text-fuchsia-400 font-bold uppercase tracking-widest text-sm bg-fuchsia-50 dark:bg-fuchsia-900/30 px-4 py-2 rounded-full border border-fuchsia-200 dark:border-fuchsia-700"
              >
                {t('customer.home.our_menu')}
              </motion.span>
              <motion.h2
                variants={itemVariants}
                className="text-4xl md:text-5xl font-bold mt-6 mb-4 text-gray-900 dark:text-white font-display"
              >
                {t('customer.home.explore_categories')}
              </motion.h2>
              <motion.div
                variants={itemVariants}
                className="w-24 h-1.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 mx-auto rounded-full"
              />
            </div>

            {/* Categories Grid - Horizontal scroll on mobile */}
            <div className="overflow-x-auto mobile-scroll -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
              <div className="flex md:grid md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 xl:gap-5 pb-4 md:pb-0">
                {categories.map((category, idx) => (
                  <motion.div
                    key={category.id}
                    variants={itemVariants}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigateToMenu(category.id)}
                    className="group cursor-pointer flex-shrink-0 w-[110px] md:w-auto"
                  >
                    <div className="relative h-full rounded-xl lg:rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 lg:p-5 transition-all duration-300 hover:border-fuchsia-300 dark:hover:border-fuchsia-600 hover:shadow-lg hover:shadow-fuchsia-500/10 dark:hover:shadow-fuchsia-500/5">
                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-br from-fuchsia-500/0 to-pink-500/0 group-hover:from-fuchsia-500/5 group-hover:to-pink-500/5 dark:group-hover:from-fuchsia-500/10 dark:group-hover:to-pink-500/10 transition-all duration-300" />

                      {/* Content */}
                      <div className="relative flex flex-col items-center text-center">
                        {/* Icon Container */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-lg lg:rounded-xl bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/30 dark:to-pink-900/30 border border-fuchsia-100 dark:border-fuchsia-800/50 flex items-center justify-center mb-2 lg:mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                          <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl">{category.icon || '🍽️'}</span>
                        </div>

                        {/* Category Name */}
                        <h3 className="font-bold text-gray-900 dark:text-white text-[11px] sm:text-xs lg:text-sm xl:text-base mb-1 line-clamp-1">
                          {category.name}
                        </h3>

                        {/* Item Count */}
                        <p className="text-[9px] sm:text-rgb(10 10 10 / 0) lg:text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {category.count} {category.count === 1 ? t('common.item') : t('common.items')}
                        </p>

                        {/* Arrow indicator on hover - hide on mobile */}
                        <div className="mt-1 lg:mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                          <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-fuchsia-500 dark:text-fuchsia-400" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Hide divider on mobile */}
        <BrandDivider variant="wave" className="opacity-30 hidden md:block" />

        {/* Brand Features - Hide on mobile */}
        <div className="w-full max-w-screen-2xl mx-auto px-4 hidden md:block">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -5 }}
                className={cn(
                  "p-8 rounded-3xl relative overflow-hidden group",
                  "bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900",
                  "border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/20 dark:shadow-none"
                )}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.color} opacity-10 rounded-bl-[100px] transition-all group-hover:scale-110`} />

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{t(`features.${feature.key}`)}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{t(`features.${feature.key}_desc`)}</p>
              </motion.div>
            ))}
          </div>
        </div>



        {/* Hide second divider on mobile */}
        <BrandDivider variant="gradient" className="hidden md:block" />

        {/* CTA Section */}
        <section className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4">
          <div className="relative rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-900/80 to-purple-900/80 z-10" />
            <div className="absolute -right-20 -top-20 w-[600px] h-[600px] bg-fuchsia-600/30 rounded-full blur-3xl opacity-50 z-0 animate-pulse" />

            {/* Content */}
            <div className="relative z-20 px-4 sm:px-6 md:px-12 lg:px-20 py-8 sm:py-12 md:py-16 lg:py-20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 md:mb-6 leading-tight">
                  {t('customer.home.cta.title', { highlight: <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">{t('customer.home.cta.highlight')}</span> })}
                </h2>
                <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8">
                  {t('customer.home.cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={() => openModal(isTableOrder ? 'dine-in' : 'delivery')}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-fuchsia-900 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    {t('customer.hero.cta_order')}
                  </button>
                  <button
                    onClick={() => navigateToMenu()}
                    className="px-6 sm:px-8 py-3 sm:py-4 bg-transparent border border-white/30 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-white/10 transition-colors"
                  >
                    {t('customer.hero.cta_menu')}
                  </button>
                </div>
              </div>

              {/* Floating Food Image (Decorative) - Hide on mobile and tablet */}
              <motion.div
                className="hidden lg:block w-80 h-80 relative"
                animate={{ y: [-15, 15, -15] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500 to-pink-500 rounded-full opacity-20 blur-2xl" />
                <div className="w-full h-full rounded-full border-4 border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center relative overflow-hidden">
                  <img src="/Nkhlogo.png" alt="NKH" className="w-3/4 h-3/4 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

      </div>

      <OrderingModal open={open} onClose={() => setOpen(false)} mode={mode} />
    </CustomerLayout>
  );
}
