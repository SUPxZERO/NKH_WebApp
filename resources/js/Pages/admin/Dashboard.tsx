import React, { useState } from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { TrendingUp, TrendingDown, Users, Timer, CheckCircle, DollarSign, Package, Clock, AlertCircle, ShoppingBag, Utensils, Calendar, ArrowRight } from 'lucide-react';
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

// Stats Card Component - Theme Aware
const StatCard = ({ title, value, icon: Icon, change, trend, color }: any) => {
  const colorStyles = {
    purple: {
      bg: 'bg-primary-muted dark:bg-primary/10',
      border: 'border-primary/20',
      icon: 'text-primary',
    },
    emerald: {
      bg: 'bg-success-muted dark:bg-success/10',
      border: 'border-success/20',
      icon: 'text-success',
    },
    orange: {
      bg: 'bg-warning-muted dark:bg-warning/10',
      border: 'border-warning/20',
      icon: 'text-warning',
    },
    blue: {
      bg: 'bg-info-muted dark:bg-info/10',
      border: 'border-info/20',
      icon: 'text-info',
    },
  };

  const styles = colorStyles[color as keyof typeof colorStyles] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-6 hover:shadow-theme-lg transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center border', styles.bg, styles.border)}>
          <Icon className={cn('w-6 h-6', styles.icon)} />
        </div>
        {change && (
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              trend === 'up' ? 'bg-success-muted text-success' : 'bg-destructive-muted text-destructive'
            )}
          >
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}%
          </div>
        )}
      </div>
      <div>
        <p className="text-muted-foreground text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
};

// Order Status Card - Theme Aware
const OrderStatusCard = ({ label, value, icon: Icon, colorClass }: any) => {
  const colorStyles: Record<string, { text: string; icon: string }> = {
    yellow: { text: 'text-status-pending', icon: 'text-status-pending' },
    orange: { text: 'text-warning', icon: 'text-warning' },
    green: { text: 'text-success', icon: 'text-success' },
    blue: { text: 'text-info', icon: 'text-info' },
    red: { text: 'text-destructive', icon: 'text-destructive' },
  };

  const styles = colorStyles[colorClass] || colorStyles.yellow;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon className={cn('w-4 h-4', styles.icon)} />
      </div>
      <div className={cn('text-2xl font-bold', styles.text)}>{value}</div>
    </div>
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
      <div className="min-h-screen bg-background p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <Skeleton className="h-12 w-12 rounded-xl mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))
          ) : (
            <>
              <StatCard title="Revenue Today" value={`$${totalRevenue.toFixed(2)}`} icon={DollarSign}
                change={12.5} trend="up" color="purple" />
              <StatCard title="Active Orders" value={activeOrders} icon={Package}
                change={8.2} trend="up" color="emerald" />
              <StatCard title="Preparing" value={orderStats?.preparing || 0} icon={Timer}
                color="orange" />
              <StatCard title="Completed" value={orderStats?.delivered || 0} icon={CheckCircle}
                change={5.4} trend="up" color="blue" />
            </>
          )}
        </div>

        {/* Charts & Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Revenue Chart */}
          <Card hover={false} className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-lg">Revenue Trend</h3>
                <div className="flex gap-2">
                  {['daily', 'weekly', 'monthly'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setRevenuePeriod(period as any)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium transition-all',
                        revenuePeriod === period
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
                      )}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <RevenueLine data={Array.isArray(revenue) ? revenue : []} />
              )}
            </CardContent>
          </Card>

          {/* Top Employees */}
          <Card hover={false}>
            <CardHeader>
              <h3 className="font-semibold text-foreground text-lg">Top Performers</h3>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(analytics?.employees || []).slice(0, 5).map((e, idx) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between px-3 py-3 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary-600 flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm">{e.name}</div>
                          <div className="text-xs text-muted-foreground">{e.ordersHandled} orders</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-warning">
                        <span className="text-sm font-medium">{e.rating}</span>
                        <span className="text-xs">⭐</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Status Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {statsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))
          ) : (
            <>
              <OrderStatusCard label="Pending" value={orderStats?.pending || 0} icon={Clock} colorClass="yellow" />
              <OrderStatusCard label="Preparing" value={orderStats?.preparing || 0} icon={Utensils} colorClass="orange" />
              <OrderStatusCard label="Ready" value={orderStats?.ready || 0} icon={ShoppingBag} colorClass="green" />
              <OrderStatusCard label="Delivered" value={orderStats?.delivered || 0} icon={CheckCircle} colorClass="blue" />
              <OrderStatusCard label="Cancelled" value={orderStats?.cancelled || 0} icon={AlertCircle} colorClass="red" />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Card hover={false}>
          <CardHeader>
            <h3 className="font-semibold text-foreground text-lg">Quick Actions</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'View Orders', icon: Package, href: '/admin/orders', color: 'purple' },
                { label: 'Reservations', icon: Calendar, href: '/admin/reservations', color: 'blue' },
                { label: 'Menu Items', icon: Utensils, href: '/admin/menu-items', color: 'emerald' },
                { label: 'Employees', icon: Users, href: '/admin/employees', color: 'orange' },
              ].map((action, idx) => {
                const colorStyles: Record<string, { bg: string; border: string; icon: string }> = {
                  purple: {
                    bg: 'bg-primary-muted dark:bg-primary/10',
                    border: 'border-primary/20',
                    icon: 'text-primary',
                  },
                  blue: {
                    bg: 'bg-info-muted dark:bg-info/10',
                    border: 'border-info/20',
                    icon: 'text-info',
                  },
                  emerald: {
                    bg: 'bg-success-muted dark:bg-success/10',
                    border: 'border-success/20',
                    icon: 'text-success',
                  },
                  orange: {
                    bg: 'bg-warning-muted dark:bg-warning/10',
                    border: 'border-warning/20',
                    icon: 'text-warning',
                  },
                };

                const styles = colorStyles[action.color] || colorStyles.purple;

                return (
                  <motion.a
                    key={action.label}
                    href={action.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-secondary transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center border', styles.bg, styles.border)}>
                        <action.icon className={cn('w-5 h-5', styles.icon)} />
                      </div>
                      <span className="font-medium text-foreground text-sm">{action.label}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </motion.a>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
