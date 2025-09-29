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
  DollarSign, 
  Calendar, 
  FileText, 
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  User,
  Tag
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Expense, ExpenseCategory, Location, User } from '@/app/types/domain';

export default function Expenses() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [error, setError] = React.useState('');

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  // Form state
  const [formData, setFormData] = React.useState({
    expense_category_id: '',
    expense_date: new Date().toISOString().split('T')[0],
    amount: '',
    vendor_name: '',
    reference: '',
    description: '',
    status: 'approved' as 'draft' | 'approved' | 'paid' | 'voided'
  });

  // Fetch expenses
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['admin/expenses', page, search, statusFilter, categoryFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/expenses?page=${page}&per_page=${perPage}&search=${search}`;
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      
      if (categoryFilter !== 'all') {
        url += `&category=${categoryFilter}`;
      }
      
      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate = '';
        
        switch (dateFilter) {
          case 'today':
            startDate = today.toISOString().split('T')[0];
            url += `&start_date=${startDate}&end_date=${startDate}`;
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            url += `&start_date=${weekAgo.toISOString().split('T')[0]}`;
            break;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            url += `&start_date=${monthAgo.toISOString().split('T')[0]}`;
            break;
        }
      }
      
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  // Fetch expense categories
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => apiGet('/api/admin/expense-categories')
  }) as { data: any };

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/locations')
  }) as { data: any };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/expenses', data),
    onSuccess: () => {
      toastSuccess('Expense created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/expenses'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create expense');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/expenses/${id}`, data),
    onSuccess: () => {
      toastSuccess('Expense updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/expenses'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update expense');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/expenses/${id}`),
    onSuccess: () => {
      toastSuccess('Expense deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/expenses'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete expense');
    }
  });

  const resetForm = () => {
    setFormData({
      expense_category_id: '',
      expense_date: new Date().toISOString().split('T')[0],
      amount: '',
      vendor_name: '',
      reference: '',
      description: '',
      status: 'approved'
    });
    setEditingExpense(null);
    setError('');
  };

  const handleCreate = () => {
    resetForm();
    setOpenCreate(true);
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      expense_category_id: expense.expense_category_id.toString(),
      expense_date: expense.expense_date,
      amount: expense.amount.toString(),
      vendor_name: expense.vendor_name || '',
      reference: expense.reference || '',
      description: expense.description || '',
      status: expense.status
    });
    setEditingExpense(expense);
    setOpenEdit(true);
  };

  const handleView = (expense: Expense) => {
    setSelectedExpense(expense);
    setOpenView(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      expense_category_id: parseInt(formData.expense_category_id)
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'voided': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalExpenses = expenses?.data?.reduce((sum: number, exp: Expense) => sum + parseFloat(exp.amount.toString()), 0) || 0;
  const paidExpenses = expenses?.data?.filter((exp: Expense) => exp.status === 'paid').reduce((sum: number, exp: Expense) => sum + parseFloat(exp.amount.toString()), 0) || 0;
  const pendingExpenses = expenses?.data?.filter((exp: Expense) => exp.status === 'approved').reduce((sum: number, exp: Expense) => sum + parseFloat(exp.amount.toString()), 0) || 0;

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
                Expenses Management
              </h1>
              <p className="text-gray-400 mt-1">Track and manage business expenses</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Expenses</div>
                <div className="text-xl font-bold text-white">${totalExpenses.toFixed(2)}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Paid</div>
                <div className="text-xl font-bold text-green-400">${paidExpenses.toFixed(2)}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Pending</div>
                <div className="text-xl font-bold text-yellow-400">${pendingExpenses.toFixed(2)}</div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search expenses..."
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
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="voided">Voided</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Categories</option>
            {categories?.data?.map((category: ExpenseCategory) => (
              <option key={category.id} value={category.id} className="bg-gray-800">
                {category.name}
              </option>
            ))}
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
              setStatusFilter('all');
              setCategoryFilter('all');
              setDateFilter('all');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>

        {/* Expenses Grid */}
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
            expenses?.data?.map((expense: Expense, index: number) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Expense Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          ${parseFloat(expense.amount.toString()).toFixed(2)}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {expense.expense_category?.name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                    </div>

                    {/* Expense Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </div>

                      {expense.vendor_name && (
                        <div className="flex items-center text-sm text-gray-300">
                          <User className="w-4 h-4 mr-2 text-gray-400" />
                          {expense.vendor_name}
                        </div>
                      )}

                      {expense.reference && (
                        <div className="flex items-center text-sm text-gray-300">
                          <FileText className="w-4 h-4 mr-2 text-gray-400" />
                          Ref: {expense.reference}
                        </div>
                      )}

                      {expense.description && (
                        <div className="text-sm text-gray-300 line-clamp-2">
                          {expense.description}
                        </div>
                      )}

                      {expense.location && (
                        <div className="flex items-center text-sm text-gray-300">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          {expense.location.name}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleView(expense)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(expense)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(expense.id)}
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
        {expenses?.meta && (
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
              Page {page} of {expenses?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === expenses?.meta?.last_page}
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
        title={editingExpense ? 'Edit Expense' : 'Create Expense'}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
              <select
                required
                value={formData.expense_category_id}
                onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Category</option>
                {categories?.data?.map((category: ExpenseCategory) => (
                  <option key={category.id} value={category.id} className="bg-gray-800">
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date *</label>
              <Input
                type="date"
                required
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Amount *</label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="voided">Voided</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Vendor Name</label>
              <Input
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Enter vendor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reference</label>
              <Input
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Invoice #, Receipt #, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Enter expense description..."
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
              {editingExpense ? 'Update' : 'Create'} Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Expense Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedExpense(null);
        }}
        title="Expense Details"
        size="lg"
      >
        {selectedExpense && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Expense Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white font-semibold">${parseFloat(selectedExpense.amount.toString()).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Category:</span>
                    <span className="text-white">{selectedExpense.expense_category?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{new Date(selectedExpense.expense_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getStatusColor(selectedExpense.status)}>
                      {selectedExpense.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Additional Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vendor:</span>
                    <span className="text-white">{selectedExpense.vendor_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference:</span>
                    <span className="text-white">{selectedExpense.reference || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white">{selectedExpense.location?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(selectedExpense.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedExpense.description && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-300 bg-white/5 p-3 rounded-lg">{selectedExpense.description}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => handleEdit(selectedExpense)}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Expense
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedExpense(null);
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
