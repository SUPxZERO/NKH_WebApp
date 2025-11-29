import React, { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion, Variants } from 'framer-motion';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';

// Dashboard Components
import StatCard from '@/app/components/dashboard/StatCard';
import ActivityFeed, { Activity } from '@/app/components/dashboard/ActivityFeed';
import QuickActions, { QuickAction } from '@/app/components/dashboard/QuickActions';
import DashboardChart from '@/app/components/dashboard/DashboardChart';

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

export default function Dashboard() {
  // Data fetching
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('19:00');
  const [bookingGuestCount, setBookingGuestCount] = useState('2');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useQuery({
    queryKey: ['customer.profile'],
    queryFn: () => apiGet<ApiResponse<CustomerProfile>>('/customer/profile').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['customer.stats'],
    queryFn: () =>
      apiGet<ApiResponse<DashboardStats>>('/customer/dashboard/stats').then((r) => r.data),
    staleTime: 1000 * 60,
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
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

  // Transform orders into activity feed
  const activities: Activity[] = useMemo(() => {
    if (!recentOrders) return [];

    return recentOrders.map((order) => ({
      id: order.id,
      type:
        order.status === 'delivered'
          ? 'order_delivered'
          : order.status === 'cancelled'
            ? 'order_cancelled'
            : 'order_placed',
      title: `Order #${order.id}`,
      description:
        order.status === 'delivered'
          ? 'Successfully delivered'
          : order.status === 'cancelled'
            ? 'Order was cancelled'
            : order.status === 'preparing'
              ? 'Being prepared'
              : 'Order placed',
      timestamp: order.placed_at || order.created_at,
      metadata: {
        amount: order.total,
        orderId: String(order.id),
      },
    }));
  }, [recentOrders]);

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
      id: 'track-order',
      label: 'Track Orders',
      description: 'View order status',
      icon: Package,
      color: 'blue',
      onClick: () => (window.location.href = '/orders'),
    },
    {
      id: 'favorites',
      label: 'Favorites',
      description: 'Reorder favorites',
      icon: Heart,
      color: 'red',
      onClick: () => console.log('Favorites'),
    },
    {
      id: 'rewards',
      label: 'My Rewards',
      description: 'View & redeem',
      icon: Gift,
      color: 'purple',
      onClick: () => console.log('Rewards'),
    },
  ];

  const handleCheckAvailability = async () => {
    setBookingError('');
    setBookingSuccess('');
    setAvailabilityMessage(null);

    if (!bookingDate || !bookingTime) {
      setBookingError('Please select a date and time.');
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const res = await apiGet<{ available: boolean; message?: string }>(
        `/customer/reservations/availability?date=${bookingDate}&time=${bookingTime}&guest_count=${bookingGuestCount}`
      );

      if (res.available) {
        setAvailabilityMessage(res.message || 'Great news! A table is available.');
      } else {
        setAvailabilityMessage(res.message || 'No tables available for that time.');
      }
    } catch (error: any) {
      setBookingError(error?.response?.data?.message || 'Failed to check availability.');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleCreateReservation = async () => {
    setBookingError('');
    setBookingSuccess('');
    setAvailabilityMessage(null);

    if (!bookingDate || !bookingTime) {
      setBookingError('Please select a date and time.');
      return;
    }

    setIsBookingSubmitting(true);
    try {
      const reserved_for = `${bookingDate}T${bookingTime}`;
      await apiPost<Reservation>('/customer/reservations', {
        reserved_for,
        guest_count: parseInt(bookingGuestCount, 10),
        notes: bookingNotes || undefined,
      });

      setBookingSuccess('Reservation created successfully!');
      setBookingNotes('');
      await refetchReservations();
    } catch (error: any) {
      setBookingError(error?.response?.data?.message || 'Failed to create reservation.');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if (!window.confirm('Cancel this reservation?')) return;
    setBookingError('');
    setBookingSuccess('');
    try {
      await apiDelete(`/customer/reservations/${reservationId}`);
      await refetchReservations();
    } catch (error: any) {
      setBookingError(error?.response?.data?.message || 'Failed to cancel reservation.');
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
                    leftIcon={<Clock className="w-5 h-5" />}
                    onClick={() => console.log('Quick reorder')}
                  >
                    Quick Reorder
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
            value={profile?.loyalty_points || 0}
            icon={Star}
            color="pink"
            loading={profileLoading}
            trend={
              stats?.points_earned_this_month
                ? { value: stats.points_earned_this_month, isPositive: true }
                : undefined
            }
            onClick={() => console.log('View points history')}
          />

          <StatCard
            title="Total Orders"
            value={profile?.total_orders || 0}
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
            value={`$${(profile?.total_spent || 0).toFixed(2)}`}
            icon={TrendingUp}
            color="green"
            loading={profileLoading}
          />

          <StatCard
            title="Available Rewards"
            value={stats?.available_rewards || 0}
            icon={Gift}
            color="purple"
            loading={statsLoading}
            onClick={() => console.log('View rewards')}
          />
        </motion.section>

        {/* Quick Actions */}
        <motion.section variants={itemVariants}>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <QuickActions actions={quickActions} columns={4} />
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Recent Activity
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Your latest orders and rewards
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<RefreshCw className="w-4 h-4" />}
                    onClick={() => refetchProfile()}
                  >
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ActivityFeed activities={activities} loading={ordersLoading} maxItems={5} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div className="space-y-6" variants={itemVariants}>
            {/* Favorite Items */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Your Favorites
                </h3>
              </CardHeader>
              <CardContent>
                {profileLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : profile?.favorite_items && profile.favorite_items.length > 0 ? (
                  <div className="space-y-2">
                    {profile.favorite_items.slice(0, 5).map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <span className="text-sm font-medium">{item}</span>
                        <Button variant="ghost" size="sm">
                          +
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No favorites yet. Order something delicious!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Next Reward Progress */}
            {profile && profile.next_reward_points > 0 && (
              <Card>
                <CardHeader>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Next Reward
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-semibold">
                          {profile.loyalty_points} / {profile.next_reward_points} pts
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(
                              (profile.loyalty_points / profile.next_reward_points) * 100,
                              100
                            )}%`,
                          }}
                          transition={{ duration: 1, delay: 0.5 }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {profile.next_reward_points - profile.loyalty_points} more points to your
                      next reward!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Special Offers */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold flex items-center gap-2">
                  <Gift className="w-4 h-4 text-orange-500" />
                  Special Offers
                </h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 border border-fuchsia-500/30">
                    <div className="font-medium text-sm">Free Delivery</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      On orders over $25
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                    <div className="font-medium text-sm">20% Off</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Your next pizza order
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.section variants={itemVariants}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Book a Table
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose your time and party size, then confirm your reservation.
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-pink-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Time</label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Guests</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bookingGuestCount}
                      onChange={(e) => setBookingGuestCount(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Notes (optional)</label>
                    <textarea
                      rows={2}
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 resize-none"
                      placeholder="Birthday, quiet table, etc."
                    />
                  </div>
                </div>

                {bookingError && (
                  <div className="mb-2 text-xs text-red-500">
                    {bookingError}
                  </div>
                )}
                {bookingSuccess && (
                  <div className="mb-2 text-xs text-emerald-500">
                    {bookingSuccess}
                  </div>
                )}
                {availabilityMessage && (
                  <div className="mb-2 text-xs text-pink-500">
                    {availabilityMessage}
                  </div>
                )}

                <div className="flex flex-wrap gap-3 mt-2">
                  <Button
                    variant="secondary"
                    leftIcon={<Clock className="w-4 h-4" />}
                    onClick={handleCheckAvailability}
                    disabled={isCheckingAvailability || isBookingSubmitting}
                  >
                    {isCheckingAvailability ? 'Checking...' : 'Check Availability'}
                  </Button>
                  <Button
                    leftIcon={<Utensils className="w-4 h-4" />}
                    onClick={handleCreateReservation}
                    disabled={isBookingSubmitting}
                  >
                    {isBookingSubmitting ? 'Booking...' : 'Book Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    My Reservations
                  </h2>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                {reservationsLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : customerReservations.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You have no upcoming reservations yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {customerReservations.slice(0, 4).map((res) => {
                      const d = new Date(res.reserved_for);
                      return (
                        <div
                          key={res.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                        >
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {d.toLocaleDateString()} • {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {res.guest_count} guests • Table {res.table?.code || 'TBD'} • {res.status}
                            </div>
                          </div>
                          {['pending', 'confirmed'].includes(res.status) && (
                            <button
                              onClick={() => handleCancelReservation(res.id)}
                              className="text-xs font-medium text-red-500 hover:text-red-600"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.section>
      </motion.div>
    </CustomerLayout>
  );
}
