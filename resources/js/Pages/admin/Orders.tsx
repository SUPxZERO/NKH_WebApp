import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Clock,
  CheckCircle, XCircle, DollarSign, MapPin, User, Calendar, Package,
  ThumbsUp, ThumbsDown, AlertCircle, Utensils, AlertTriangle,
  ShoppingBag, Truck, Coffee, ChefHat, X, Phone, FileText, UtensilsCrossed,
  CreditCard, Receipt, Hash
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Order } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';

// --- Stats Ribbon Component ---
const OrderStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
    {/* Total Orders - Purple gradient */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0 }}
      className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-theme-md hover:shadow-theme-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 blur-xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Total Orders</p>
          <p className="text-3xl font-bold text-foreground mt-1">{stats.total}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center border border-fuchsia-500/30">
          <Package className="w-6 h-6 text-fuchsia-500" />
        </div>
      </div>
    </motion.div>

    {/* Pending - Amber gradient */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-theme-md hover:shadow-theme-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 blur-xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Pending</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{stats.pending}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30">
          <Clock className="w-6 h-6 text-amber-500" />
        </div>
      </div>
    </motion.div>

    {/* Preparing - Orange gradient */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-theme-md hover:shadow-theme-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 blur-xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Preparing</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{stats.preparing}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center border border-orange-500/30">
          <ChefHat className="w-6 h-6 text-orange-500" />
        </div>
      </div>
    </motion.div>

    {/* Ready - Green gradient */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-theme-md hover:shadow-theme-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 blur-xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Ready</p>
          <p className="text-3xl font-bold text-emerald-500 mt-1">{stats.ready}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
        </div>
      </div>
    </motion.div>

    {/* Needs Approval - Red/Rose gradient */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden bg-card border border-border rounded-2xl p-5 shadow-theme-md hover:shadow-theme-lg hover:-translate-y-1 transition-all duration-300"
    >
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-gradient-to-br from-rose-500/20 to-red-500/20 blur-xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Need Approval</p>
          <p className="text-3xl font-bold text-rose-500 mt-1">{stats.needsApproval}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center border border-rose-500/30">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>
      </div>
    </motion.div>
  </div>
);

// --- Status Pill Component ---
const StatusPill = ({ status }: { status: string }) => {
  const config: Record<string, { classes: string; icon: React.ReactNode }> = {
    pending: {
      classes: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
      icon: <Clock className="w-3 h-3" />,
    },
    received: {
      classes: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    preparing: {
      classes: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
      icon: <ChefHat className="w-3 h-3" />,
    },
    ready: {
      classes: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    completed: {
      classes: 'bg-gradient-to-r from-green-500/20 to-teal-500/20 text-green-600 dark:text-green-400 border-green-500/30',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    cancelled: {
      classes: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border-red-500/30',
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  const statusConfig = config[status] || { classes: 'bg-secondary text-muted-foreground', icon: null };

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold", statusConfig.classes)}>
      {statusConfig.icon}
      <span className="capitalize">{status}</span>
    </div>
  );
};

export default function Orders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending'>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [openView, setOpenView] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20); // Increased from 15

  const getAmount = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin/orders', page, search, statusFilter, typeFilter, approvalFilter],
    queryFn: async () => {
      // ✅ Build query parameters
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });

      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (approvalFilter !== 'all') params.append('approval_status', approvalFilter);

      const endpoint = `/api/admin/orders?${params.toString()}`;

      console.log('🔍 Fetching orders:', { endpoint, filters: { page, search, statusFilter, typeFilter, approvalFilter } });

      const response = await apiGet(endpoint);

      console.log('📦 Orders response:', {
        total: response?.meta?.total || response?.total || 'unknown',
        count: response?.data?.length || (Array.isArray(response) ? response.length : 0),
        hasData: !!response,
        sample: response?.data?.[0] || null
      });

      return response;
    }
  }) as { data: any, isLoading: boolean };

  const orderList: Order[] = useMemo(() => {
    if (!orders) return [];
    if (Array.isArray(orders)) return orders;
    if (orders.data && Array.isArray(orders.data)) return orders.data;
    return [];
  }, [orders]);

  // Calculate stats
  const stats = useMemo(() => {
    const list = orderList;
    return {
      total: orders?.meta?.total || list.length,
      pending: list.filter(o => o.status === 'pending').length,
      preparing: list.filter(o => o.status === 'preparing').length,
      ready: list.filter(o => o.status === 'ready').length,
      needsApproval: list.filter(o => (o as any).approval_status === 'pending').length
    };
  }, [orderList, orders]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) =>
      apiPut(`/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      toastSuccess('Status updated');
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
    },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed to update')
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'paid' | 'unpaid' }) =>
      apiPatch(`/api/admin/orders/${id}/payment-status`, { payment_status: status }),
    onSuccess: (_, variables) => {
      toastSuccess(`Order marked as ${variables.status}`);
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
      // Also close view modal if open
      if (selectedOrder && selectedOrder.id === variables.id) {
        setOpenView(false);
      }
    },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed to update payment status')
  });

  const handleApprove = async (order: Order) => {
    try {
      await apiPatch(`/api/admin/orders/${order.id}/approve`, {});
      toastSuccess('Order approved');
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Failed to approve');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedOrders.size === 0) return;
    if (!confirm(`Approve ${selectedOrders.size} orders?`)) return;

    try {
      await Promise.all(
        Array.from(selectedOrders).map(id =>
          apiPatch(`/api/admin/orders/${id}/approve`, {})
        )
      );
      toastSuccess(`${selectedOrders.size} orders approved`);
      setSelectedOrders(new Set());
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
    } catch (error: any) {
      toastError('Failed to approve some orders');
    }
  };

  const handleReject = (order: Order) => {
    setSelectedOrder(order);
    setOpenReject(true);
  };

  const confirmReject = async () => {
    if (!selectedOrder || rejectionReason.length < 10) {
      toastError('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      await apiPatch(`/api/admin/orders/${selectedOrder.id}/reject`, {
        rejection_reason: rejectionReason
      });
      toastSuccess('Order rejected');
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
      setOpenReject(false);
      setSelectedOrder(null);
      setRejectionReason('');
    } catch (error: any) {
      toastError(error.response?.data?.message || 'Failed to reject');
    }
  };

  const handleQuickStatus = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleTogglePayment = (order: Order) => {
    const isPaid = order.payment_status === 'paid';
    const newStatus = isPaid ? 'unpaid' : 'paid';

    if (confirm(`Mark order #${order.order_number} as ${newStatus.toUpperCase()}?`)) {
      updatePaymentStatusMutation.mutate({ id: order.id, status: newStatus });
    }
  };

  const toggleSelectOrder = (id: number) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedOrders(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orderList.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orderList.map(o => o.id)));
    }
  };

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
                Orders
              </span>
            </h1>
            <p className="text-muted-foreground mt-2">Manage and track all orders in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium text-muted-foreground">Live Updates</span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <OrderStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-theme-md"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order number, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 px-4 pr-10 bg-secondary/50 border border-border rounded-xl text-foreground text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-12 px-4 pr-10 bg-secondary/50 border border-border rounded-xl text-foreground text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="all">All Types</option>
                <option value="dine-in">Dine-In</option>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>

              {/* Approval Toggle */}
              <button
                onClick={() => setApprovalFilter(approvalFilter === 'all' ? 'pending' : 'all')}
                className={cn(
                  "h-12 px-5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                  approvalFilter === 'pending'
                    ? "bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl"
                    : "bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary hover:text-foreground"
                )}
              >
                <AlertTriangle className="w-4 h-4" />
                {approvalFilter === 'pending' ? `Needs Approval (${stats.needsApproval})` : 'Pending Approvals'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedOrders.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl p-5 mb-6 shadow-xl shadow-fuchsia-500/20"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">
                      {selectedOrders.size} order{selectedOrders.size === 1 ? '' : 's'} selected
                    </p>
                    <p className="text-white/70 text-sm">Ready for bulk actions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="md"
                    onClick={handleBulkApprove}
                    className="bg-white text-fuchsia-600 hover:bg-white/90 shadow-lg"
                  >
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Approve All
                  </Button>
                  <Button
                    size="md"
                    onClick={() => setSelectedOrders(new Set())}
                    className="bg-white/20 text-white hover:bg-white/30 border-0"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-theme-lg"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-gradient-to-r from-secondary/50 to-secondary/30">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedOrders.size === orderList.length && orderList.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
              />
            </div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Order</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Customer</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Type</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Status</div>
            <div className="col-span-1 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Total</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-end">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border/50">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 mb-4">
                  <div className="w-8 h-8 border-3 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-muted-foreground font-medium">Loading orders...</p>
              </div>
            ) : orderList.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-muted mb-4">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-1">No orders found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              orderList.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-200 group cursor-pointer",
                    "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent",
                    selectedOrders.has(order.id) && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                  onClick={() => { setSelectedOrder(order); setOpenView(true); }}
                >
                  {/* Checkbox */}
                  <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all hover:border-primary/50"
                    />
                  </div>

                  {/* Order Number & Time */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Hash className="w-4 h-4 text-fuchsia-500" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {order.order_number}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-foreground font-medium truncate max-w-[120px]">
                          {order.customer?.user?.name || 'Guest'}
                        </div>
                        {order.table && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Utensils className="w-3 h-3" />
                            Table {order.table.number}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                      order.order_type === 'dine-in' && "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400",
                      order.order_type === 'pickup' && "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400",
                      order.order_type === 'delivery' && "bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {order.order_type === 'dine-in' && <Coffee className="w-4 h-4" />}
                      {order.order_type === 'pickup' && <ShoppingBag className="w-4 h-4" />}
                      {order.order_type === 'delivery' && <Truck className="w-4 h-4" />}
                      <span className="capitalize">{order.order_type?.replace('-', ' ')}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusPill status={order.status} />
                    {(order as any).approval_status === 'pending' && (
                      <div className="text-xs mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500/20 to-red-500/20 text-rose-500 w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="font-medium">Needs Approval</span>
                      </div>
                    )}
                  </div>

                  {/* Total & Payment */}
                  <div className="col-span-1">
                    <div className="font-bold text-foreground text-lg">
                      ${getAmount(order.total).toFixed(2)}
                    </div>
                    <div className="mt-1">
                      {order.payment_status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30">
                          <Clock className="w-3 h-3" />
                          Unpaid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200" onClick={(e) => e.stopPropagation()}>
                    {(order as any).approval_status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(order)}
                          variant="success"
                          className="h-9 shadow-lg shadow-emerald-500/20"
                        >
                          <ThumbsUp className="w-3.5 h-3.5 mr-1.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReject(order)}
                          variant="destructive"
                          className="h-9 w-9 p-0 shadow-lg shadow-red-500/20"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatus(order.id, 'received')}
                            variant="info"
                            className="h-9 text-xs shadow-lg shadow-blue-500/20"
                          >
                            Accept
                          </Button>
                        )}
                        {order.status === 'received' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatus(order.id, 'preparing')}
                            variant="warning"
                            className="h-9 text-xs shadow-lg shadow-amber-500/20"
                          >
                            Prep
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatus(order.id, 'ready')}
                            variant="success"
                            className="h-9 text-xs shadow-lg shadow-emerald-500/20"
                          >
                            Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatus(order.id, 'completed')}
                            variant="success"
                            className="h-9 text-xs shadow-lg shadow-emerald-500/20"
                          >
                            Done
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setSelectedOrder(order); setOpenView(true); }}
                          className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePayment(order)}
                          className={cn(
                            "h-9 w-9 p-0 border-2 transition-all",
                            order.payment_status === 'paid'
                              ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                              : "border-border bg-secondary hover:bg-emerald-500 hover:border-emerald-500 text-muted-foreground hover:text-white"
                          )}
                          title={order.payment_status === 'paid' ? "Mark as Unpaid" : "Mark as Paid"}
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {orders?.meta && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-border bg-gradient-to-r from-secondary/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-9 px-4 rounded-lg bg-secondary border border-border flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{orders.meta.total}</span>
                  <span className="text-sm text-muted-foreground">orders</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * perPage, orders.meta.total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-10 px-4 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, orders.meta.last_page) }, (_, i) => {
                    let pageNum;
                    if (orders.meta.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= orders.meta.last_page - 2) {
                      pageNum = orders.meta.last_page - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "h-10 w-10 rounded-xl text-sm font-semibold transition-all",
                          page === pageNum
                            ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25"
                            : "bg-secondary border border-border text-muted-foreground hover:bg-secondary-hover hover:text-foreground"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === orders.meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="h-10 px-4 gap-2"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reject Modal */}
      <Modal
        open={openReject}
        onClose={() => { setOpenReject(false); setRejectionReason(''); }}
        title={`Reject Order #${selectedOrder?.order_number}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-destructive-muted border border-destructive/30 rounded-lg p-4">
            <p className="text-destructive text-sm">Customer will be notified of rejection. Please provide a clear reason.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rejection Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g., Kitchen closed, Out of ingredients, etc."
            />
            <div className="text-xs text-muted-foreground mt-1">{rejectionReason.length} / 500</div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setOpenReject(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              variant="destructive"
              className="flex-1"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Enhanced Order Detail Modal */}
      <AnimatePresence>
        {openView && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
            onClick={() => setOpenView(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-theme-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className={cn(
                "p-5 text-white",
                selectedOrder.status === 'pending' || selectedOrder.status === 'received' ? 'bg-gradient-to-r from-status-pending to-warning' :
                selectedOrder.status === 'preparing' ? 'bg-gradient-to-r from-warning to-warning/80' :
                selectedOrder.status === 'ready' ? 'bg-gradient-to-r from-success to-success/80' :
                selectedOrder.status === 'completed' ? 'bg-gradient-to-r from-success to-info' :
                'bg-gradient-to-r from-secondary to-muted'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <UtensilsCrossed className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Order #{selectedOrder.order_number}</h2>
                      <div className="flex items-center gap-3 text-sm opacity-90 mt-1">
                        <span className="flex items-center gap-1">
                          {selectedOrder.order_type === 'dine-in' && <Coffee className="w-4 h-4" />}
                          {selectedOrder.order_type === 'pickup' && <ShoppingBag className="w-4 h-4" />}
                          {selectedOrder.order_type === 'delivery' && <Truck className="w-4 h-4" />}
                          <span className="capitalize">{selectedOrder.order_type?.replace('-', ' ')}</span>
                        </span>
                        {selectedOrder.table && (
                          <span className="flex items-center gap-1">
                            <span>•</span> Table {(selectedOrder.table as any).number || (selectedOrder.table as any).table_number}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(selectedOrder.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold px-3 py-1 bg-white/20 rounded-full capitalize">
                        {selectedOrder.status}
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenView(false)}
                      className="p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Info Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Customer Info */}
                  <div className="bg-secondary border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-info" />
                      Customer
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {selectedOrder.customer?.user?.name || 'Guest'}
                      </div>
                      {selectedOrder.customer?.user?.email && (
                        <div className="flex items-center gap-2 text-muted-foreground text-xs truncate">
                          {selectedOrder.customer.user.email}
                        </div>
                      )}
                      {((selectedOrder.customer as any)?.phone || (selectedOrder.customer?.user as any)?.phone) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {(selectedOrder.customer as any)?.phone || (selectedOrder.customer?.user as any)?.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-secondary border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-success" />
                      Payment
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium border",
                          selectedOrder.payment_status === 'paid'
                            ? "bg-success-muted text-success border-success/30"
                            : "bg-destructive-muted text-destructive border-destructive/30"
                        )}>
                          {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="text-foreground">${getAmount(selectedOrder.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="text-foreground text-lg">${getAmount(selectedOrder.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="bg-secondary border border-border rounded-xl p-4">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-primary" />
                      Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Order ID:</span>
                        <span className="text-foreground font-mono">#{selectedOrder.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Items:</span>
                        <span className="text-foreground">{selectedOrder.items?.length || 0}</span>
                      </div>
                      {(selectedOrder as any).approval_status && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Approval:</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                            (selectedOrder as any).approval_status === 'approved'
                              ? "bg-success-muted text-success"
                              : (selectedOrder as any).approval_status === 'pending'
                              ? "bg-warning-muted text-warning"
                              : "bg-destructive-muted text-destructive"
                          )}>
                            {(selectedOrder as any).approval_status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delivery Address (for delivery orders) */}
                {selectedOrder.order_type === 'delivery' && (selectedOrder as any).customer_address && (
                  <div className="mb-6 p-4 bg-info-muted border border-info/30 rounded-xl">
                    <h3 className="font-semibold text-info mb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Delivery Address
                    </h3>
                    <p className="text-muted-foreground">
                      {(selectedOrder as any).customer_address?.street_address}, {(selectedOrder as any).customer_address?.city}, {(selectedOrder as any).customer_address?.state} {(selectedOrder as any).customer_address?.postal_code}
                    </p>
                  </div>
                )}

                {/* Order Notes */}
                {(selectedOrder as any).special_instructions && (
                  <div className="mb-6 p-4 bg-warning-muted border border-warning/30 rounded-xl">
                    <h3 className="font-semibold text-warning mb-2 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Order Notes
                    </h3>
                    <p className="text-foreground">{(selectedOrder as any).special_instructions}</p>
                  </div>
                )}

                {/* Items List */}
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-primary" />
                    Order Items ({selectedOrder.items?.length || 0})
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 p-4 bg-secondary border border-border rounded-xl hover:bg-secondary-hover transition-colors"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary-muted border border-primary/30 text-primary flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {item.quantity}x
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-semibold text-foreground text-lg">
                              {item.menu_item?.name || item.name || 'Unknown Item'}
                            </div>
                            {item.status && (
                              <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium border",
                                item.status === 'served' ? 'bg-success-muted text-success border-success/30' :
                                item.status === 'preparing' ? 'bg-warning-muted text-warning border-warning/30' :
                                item.status === 'cancelled' ? 'bg-destructive-muted text-destructive border-destructive/30' :
                                'bg-secondary text-muted-foreground border-border'
                              )}>
                                {item.status}
                              </span>
                            )}
                          </div>
                          {item.special_instructions && (
                            <div className="mt-2 p-2 bg-warning-muted border border-warning/30 rounded-lg text-sm text-warning">
                              <strong>Special Request:</strong> {item.special_instructions}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>${getAmount(item.unit_price).toFixed(2)} each</span>
                            <span className="text-foreground font-medium">
                              Total: ${getAmount(item.total_price).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${getAmount(selectedOrder.subtotal).toFixed(2)}</span>
                    </div>
                    {getAmount((selectedOrder as any).tax_amount) > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax</span>
                        <span>${getAmount((selectedOrder as any).tax_amount).toFixed(2)}</span>
                      </div>
                    )}
                    {getAmount((selectedOrder as any).discount_amount) > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount</span>
                        <span>-${getAmount((selectedOrder as any).discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
                      <span>Total</span>
                      <span>${getAmount(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Actions */}
              <div className="p-4 border-t border-border bg-secondary flex flex-wrap gap-3 justify-between">
                <div className="flex gap-2">
                  {/* Status Actions */}
                  {selectedOrder.status === 'pending' && (
                    <Button
                      onClick={() => { handleQuickStatus(selectedOrder.id, 'received'); setOpenView(false); }}
                      className="bg-info hover:bg-info/90 text-info-foreground"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Accept Order
                    </Button>
                  )}
                  {selectedOrder.status === 'received' && (
                    <Button
                      onClick={() => { handleQuickStatus(selectedOrder.id, 'preparing'); setOpenView(false); }}
                      variant="warning"
                    >
                      <ChefHat className="w-4 h-4 mr-2" /> Start Preparing
                    </Button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <Button
                      onClick={() => { handleQuickStatus(selectedOrder.id, 'ready'); setOpenView(false); }}
                      variant="success"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Mark Ready
                    </Button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <Button
                      onClick={() => { handleQuickStatus(selectedOrder.id, 'completed'); setOpenView(false); }}
                      variant="success"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Complete Order
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* Payment Toggle */}
                  <Button
                    variant="outline"
                    onClick={() => handleTogglePayment(selectedOrder)}
                    className={cn(
                      selectedOrder.payment_status === 'paid'
                        ? "border-success/30 text-success hover:bg-success-muted"
                        : "text-muted-foreground hover:bg-secondary-hover"
                    )}
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {selectedOrder.payment_status === 'paid' ? 'Mark Unpaid' : 'Mark as Paid'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setOpenView(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout >
  );
}