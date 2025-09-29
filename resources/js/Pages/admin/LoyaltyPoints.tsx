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
  Star, 
  TrendingUp,
  TrendingDown,
  Award,
  Gift,
  Users,
  Calendar,
  DollarSign
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { LoyaltyPoint, Customer, Order, Location } from '@/app/types/domain';

export default function LoyaltyPoints() {
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<LoyaltyPoint | null>(null);
  const [editingTransaction, setEditingTransaction] = React.useState<LoyaltyPoint | null>(null);
  const [error, setError] = React.useState('');

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);

  // Form state
  const [formData, setFormData] = React.useState({
    customer_id: '',
    type: 'earn' as 'earn' | 'redeem' | 'adjust',
    points: '',
    occurred_at: '',
    notes: ''
  });

  // Fetch loyalty points
  const { data: loyaltyPoints, isLoading } = useQuery({
    queryKey: ['admin/loyalty-points', page, search, typeFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/loyalty-points?page=${page}&per_page=${perPage}&search=${search}`;
      
      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }
      
      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate = '';
        
        switch (dateFilter) {
          case 'today':
            startDate = today.toISOString().split('T')[0];
            url += `&date=${startDate}`;
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            url += `&start_date=${weekAgo.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            url += `&start_date=${monthAgo.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
            break;
        }
      }
      
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiGet('/api/admin/customers')
  }) as { data: any };

  // Fetch loyalty stats
  const { data: loyaltyStats } = useQuery({
    queryKey: ['admin/loyalty-stats'],
    queryFn: () => apiGet('/api/admin/loyalty-stats')
  }) as { data: any };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/loyalty-points', data),
    onSuccess: () => {
      toastSuccess('Loyalty points transaction created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/loyalty-points'] });
      qc.invalidateQueries({ queryKey: ['admin/loyalty-stats'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create transaction');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/loyalty-points/${id}`, data),
    onSuccess: () => {
      toastSuccess('Loyalty points transaction updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/loyalty-points'] });
      qc.invalidateQueries({ queryKey: ['admin/loyalty-stats'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update transaction');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/loyalty-points/${id}`),
    onSuccess: () => {
      toastSuccess('Loyalty points transaction deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/loyalty-points'] });
      qc.invalidateQueries({ queryKey: ['admin/loyalty-stats'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete transaction');
    }
  });

  const resetForm = () => {
    setFormData({
      customer_id: '',
      type: 'earn',
      points: '',
      occurred_at: '',
      notes: ''
    });
    setEditingTransaction(null);
    setError('');
  };

  const handleCreate = () => {
    resetForm();
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      occurred_at: now.toISOString().slice(0, 16) // datetime-local format
    }));
    setOpenCreate(true);
  };

  const handleEdit = (transaction: LoyaltyPoint) => {
    setFormData({
      customer_id: transaction.customer_id.toString(),
      type: transaction.type,
      points: Math.abs(transaction.points).toString(),
      occurred_at: transaction.occurred_at.slice(0, 16), // datetime-local format
      notes: transaction.notes || ''
    });
    setEditingTransaction(transaction);
    setOpenEdit(true);
  };

  const handleView = (transaction: LoyaltyPoint) => {
    setSelectedTransaction(transaction);
    setOpenView(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this loyalty points transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const points = parseInt(formData.points);
    const data = {
      ...formData,
      customer_id: parseInt(formData.customer_id),
      points: formData.type === 'redeem' ? -Math.abs(points) : Math.abs(points)
    };

    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'earn': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'redeem': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'adjust': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'earn': return <TrendingUp className="w-4 h-4" />;
      case 'redeem': return <Gift className="w-4 h-4" />;
      case 'adjust': return <Edit className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const totalTransactions = loyaltyPoints?.data?.length || 0;
  const totalPointsEarned = loyaltyStats?.total_earned || 0;
  const totalPointsRedeemed = loyaltyStats?.total_redeemed || 0;
  const activeCustomers = loyaltyStats?.active_customers || 0;

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
                Loyalty Points Management
              </h1>
              <p className="text-gray-400 mt-1">Manage customer loyalty points and rewards</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Earned</div>
                <div className="text-xl font-bold text-green-400">{totalPointsEarned.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Redeemed</div>
                <div className="text-xl font-bold text-blue-400">{totalPointsRedeemed.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Active Customers</div>
                <div className="text-xl font-bold text-purple-400">{activeCustomers}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Transactions</div>
                <div className="text-xl font-bold text-white">{totalTransactions}</div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
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
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Types</option>
            <option value="earn">Earned</option>
            <option value="redeem">Redeemed</option>
            <option value="adjust">Adjustments</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setTypeFilter('all');
              setDateFilter('all');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>

        {/* Transactions Grid */}
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
          ) : (
            loyaltyPoints?.data?.map((transaction: LoyaltyPoint, index: number) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Transaction Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {transaction.customer?.user?.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {new Date(transaction.occurred_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getTypeColor(transaction.type)}>
                        <div className="flex items-center gap-1">
                          {getTypeIcon(transaction.type)}
                          {transaction.type}
                        </div>
                      </Badge>
                    </div>

                    {/* Points Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Points:</span>
                        <span className={`font-bold text-lg ${
                          transaction.points > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.points > 0 ? '+' : ''}{transaction.points}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Balance After:</span>
                        <span className="text-white font-semibold">
                          {transaction.balance_after}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Time:</span>
                        <span className="text-white">
                          {new Date(transaction.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {transaction.order_id && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Order:</span>
                          <span className="text-white">#{transaction.order_id}</span>
                        </div>
                      )}

                      {transaction.notes && (
                        <div className="text-sm text-gray-300 line-clamp-2">
                          <strong>Notes:</strong> {transaction.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleView(transaction)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(transaction)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(transaction.id)}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {loyaltyPoints?.meta && (
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
              Page {page} of {loyaltyPoints?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === loyaltyPoints?.meta?.last_page}
              onClick={() => setPage(page + 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={openCreate || openEdit}
        onClose={() => {
          setOpenCreate(false);
          setOpenEdit(false);
          resetForm();
        }}
        title={editingTransaction ? 'Edit Loyalty Transaction' : 'Add Loyalty Transaction'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer *</label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Customer</option>
                {customers?.data?.map((customer: Customer) => (
                  <option key={customer.id} value={customer.id} className="bg-gray-800">
                    {customer.user?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="earn">Earn Points</option>
                <option value="redeem">Redeem Points</option>
                <option value="adjust">Adjust Points</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Points *</label>
              <Input
                type="number"
                min="1"
                required
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter points amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time *</label>
              <Input
                type="datetime-local"
                required
                value={formData.occurred_at}
                onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Optional notes about this transaction..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpenCreate(false);
                setOpenEdit(false);
                resetForm();
              }}
              className="flex-1 border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {editingTransaction ? 'Update' : 'Add'} Transaction
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Transaction Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedTransaction(null);
        }}
        title="Loyalty Transaction Details"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Transaction Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white font-semibold">{selectedTransaction.customer?.user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <Badge className={getTypeColor(selectedTransaction.type)}>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(selectedTransaction.type)}
                        {selectedTransaction.type}
                      </div>
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Points:</span>
                    <span className={`font-bold ${
                      selectedTransaction.points > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedTransaction.points > 0 ? '+' : ''}{selectedTransaction.points}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Balance After:</span>
                    <span className="text-white font-semibold">{selectedTransaction.balance_after}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Transaction Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{new Date(selectedTransaction.occurred_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-white">{new Date(selectedTransaction.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {selectedTransaction.order_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Related Order:</span>
                      <span className="text-white">#{selectedTransaction.order_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(selectedTransaction.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedTransaction.notes && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                <p className="text-gray-300 bg-white/5 p-3 rounded-lg">{selectedTransaction.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => handleEdit(selectedTransaction)}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Transaction
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedTransaction(null);
                }}
                className="border-white/20 hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
