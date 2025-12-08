import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/app/libs/apiClient';
import { ApiResponse, Order, Reservation } from '@/app/types/domain';
import {
  Star,
  ShoppingBag,
  Gift,
  TrendingUp,
  Utensils,
  Clock,
  Heart,
  MapPin,
  RefreshCw,
  Package,
  Sparkles,
  Calendar,
  Trophy,
  Zap,
  Target,
  Award,
  TrendingDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Percent,
  DollarSign,
  Bell,
  CheckCircle2,
} from 'lucide-react';

// Dashboard Components
import StatCard from '@/app/components/dashboard/StatCard';
import ActivityFeed, { Activity } from '@/app/components/dashboard/ActivityFeed';
import QuickActions, { QuickAction } from '@/app/components/dashboard/QuickActions';

// UI Components
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  loyalty_points: number;
  total_orders: number;
  total_spent: number;
  favorite_items: string[];
  member_since: string;
  next_reward_points: number;
}

interface DashboardStats {
  orders_this_month: number;
  orders_trend: number;
  points_earned_this_month: number;
  available_rewards: number;
}

interface Reward {
  id: number;
  title: string;
  description: string;
  points_required: number;
  type: 'discount' | 'free_item' | 'upgrade';
  value: string;
  icon: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: 1,
    title: 'First Order',
    description: 'Place your first order',
    icon: '🎯',
    unlocked: true,
  },
  {
    id: 2,
    title: 'Regular Customer',
    description: 'Place 10 orders',
    icon: '⭐',
    unlocked: true,
    progress: 10,
    total: 10,
  },
  {
    id: 3,
    title: 'Food Explorer',
    description: 'Try 20 different items',
    icon: '🗺️',
    unlocked: false,
    progress: 12,
    total: 20,
  },
  {
    id: 4,
    title: 'Loyalty Champion',
    description: 'Earn 1,000 points',
    icon: '🏆',
    unlocked: false,
    progress: 560,
    total: 1000,
  },
];

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  // Data fetching
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['customer.profile'],
    queryFn: () => apiGet<ApiResponse<CustomerProfile>>('/customer/profile').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['customer.stats'],
    queryFn: () =>
      apiGet<ApiResponse<DashboardStats>>('/customer/dashboard/stats').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['customer.orders.recent'],
    queryFn: () => apiGet<ApiResponse<Order[]>>('/customer/orders?limit=5').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const {
    data: customerReservations = [],
    isLoading: reservationsLoading,
    refetch: refetchReservations,
  } = useQuery({
    queryKey: ['customer.reservations'],
    queryFn: () => apiGet<{ data: Reservation[] }>('/customer/reservations').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  // Fetch rewards from API
  const { data: rewardsData, isLoading: rewardsLoading, refetch: refetchRewards } = useQuery({
    queryKey: ['customer', 'rewards'],
    queryFn: () => apiGet<{ data: Reward[]; customer_points: number }>('/customer/rewards'),
    staleTime: 1000 * 60,
  });

  const REWARDS = rewardsData?.data || [];

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: 'order-now',
      label: 'Order Now',
      description: 'Browse menu & order',
      icon: Utensils,
      color: 'pink',
      onClick: () => (window.location.href = '/menu'),
    },
    {
      id: 'reservations',
      label: 'Reservations',
      description: 'Book a table',
      icon: Calendar,
      color: 'blue',
      onClick: () => (window.location.href = '/customer/reservations'),
    },
    {
      id: 'rewards',
      label: 'Rewards',
      description: 'Redeem points',
      icon: Gift,
      color: 'purple',
      onClick: () => setShowRewardsModal(true),
    },
  ];

  const handleCancelReservation = async (reservationId: number) => {
    if (!window.confirm('Cancel this reservation?')) return;
    try {
      await apiDelete(`/customer/reservations/${reservationId}`);
      await refetchReservations();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to cancel reservation.');
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!profile || profile.loyalty_points < reward.points_required) {
      alert('You don\'t have enough points for this reward!');
      return;
    }

    if (window.confirm(`Redeem ${reward.title} for ${reward.points_required} points?`)) {
      try {
        const response = await apiPost<{
          message: string;
          data: {
            redemption_code: string;
            new_balance: number;
            points_deducted: number;
          };
        }>('/customer/rewards/redeem', {
          reward_id: reward.id,
          points_required: reward.points_required,
          reward_title: reward.title,
        });

        // Show success message with redemption code
        alert(
          `✅ ${response.message}` +
          `Redemption Code: ${response.data.redemption_code}\n` +
          `Points Used: ${response.data.points_deducted}\n` +
          `New Balance: ${response.data.new_balance} points\n\n` +
          `Show this code at checkout to claim your reward!`
        );

        // Refresh data
        await Promise.all([
          refetchProfile(),
          refetchRewards(),
          queryClient.invalidateQueries({ queryKey: ['customer', 'history'] }),
        ]);

        setShowRewardsModal(false);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 'Failed to redeem reward. Please try again.';
        alert(`❌ Error: ${errorMessage}`);
      }
    }
  };

  return (
    <CustomerLayout>
      <Head>
        <title>Dashboard - NKH Restaurant</title>
        <meta name="description" content="Your personal restaurant dashboard" />
      </Head>

      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome Hero */}
        <motion.section
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 bg-gradient-to-br from-fuchsia-600/20 via-pink-500/10 to-rose-500/20 border border-white/10 backdrop-blur-xl"
          variants={itemVariants}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <motion.h1
                  className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Welcome back
                  {profile?.name && (
                    <span className="bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                      , {profile.name}
                    </span>
                  )}
                  ! 👋
                </motion.h1>
                <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 max-w-2xl">
                  Ready to satisfy your cravings? Check out today's specials or reorder your favorites.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Button
                    leftIcon={<Utensils className="w-5 h-5" />}
                    onClick={() => (window.location.href = '/menu')}
                  >
                    Browse Menu
                  </Button>
                  <Button
                    variant="secondary"
                    leftIcon={<RefreshCw className="w-5 h-5" />}
                    onClick={() => (window.location.href = '/customer/orders')}
                  >
                    View Orders
                  </Button>
                </div>
              </div>

              {/* Member badge */}
              {profile?.member_since && (
                <motion.div
                  className="hidden md:block px-4 py-2 rounded-xl bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/20"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="text-xs text-gray-600 dark:text-gray-400">Member Since</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {new Date(profile.member_since).getFullYear()}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 -bottom-24 h-60 w-60 rounded-full bg-rose-500/20 blur-3xl" />

          {/* Floating food emoji */}
          <motion.div
            className="absolute top-8 right-12 text-5xl hidden lg:block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            🍕
          </motion.div>
        </motion.section>

        {/* Stats Grid */}
        <motion.section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
          <StatCard
            title="Loyalty Points"
            value={profile?.loyalty_points ?? 0}
            icon={Star}
            color="pink"
            loading={profileLoading}
            trend={
              stats?.points_earned_this_month
                ? { value: stats.points_earned_this_month, isPositive: true }
                : undefined
            }
            onClick={() => (window.location.href = '/customer/loyalty')}
          />

          <StatCard
            title="Total Orders"
            value={profile?.total_orders ?? 0}
            icon={ShoppingBag}
            color="blue"
            loading={profileLoading}
            trend={
              stats?.orders_trend
                ? { value: stats.orders_trend, isPositive: stats.orders_trend > 0 }
                : undefined
            }
          />

          <StatCard
            title="Total Spent"
            value={`$${(profile?.total_spent ?? 0).toFixed(2)}`}
            icon={TrendingUp}
            color="green"
            loading={profileLoading}
          />

          <StatCard
            title="Available Rewards"
            value={stats?.available_rewards ?? 0}
            icon={Gift}
            color="purple"
            loading={statsLoading}
            onClick={() => setShowRewardsModal(true)}
          />
        </motion.section>

        {/* Quick Actions */}
        <motion.section variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <QuickActions actions={quickActions} columns={4} />
        </motion.section>

        {/* Main Content Grid - Clean Layout */}
        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recent Orders - Main Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-5 h-5 text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Recent Orders</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Your latest activity</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => (window.location.href = '/customer/orders')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full" />
                      ))}
                    </div>
                  ) : recentOrders && recentOrders.length > 0 ? (
                    <div className="space-y-2">
                      {recentOrders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              Order #{order.id}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${(order.total_amount ?? 0).toFixed(2)}
                            </div>
                            <div className={`text-xs font-medium mt-0.5 ${order.status === 'completed' ? 'text-green-500' :
                                order.status === 'pending' ? 'text-yellow-500' :
                                  order.status === 'cancelled' ? 'text-red-500' :
                                    'text-blue-500'
                              }`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ShoppingBag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">No orders yet. Time to order!</p>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => (window.location.href = '/menu')}
                      >
                        Browse Menu
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reservations Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-pink-500" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Reservations</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Book your table</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => (window.location.href = '/customer/reservations')}
                    >
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {reservationsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : customerReservations.length > 0 ? (
                    <div className="space-y-2">
                      {customerReservations.slice(0, 4).map((res) => {
                        const d = new Date(res.reserved_for);
                        return (
                          <div
                            key={res.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {d.toLocaleDateString()} at {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                                {res.guest_count} guests • {res.status}
                              </div>
                            </div>
                            {['pending', 'confirmed'].includes(res.status) && (
                              <button
                                onClick={() => handleCancelReservation(res.id)}
                                className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">No reservations yet</p>
                      <Button
                        size="sm"
                        className="mt-3"
                        onClick={() => (window.location.href = '/customer/reservations')}
                      >
                        Book a Table
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Loyalty & Info */}
            <div className="lg:col-span-4 space-y-6">
              {/* Loyalty Progress */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Next Reward</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        {profile?.loyalty_points ?? 0} / 100 pts
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(((profile?.loyalty_points ?? 0) / 100) * 100, 100)}%`,
                        }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {Math.max(0, 100 - (profile?.loyalty_points ?? 0))} more points to next reward
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowRewardsModal(true)}
                    >
                      View Rewards
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Favorites */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Your Favorites</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Most ordered items</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {profileLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : profile?.favorite_items && profile.favorite_items.length > 0 ? (
                    <div className="space-y-2">
                      {profile.favorite_items.slice(0, 4).map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                        >
                          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No favorites yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Member Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Member</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Since {profile?.member_since ? new Date(profile.member_since).getFullYear() : '2024'}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      You've earned <span className="font-bold text-gray-900 dark:text-white">{profile?.loyalty_points ?? 0}</span> points so far!
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => (window.location.href = '/customer/loyalty')}
                    >
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.section>

        {/* Rewards Modal - Clean and Centered */}
        {showRewardsModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowRewardsModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gift className="w-6 h-6 text-purple-500" />
                    Rewards Marketplace
                  </h2>
                  <button
                    onClick={() => setShowRewardsModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  You have <span className="font-bold text-purple-600">{profile?.loyalty_points || 0} points</span> available
                </p>
              </div>
              <div className="p-6">
                {rewardsLoading ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500">Loading rewards...</div>
                  </div>
                ) : REWARDS.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-500">No rewards available at this time.</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {REWARDS.map((reward) => {
                      const canRedeem = profile && profile.loyalty_points >= reward.points_required;
                      return (
                        <div
                          key={reward.id}
                          className={`p-4 rounded-xl border-2 transition-all ${canRedeem
                            ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="text-4xl">{reward.icon}</div>
                            <div className="text-right">
                              <div className="text-xs text-gray-600 dark:text-gray-400">Value</div>
                              <div className="text-lg font-bold text-purple-600">{reward.value}</div>
                            </div>
                          </div>
                          <div className="font-semibold text-gray-900 dark:text-white mb-1">
                            {reward.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {reward.description}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span>{reward.points_required} pts</span>
                            </div>
                            <Button
                              size="sm"
                              variant={canRedeem ? 'primary' : 'secondary'}
                              disabled={!canRedeem}
                              onClick={() => handleRedeemReward(reward)}
                            >
                              {canRedeem ? 'Redeem' : 'Not Enough Points'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </CustomerLayout>
  );
}
