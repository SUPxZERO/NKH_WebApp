import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle,
  DollarSign,
  MapPin,
  User,
  Calendar,
  Package
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Order, Customer, Employee, Location, DiningTable } from '@/app/types/domain';

export default function Orders() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [openView, setOpenView] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [error, setError] = React.useState('');

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  // --- HELPER: Safe Number Parsing ---
  const getAmount = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  };

  // Fetch orders
  // Typed as 'any' to handle flexible API responses safely
  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin/orders', page, search, statusFilter, typeFilter],
    queryFn: () => apiGet(`/api/admin/orders?page=${page}&per_page=${perPage}&search=${search}&status=${statusFilter}&type=${typeFilter}`)
  }) as { data: any, isLoading: boolean };

  // --- SAFE DATA EXTRACTION ---
  // Guarantees 'orderList' is always an array, fixing the "Empty List" bug
  const orderList: Order[] = React.useMemo(() => {
    if (!orders) return [];
    if (Array.isArray(orders)) return orders;
    if (orders.data && Array.isArray(orders.data)) return orders.data;
    return [];
  }, [orders]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      apiPut(`/api/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      toastSuccess('Order status updated successfully!');
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update order status');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/orders/${id}`),
    onSuccess: () => {
      toastSuccess('Order deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/orders'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete order');
    }
  });

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setOpenView(true);
  };

  const handleEdit = (order: Order) => {
    setSelectedOrder(order);
    setOpenEdit(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'received': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'preparing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'ready': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dine-in': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'pickup': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delivery': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Orders Management
              </h1>
              <p className="text-gray-400 mt-1">Manage restaurant orders and track status</p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all"  className='text-black'>All Status</option>
            <option value="pending" className='text-black'>Pending</option>
            <option value="received" className='text-black'>Received</option>
            <option value="preparing" className='text-black'>Preparing</option>
            <option value="ready" className='text-black'>Ready</option>
            <option value="completed" className='text-black'>Completed</option>
            <option value="cancelled" className='text-black'>Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all" className='text-black'>All Types</option>
            <option value="dine-in" className='text-black'>Dine In</option>
            <option value="pickup" className='text-black'>Pickup</option>
            <option value="delivery" className='text-black'>Delivery</option>
          </select>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setTypeFilter('all');
              }}
              className="flex-1 border-white/20 hover:bg-white/10"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </motion.div>

        {/* Orders Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      <div className="h-8 bg-white/10 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : orderList.length === 0 ? (
             <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">No Orders Found</h3>
                <p className="text-gray-400 mt-2">Waiting for new orders to arrive...</p>
             </div>
          ) : (
            orderList.map((order: Order, index: number) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Order Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">#{order.order_number}</h3>
                        <p className="text-sm text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()} at{' '}
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <Badge className={getTypeColor(order.order_type)}>
                          {order.order_type}
                        </Badge>
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="space-y-3 mb-4">
                      {order.customer && (
                        <div className="flex items-center text-sm text-gray-300">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {order.customer.user?.name || 'Guest Customer'}
                        </div>
                      )}
                      
                      <div className="flex items-center text-sm text-gray-300">
                        <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-white font-medium">Total: ${getAmount(order.total).toFixed(2)}</span>
                      </div>

                      {order.table && (
                        <div className="flex items-center text-sm text-gray-300">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          Table {order.table.number}
                        </div>
                      )}
                    </div>

                    {/* Quick Status Actions */}
                    <div className="flex gap-2 mb-4">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStatusUpdate(order.id, 'received')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                      )}
                      {order.status === 'received' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStatusUpdate(order.id, 'preparing')}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Start Prep
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStatusUpdate(order.id, 'completed')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </Button>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleView(order)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(order)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(order.id)}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {orders?.meta && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {page} of {orders?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === orders?.meta?.last_page}
              onClick={() => setPage(page + 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* View Order Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedOrder(null);
        }}
        title={`Order #${selectedOrder?.order_number}`}
        size="xl"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <Badge className={getTypeColor(selectedOrder.order_type)}>
                      {selectedOrder.order_type}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white font-semibold">${getAmount(selectedOrder.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Status:</span>
                    <span className={`font-medium ${selectedOrder.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                       {selectedOrder.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Customer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{selectedOrder.customer?.user?.name || 'Guest'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{selectedOrder.customer?.user?.email || 'N/A'}</span>
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

            {/* Order Items */}
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

            {/* Notes */}
            {selectedOrder.notes && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                <p className="text-gray-300 bg-white/5 p-3 rounded-lg">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Order Modal */}
      <Modal
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setSelectedOrder(null);
        }}
        title={`Edit Order #${selectedOrder?.order_number}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option className="bg-slate-900" value="pending">Pending</option>
                  <option className="bg-slate-900" value="received">Received</option>
                  <option className="bg-slate-900" value="preparing">Preparing</option>
                  <option className="bg-slate-900" value="ready">Ready</option>
                  <option className="bg-slate-900" value="completed">Completed</option>
                  <option className="bg-slate-900" value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Status</label>
                <select
                  value={selectedOrder.payment_status}
                  onChange={(e) => {
                     // Cast the value to the specific union type
                     const newVal = e.target.value as 'unpaid' | 'paid' | 'refunded';
                     if(selectedOrder) setSelectedOrder({...selectedOrder, payment_status: newVal});
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option className="bg-slate-900" value="unpaid">Unpaid</option>
                  <option className="bg-slate-900" value="paid">Paid</option>
                  <option className="bg-slate-900" value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
              <textarea
                value={selectedOrder.notes || ''}
                onChange={(e) => setSelectedOrder({...selectedOrder, notes: e.target.value})}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
                placeholder="Order notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setOpenEdit(false);
                  setSelectedOrder(null);
                }}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                    // Here you would normally trigger a mutation to update the whole order
                    setOpenEdit(false);
                    toastSuccess('Order updated (Simulation)');
                }}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}