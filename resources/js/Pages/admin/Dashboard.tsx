import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/app/layouts/AdminLayout';
import { AlertBanner, Alert } from '@/app/components/dashboard/AlertBanner';
import { ApprovalQueue } from '@/app/components/dashboard/ApprovalQueue';
import { TeamStatusBar } from '@/app/components/dashboard/TeamStatusBar';
import { SystemHealthDisplay } from '@/app/components/dashboard/SystemHealthDisplay';
import { OrderStatusDisplay } from '@/app/components/dashboard/OrderStatusDisplay';
import { BoldStatCard } from '@/app/components/dashboard/BoldStatCard';
import { BoldQuickActions } from '@/app/components/dashboard/BoldQuickActions';
import { BoldRevenueChart } from '@/app/components/dashboard/BoldRevenueChart';
import { BoldTopItemsChart } from '@/app/components/dashboard/BoldTopItemsChart';
import { BranchOverviewWidget } from '@/app/components/dashboard/BranchOverviewWidget';
import {
  DollarSign, ShoppingCart, TrendingUp, Users, Package, Clock,
  ReceiptText, BarChart3, Calendar, Settings, Shield, ClipboardList,
  RefreshCw, Activity, Sparkles
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { apiGet } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';
import { useSmartPolling } from '@/app/hooks/useSmartPolling';
import { useTranslation } from '@/app/hooks/useTranslation';

// Types
interface DashboardSummary {
  user: {
    name: string;
    role: string;
    roles: string[];
  };
  today: string;
  greeting: string;
  system_health?: {
    api: { status: string; uptime: string };
    database: { status: string; connections: string };
    queue: { status: string; pending: number };
  };
  critical_alerts?: { type: string; severity: string; message: string; action: string }[];
  performance?: {
    revenue: number;
    orders: number;
    completed_orders: number;
    completion_rate: number;
  };
  pending_approvals?: {
    orders: number;
    time_off: number;
    inventory: number;
  };
  team_status?: {
    total: number;
    by_position: Record<string, number>;
  };
  my_tasks?: { id: number; order_number: string; status: string; table?: string }[];
  my_performance?: { orders_this_week: number };
  quick_actions?: { label: string; icon: string; href: string }[];
  branch_overview?: any[];
}

interface QuickStats {
  revenue: { today: number; yesterday: number; change_percent: number };
  orders: { today: number; yesterday: number; active: number; by_status: Record<string, number> };
  last_updated: string;
}

interface DashboardProps {
  dashboardSummary: DashboardSummary;
  alerts: Alert[];
  quickStats: QuickStats;
  activityFeed: any[];
  initialKPIs: { total_revenue: number; total_orders: number; avg_order_value: number };
  initialRevenue: any;
  initialOrderStatus: any[];
  initialTopItems: any[];
}

// Icon mapping utility
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'chart-bar': BarChart3,
  'users': Users,
  'settings': Settings,
  'shield': Shield,
  'clipboard-list': ClipboardList,
  'receipt': ReceiptText,
  'calendar': Calendar,
  'grid': Package,
  'clock': Clock,
};

// Format currency helper
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function Dashboard({
  dashboardSummary,
  alerts,
  quickStats,
  activityFeed,
  initialKPIs,
  initialRevenue,
  initialOrderStatus,
  initialTopItems
}: DashboardProps) {
  useSmartPolling(['dashboard'], 30000);
  const { t } = useTranslation();

  const isAdmin = useMemo(() =>
    dashboardSummary?.user?.roles?.some(r => ['super-admin', 'admin'].includes(r)) ?? false
    , [dashboardSummary]);

  const isManager = useMemo(() =>
    dashboardSummary?.user?.roles?.some(r => ['manager', 'service-manager', 'chief'].includes(r)) ?? false
    , [dashboardSummary]);

  const isEmployee = !isAdmin && !isManager;

  // Fetch fresh quick stats
  const { data: liveStats, refetch: refetchStats, isFetching } = useQuery({
    queryKey: ['dashboard-quick-stats'],
    queryFn: () => apiGet('/api/admin/dashboard/quick-stats'),
    initialData: quickStats,
    refetchInterval: 30000,
  });

  const stats = liveStats || quickStats;

  return (
    <AdminLayout>
      <Head title={t('admin.dashboard.title') as string} />

      {/* Light/Dark mode adaptive background */}
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-fuchsia-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/50">
        <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4 md:space-y-6">

          {/* Bold Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(217, 70, 239, 0.4)',
                    '0 0 40px rgba(217, 70, 239, 0.6)',
                    '0 0 20px rgba(217, 70, 239, 0.4)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-2xl bg-gradient-to-br from-fuchsia-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-fuchsia-500/40"
              >
                <Activity className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 dark:from-white dark:via-fuchsia-200 dark:to-purple-200 bg-clip-text text-transparent"
                >
                  {dashboardSummary?.greeting || t('admin.dashboard.welcome')}, {dashboardSummary?.user?.name?.split(' ')[0] || t('admin.dashboard.fallbacks.user_name')}!
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-400 flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-fuchsia-400" />
                  <span className="text-xs sm:text-base">
                    {dashboardSummary?.today ? `${format(new Date(dashboardSummary.today), 'EEEE, MMMM d, yyyy')}` : t('admin.dashboard.command_center')}
                  </span>
                </motion.p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => refetchStats()}
                disabled={isFetching}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-xl",
                  "bg-gradient-to-r from-gray-800 to-gray-900 border border-white/10",
                  "text-white font-medium shadow-lg shadow-black/20",
                  "hover:border-fuchsia-500/50 transition-all",
                  isFetching && "opacity-50"
                )}
              >
                <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                <span className="hidden sm:inline">{t('admin.dashboard.refresh')}</span>
              </motion.button>

              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/30"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"
                />
                <span className="text-sm font-bold text-emerald-400">{t('admin.dashboard.live')}</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Alerts Section */}
          {(isAdmin || isManager) && alerts && alerts.length > 0 && (
            <AlertBanner alerts={alerts} />
          )}

          {/* Bold Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            <BoldStatCard
              title={t('admin.dashboard.stats.revenue') as string}
              value={formatCurrency(stats?.revenue?.today || 0)}
              icon={DollarSign}
              variant="revenue"
              trend={stats?.revenue?.change_percent ? {
                value: Math.abs(stats.revenue.change_percent),
                isPositive: stats.revenue.change_percent > 0
              } : undefined}
            />
            <BoldStatCard
              title={t('admin.dashboard.stats.orders') as string}
              value={String(stats?.orders?.today || 0)}
              icon={ShoppingCart}
              variant="orders"
              trend={(stats?.orders?.yesterday && stats?.orders?.today !== undefined) ? {
                value: Math.abs(Math.round((((stats.orders.today ?? 0) - (stats.orders.yesterday ?? 0)) / Math.max(stats.orders.yesterday ?? 1, 1)) * 100)),
                isPositive: (stats.orders.today ?? 0) >= (stats.orders.yesterday ?? 0)
              } : undefined}
            />
            <BoldStatCard
              title={t('admin.dashboard.stats.active_orders') as string}
              value={String(stats?.orders?.active || 0)}
              icon={Package}
              variant="active"
            />
            <BoldStatCard
              title={t('admin.dashboard.stats.avg_order_value') as string}
              value={formatCurrency(initialKPIs?.avg_order_value || 0)}
              icon={TrendingUp}
              variant="average"
            />
          </div>

          {/* Role-Based Content */}
          {isAdmin && (
            <AdminDashboardContent
              systemHealth={dashboardSummary?.system_health}
              criticalAlerts={dashboardSummary?.critical_alerts || []}
              quickActions={dashboardSummary?.quick_actions || []}
              revenueData={initialRevenue}
              orderStatusData={initialOrderStatus}
              topItemsData={initialTopItems}
              teamStatus={dashboardSummary?.team_status}
              pendingApprovals={dashboardSummary?.pending_approvals}
              branchOverview={dashboardSummary?.branch_overview}
            />
          )}

          {isManager && !isAdmin && (
            <ManagerDashboardContent
              pendingApprovals={dashboardSummary?.pending_approvals}
              teamStatus={dashboardSummary?.team_status}
              quickActions={dashboardSummary?.quick_actions || []}
              revenueData={initialRevenue}
              orderStatusData={initialOrderStatus}
            />
          )}

          {isEmployee && (
            <EmployeeDashboardContent
              myTasks={dashboardSummary?.my_tasks || []}
              myPerformance={dashboardSummary?.my_performance}
              quickActions={dashboardSummary?.quick_actions || []}
            />
          )}

        </div>
      </div>
    </AdminLayout>
  );
}

// ==================== Admin Dashboard Content ====================
function AdminDashboardContent({
  systemHealth,
  criticalAlerts,
  quickActions,
  revenueData,
  orderStatusData,
  topItemsData,
  teamStatus,
  pendingApprovals,
  branchOverview
}: any) {
  return (
    <>
      {/* Branch Overview - Multi-branch support */}
      {branchOverview && branchOverview.length > 0 && (
        <div className="mb-6">
          <BranchOverviewWidget branches={branchOverview} />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Health */}
        {systemHealth && (
          <SystemHealthDisplay health={systemHealth} />
        )}
        {/* Team Status */}
        {teamStatus && (
          <TeamStatusBar
            total={teamStatus?.total || 0}
            byPosition={teamStatus?.by_position || {}}
          />
        )}
      </div>

      {/* Pending Approvals */}
      {pendingApprovals && (
        <div className="mb-6">
          <ApprovalQueue approvals={pendingApprovals} />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        <BoldRevenueChart
          data={revenueData || []}
          className="lg:col-span-4"
        />
        <OrderStatusDisplay
          data={orderStatusData || []}
          className="lg:col-span-3"
        />
      </div>

      {/* Top Items */}
      <BoldTopItemsChart data={topItemsData || []} />

      {/* Quick Actions */}
      <BoldQuickActions actions={quickActions} iconMap={iconMap} />

    </>
  );
}

// ==================== Manager Dashboard Content ====================
function ManagerDashboardContent({
  pendingApprovals,
  teamStatus,
  quickActions,
  revenueData,
  orderStatusData
}: any) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <ApprovalQueue approvals={pendingApprovals} />
        <TeamStatusBar
          total={teamStatus?.total || 0}
          byPosition={teamStatus?.by_position || {}}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BoldRevenueChart data={revenueData || []} />
        <OrderStatusDisplay data={orderStatusData || []} />
      </div>

      <BoldQuickActions actions={quickActions} iconMap={iconMap} />
    </>
  );
}

// ==================== Employee Dashboard Content ====================
function EmployeeDashboardContent({ myTasks, myPerformance, quickActions }: any) {
  const { t } = useTranslation();
  return (
    <>
      {/* My Tasks */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 border border-white/10 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 shadow-lg shadow-fuchsia-500/40">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{t('admin.dashboard.stats.active_tasks')}</h3>
            <p className="text-sm text-gray-400">{t('admin.dashboard.stats.assigned_orders')}</p>
          </div>
        </div>

        {myTasks && myTasks.length > 0 ? (
          <div className="space-y-3">
            {myTasks.map((task: any, index: number) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-fuchsia-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center">
                    <ReceiptText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{t('admin.dashboard.tasks.order_prefix')}{task.order_number}</p>
                    {task.table && <p className="text-sm text-gray-400">{t('admin.dashboard.tasks.table_prefix')}{task.table}</p>}
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold capitalize",
                  task.status === 'ready' && "bg-emerald-500/20 text-emerald-400",
                  task.status === 'preparing' && "bg-orange-500/20 text-orange-400",
                  task.status === 'pending' && "bg-amber-500/20 text-amber-400",
                  task.status === 'received' && "bg-blue-500/20 text-blue-400"
                )}>
                  {t(`common.ui.badge.status.${task.status}` as any) || task.status}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">{t('admin.dashboard.stats.no_tasks')}</p>
          </div>
        )}

        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/10 rounded-full blur-3xl" />
      </motion.div>

      {/* Performance */}
      {myPerformance && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 border border-white/10 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/40">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-white text-lg">{t('admin.dashboard.stats.performance')}</h3>
          </div>

          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-6xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"
              >
                {myPerformance.orders_this_week || 0}
              </motion.span>
              <p className="text-gray-400 mt-2">{t('admin.dashboard.stats.orders_completed')}</p>
            </div>
          </div>

          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-full blur-3xl" />
        </motion.div>
      )}

      {/* Quick Actions */}
      <BoldQuickActions actions={quickActions} iconMap={iconMap} />
    </>
  );
}
