
import React, { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/app/libs/apiClient';
import { ApiResponse, Order, Reservation } from '@/app/types/domain';
import { PageProps } from '@/types';
import { RequireAuth } from '@/app/providers/AuthProvider';
import {
  Star,
  ShoppingBag,
  Gift,
  TrendingUp,
  Utensils,
  Calendar,
  Heart,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap
} from 'lucide-react';
import { cn } from '@/app/utils/cn';
import {
  BrandDivider,
} from '@/Components/brand';

// Interfaces
interface FavoriteItem {
  id: number;
  name: string;
  price: number;
  image_path: string | null;
}

interface CustomerProfile {
  id: number;
  name: string;
  email: string;
  loyalty_points: number;
  total_orders: number;
  total_spent: number;
  favorite_items: FavoriteItem[];
  member_since: string;
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

// Animation Variants
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

export default function Dashboard() {
  const { auth } = usePage<PageProps>().props;
  const queryClient = useQueryClient();
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  // Data fetching
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['customer.profile'],
    queryFn: () => apiGet<ApiResponse<CustomerProfile>>('/customer/profile').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['customer.stats'],
    queryFn: () => apiGet<ApiResponse<DashboardStats>>('/customer/dashboard/stats').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer.orders.recent'],
    queryFn: () => apiGet<ApiResponse<Order[]>>('/customer/orders?limit=5').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const { data: customerReservations = [], isLoading: reservationsLoading, refetch: refetchReservations } = useQuery({
    queryKey: ['customer.reservations'],
    queryFn: () => apiGet<{ data: Reservation[] }>('/customer/reservations').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const { data: rewardsData, isLoading: rewardsLoading, refetch: refetchRewards } = useQuery({
    queryKey: ['customer', 'rewards'],
    queryFn: () => apiGet<{ data: Reward[]; customer_points: number }>('/customer/rewards'),
    staleTime: 1000 * 60,
  });

  const REWARDS = rewardsData?.data || [];

  // Actions
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
          data: { redemption_code: string; new_balance: number; points_deducted: number; };
        }>('/customer/rewards/redeem', {
          reward_id: reward.id,
          points_required: reward.points_required,
          reward_title: reward.title,
        });

        alert(`✅ ${response.message}\nCode: ${response.data.redemption_code}`);

        await Promise.all([
          refetchProfile(),
          refetchRewards(),
          queryClient.invalidateQueries({ queryKey: ['customer', 'history'] }),
        ]);

        setShowRewardsModal(false);
      } catch (error: any) {
        alert(`❌ Error: ${error?.response?.data?.message || 'Failed to redeem reward.'}`);
      }
    }
  };

  return (
    <RequireAuth roles={['customer']}>
      <CustomerLayout>
        <Head>
          <title>Dashboard - NKH Restaurant</title>
        </Head>

        <motion.div
          className="space-y-4 sm:space-y-6 md:space-y-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* HERO SECTION */}
          <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-fuchsia-500/10">
            {/* Background with proper light/dark mode */}
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600 via-purple-600 to-pink-600 dark:from-fuchsia-700 dark:via-purple-700 dark:to-pink-700" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.1),transparent_50%)]" />

            <div className="relative z-10 p-4 sm:p-6 lg:p-12">
              {/* Mobile Layout */}
              <div className="lg:hidden">
                {/* Welcome Text - Full Width on Mobile */}
                <div className="mb-4 sm:mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 mb-4"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">Member Dashboard</span>
                  </motion.div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 font-display">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-pink-200">
                      {auth.user?.name || profile?.name || 'Guest'}!
                    </span>
                  </h1>

                  <p className="text-white/90 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 max-w-lg">
                    Ready to satisfy your cravings? Check your rewards and latest offers.
                  </p>

                  <div className="flex flex-wrap gap-3 sm:gap-4">
                    <button
                      onClick={() => window.location.href = '/menu'}
                      className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white text-fuchsia-600 rounded-xl font-bold shadow-lg shadow-black/20 hover:shadow-black/30 hover:scale-105 transition-all flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Utensils className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5" /> Menu
                    </button>
                    <button
                      onClick={() => window.location.href = '/customer/orders'}
                      className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white/15 backdrop-blur-md border border-white/30 text-white rounded-xl font-bold hover:bg-white/25 transition-all flex items-center gap-2 text-sm sm:text-base"
                    >
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5" /> Orders
                    </button>
                  </div>
                </div>

                {/* Loyalty Card - Only on Mobile */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-4 sm:p-5 md:p-6 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Award className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 text-white" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4 sm:mb-5 md:mb-6">
                      <div>
                        <h3 className="text-white/90 text-sm font-medium uppercase tracking-wider">Loyalty Balance</h3>
                        <div className="text-3xl sm:text-4xl font-bold text-white mt-1">{profile?.loyalty_points || 0} <span className="text-lg text-white/70 font-normal">pts</span></div>
                      </div>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30">
                        <Star className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 fill-current" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 sm:mb-5 md:mb-6">
                      <div className="flex justify-between text-sm text-white/90">
                        <span>Progress to next reward</span>
                        <span>{Math.min(((profile?.loyalty_points || 0) % 100), 100)}%</span>
                      </div>
                      <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-fuchsia-300 to-pink-300 rounded-full"
                          style={{ width: `${Math.min(((profile?.loyalty_points || 0) % 100), 100)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setShowRewardsModal(true)}
                      className="w-full py-3 rounded-xl bg-white text-fuchsia-600 font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Gift className="w-5 h-5" /> Redeem Rewards
                    </button>
                  </div>
                </motion.div>
              </div>

              {/* Desktop Layout - Two Column */}
              <div className="hidden lg:grid lg:grid-cols-2 gap-8 items-stretch">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 mb-4"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">Member Dashboard</span>
                  </motion.div>

                  <h1 className="text-4xl font-bold text-white mb-4 font-display">
                    Welcome back, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-200 to-pink-200">
                      {auth.user?.name || profile?.name || 'Guest'}!
                    </span>
                  </h1>

                  <p className="text-white/90 text-lg mb-8 max-w-lg">
                    Ready to satisfy your cravings? Check your rewards and latest offers.
                  </p>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => window.location.href = '/menu'}
                      className="px-6 py-3 bg-white text-fuchsia-600 rounded-xl font-bold shadow-lg shadow-black/20 hover:shadow-black/30 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Utensils className="w-5 h-5" /> Browse Menu
                    </button>
                    <button
                      onClick={() => window.location.href = '/customer/orders'}
                      className="px-6 py-3 bg-white/15 backdrop-blur-md border border-white/30 text-white rounded-xl font-bold hover:bg-white/25 transition-all flex items-center gap-2"
                    >
                      <Clock className="w-5 h-5" /> Recent Orders
                    </button>
                  </div>
                </div>

                {/* Loyalty Card - Desktop */}
                <motion.div
                  variants={itemVariants}
                  className="bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl p-6 relative overflow-hidden self-center"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Award className="w-32 h-32 text-white" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-white/90 text-sm font-medium uppercase tracking-wider">Loyalty Balance</h3>
                        <div className="text-4xl font-bold text-white mt-1">{profile?.loyalty_points || 0} <span className="text-lg text-white/70 font-normal">pts</span></div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-400 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/30">
                        <Star className="w-6 h-6 fill-current" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between text-sm text-white/90">
                        <span>Progress to next reward</span>
                        <span>{Math.min(((profile?.loyalty_points || 0) % 100), 100)}%</span>
                      </div>
                      <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-fuchsia-300 to-pink-300 rounded-full"
                          style={{ width: `${Math.min(((profile?.loyalty_points || 0) % 100), 100)}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setShowRewardsModal(true)}
                      className="w-full py-3 rounded-xl bg-white text-fuchsia-600 font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <Gift className="w-5 h-5" /> Redeem Rewards
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {[
              { label: 'Total Orders', value: profile?.total_orders || 0, icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800/50' },
              { label: 'Total Spent', value: `$${(profile?.total_spent || 0).toFixed(2)}`, icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-800/50' },
              { label: 'Points Earned', value: `+${stats?.points_earned_this_month || 0}`, icon: Zap, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800/50', sub: 'This Month', hideOnMobile: true },
              { label: 'Available Rewards', value: stats?.available_rewards || 0, icon: Gift, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-800/50' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={cn(
                  "relative rounded-xl sm:rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 md:p-6 transition-all hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:border-fuchsia-200 dark:hover:border-fuchsia-700",
                  stat.hideOnMobile && "hidden lg:block"
                )}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={cn("p-2.5 sm:p-3 rounded-xl border", stat.bg, stat.border)}>
                    <stat.icon className={cn("w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7", stat.color)} />
                  </div>
                  {stat.sub && <span className="text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{stat.sub}</span>}
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Loyalty Program CTA */}
          <motion.div
            variants={itemVariants}
            className="mt-3 sm:mt-4 md:mt-6 hidden sm:block"
          >
            <button
              onClick={() => window.location.href = '/customer/loyalty'}
              className="w-full md:w-auto group relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-fuchsia-600 bg-[length:200%_100%] p-4 sm:p-5 md:p-6 shadow-xl shadow-fuchsia-500/30 border border-fuchsia-500/20 hover:bg-[position:100%_0] hover:shadow-2xl hover:shadow-fuchsia-500/40 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm sm:text-lg font-bold text-white">Loyalty Rewards Program</h3>
                    <p className="text-[11px] sm:text-sm text-white/80">View your tier, earn points, and unlock rewards</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </motion.div>

          <BrandDivider variant="dots" className="opacity-30 my-6 sm:my-8" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content - Recent Orders */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display">Recent Activity</h2>
                <button onClick={() => window.location.href = '/customer/orders'} className="text-sm font-medium text-fuchsia-600 hover:text-fuchsia-700 transition-colors">View All Orders</button>
              </div>

              {ordersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.slice(0, 3).map((order) => (
                    <div
                      key={order.id}
                      onClick={() => window.location.href = `/customer/orders/${order.id}`}
                      className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer group transition-all hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:border-fuchsia-200 dark:hover:border-fuchsia-700"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-fuchsia-500 group-hover:bg-fuchsia-100 dark:group-hover:bg-fuchsia-900/30 transition-colors">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">Order #{order.id}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} items</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900 dark:text-white">${Number(order.total_amount).toFixed(2)}</div>
                        <div className={cn("text-xs font-bold uppercase tracking-wider mt-1",
                          order.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                            order.status === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                        )}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                  <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No recent orders found.</p>
                  <button
                    onClick={() => window.location.href = '/menu'}
                    className="mt-4 px-4 py-2 bg-fuchsia-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-fuchsia-700 transition-colors"
                  >
                    Order Now
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar - Reservations & Favorites - Hidden on mobile */}
            <div className="hidden lg:space-y-6 lg:block">
              {/* Upcoming Reservations */}
              <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">Reservations</h3>
                  <button onClick={() => window.location.href = '/customer/reservations'} className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" /></button>
                </div>

                {reservationsLoading ? (
                  <div className="h-14 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
                ) : customerReservations.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {customerReservations.slice(0, 3).map(res => (
                      <div key={res.id} className="p-2.5 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 flex justify-between items-center group hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-colors">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-[10px] sm:text-xs border border-orange-200 dark:border-orange-800/50">
                            {new Date(res.reserved_for).getDate()}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">{new Date(res.reserved_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{res.guest_count} Guests</div>
                          </div>
                        </div>
                        {res.status === 'pending' && (
                          <button onClick={() => handleCancelReservation(res.id)} className="text-[10px] sm:text-xs text-red-500 dark:text-red-400 hover:underline">Cancel</button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 sm:py-6">
                    <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-3">No upcoming reservations</p>
                    <button onClick={() => window.location.href = '/customer/reservations'} className="text-[10px] sm:text-xs font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider hover:underline">Book a Table</button>
                  </div>
                )}
              </div>

              {/* Favorites */}
              <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 text-sm sm:text-base">Your Favorites</h3>
                {profile?.favorite_items && profile.favorite_items.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {profile.favorite_items.slice(0, 4).map(item => (
                      <div
                        key={item.id}
                        onClick={() => window.location.href = `/menu?item=${item.id}`}
                        className="flex items-center gap-2.5 sm:gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group"
                      >
                        <img src={item.image_path || '/images/default-food.png'} alt={item.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-600" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[11px] sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors">{item.name}</h4>
                          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">${Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-500 dark:text-fuchsia-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 text-center py-3 sm:py-4">Make some orders to see favorites!</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* REWARDS MODAL */}
        <AnimatePresence>
          {showRewardsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRewardsModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-6 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2"><Gift className="w-6 h-6" /> Rewards Marketplace</h2>
                    <button onClick={() => setShowRewardsModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 rounded-xl p-4 backdrop-blur-md">
                    <span className="font-medium opacity-90">Your Balance</span>
                    <span className="text-2xl font-bold flex items-center gap-1">{profile?.loyalty_points || 0} <Star className="w-4 h-4 fill-current" /></span>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                  {rewardsLoading ? (
                    <div className="text-center py-10 text-gray-500">Loading rewards...</div>
                  ) : REWARDS.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">No rewards available yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {REWARDS.map(reward => {
                        const canRedeem = (profile?.loyalty_points || 0) >= reward.points_required;
                        return (
                          <div
                            key={reward.id}
                            className={cn(
                              "border-2 rounded-2xl p-4 transition-all relative overflow-hidden group",
                              canRedeem
                                ? "border-fuchsia-100 hover:border-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-900/10 dark:border-fuchsia-900/50 dark:hover:border-fuchsia-500"
                                : "border-gray-100 bg-gray-50 opacity-60 dark:bg-gray-800 dark:border-gray-700"
                            )}
                          >
                            <div className="text-3xl mb-3">{reward.icon}</div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-1">{reward.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 h-10">{reward.description}</p>

                            <div className="flex items-center justify-between mt-auto">
                              <span className={cn("text-sm font-bold", canRedeem ? "text-fuchsia-600" : "text-gray-400")}>
                                {reward.points_required} Points
                              </span>
                              <button
                                onClick={() => handleRedeemReward(reward)}
                                disabled={!canRedeem}
                                className={cn(
                                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-colors",
                                  canRedeem
                                    ? "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-md hover:shadow-lg"
                                    : "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700"
                                )}
                              >
                                Redeem
                              </button>
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
        </AnimatePresence>
      </CustomerLayout>
    </RequireAuth>
  );
}
