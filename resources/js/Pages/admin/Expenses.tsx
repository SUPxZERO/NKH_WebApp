import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Edit, Trash2, DollarSign, Calendar, FileText,
  CheckCircle, XCircle, Clock, MapPin, User as UserIcon
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { Expense, ExpenseCategory } from '@/app/types/domain';

// Stats Ribbon
const ExpenseStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Expenses</p>
          <p className="text-2xl font-bold text-white mt-1">${stats.total.toFixed(2)}</p>
        </div>
        <DollarSign className="w-8 h-8 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Paid</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">${stats.paid.toFixed(2)}</p>
        </div>
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">${stats.pending.toFixed(2)}</p>
        </div>
        <Clock className="w-8 h-8 text-amber-400" />
      </div>
    </div>
  </div>
);

export default function Expenses() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [formData, setFormData] = useState({
    expense_category_id: '', expense_date: new Date().toISOString().split('T')[0],
    amount: '', vendor_name: '', reference: '', description: '', status: 'approved' as 'draft' | 'approved' | 'paid' | 'voided'
  });

  // Fetch Data
  const { data: expenses, isLoading } = useQuery({
    queryKey: ['admin/expenses', page, search, statusFilter, categoryFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/expenses?page=${page}&per_page=${perPage}&search=${search}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (categoryFilter !== 'all') url += `&category=${categoryFilter}`;
      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate = '';
        if (dateFilter === 'today') startDate = today.toISOString().split('T')[0];
        else if (dateFilter === 'week') startDate = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0];
        else if (dateFilter === 'month') startDate = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
        url += `&start_date=${startDate}`;
      }
      return apiGet(url);
    }
  });

  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => apiGet('/api/admin/expense-categories')
  });

  const expenseList = useMemo(() => expenses?.data || [], [expenses]);

  const stats = useMemo(() => ({
    total: expenseList.reduce((sum: number, e: Expense) => sum + parseFloat(e.amount.toString()), 0),
    paid: expenseList.filter((e: Expense) => e.status === 'paid').reduce((sum: number, e: Expense) => sum + parseFloat(e.amount.toString()), 0),
    pending: expenseList.filter((e: Expense) => e.status === 'approved').reduce((sum: number, e: Expense) => sum + parseFloat(e.amount.toString()), 0)
  }), [expenseList]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/expenses', data),
    onSuccess: () => { toastSuccess('Expense created'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/expenses'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/expenses/${id}`, data),
    onSuccess: () => { toastSuccess('Expense updated'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/expenses'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/expenses/${id}`),
    onSuccess: () => { toastSuccess('Expense deleted'); qc.invalidateQueries({ queryKey: ['admin/expenses'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const closeModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditingExpense(null);
    setFormData({
      expense_category_id: '', expense_date: new Date().toISOString().split('T')[0],
      amount: '', vendor_name: '', reference: '', description: '', status: 'approved'
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      expense_category_id: expense.expense_category_id.toString(),
      expense_date: expense.expense_date,
      amount: expense.amount.toString(),
      vendor_name: expense.vendor_name || '',
      reference: expense.reference || '',
      description: expense.description || '',
      status: expense.status
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this expense?')) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      amount: parseFloat(formData.amount),
      expense_category_id: parseInt(formData.expense_category_id)
    };
    if (editingExpense) updateMutation.mutate({ id: editingExpense.id, data });
    else createMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'voided': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Expenses</h1>
            <p className="text-slate-400 mt-1">Track business spending</p>
          </div>
          <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>

        <ExpenseStatsRibbon stats={stats} />

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="voided">Voided</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Categories</option>
              {categories?.data?.map((c: ExpenseCategory) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-2">Date</div>
            <div className="col-span-3">Category / Vendor</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Reference</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : expenseList.map((expense: Expense) => (
              <motion.div key={expense.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                <div className="col-span-2 text-sm text-gray-300">
                  {new Date(expense.expense_date).toLocaleDateString()}
                </div>
                <div className="col-span-3">
                  <div className="font-medium text-white">{expense.expense_category?.name}</div>
                  <div className="text-xs text-gray-500">{expense.vendor_name || '-'}</div>
                </div>
                <div className="col-span-2 font-bold text-white">
                  ${parseFloat(expense.amount.toString()).toFixed(2)}
                </div>
                <div className="col-span-2 text-sm text-gray-400 font-mono">{expense.reference || '-'}</div>
                <div className="col-span-2">
                  <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", getStatusColor(expense.status))}>
                    {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(expense)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(expense.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingExpense ? 'Edit Expense' : 'New Expense'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select value={formData.expense_category_id} onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
                required className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="">Select Category</option>
                {categories?.data?.map((c: ExpenseCategory) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Input label="Date" type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} required className="bg-slate-950 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required className="bg-slate-950 border-white/10" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="voided">Voided</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vendor" value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} className="bg-slate-950 border-white/10" />
            <Input label="Reference" value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} className="bg-slate-950 border-white/10" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Save</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
