import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle,
  DollarSign, User, Package, ThumbsUp, AlertTriangle, X, UtensilsCrossed,
  ChefHat, Coffee, ShoppingBag, Truck, Filter, CalendarDays, Eye,
  MoreVertical, Play, Timer, Sparkles, TrendingUp, Zap, RefreshCw,
  ArrowUpRight, ReceiptText, CreditCard, MapPin, Phone, Mail
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPut, apiPatch } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Order } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';
import { useSmartPolling } from '@/app/hooks/useSmartPolling';
import { useTranslation } from '@/app/hooks/useTranslation';

// Enhanced Status badge with icons
const StatusBadge = ({ status, size = 'default' }: { status: string; size?: 'default' | 'lg' }) => {
  const { t } = useTranslation();
  const getStatusLabel = (s: string) => t(`admin.orders.status.${s}`) || s;

  const configs: Record<string, { bg: string; text: string; icon: React.ReactNode; glow?: string }> = {
    pending: {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-600 dark:text-amber-400',
      icon: <Clock className={cn(size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} />,
      glow: 'shadow-amber-500/20'
    },
    received: {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-600 dark:text-blue-400',
      icon: <CheckCircle className={cn(size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} />,
      glow: 'shadow-blue-500/20'
    },
    preparing: {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      text: 'text-orange-600 dark:text-orange-400',
      icon: <ChefHat className={cn(size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} />,
      glow: 'shadow-orange-500/20'
    },
    ready: {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: <Sparkles className={cn(size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} />,
      glow: 'shadow-emerald-500/20'
    },
    completed: {
      bg: 'bg-green-500/10 dark:bg-green-500/20',
      text: 'text-green-600 dark:text-green-400',
      icon: <CheckCircle className={cn(size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} />,
      glow: 'shadow-green-500/20'
    },
    cancelled: {
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      text: 'text-red-600 dark:text-red-400',
      icon: <XCircle className={cn(size === 'lg' ? 'w-4 h-4' : 'w-3 h-3')} />,
      glow: 'shadow-red-500/20'
    },
  };

  const config = configs[status] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: null };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium shadow-sm transition-all",
      config.bg,
      config.text,
      config.glow,
      size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
    )}>
      {config.icon}
      <span className="capitalize">{getStatusLabel(status)}</span>
    </span>
  );
};

// Order type badge
const TypeBadge = ({ type }: { type: string }) => {
  const { t } = useTranslation();
  const getTypeLabel = (tType: string) => t(`admin.orders.filter.types.${tType.replace('-', '_')}`) || tType;

  const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'dine-in': {
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      text: 'text-violet-600 dark:text-violet-400',
      icon: <Coffee className="w-3.5 h-3.5" />
    },
    'pickup': {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      text: 'text-cyan-600 dark:text-cyan-400',
      icon: <ShoppingBag className="w-3.5 h-3.5" />
    },
    'delivery': {
      bg: 'bg-pink-500/10 dark:bg-pink-500/20',
      text: 'text-pink-600 dark:text-pink-400',
      icon: <Truck className="w-3.5 h-3.5" />
    },
  };

  const config = configs[type] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: <UtensilsCrossed className="w-3.5 h-3.5" /> };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
      config.bg,
      config.text
    )}>
      {config.icon}
      <span className="capitalize">{getTypeLabel(type)}</span>
    </span>
  );
};

// Stats Card Component
const StatsCard = ({
  label,
  value,
  icon: Icon,
  color,
  isActive,
  onClick
}: {
  label: string;
  value: number;
  icon: any;
  color: string;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={cn(
      "relative flex-1 min-w-[120px] p-4 rounded-2xl border transition-all cursor-pointer text-left",
      "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
      isActive
        ? `border-${color}-500 ring-2 ring-${color}-500/20 shadow-lg`
        : "border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600"
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors",
      `bg-${color}-500/10 dark:bg-${color}-500/20`
    )}>
      <Icon className={cn("w-5 h-5", `text-${color}-500`)} />
    </div>
    <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{label}</p>
    {isActive && (
      <motion.div
        layoutId="activeIndicator"
        className={cn("absolute top-2 right-2 w-2 h-2 rounded-full", `bg-${color}-500`)}
      />
    )}
  </motion.button>
);

// Time ago formatter moved inside component to access translations

// Order Timeline Progress
const OrderProgress = ({ status }: { status: string }) => {
  const stages = ['pending', 'received', 'preparing', 'ready', 'completed'];
  const currentIndex = stages.indexOf(status);

  return (
    <div className="flex items-center gap-1 w-full">
      {stages.map((stage, index) => (
        <React.Fragment key={stage}>
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index <= currentIndex
                ? index === currentIndex
                  ? "bg-fuchsia-500 ring-4 ring-fuchsia-500/20"
                  : "bg-emerald-500"
                : "bg-gray-200 dark:bg-gray-700"
            )}
          />
          {index < stages.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 rounded-full transition-all",
              index < currentIndex
                ? "bg-emerald-500"
                : "bg-gray-200 dark:bg-gray-700"
            )} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default function Orders() {
  useSmartPolling(['orders'], 15000);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [openView, setOpenView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  // State for rejection modal - REMOVED
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  // Phase 4 Fix: Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter]);


  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('admin.common.time.just_now');
    if (diffMins < 60) return t('admin.common.time.minutes_ago', { count: diffMins });
    if (diffHours < 24) return t('admin.common.time.hours_ago', { count: diffHours });
    return t('admin.common.time.days_ago', { count: diffDays });
  };

  const getAmount = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  // Fetch orders
  const { data: ordersData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin/orders', page, search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      return await apiGet(`/api/admin/orders?${params.toString()}`);
    }
  });

  const orderList = useMemo(() => {
    if (!ordersData) return [];
    if (Array.isArray(ordersData)) return ordersData;
    if (ordersData.data && Array.isArray(ordersData.data)) return ordersData.data;
    return [];
  }, [ordersData]);

  // Stats calculation
  const stats = useMemo(() => {
    // Phase 4 Fix: Use server-side stats if available
    if ((ordersData as any)?.stats) {
      return (ordersData as any).stats;
    }

    // Fallback for loading state or if stats missing
    return {
      total: ordersData?.meta?.total || 0,
      pending: 0,
      preparing: 0,
      ready: 0,
    };
  }, [ordersData]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) =>
      apiPut(`/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      toastSuccess('Status updated');
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
    },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'paid' | 'unpaid' }) =>
      apiPatch(`/api/admin/orders/${id}/payment-status`, { payment_status: status }),
    onSuccess: () => {
      toastSuccess('Payment updated');
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
      setOpenView(false);
    },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });


  const handleQuickStatus = (id: number, status: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    updateStatusMutation.mutate({ id, status });
  };

  const toggleSelectOrder = (id: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orderList.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(orderList.map((o: Order) => o.id)));
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      pending: 'received',
      received: 'preparing',
      preparing: 'ready',
      ready: 'completed'
    };
    return flow[currentStatus] || null;
  };


  const getNextStatusLabel = (currentStatus: string): string => {
    const mapping: Record<string, string> = {
      pending: 'receive',
      received: 'start_prep',
      preparing: 'ready',
      ready: 'complete'
    };
    const key = mapping[currentStatus] || 'update';
    return t(`admin.orders.actions.${key}`) as string;
  };

  return (
    <AdminLayout>
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-gray-50 to-fuchsia-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-fuchsia-900/10">
        <div className="p-3 sm:p-4 md:p-6 w-full mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/25 flex-shrink-0">
                <ReceiptText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate">{t('admin.orders.title')}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{ordersData?.meta?.total || 0} {t('admin.common.items')}</p>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">{t('admin.orders.live')}</span>
                  </div>
                </div>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => refetch()} disabled={isFetching}
              className={cn("p-2 sm:p-2.5 rounded-lg sm:rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0", isFetching && "animate-spin")}>
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.button>
          </div>

          {/* Quick Stats - Horizontal scroll on mobile */}
          <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
            <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-3 min-w-max sm:min-w-0">
              <motion.div whileTap={{ scale: 0.98 }} onClick={() => setStatusFilter('all')}
                className={cn("relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm min-w-[90px] sm:min-w-0",
                  statusFilter === 'all' ? "border-fuchsia-500 ring-2 ring-fuchsia-500/20 shadow-lg" : "border-gray-200/50 dark:border-gray-700/50")}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-2 sm:mb-3">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-600 dark:text-fuchsia-400" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('admin.orders.stats.all')}</p>
              </motion.div>
              <motion.div whileTap={{ scale: 0.98 }} onClick={() => setStatusFilter('pending')}
                className={cn("relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm min-w-[90px] sm:min-w-0",
                  statusFilter === 'pending' ? "border-amber-500 ring-2 ring-amber-500/20 shadow-lg" : "border-gray-200/50 dark:border-gray-700/50")}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center mb-2 sm:mb-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('admin.orders.stats.pending')}</p>
                {stats.pending > 0 && <span className="absolute top-2 right-2 sm:top-3 sm:right-3 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 animate-pulse" />}
              </motion.div>
              <motion.div whileTap={{ scale: 0.98 }} onClick={() => setStatusFilter('preparing')}
                className={cn("relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm min-w-[90px] sm:min-w-0",
                  statusFilter === 'preparing' ? "border-orange-500 ring-2 ring-orange-500/20 shadow-lg" : "border-gray-200/50 dark:border-gray-700/50")}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center mb-2 sm:mb-3">
                  <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.preparing}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('admin.orders.stats.preparing')}</p>
                {stats.preparing > 0 && <span className="absolute top-2 right-2 sm:top-3 sm:right-3 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 animate-pulse" />}
              </motion.div>
              <motion.div whileTap={{ scale: 0.98 }} onClick={() => setStatusFilter('ready')}
                className={cn("relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm min-w-[90px] sm:min-w-0",
                  statusFilter === 'ready' ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg" : "border-gray-200/50 dark:border-gray-700/50")}>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center mb-2 sm:mb-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.ready}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{t('admin.orders.stats.ready')}</p>
                {stats.ready > 0 && <span className="absolute top-2 right-2 sm:top-3 sm:right-3 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </motion.div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={(t('admin.orders.search_placeholder') as string) || "Search..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "flex items-center gap-2 px-4 h-12 rounded-xl border transition-all font-medium",
                    showFilters
                      ? "bg-fuchsia-500 border-fuchsia-500 text-white"
                      : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-fuchsia-500"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('admin.orders.filter.button')}</span>
                </button>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="h-12 px-4 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 cursor-pointer"
                >
                  <option value="all">{t('admin.orders.filter.types.all')}</option>
                  <option value="dine-in">{t('admin.orders.filter.types.dine_in')}</option>
                  <option value="pickup">{t('admin.orders.filter.types.pickup')}</option>
                  <option value="delivery">{t('admin.orders.filter.types.delivery')}</option>
                </select>
              </div>
            </div>

            {/* Extended Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['pending', 'received', 'preparing', 'ready', 'completed', 'cancelled'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-medium text-sm capitalize",
                          statusFilter === s
                            ? "bg-fuchsia-500 border-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25"
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-fuchsia-300"
                        )}
                      >
                        {t(`admin.orders.status.${s}`) || s}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bulk Actions */}
          <AnimatePresence>
            {selectedOrders.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-600 rounded-2xl p-4 mb-6 shadow-xl shadow-fuchsia-500/25"
              >
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-lg">{selectedOrders.size}</span>
                      <span className="ml-1 opacity-90">{t('admin.common.items')} {t('admin.orders.actions.selected')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedOrders(new Set())}
                      className="text-white hover:bg-white/20 h-10 px-4"
                    >
                      <X className="w-4 h-4 mr-1" /> {t('admin.orders.actions.clear')}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Orders List */}
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 border-4 border-fuchsia-500/30 border-t-fuchsia-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t('admin.orders.empty.loading')}</p>
            </div>
          ) : orderList.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50"
            >
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold text-lg mb-1">{t('admin.orders.empty.no_orders')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.orders.empty.try_adjusting')}</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === orderList.length && orderList.length > 0}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 rounded-md border-2 border-gray-300 dark:border-gray-600 text-fuchsia-600 focus:ring-fuchsia-500 focus:ring-offset-0 cursor-pointer transition-all"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {t('admin.orders.actions.select_all')} ({orderList.length})
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {t('admin.common.pagination.showing_of_total', { count: orderList.length, total: ordersData?.meta?.total || orderList.length })}
                </p>
              </div>

              {/* Order Cards */}
              {orderList.map((order: Order, index: number) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={cn(
                    "group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border p-4 lg:p-5 cursor-pointer transition-all hover:shadow-lg",
                    selectedOrders.has(order.id)
                      ? "border-fuchsia-500 ring-2 ring-fuchsia-500/20 shadow-lg"
                      : "border-gray-200/50 dark:border-gray-700/50 hover:border-fuchsia-300 dark:hover:border-fuchsia-700"
                  )}
                  onClick={() => { setSelectedOrder(order); setOpenView(true); }}
                >
                  {/* Approval Alert Banner */}

                  <div className={cn(
                    "flex flex-col lg:flex-row lg:items-center gap-4",
                  )}>
                    {/* Checkbox + Order Info */}
                    <div className="flex items-start lg:items-center gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleSelectOrder(order.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 mt-1 lg:mt-0 rounded-md border-2 border-gray-300 dark:border-gray-600 text-fuchsia-600 focus:ring-fuchsia-500 focus:ring-offset-0 cursor-pointer transition-all"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900 dark:text-white text-lg">
                            #{order.order_number}
                          </span>
                          <StatusBadge status={order.status} />
                          <TypeBadge type={order.order_type || ''} />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {order.customer?.user?.name || t('admin.orders.card.guest')}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Timer className="w-4 h-4" />
                            {formatTimeAgo((order as any).created_at || '')}
                          </span>
                          {order.items && order.items.length > 0 && (
                            <span className="flex items-center gap-1.5">
                              <UtensilsCrossed className="w-4 h-4" />
                              {order.items.length} {t('admin.orders.card.items')}
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 hidden lg:block max-w-xs">
                          <OrderProgress status={order.status} />
                        </div>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-4 lg:gap-6 pl-9 lg:pl-0">
                      <div className="text-left lg:text-right">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          ${getAmount(order.total).toFixed(2)}
                        </div>
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium mt-1",
                          order.payment_status === 'paid'
                            ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                        )}>
                          {order.payment_status === 'paid' ? (
                            <><CreditCard className="w-3.5 h-3.5" /> {t('admin.orders.card.paid')}</>
                          ) : (
                            <><Clock className="w-3.5 h-3.5" /> {t('admin.orders.card.unpaid')}</>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2">
                        {getNextStatus(order.status) && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => handleQuickStatus(order.id, getNextStatus(order.status)!, e)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white rounded-xl font-medium text-sm shadow-lg shadow-fuchsia-500/25 transition-all"
                          >
                            <Zap className="w-4 h-4" />
                            <span className="hidden sm:inline">{getNextStatusLabel(order.status)}</span>
                          </motion.button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setOpenView(true); }}
                          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {ordersData?.meta && ordersData.meta.last_page > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin.common.pagination.page_of_total', {
                  current: <span className="font-semibold text-gray-900 dark:text-white">{page}</span>,
                  total: <span className="font-semibold text-gray-900 dark:text-white">{ordersData.meta.last_page}</span>
                })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-10 px-4 border-gray-200 dark:border-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> {t('admin.common.pagination.previous')}
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, ordersData.meta.last_page) }, (_, i) => {
                    let pageNum: number;
                    if (ordersData.meta.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= ordersData.meta.last_page - 2) {
                      pageNum = ordersData.meta.last_page - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "w-10 h-10 rounded-xl font-medium transition-all",
                          page === pageNum
                            ? "bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === ordersData.meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="h-10 px-4 border-gray-200 dark:border-gray-700"
                >
                  {t('admin.common.pagination.next')} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Order Detail Modal */}
      <AnimatePresence>
        {openView && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpenView(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-600 p-6 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                      <ReceiptText className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="font-bold text-xl">#{selectedOrder.order_number}</h2>
                      <div className="flex items-center gap-3 mt-1">
                        <TypeBadge type={selectedOrder.order_type || ''} />
                        <StatusBadge status={selectedOrder.status} size="lg" />
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpenView(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {/* Customer Info */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('admin.orders.modal.customer_details')}</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {(selectedOrder.customer?.user?.name || 'G')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedOrder.customer?.user?.name || t('admin.orders.card.guest')}</p>
                      {selectedOrder.customer?.user?.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          {selectedOrder.customer.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">{t('admin.orders.modal.total_amount')}</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${getAmount(selectedOrder.total).toFixed(2)}</p>
                  </div>
                  <div className={cn(
                    "rounded-2xl p-4",
                    selectedOrder.payment_status === 'paid'
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-red-50 dark:bg-red-900/20"
                  )}>
                    <div className={cn(
                      "flex items-center gap-2 mb-2",
                      selectedOrder.payment_status === 'paid'
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      <CreditCard className="w-4 h-4" />
                      <span className="text-xs font-medium uppercase">{t('admin.orders.modal.payment')}</span>
                    </div>
                    <p className={cn(
                      "text-lg font-bold",
                      selectedOrder.payment_status === 'paid'
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    )}>
                      {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-fuchsia-600" />
                    Order Items ({selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 text-fuchsia-600 dark:text-fuchsia-400 rounded-xl flex items-center justify-center font-bold text-sm">
                            {item.quantity}×
                          </span>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.menu_item?.name || item.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">${getAmount(item.unit_price).toFixed(2)} each</p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white">${getAmount(item.total_price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                {(selectedOrder as any).special_instructions && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Special Instructions
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">{(selectedOrder as any).special_instructions}</p>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex flex-col gap-3">
                  {/* Primary Actions */}
                  <div className="flex gap-2">
                    {selectedOrder.status === 'pending' && (
                      <Button
                        onClick={() => { handleQuickStatus(selectedOrder.id, 'received'); setOpenView(false); }}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" /> Receive Order
                      </Button>
                    )}
                    {selectedOrder.status === 'received' && (
                      <Button
                        onClick={() => { handleQuickStatus(selectedOrder.id, 'preparing'); setOpenView(false); }}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-12"
                      >
                        <ChefHat className="w-5 h-5 mr-2" /> Start Preparing
                      </Button>
                    )}
                    {selectedOrder.status === 'preparing' && (
                      <Button
                        onClick={() => { handleQuickStatus(selectedOrder.id, 'ready'); setOpenView(false); }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-12"
                      >
                        <Sparkles className="w-5 h-5 mr-2" /> Mark Ready
                      </Button>
                    )}
                    {selectedOrder.status === 'ready' && (
                      <Button
                        onClick={() => { handleQuickStatus(selectedOrder.id, 'completed'); setOpenView(false); }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-12"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" /> Complete Order
                      </Button>
                    )}
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => updatePaymentMutation.mutate({ id: selectedOrder.id, status: selectedOrder.payment_status === 'paid' ? 'unpaid' : 'paid' })}
                      className="flex-1 h-11 border-gray-200 dark:border-gray-700"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {selectedOrder.payment_status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setOpenView(false)}
                      className="flex-1 h-11"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
