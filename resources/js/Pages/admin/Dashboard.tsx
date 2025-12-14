import React, { useState } from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { Button } from '@/app/components/ui/Button';
import {
  TrendingUp, TrendingDown, Users, Timer, CheckCircle, DollarSign,
  Package, Clock, AlertCircle, ShoppingBag, Utensils, Calendar,
  ArrowRight, Activity, Star, Zap, BarChart3, PieChart, RefreshCcw,
  ChevronRight, Sparkles, Target, Award
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';
import RevenueLine from '@/app/components/charts/RevenueLine';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';

interface Employee { id: number; name: string; ordersHandled: number; rating: number; }
interface Analytics { employees: Employee[]; }
interface OrderStats { pending: number; preparing: number; ready: number; delivered: number; cancelled: number; }
interface RevenuePoint { label: string; value: number; }

const useDashboardAnalytics = () => {
  return useQuery<Analytics>({
    queryKey: ['admin.dashboard.analytics'],
    queryFn: async () => {
      const res = await apiGet('/api/admin/dashboard/analytics');
      return res?.data as Analytics;
    },
  });
};

const useOrderStats = () => {
  return useQuery<OrderStats>({
    queryKey: ['admin.dashboard.orderStats'],
    queryFn: async () => {
      const res = await apiGet('/api/admin/dashboard/orders/stats');
      return res?.data as OrderStats;
    },
  });
};

const useRevenue = (period: 'daily' | 'weekly' | 'monthly') => {
  return useQuery<RevenuePoint[]>({
    queryKey: ['admin.dashboard.revenue', period],
    queryFn: async () => {
      const res = await apiGet(`/api/admin/dashboard/revenue/${period}`);
      const arr = res?.data as RevenuePoint[] | undefined;
      return Array.isArray(arr) ? arr : [];
    },
  });
};

// Enhanced Stats Card with Vibrant Gradients
const StatCard = ({ title, value, icon: Icon, change, trend, color, index = 0 }: any) => {
  const colorStyles = {
    purple: {
      gradient: 'from-fuchsia-500 to-purple-600',
      lightBg: 'from-fuchsia-500/20 to-purple-500/10',
      iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
      shadow: 'shadow-fuchsia-500/20',
      border: 'border-fuchsia-500/30',
      text: 'text-fuchsia-500',
    },
    emerald: {
      gradient: 'from-emerald-500 to-green-600',
      lightBg: 'from-emerald-500/20 to-green-500/10',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      shadow: 'shadow-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-500',
    },
    orange: {
      gradient: 'from-amber-500 to-orange-600',
      lightBg: 'from-amber-500/20 to-orange-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-500',
    },
    blue: {
      gradient: 'from-blue-500 to-cyan-600',
      lightBg: 'from-blue-500/20 to-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      shadow: 'shadow-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-500',
    },
  };

  const styles = colorStyles[color as keyof typeof colorStyles] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden bg-card border rounded-2xl p-6",
        "hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
        styles.border,
        `hover:${styles.shadow}`
      )}
    >
      {/* Background Gradient Decoration */}
      <div className={cn(
        "absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-50 blur-2xl",
        `bg-gradient-to-br ${styles.lightBg}`
      )} />
      <div className={cn(
        "absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-30 blur-xl",
        `bg-gradient-to-br ${styles.lightBg}`
      )} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
            styles.iconBg,
            styles.shadow
          )}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          {change && (
            <div
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border',
                trend === 'up'
                  ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-gradient-to-r from-red-500/20 to-rose-500/10 text-red-600 dark:text-red-400 border-red-500/30'
              )}
            >
              {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {change}%
            </div>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
          <p className={cn("text-4xl font-extrabold", styles.text)}>{value}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Order Status Card with Gradients
const OrderStatusCard = ({ label, value, icon: Icon, colorClass, index = 0 }: any) => {
  const colorStyles: Record<string, {
    gradient: string;
    bg: string;
    text: string;
    border: string;
    shadow: string;
  }> = {
    yellow: {
      gradient: 'from-amber-500 to-yellow-500',
      bg: 'from-amber-500/20 to-yellow-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      shadow: 'shadow-amber-500/20',
    },
    orange: {
      gradient: 'from-orange-500 to-amber-500',
      bg: 'from-orange-500/20 to-amber-500/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-500/30',
      shadow: 'shadow-orange-500/20',
    },
    green: {
      gradient: 'from-emerald-500 to-green-500',
      bg: 'from-emerald-500/20 to-green-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      shadow: 'shadow-emerald-500/20',
    },
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'from-blue-500/20 to-cyan-500/10',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/30',
      shadow: 'shadow-blue-500/20',
    },
    red: {
      gradient: 'from-red-500 to-rose-500',
      bg: 'from-red-500/20 to-rose-500/10',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-500/30',
      shadow: 'shadow-red-500/20',
    },
  };

  const styles = colorStyles[colorClass] || colorStyles.yellow;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative overflow-hidden bg-card border rounded-2xl p-5",
        "hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5",
        styles.border,
        `hover:${styles.shadow}`
      )}
    >
      {/* Background Gradient */}
      <div className={cn(
        "absolute inset-0 opacity-30",
        `bg-gradient-to-br ${styles.bg}`
      )} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center",
            `bg-gradient-to-br ${styles.gradient}`
          )}>
            <Icon className="w-4 h-4 text-white" />
          </div>
        </div>
        <div className={cn('text-3xl font-extrabold', styles.text)}>{value}</div>
      </div>
    </motion.div>
  );
};

// Quick Action Card
const QuickActionCard = ({ label, icon: Icon, href, color, index = 0 }: any) => {
  const colorStyles: Record<string, {
    gradient: string;
    bg: string;
    border: string;
    shadow: string;
    hoverBg: string;
  }> = {
    purple: {
      gradient: 'from-fuchsia-500 to-purple-600',
      bg: 'from-fuchsia-500/10 to-purple-500/5',
      border: 'border-fuchsia-500/20',
      shadow: 'hover:shadow-fuchsia-500/20',
      hoverBg: 'hover:from-fuchsia-500/20 hover:to-purple-500/10',
    },
    blue: {
      gradient: 'from-blue-500 to-cyan-600',
      bg: 'from-blue-500/10 to-cyan-500/5',
      border: 'border-blue-500/20',
      shadow: 'hover:shadow-blue-500/20',
      hoverBg: 'hover:from-blue-500/20 hover:to-cyan-500/10',
    },
    emerald: {
      gradient: 'from-emerald-500 to-green-600',
      bg: 'from-emerald-500/10 to-green-500/5',
      border: 'border-emerald-500/20',
      shadow: 'hover:shadow-emerald-500/20',
      hoverBg: 'hover:from-emerald-500/20 hover:to-green-500/10',
    },
    orange: {
      gradient: 'from-amber-500 to-orange-600',
      bg: 'from-amber-500/10 to-orange-500/5',
      border: 'border-amber-500/20',
      shadow: 'hover:shadow-amber-500/20',
      hoverBg: 'hover:from-amber-500/20 hover:to-orange-500/10',
    },
  };

  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "group relative overflow-hidden flex items-center justify-between p-5 rounded-2xl border",
        "transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl",
        `bg-gradient-to-r ${styles.bg} ${styles.hoverBg}`,
        styles.border,
        styles.shadow
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center shadow-lg",
          `bg-gradient-to-br ${styles.gradient}`
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-bold text-foreground">{label}</span>
          <p className="text-xs text-muted-foreground mt-0.5">Click to manage</p>
        </div>
      </div>
      <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.a>
  );
};

export default function Dashboard() {
  const [revenuePeriod, setRevenuePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data: analytics, isLoading } = useDashboardAnalytics();
  const { data: orderStats, isLoading: statsLoading } = useOrderStats();
  const { data: revenue, isLoading: revenueLoading } = useRevenue(revenuePeriod);

  const totalRevenue = Array.isArray(revenue) ? revenue.reduce((sum, point) => sum + point.value, 0) : 0;
  const activeOrders = (orderStats?.pending || 0) + (orderStats?.preparing || 0);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Live</span>
            </div>
            <Button variant="secondary" size="sm" leftIcon={<RefreshCcw className="w-4 h-4" />}>
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <Skeleton className="h-14 w-14 rounded-2xl mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-32" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                title="Revenue Today"
                value={`$${totalRevenue.toFixed(2)}`}
                icon={DollarSign}
                change={12.5}
                trend="up"
                color="purple"
                index={0}
              />
              <StatCard
                title="Active Orders"
                value={activeOrders}
                icon={Package}
                change={8.2}
                trend="up"
                color="emerald"
                index={1}
              />
              <StatCard
                title="Preparing"
                value={orderStats?.preparing || 0}
                icon={Timer}
                color="orange"
                index={2}
              />
              <StatCard
                title="Completed"
                value={orderStats?.delivered || 0}
                icon={CheckCircle}
                change={5.4}
                trend="up"
                color="blue"
                index={3}
              />
            </>
          )}
        </div>

        {/* Charts & Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-border bg-gradient-to-r from-fuchsia-500/5 to-purple-500/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Revenue Trend</h3>
                    <p className="text-xs text-muted-foreground">Track your earnings over time</p>
                  </div>
                </div>
                <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl">
                  {['daily', 'weekly', 'monthly'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setRevenuePeriod(period as any)}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                        revenuePeriod === period
                          ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      )}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6">
              {revenueLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-48 w-full rounded-xl" />
                </div>
              ) : (
                <RevenueLine data={Array.isArray(revenue) ? revenue : []} />
              )}
            </div>
          </motion.div>

          {/* Top Employees */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-border bg-gradient-to-r from-amber-500/5 to-orange-500/5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Top Performers</h3>
                  <p className="text-xs text-muted-foreground">Best employees this week</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(analytics?.employees || []).slice(0, 5).map((e, idx) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border transition-all",
                        "hover:shadow-md hover:-translate-y-0.5",
                        idx === 0 ? "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/30" :
                        idx === 1 ? "bg-gradient-to-r from-slate-400/10 to-slate-500/5 border-slate-400/30" :
                        idx === 2 ? "bg-gradient-to-r from-orange-400/10 to-amber-500/5 border-orange-400/30" :
                        "bg-secondary/30 border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md",
                          idx === 0 ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20" :
                          idx === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/20" :
                          idx === 2 ? "bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-500/20" :
                          "bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-500/20"
                        )}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{e.name}</div>
                          <div className="text-xs text-muted-foreground">{e.ordersHandled} orders handled</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{e.rating}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Order Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Order Status Overview</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {statsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5">
                  <Skeleton className="h-4 w-20 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))
            ) : (
              <>
                <OrderStatusCard label="Pending" value={orderStats?.pending || 0} icon={Clock} colorClass="yellow" index={0} />
                <OrderStatusCard label="Preparing" value={orderStats?.preparing || 0} icon={Utensils} colorClass="orange" index={1} />
                <OrderStatusCard label="Ready" value={orderStats?.ready || 0} icon={ShoppingBag} colorClass="green" index={2} />
                <OrderStatusCard label="Delivered" value={orderStats?.delivered || 0} icon={CheckCircle} colorClass="blue" index={3} />
                <OrderStatusCard label="Cancelled" value={orderStats?.cancelled || 0} icon={AlertCircle} colorClass="red" index={4} />
              </>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              label="View Orders"
              icon={Package}
              href="/admin/orders"
              color="purple"
              index={0}
            />
            <QuickActionCard
              label="Reservations"
              icon={Calendar}
              href="/admin/reservations"
              color="blue"
              index={1}
            />
            <QuickActionCard
              label="Menu Items"
              icon={Utensils}
              href="/admin/menu-items"
              color="emerald"
              index={2}
            />
            <QuickActionCard
              label="Employees"
              icon={Users}
              href="/admin/employees"
              color="orange"
              index={3}
            />
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
