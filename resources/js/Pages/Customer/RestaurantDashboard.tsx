/**
 * 🍽️ RestaurantDashboard - Revolutionary Customer Experience
 * Appetite-inducing dashboard that makes users hungry and engaged
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  Heart, 
  Star, 
  Clock, 
  MapPin, 
  Gift,
  Zap,
  TrendingUp,
  Award,
  ArrowRight,
  ChefHat,
  Utensils,
  Coffee,
  IceCream
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { Order, MenuItem, ApiResponse } from '@/app/types/domain';
import RestaurantLayout from '@/Layouts/RestaurantLayout';
import { RestaurantCard, CardHeader, CardContent, CardTitle, CardDescription } from '@/Components/ui/RestaurantCard';
import { RestaurantButton } from '@/Components/ui/RestaurantButton';
import FoodCard from '@/Components/food/FoodCard';
import { animationVariants, createStaggerAnimation } from '@/design-system/animations';
import { cn } from '@/app/utils/cn';

interface CustomerStats {
  total_orders: number;
  total_spent: number;
  loyalty_points: number;
  favorite_items: MenuItem[];
  recent_orders: Order[];
  achievements: Achievement[];
  next_reward: {
    points_needed: number;
    reward_name: string;
  };
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  earned_at: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const rarityColors = {
  common: 'from-gray-400 to-gray-500',
  rare: 'from-blue-400 to-blue-500',
  epic: 'from-purple-400 to-purple-500',
  legendary: 'from-yellow-400 to-yellow-500',
};

export default function RestaurantDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'favorites' | 'rewards'>('overview');

  const { data: customerStats, isLoading } = useQuery({
    queryKey: ['customer.dashboard'],
    queryFn: () => apiGet<ApiResponse<CustomerStats>>('/customer/dashboard').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: popularItems = [] } = useQuery({
    queryKey: ['popular-items'],
    queryFn: () => apiGet<ApiResponse<MenuItem[]>>('/menu/popular').then(r => r.data),
  });

  const { data: todaySpecials = [] } = useQuery({
    queryKey: ['today-specials'],
    queryFn: () => apiGet<ApiResponse<MenuItem[]>>('/menu/specials').then(r => r.data),
  });

  if (isLoading) {
    return (
      <RestaurantLayout role="customer">
        <div className="space-y-6">
          {/* Loading Skeleton */}
          <div className="animate-pulse space-y-6">
            <div className="h-48 bg-primary-100 rounded-3xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-primary-100 rounded-3xl" />
              ))}
            </div>
          </div>
        </div>
      </RestaurantLayout>
    );
  }

  return (
    <RestaurantLayout role="customer">
      <motion.div 
        className="space-y-8"
        variants={createStaggerAnimation(0.1)}
        initial="initial"
        animate="animate"
      >
        {/* 🎉 Welcome Hero Section */}
        <motion.section
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-primary-500/20 via-primary-400/10 to-orange-500/20 border border-primary-200/30 backdrop-blur-xl"
          variants={animationVariants.fadeIn}
        >
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl md:text-4xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-3">
                Welcome back! 👋
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-6 max-w-2xl">
                Ready to satisfy your cravings? Discover today's chef specials and reorder your favorites with just a tap.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <RestaurantButton
                  variant="primary"
                  size="lg"
                  appetiteMode
                  leftIcon={<Utensils className="w-5 h-5" />}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Browse Menu
                </RestaurantButton>
                <RestaurantButton
                  variant="secondary"
                  size="lg"
                  leftIcon={<Clock className="w-5 h-5" />}
                >
                  Quick Reorder
                </RestaurantButton>
              </div>
            </motion.div>
          </div>

          {/* 🎨 Decorative Elements */}
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-primary-400/20 blur-3xl" />
          <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-orange-400/20 blur-3xl" />
          
          {/* ✨ Floating Food Icons */}
          <motion.div
            className="absolute top-8 right-8 text-4xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            🍕
          </motion.div>
          <motion.div
            className="absolute bottom-8 right-16 text-3xl"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            🍔
          </motion.div>
        </motion.section>

        {/* 📊 Stats Grid */}
        <motion.section
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          variants={createStaggerAnimation(0.1)}
        >
          {/* Total Orders */}
          <RestaurantCard variant="analytics" appetiteMode>
            <CardContent className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {customerStats?.total_orders || 0}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Total Orders
              </p>
            </CardContent>
          </RestaurantCard>

          {/* Loyalty Points */}
          <RestaurantCard variant="premium" glow>
            <CardContent className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-amber-600 mb-1">
                {customerStats?.loyalty_points || 0}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Loyalty Points
              </p>
            </CardContent>
          </RestaurantCard>

          {/* Total Spent */}
          <RestaurantCard variant="customer" appetiteMode>
            <CardContent className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                ${customerStats?.total_spent || 0}
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Total Spent
              </p>
            </CardContent>
          </RestaurantCard>

          {/* Next Reward */}
          <RestaurantCard variant="warm" appetiteMode>
            <CardContent className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                {customerStats?.next_reward?.points_needed || 0} pts
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                to {customerStats?.next_reward?.reward_name || 'Next Reward'}
              </p>
            </CardContent>
          </RestaurantCard>
        </motion.section>

        {/* 🍽️ Today's Specials */}
        <motion.section variants={animationVariants.fadeIn}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Today's Chef Specials
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Handcrafted dishes made with the finest ingredients
              </p>
            </div>
            <RestaurantButton variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </RestaurantButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {todaySpecials.slice(0, 3).map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                variant="featured"
                chefRecommended
                appetiteMode
                onAddToCart={(item: MenuItem, quantity: number) => {
                  console.log('Add to cart:', item, quantity);
                }}
                onToggleFavorite={(item: MenuItem) => {
                  console.log('Toggle favorite:', item);
                }}
              />
            ))}
          </div>
        </motion.section>

        {/* 🔥 Popular Items */}
        <motion.section variants={animationVariants.fadeIn}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Popular Right Now
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                What other food lovers are ordering
              </p>
            </div>
            <RestaurantButton variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
              View All
            </RestaurantButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularItems.slice(0, 4).map((item) => (
              <FoodCard
                key={item.id}
                item={item}
                variant="grid"
                isPopular
                appetiteMode
                onAddToCart={(item: MenuItem, quantity: number) => {
                  console.log('Add to cart:', item, quantity);
                }}
                onToggleFavorite={(item: MenuItem) => {
                  console.log('Toggle favorite:', item);
                }}
              />
            ))}
          </div>
        </motion.section>

        {/* 📱 Quick Actions */}
        <motion.section variants={animationVariants.fadeIn}>
          <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6">
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Coffee className="w-6 h-6" />, label: 'Beverages', color: 'from-blue-500 to-blue-600' },
              { icon: <ChefHat className="w-6 h-6" />, label: 'Main Course', color: 'from-red-500 to-red-600' },
              { icon: <IceCream className="w-6 h-6" />, label: 'Desserts', color: 'from-pink-500 to-pink-600' },
              { icon: <Zap className="w-6 h-6" />, label: 'Quick Bites', color: 'from-yellow-500 to-yellow-600' },
            ].map((action, index) => (
              <motion.div
                key={action.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RestaurantCard 
                  variant="glass" 
                  hover 
                  className="cursor-pointer text-center"
                >
                  <CardContent>
                    <div className={cn(
                      'w-12 h-12 rounded-2xl bg-gradient-to-r flex items-center justify-center mx-auto mb-3 text-white',
                      action.color
                    )}>
                      {action.icon}
                    </div>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {action.label}
                    </p>
                  </CardContent>
                </RestaurantCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 🏆 Recent Achievements */}
        {customerStats?.achievements && customerStats.achievements.length > 0 && (
          <motion.section variants={animationVariants.fadeIn}>
            <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              Recent Achievements
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customerStats.achievements.slice(0, 3).map((achievement) => (
                <RestaurantCard 
                  key={achievement.id}
                  variant="premium"
                  className="text-center"
                >
                  <CardContent>
                    <div className={cn(
                      'w-16 h-16 rounded-3xl bg-gradient-to-r flex items-center justify-center mx-auto mb-4 text-2xl',
                      rarityColors[achievement.rarity]
                    )}>
                      {achievement.icon}
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {achievement.description}
                    </p>
                  </CardContent>
                </RestaurantCard>
              ))}
            </div>
          </motion.section>
        )}
      </motion.div>
    </RestaurantLayout>
  );
}
