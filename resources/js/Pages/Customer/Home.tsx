
import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import OrderingModal from '@/app/components/customer/OrderingModal';
import { useCartStore } from '@/app/store/cart';
import { toastSuccess } from '@/app/utils/toast';
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
  HeroBackground,
  BrandDivider,
  GlowCard,
  BrandBlob
} from '@/Components/brand';

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
    title: 'Lightning Fast',
    description: 'Average delivery time under 30 minutes',
    color: 'from-amber-500 to-orange-500' // Adjusted to complimentary colors
  },
  {
    icon: ChefHat,
    title: 'Fresh Ingredients',
    description: 'Locally sourced, premium quality',
    color: 'from-emerald-500 to-green-500'
  },
  {
    icon: Heart,
    title: 'Made with Love',
    description: 'Passion in every single dish',
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
                <div className="px-3 py-1 rounded-lg bg-fuchsia-500 text-white text-xs font-bold uppercase tracking-wider">Featured</div>
                <div className="px-3 py-1 rounded-lg bg-white/20 text-white text-xs font-medium uppercase tracking-wider backdrop-blur-md">Hot Item</div>
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
  const [mode, setMode] = React.useState<'delivery' | 'pickup'>('delivery');
  const cart = useCartStore();

  function openModal(m: 'delivery' | 'pickup') {
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
    toastSuccess(`${item.name} added to cart!`);
    setMode('delivery');
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
        <title>NKH Restaurant - Fresh Food Delivered Fast</title>
      </Head>

      <div className="space-y-24 pb-20">
        {/* NEW HERO SECTION & Brand Background */}
        <HeroBackground variant="mesh" className="rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 px-4 md:px-8">
            <motion.div className="max-w-2xl" variants={itemVariants} initial="hidden" animate="visible">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8 shadow-lg"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
                <span className="text-sm font-semibold text-white">
                  Rated {stats.averageRating}/5 by {stats.totalCustomers.toLocaleString()}+ Customers
                </span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight text-white mb-6 font-display">
                Taste the <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-pink-300 animate-pulse">Extraordinary.</span>
              </h1>

              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-xl">
                Experience culinary perfection delivered to your door. Fresh ingredients, masterful recipes, and passion in every bite.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  onClick={() => openModal('delivery')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative flex items-center justify-center gap-3 h-14 px-8 rounded-2xl bg-white text-fuchsia-600 font-bold text-lg shadow-xl shadow-black/10 hover:bg-gray-50 transition-all"
                >
                  <Truck className="w-5 h-5" />
                  <span>Order Delivery</span>
                </motion.button>

                <motion.button
                  onClick={() => openModal('pickup')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-3 h-14 px-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-lg hover:bg-white/20 transition-all"
                >
                  <Store className="w-5 h-5" />
                  <span>Order Pickup</span>
                </motion.button>
              </div>

              {/* Stats Row */}
              <div className="mt-12 flex flex-wrap gap-8 border-t border-white/10 pt-8">
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white">{stats.averageDeliveryTime}m</span>
                  <span className="text-sm text-white/60">Avg. Delivery</span>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white">{stats.totalCustomers > 1000 ? '1k+' : stats.totalCustomers}</span>
                  <span className="text-sm text-white/60">Happy Customers</span>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-3xl font-bold text-white">4.9</span>
                  <span className="text-sm text-white/60">Rating</span>
                </div>
              </div>
            </motion.div>

            {/* Carousel Area */}
            <motion.div
              className="hidden lg:flex justify-center items-center relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <BrandBlob className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-40 blur-3xl" />
              <div className="relative z-10 w-full max-w-md">
                {featuredItems.length > 0 ? (
                  <FeaturedCarousel items={featuredItems} onItemClick={() => openModal('delivery')} />
                ) : (
                  <div className="w-80 h-96 rounded-3xl bg-white/10 animate-pulse mx-auto border border-white/10" />
                )}
              </div>
            </motion.div>
          </div>
        </HeroBackground>
        
        {/* Featured Items Section */}
        <section className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-fuchsia-600 font-bold uppercase tracking-widest text-sm">Delicious Choices</span>
              <h2 className="text-4xl font-bold mt-2 text-gray-900 dark:text-white font-display">Featured Dishes</h2>
            </div>
            <motion.button
              onClick={() => navigateToMenu()}
              whileHover={{ x: 5 }}
              className="flex items-center gap-2 text-fuchsia-600 font-bold hover:text-fuchsia-700 transition-colors"
            >
              View Full Menu <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                        <Plus className="w-4 h-4" /> Add to Order
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
                      <Clock className="w-3 h-3" /> 15-20 min • <Utensils className="w-3 h-3" /> {item.category?.name || 'Main Course'}
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Categories Section */}
        <section className="container mx-auto px-4">
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
                Our Menu
              </motion.span>
              <motion.h2
                variants={itemVariants}
                className="text-4xl md:text-5xl font-bold mt-6 mb-4 text-gray-900 dark:text-white font-display"
              >
                Explore Categories
              </motion.h2>
              <motion.div
                variants={itemVariants}
                className="w-24 h-1.5 bg-gradient-to-r from-fuchsia-500 to-pink-500 mx-auto rounded-full"
              />
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
              {categories.map((category, idx) => (
                <motion.div
                  key={category.id}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigateToMenu(category.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative h-full rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 transition-all duration-300 hover:border-fuchsia-300 dark:hover:border-fuchsia-600 hover:shadow-lg hover:shadow-fuchsia-500/10 dark:hover:shadow-fuchsia-500/5">
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-fuchsia-500/0 to-pink-500/0 group-hover:from-fuchsia-500/5 group-hover:to-pink-500/5 dark:group-hover:from-fuchsia-500/10 dark:group-hover:to-pink-500/10 transition-all duration-300" />

                    {/* Content */}
                    <div className="relative flex flex-col items-center text-center">
                      {/* Icon Container */}
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/30 dark:to-pink-900/30 border border-fuchsia-100 dark:border-fuchsia-800/50 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                        <span className="text-2xl md:text-3xl">{category.icon || '🍽️'}</span>
                      </div>

                      {/* Category Name */}
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base mb-1 line-clamp-1">
                        {category.name}
                      </h3>

                      {/* Item Count */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {category.count} {category.count === 1 ? 'item' : 'items'}
                      </p>

                      {/* Arrow indicator on hover */}
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <BrandDivider variant="wave" className="opacity-30" />

        {/* Brand Features */}
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        

        <BrandDivider variant="gradient" />

        {/* CTA Section */}
        <section className="container mx-auto px-4">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-900/80 to-purple-900/80 z-10" />
            <div className="absolute -right-20 -top-20 w-[600px] h-[600px] bg-fuchsia-600/30 rounded-full blur-3xl opacity-50 z-0 animate-pulse" />

            {/* Content */}
            <div className="relative z-20 px-6 py-20 md:px-20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-2xl">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                  Ready to taste <br /> something <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400">amazing?</span>
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Join thousands of happy customers and experience the best food delivery service in town.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => openModal('delivery')}
                    className="px-8 py-4 bg-white text-fuchsia-900 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Order Now
                  </button>
                  <button
                    onClick={() => navigateToMenu()}
                    className="px-8 py-4 bg-transparent border border-white/30 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition-colors"
                  >
                    Browse Menu
                  </button>
                </div>
              </div>

              {/* Floating Food Image (Decorative) */}
              <motion.div
                className="hidden md:block w-80 h-80 relative"
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