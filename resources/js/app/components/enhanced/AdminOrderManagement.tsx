import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Phone, 
  MapPin, 
  User,
  DollarSign,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import EnhancedButton from '@/app/components/ui/EnhancedButton';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/app/libs/apiClient';
import { Order, ApiResponse } from '@/app/types/domain';
import { useOrderUpdates } from '@/app/hooks/useRealtime';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface OrderWithDetails extends Omit<Order, 'delivery_address'> {
  delivery_address?: {
    street: string;
    city: string;
    postal_code: string;
  };
}

export function AdminOrderManagement() {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const qc = useQueryClient();

  // Real-time order updates
  useOrderUpdates();

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['admin.orders', statusFilter, searchTerm],
    queryFn: () => apiGet<ApiResponse<OrderWithDetails[]>>('/admin/orders', {
      params: { 
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined 
      }
    }).then(r => r.data),
    refetchInterval: 30000,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      apiPatch(`/admin/orders/${orderId}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin.orders'] });
      qc.invalidateQueries({ queryKey: ['admin.dashboard'] });
      toastSuccess('Order status updated successfully');
    },
    onError: () => {
      toastError('Failed to update order status');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'received': return 'text-blue-400 bg-blue-500/20';
      case 'preparing': return 'text-purple-400 bg-purple-500/20';
      case 'ready': return 'text-emerald-400 bg-emerald-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'delivered': return 'text-indigo-400 bg-indigo-500/20';
      case 'cancelled': return 'text-rose-400 bg-rose-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getNextStatus = (currentStatus: string, orderType: string) => {
    const transitions: Record<string, string | undefined> = {
      'pending': orderType === 'dine-in' ? 'received' : undefined, // Only POS orders auto-approve
      'received': 'preparing',
      'preparing': 'ready',
      'ready': orderType === 'delivery' ? 'delivered' : 'completed',
      'completed': undefined,
      'delivered': undefined,
      'cancelled': undefined
    };
    return transitions[currentStatus];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.id.toString().includes(searchTerm) ||
      order.customer?.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.user?.phone?.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Order Management</h2>
              <p className="text-gray-400">Monitor and manage all restaurant orders</p>
            </div>
            
            <div className="flex items-center gap-3">
              <EnhancedButton
                variant="secondary"
                size="sm"
                onClick={() => refetch()}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                haptic
              >
                Refresh
              </EnhancedButton>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search by order ID, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            
            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group"
            >
              <Card className="hover:shadow-lg hover:shadow-fuchsia-500/20 transition-all duration-300">
                <CardContent className="p-4">
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">#{order.id}</h3>
                      <p className="text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{order.customer?.user?.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{order.customer?.user?.phone}</span>
                    </div>
                    
                    {order.mode === 'delivery' && order.delivery_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm">
                          {order.delivery_address.street}, {order.delivery_address.city}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Order Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span>Items:</span>
                      <span>{order.items?.length || 0} items</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Mode:</span>
                      <span className="capitalize">{order.mode}</span>
                    </div>
                    
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-fuchsia-400">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <EnhancedButton
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSelectedOrder(order)}
                      leftIcon={<Eye className="w-4 h-4" />}
                    >
                      View
                    </EnhancedButton>
                    
                    {getNextStatus(order.status, order.order_type) && (
                      <EnhancedButton
                        variant="gradient"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateOrderMutation.mutate({
                          orderId: order.id,
                          status: getNextStatus(order.status, order.order_type) as string
                        })}
                        loading={updateOrderMutation.isPending}
                        leftIcon={<CheckCircle className="w-4 h-4" />}
                        haptic
                        soundEffect="success"
                      >
                        {(getNextStatus(order.status, order.order_type) as string)?.charAt(0).toUpperCase() + 
                         (getNextStatus(order.status, order.order_type) as string)?.slice(1)}
                      </EnhancedButton>
                    )}
                    
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <EnhancedButton
                        variant="danger"
                        size="sm"
                        onClick={() => updateOrderMutation.mutate({
                          orderId: order.id,
                          status: 'cancelled'
                        })}
                        loading={updateOrderMutation.isPending}
                        haptic
                      >
                        <XCircle className="w-4 h-4" />
                      </EnhancedButton>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-500/20 flex items-center justify-center">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'New orders will appear here when customers place them.'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Order Detail Modal */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.id}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Customer & Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Customer Information</h4>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <span>{selectedOrder.customer?.user?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span>{selectedOrder.customer?.user?.phone}</span>
                  </div>
                  {selectedOrder.delivery_address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div>{selectedOrder.delivery_address.street}</div>
                        <div className="text-sm text-gray-400">
                          {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.postal_code}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h4 className="font-semibold">Order Details</h4>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span>#{selectedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className="capitalize">{selectedOrder.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Placed:</span>
                    <span>{new Date(selectedOrder.created_at).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <h4 className="font-semibold">Order Items</h4>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-400">Qty: {item.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${(item.unit_price * item.quantity).toFixed(2)}</div>
                        <div className="text-sm text-gray-400">${item.unit_price.toFixed(2)} each</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-fuchsia-400">${selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {getNextStatus(selectedOrder.status) && (
                <EnhancedButton
                  variant="gradient"
                  onClick={() => {
                    updateOrderMutation.mutate({
                      orderId: selectedOrder.id,
                      status: getNextStatus(selectedOrder.status)!
                    });
                    setSelectedOrder(null);
                  }}
                  loading={updateOrderMutation.isPending}
                  leftIcon={<CheckCircle className="w-4 h-4" />}
                  haptic
                  soundEffect="success"
                >
                  Mark as {getNextStatus(selectedOrder.status)?.charAt(0).toUpperCase() + 
                           getNextStatus(selectedOrder.status)?.slice(1)}
                </EnhancedButton>
              )}
              
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                <EnhancedButton
                  variant="danger"
                  onClick={() => {
                    updateOrderMutation.mutate({
                      orderId: selectedOrder.id,
                      status: 'cancelled'
                    });
                    setSelectedOrder(null);
                  }}
                  loading={updateOrderMutation.isPending}
                  leftIcon={<XCircle className="w-4 h-4" />}
                  haptic
                >
                  Cancel Order
                </EnhancedButton>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminOrderManagement;
