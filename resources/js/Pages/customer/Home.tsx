import React from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import Button from '@/app/components/ui/Button';
import OrderingModal from '@/app/components/customer/OrderingModal';
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
  Quote
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { MenuItem } from '@/app/types/domain';

// Types for Inertia Props
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

const steps = [
  {
    number: 1,
    title: 'Browse Menu',
    description: 'Explore our delicious offerings',
    icon: Search
  },
  {
    number: 2,
    title: 'Place Order',
    description: 'Choose delivery or pickup',
    icon: Plus
  },
  {
    number: 3,
    title: 'Track Progress',
    description: 'Real-time order updates',
    icon: Clock
  },
  {
    number: 4,
    title: 'Enjoy!',
    description: 'Savor every bite',
    icon: Heart
  }
];

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Average delivery time under 30 minutes',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    icon: ChefHat,
    title: 'Fresh Ingredients',
    description: 'Locally sourced, premium quality',
    color: 'from-green-500 to-emerald-500'
  },
  {
    icon: Star,
    title: '4.9/5 Rating',
    description: 'Loved by thousands of customers',
    color: 'from-fuchsia-500 to-pink-500'
  }
];

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
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
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

const floatingVariants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

export default function Home({ featuredItems, categories, testimonials, stats }: HomeProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'delivery' | 'pickup'>('delivery');

  function openModal(m: 'delivery' | 'pickup') {
    setMode(m);
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
        <title>NKH Restaurant - Fresh Food Delivered Fast | Order Online</title>
        <meta name="description" content="Order delicious, fresh meals from NKH Restaurant. Choose delivery or pickup. Browse our menu of gourmet burgers, pasta, desserts and more. Fast delivery, premium quality." />
        <meta name="keywords" content="food delivery, restaurant, online ordering, gourmet food, fast delivery" />
      </Head>

      <div className="space-y-20">
        {/* Hero Section */}
        <motion.section
          className="relative overflow-hidden rounded-3xl p-8 md:p-16 bg-gradient-to-br from-fuchsia-600/20 via-pink-500/10 to-rose-500/20 border border-white/10 backdrop-blur-xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div className="max-w-2xl z-10" variants={itemVariants} transition={{ duration: 0.5, ease: "easeOut" }}>
              <motion.div
                className="inline-block px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 mb-6"
                whileHover={{ scale: 1.05 }}
              >
                <span className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                  ⭐ Rated {stats.averageRating}/5 by {stats.totalCustomers.toLocaleString()}+ customers
                </span>
              </motion.div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Crave. Click. Enjoy.
                </span>
              </h1>

              <p className="mt-6 text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-xl">
                Freshly crafted flavors at your fingertips. Choose delivery for cozy nights in or pickup for on-the-go vibes.
                <strong className="text-fuchsia-600 dark:text-fuchsia-400"> Your next meal is just a tap away.</strong>
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  onClick={() => openModal('delivery')}
                  size="lg"
                  leftIcon={<Truck className="w-5 h-5" />}
                  className="shadow-2xl shadow-fuchsia-500/30"
                >
                  Order Delivery
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => openModal('pickup')}
                  size="lg"
                  leftIcon={<Store className="w-5 h-5" />}
                >
                  Order Pickup
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="mt-10 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-fuchsia-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stats.averageDeliveryTime} min delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-fuchsia-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fresh ingredients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-fuchsia-600" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Top rated</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Image - Floating Food Items */}
            <motion.div
              className="hidden lg:flex justify-center items-center relative"
              variants={itemVariants}
            >
              <div className="relative w-full h-[400px]">
                <motion.div
                  className="absolute top-0 right-0 w-48 h-48 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm"
                  variants={floatingVariants}
                  initial="initial"
                  animate="animate"
                  style={{ animationDelay: '0s' }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-6xl">
                    🍔
                  </div>
                </motion.div>

                <motion.div
                  className="absolute bottom-0 left-0 w-56 h-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm"
                  variants={floatingVariants}
                  initial="initial"
                  animate="animate"
                  style={{ animationDelay: '1s' }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-7xl">
                    🍝
                  </div>
                </motion.div>

                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 backdrop-blur-sm z-10"
                  variants={floatingVariants}
                  initial="initial"
                  animate="animate"
                  style={{ animationDelay: '2s' }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-6xl">
                    🍰
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Decorative Blobs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-24 h-80 w-80 rounded-full bg-rose-500/20 blur-3xl" />
        </motion.section>

        {/* Popular Categories */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              variants={itemVariants}
            >
              Popular Categories
            </motion.h2>
            <motion.p
              className="mt-3 text-gray-600 dark:text-gray-400 text-lg"
              variants={itemVariants}
            >
              Explore our diverse menu categories
            </motion.p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.button
                key={category.id}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigateToMenu(category.id)}
                className="group relative overflow-hidden rounded-2xl p-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:border-fuchsia-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-fuchsia-500/10"
              >
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br",
                  category.color
                )} style={{ opacity: 0.05 }} />

                <div className="relative z-10 text-center">
                  <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform duration-300">
                    {category.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {category.count} items
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Featured Menu Items */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              variants={itemVariants}
            >
              Featured Specialties
            </motion.h2>
            <motion.p
              className="mt-3 text-gray-600 dark:text-gray-400 text-lg"
              variants={itemVariants}
            >
              Our most loved dishes, crafted with passion
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item, index) => (
              <motion.div
                key={item.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="group relative overflow-hidden rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:border-fuchsia-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-fuchsia-500/10"
              >
                {/* Badge */}
                {item.badge && (
                  <div className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-xs font-semibold shadow-lg">
                    {item.badge}
                  </div>
                )}

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
                    <div className="absolute inset-0 flex items-center justify-center text-8xl transform group-hover:scale-110 transition-transform duration-500">
                      {index === 0 ? '🍔' : index === 1 ? '🍝' : '🍰'}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                      {item.name}
                    </h3>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                    {item.description}
                  </p>

                  {/* Rating */}
                  {item.rating && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                      {(item.reviews_count ?? 0) > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ({item.reviews_count} reviews)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold bg-gradient-to-r from-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                      ${item.price.toFixed(2)}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openModal('delivery')}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-10"
            variants={itemVariants}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigateToMenu()}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              View Full Menu
            </Button>
          </motion.div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 border border-white/10 backdrop-blur-xl"
        >
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              variants={itemVariants}
            >
              How It Works
            </motion.h2>
            <motion.p
              className="mt-3 text-gray-600 dark:text-gray-400 text-lg"
              variants={itemVariants}
            >
              Four simple steps to deliciousness
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  variants={itemVariants}
                  className="relative text-center"
                >
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-fuchsia-500/50 to-pink-500/50" />
                  )}

                  {/* Step Circle */}
                  <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-fuchsia-600/20 to-pink-600/20 border-2 border-fuchsia-500/30 backdrop-blur-xl mb-6 mx-auto">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                    <Icon className="w-10 h-10 text-fuchsia-600 dark:text-fuchsia-400 z-10" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {step.number}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Why Choose Us */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
        >
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              variants={itemVariants}
            >
              Why Choose NKH?
            </motion.h2>
            <motion.p
              className="mt-3 text-gray-600 dark:text-gray-400 text-lg"
              variants={itemVariants}
            >
              We're committed to excellence in every bite
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="relative overflow-hidden rounded-2xl p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/20 hover:border-fuchsia-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-fuchsia-500/10 text-center"
                >
                  <div className={cn(
                    "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br mb-6",
                    feature.color
                  )}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-pink-500/10 border border-white/10 backdrop-blur-xl"
        >
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tight"
              variants={itemVariants}
            >
              What Our Customers Say
            </motion.h2>
            <motion.p
              className="mt-3 text-gray-600 dark:text-gray-400 text-lg"
              variants={itemVariants}
            >
              Join thousands of happy food lovers
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="relative overflow-hidden rounded-2xl p-6 bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-white/20 hover:border-fuchsia-500/30 transition-all duration-300"
              >
                <Quote className="absolute top-4 right-4 w-8 h-8 text-fuchsia-500/20" />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-600 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.customer_name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.customer_role}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          variants={containerVariants}
          className="relative overflow-hidden rounded-3xl p-12 md:p-16 bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600 text-white text-center"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Ready to Order?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers. Your delicious meal is just moments away!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                onClick={() => openModal('delivery')}
                size="lg"
                variant="secondary"
                leftIcon={<Truck className="w-5 h-5" />}
                className="bg-white text-fuchsia-900 hover:bg-white/90"
              >
                Start Your Order
              </Button>
              <Button
                onClick={() => navigateToMenu()}
                size="lg"
                variant="ghost"
                className="border-2 border-white/30 text-white hover:bg-white/10"
              >
                View Full Menu
              </Button>
            </div>
          </motion.div>

          {/* Decorative Elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </motion.section>
      </div>

      {/* Ordering Modal */}
      <OrderingModal open={open} onClose={() => setOpen(false)} mode={mode} />
    </CustomerLayout>
  );
}
