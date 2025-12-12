import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Clock,
  CheckCircle, XCircle, DollarSign, MapPin, User, Calendar, Package,
  ThumbsUp, ThumbsDown, AlertCircle, Utensils, AlertTriangle,
  ShoppingBag, Truck, Coffee, ChefHat
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
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
          <Package className="w-5 h-5 text-purple-400" />
        </div>
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
          <Clock className="w-5 h-5 text-yellow-400" />
        </div>
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Preparing</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{stats.preparing}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
          <ChefHat className="w-5 h-5 text-orange-400" />
        </div>
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Ready</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.ready}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Need Approval</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.needsApproval}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
      </div>
    </div>
  </div>
);

// --- Status Pill Component ---
const StatusPill = ({ status }: { status: string }) => {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    received: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    preparing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    ready: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }[status] || 'bg-gray-500/10 text-gray-400';

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium w-fit", styles)}>
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
      <div className="min-h-screen bg-slate-900 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
            <p className="text-slate-400 mt-1">Manage and track all orders</p>
          </div>
        </div>

        {/* Stats */}
        <OrderStatsRibbon stats={stats} />

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by order number, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-w-[140px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-w-[140px]"
              >
                <option value="all">All Types</option>
                <option value="dine-in">Dine-In</option>
                <option value="pickup">Pickup</option>
                <option value="delivery">Delivery</option>
              </select>

              <button
                onClick={() => setApprovalFilter(approvalFilter === 'all' ? 'pending' : 'all')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  approvalFilter === 'pending'
                    ? "bg-amber-600 text-white"
                    : "bg-slate-800 text-gray-400 hover:bg-slate-700"
                )}
              >
                {approvalFilter === 'pending' ? `Needs Approval (${stats.needsApproval})` : 'Show All'}
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrders.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-600 border border-purple-500 rounded-xl p-4 mb-6 flex items-center justify-between"
          >
            <span className="text-white font-medium">
              {selectedOrders.size} order{selectedOrders.size === 1 ? '' : 's'} selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleBulkApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Bulk Approve
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedOrders(new Set())}
                className="border-white/20 hover:bg-white/10"
              >
                Clear Selection
              </Button>
            </div>
          </motion.div>
        )}

        {/* Orders Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedOrders.size === orderList.length && orderList.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-white/20 bg-slate-900 text-purple-600"
              />
            </div>
            <div className="col-span-2">Order</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Total</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-12 text-center text-gray-400">Loading orders...</div>
            ) : orderList.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium">No orders found</h3>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              orderList.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                >
                  {/* Checkbox */}
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-900 text-purple-600"
                    />
                  </div>

                  {/* Order Number & Time */}
                  <div className="col-span-2">
                    <div className="font-bold text-white">#{order.order_number}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="col-span-2">
                    <div className="text-white truncate">{order.customer?.user?.name || 'Guest'}</div>
                    {order.table && (
                      <div className="text-xs text-gray-500">Table {order.table.number}</div>
                    )}
                  </div>

                  {/* Type */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 text-gray-300">
                      {order.order_type === 'dine-in' && <Coffee className="w-4 h-4" />}
                      {order.order_type === 'pickup' && <ShoppingBag className="w-4 h-4" />}
                      {order.order_type === 'delivery' && <Truck className="w-4 h-4" />}
                      <span className="capitalize text-sm">{order.order_type}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <StatusPill status={order.status} />
                    {(order as any).approval_status === 'pending' && (
                      <div className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Needs Approval
                      </div>
                    )}
                  </div>

                  {/* Total & Payment */}
                  <div className="col-span-1">
                    <div className="font-semibold text-white">
                      ${getAmount(order.total).toFixed(2)}
                    </div>
                    <div className="mt-1">
                      {order.payment_status === 'paid' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          Unpaid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {(order as any).approval_status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(order)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
                        >
                          <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleReject(order)}
                          className="bg-red-600 hover:bg-red-700 text-white h-8"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatus(order.id, 'received')}
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                          >
                            Accept
                          </Button>
                        )}
                        {order.status === 'received' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatus(order.id, 'preparing')}
                            className="bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs"
                          >
                            Prep
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatus(order.id, 'ready')}
                            className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                          >
                            Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => handleQuickStatus(order.id, 'completed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                          >
                            Done
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => { setSelectedOrder(order); setOpenView(true); }}
                          className="h-8 w-8 p-0 border-white/10"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePayment(order)}
                          className={cn(
                            "h-8 w-8 p-0 border",
                            order.payment_status === 'paid'
                              ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20"
                              : "border-white/10 bg-white/10 hover:bg-emerald-600 text-gray-400 hover:text-white"
                          )}
                          title={order.payment_status === 'paid' ? "Mark as Unpaid" : "Mark as Paid"}
                        >
                          <DollarSign className="w-3 h-3" />
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
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
              <div className="text-sm text-gray-400">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, orders.meta.total)} of {orders.meta.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === orders.meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="border-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        open={openReject}
        onClose={() => { setOpenReject(false); setRejectionReason(''); }}
        title={`Reject Order #${selectedOrder?.order_number}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-red-300 text-sm">Customer will be notified of rejection. Please provide a clear reason.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-gray-400"
              placeholder="e.g., Kitchen closed, Out of ingredients, etc."
            />
            <div className="text-xs text-gray-400 mt-1">{rejectionReason.length} / 500</div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setOpenReject(false)}
              className="flex-1 border-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReject}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Modal - Simplified */}
      <Modal
        open={openView}
        onClose={() => setOpenView(false)}
        title={`Order #${selectedOrder?.order_number}`}
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Order Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <StatusPill status={selectedOrder.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white capitalize">{selectedOrder.order_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white font-semibold">${getAmount(selectedOrder.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Payment:</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        selectedOrder.payment_status === 'paid' ? "text-emerald-400" : "text-red-400"
                      )}>
                        {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTogglePayment(selectedOrder)}
                        className="h-6 text-xs px-2 py-0 ml-2 border-white/20"
                      >
                        {selectedOrder.payment_status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Customer</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{selectedOrder.customer?.user?.name || 'Guest'}</span>
                  </div>
                  {selectedOrder.table && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Table:</span>
                      <span className="text-white">Table {selectedOrder.table.number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <span className="text-white font-medium">{item.menu_item?.name}</span>
                      <span className="text-gray-400 ml-2">x{item.quantity}</span>
                    </div>
                    <span className="text-white">${getAmount(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout >
  );
}