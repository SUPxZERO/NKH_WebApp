import React, { useState } from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { Button } from '@/app/components/ui/Button';
import {
  TrendingUp, TrendingDown, Users, Timer, CheckCircle, DollarSign,
  Package, Clock, AlertCircle, ShoppingBag, Utensils, Calendar,
  ArrowRight, Activity, Star, Zap, BarChart3, PieChart, RefreshCcw,
  ChevronRight, Sparkles, Target, Award, Menu
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

// Compact Stats Card for Mobile
const StatCard = ({ title, value, icon: Icon, change, trend, color, index = 0 }: any) => {
  const colorStyles = {
    purple: { gradient: 'from-fuchsia-500 to-purple-600', iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600', text: 'text-fuchsia-500' },
    emerald: { gradient: 'from-emerald-500 to-green-600', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-emerald-500' },
    orange: { gradient: 'from-amber-500 to-orange-600', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-amber-500' },
    blue: { gradient: 'from-blue-500 to-cyan-600', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-500' },
  };

  const styles = colorStyles[color as keyof typeof colorStyles] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", styles.iconBg)}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold", styles.text)}>{value}</p>
          </div>
        </div>
        {change && (
          <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", trend === 'up' ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-600')}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}%
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Compact Order Status Card
const OrderStatusCard = ({ label, value, icon: Icon, colorClass, index = 0 }: any) => {
  const colorStyles: Record<string, { gradient: string; text: string; }> = {
    yellow: { gradient: 'from-amber-500 to-yellow-500', text: 'text-amber-600' },
    orange: { gradient: 'from-orange-500 to-amber-500', text: 'text-orange-600' },
    green: { gradient: 'from-emerald-500 to-green-500', text: 'text-emerald-600' },
    blue: { gradient: 'from-blue-500 to-cyan-500', text: 'text-blue-600' },
    red: { gradient: 'from-red-500 to-rose-500', text: 'text-red-600' },
  };

  const styles = colorStyles[colorClass] || colorStyles.yellow;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03 }}
      className="bg-card border border-border rounded-xl p-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-2">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", `bg-gradient-to-br ${styles.gradient}`)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <span className={cn("text-xl font-bold", styles.text)}>{value}</span>
    </motion.div>
  );
};

// Compact Quick Action Card
const QuickActionCard = ({ label, icon: Icon, href, color, index = 0 }: any) => {
  const colorStyles: Record<string, { gradient: string; }> = {
    purple: { gradient: 'from-fuchsia-500 to-purple-600' },
    blue: { gradient: 'from-blue-500 to-cyan-600' },
    emerald: { gradient: 'from-emerald-500 to-green-600' },
    orange: { gradient: 'from-amber-500 to-orange-600' },
  };

  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", `bg-gradient-to-br ${styles.gradient}`)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
      <div className="min-h-screen bg-background p-4 md:p-6">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Welcome back! Here's what's happening.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-emerald-600">Live</span>
            </div>
            <Button variant="secondary" size="sm" className="h-8 px-3">
              <RefreshCcw className="w-3.5 h-3.5 mr-1" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </motion.div>

        {/* Main Stats Grid - 2 columns on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <Skeleton className="h-10 w-10 rounded-lg mb-2" />
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))
          ) : (
            <>
              <StatCard title="Revenue" value={`$${totalRevenue.toFixed(0)}`} icon={DollarSign} change={12.5} trend="up" color="purple" index={0} />
              <StatCard title="Active" value={activeOrders} icon={Package} color="emerald" index={1} />
              <StatCard title="Preparing" value={orderStats?.preparing || 0} icon={Timer} color="orange" index={2} />
              <StatCard title="Done" value={orderStats?.delivered || 0} icon={CheckCircle} change={5.4} trend="up" color="blue" index={3} />
            </>
          )}
        </div>

        {/* Revenue Chart - Full width on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-sm">Revenue</h3>
              </div>
              <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
                {(['daily', 'weekly', 'monthly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setRevenuePeriod(period)}
                    className={cn(
                      'px-3 py-1 rounded-md text-xs font-medium transition-all',
                      revenuePeriod === period
                        ? 'bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-4">
            {revenueLoading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : (
              <RevenueLine data={Array.isArray(revenue) ? revenue : []} />
            )}
          </div>
        </motion.div>

        {/* Order Status - Horizontal scroll on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="font-semibold text-base">Orders</h2>
          </div>
          {/* Horizontal scroll container for mobile */}
          <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex gap-3 min-w-max md:grid md:grid-cols-5">
              {statsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-32 bg-card border border-border rounded-xl p-3">
                    <Skeleton className="h-8 w-8 rounded-lg mb-2" />
                    <Skeleton className="h-5 w-12" />
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
          </div>
        </motion.div>

        {/* Top Performers - Stack below on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl overflow-hidden mb-6"
        >
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="font-semibold text-sm">Top Performers</h3>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))
            ) : (
              (analytics?.employees || []).slice(0, 5).map((e, idx) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    idx === 0 ? "bg-amber-500/10 border-amber-500/30" :
                    idx === 1 ? "bg-slate-400/10 border-slate-400/30" :
                    idx === 2 ? "bg-orange-400/10 border-orange-400/30" :
                    "bg-secondary/30 border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-sm",
                      idx === 0 ? "bg-gradient-to-br from-amber-500 to-orange-600" :
                      idx === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500" :
                      idx === 2 ? "bg-gradient-to-br from-orange-400 to-amber-500" :
                      "bg-gradient-to-br from-gray-400 to-gray-500"
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.ordersHandled} orders</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-amber-600">{e.rating}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions - 2 columns on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <h2 className="font-semibold text-base">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickActionCard label="Orders" icon={Package} href="/admin/orders" color="purple" index={0} />
            <QuickActionCard label="Reservations" icon={Calendar} href="/admin/reservations" color="blue" index={1} />
            <QuickActionCard label="Menu" icon={Utensils} href="/admin/menu-items" color="emerald" index={2} />
            <QuickActionCard label="Employees" icon={Users} href="/admin/employees" color="orange" index={3} />
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
