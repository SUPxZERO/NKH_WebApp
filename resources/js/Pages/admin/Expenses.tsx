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
import { Expense, ExpenseCategory } from '@/types';
import { useLanguage } from '@/app/context/LanguageContext';

// StatCard Component with vibrant gradients - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
  const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string; shadow: string }> = {
    purple: {
      gradient: 'from-fuchsia-500/20 to-purple-500/10',
      iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
      text: 'text-fuchsia-600 dark:text-fuchsia-400',
      border: 'border-fuchsia-500/30',
      shadow: 'shadow-fuchsia-500/20'
    },
    emerald: {
      gradient: 'from-emerald-500/20 to-green-500/10',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      shadow: 'shadow-emerald-500/20'
    },
    amber: {
      gradient: 'from-amber-500/20 to-orange-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      shadow: 'shadow-amber-500/20'
    }
  };
  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 transform translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-8 hidden sm:block">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">{title}</p>
            <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate", styles.text)}>{value}</p>
          </div>
          <div className={cn("p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon - Mobile optimized
const ExpenseStatsRibbon = ({ stats }: { stats: any }) => {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
      <StatCard title={t('admin.finance.expenses.stats.total')} value={`$${stats.total.toFixed(0)}`} icon={DollarSign} color="purple" index={0} />
      <StatCard title={t('admin.finance.expenses.stats.paid')} value={`$${stats.paid.toFixed(0)}`} icon={CheckCircle} color="emerald" index={1} />
      <StatCard title={t('admin.finance.expenses.stats.pending')} value={`$${stats.pending.toFixed(0)}`} icon={Clock} color="amber" index={2} />
    </div>
  );
};

export default function Expenses() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openManageCategories, setOpenManageCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
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

  const expenseList = useMemo(() => {
    if (!expenses) return [];
    if (Array.isArray(expenses)) return expenses;
    if (Array.isArray(expenses.data)) return expenses.data;
    return [];
  }, [expenses]);

  const stats = useMemo(() => {
    if (!expenseList.length) return { total: 0, paid: 0, pending: 0 };
    return {
      total: expenseList.reduce((sum: number, e: Expense) => sum + (parseFloat(e.amount?.toString()) || 0), 0),
      paid: expenseList.filter((e: Expense) => e.status === 'paid').reduce((sum: number, e: Expense) => sum + (parseFloat(e.amount?.toString()) || 0), 0),
      pending: expenseList.filter((e: Expense) => e.status === 'approved').reduce((sum: number, e: Expense) => sum + (parseFloat(e.amount?.toString()) || 0), 0)
    };
  }, [expenseList]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/expenses', data),
    onSuccess: () => { toastSuccess(t('admin.finance.expenses.toasts.created') as string); closeModal(); qc.invalidateQueries({ queryKey: ['admin/expenses'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.finance.expenses.toasts.failed') as string)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/expenses/${id}`, data),
    onSuccess: () => { toastSuccess(t('admin.finance.expenses.toasts.updated') as string); closeModal(); qc.invalidateQueries({ queryKey: ['admin/expenses'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.finance.expenses.toasts.failed') as string)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/expenses/${id}`),
    onSuccess: () => { toastSuccess(t('admin.finance.expenses.toasts.deleted') as string); qc.invalidateQueries({ queryKey: ['admin/expenses'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.finance.expenses.toasts.failed') as string)
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/expense-categories', data),
    onSuccess: () => {
      toastSuccess(t('admin.finance.expenses.toasts.category_created') as string);
      setNewCatName('');
      qc.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.finance.expenses.toasts.failed') as string)
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/expense-categories/${id}`),
    onSuccess: () => {
      toastSuccess(t('admin.finance.expenses.toasts.category_deleted') as string);
      qc.invalidateQueries({ queryKey: ['expense-categories'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || t('admin.finance.expenses.toasts.failed') as string)
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
      expense_date: expense.expense_date || '',
      amount: expense.amount.toString(),
      vendor_name: expense.vendor_name || '',
      reference: expense.reference || '',
      description: expense.description || '',
      status: (expense.status as 'draft' | 'approved' | 'paid' | 'voided') || 'approved'
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t('admin.finance.expenses.modal.confirm_delete') as string)) deleteMutation.mutate(id);
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
      case 'paid': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'voided': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent truncate"
            >
              {t('admin.finance.expenses.title')}
            </motion.h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('admin.finance.expenses.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setOpenManageCategories(true)} variant="secondary" className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0">
              <FileText className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('admin.finance.expenses.categories')}</span>
            </Button>
            <Button onClick={() => { closeModal(); setOpenCreate(true); }} variant="primary" className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{t('admin.finance.expenses.add_expense')}</span>
            </Button>
          </div>
        </div>

        <ExpenseStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder={t('admin.finance.expenses.filters.search') as string} value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-sm" variant="filled" />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-secondary border border-border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none">
                <option value="all">{t('admin.finance.expenses.filters.all_status')}</option>
                <option value="draft">{t('admin.finance.expenses.status.draft')}</option>
                <option value="approved">{t('admin.finance.expenses.status.approved')}</option>
                <option value="paid">{t('admin.finance.expenses.status.paid')}</option>
                <option value="voided">{t('admin.finance.expenses.status.voided')}</option>
              </select>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-secondary border border-border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none hidden sm:block">
                <option value="all">{t('admin.finance.expenses.filters.all_categories')}</option>
                {categories?.data?.map((c: ExpenseCategory) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 sm:flex-none bg-secondary border border-border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none">
                <option value="all">{t('admin.finance.expenses.filters.all_time')}</option>
                <option value="today">{t('admin.dashboard.period.today')}</option>
                <option value="week">{t('admin.dashboard.period.this_week')}</option>
                <option value="month">{t('admin.dashboard.period.this_month')}</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Desktop Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:block relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {/* Table Header with Gradient */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-purple-500/10">
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.expenses.table.date')}</div>
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.expenses.table.category_vendor')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.expenses.table.amount')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.expenses.table.reference')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.finance.expenses.table.status')}</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.finance.expenses.table.actions')}</div>
          </div>
          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  {t('admin.finance.expenses.table.loading')}
                </div>
              </div>
            ) : expenseList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-foreground font-semibold">{t('admin.finance.expenses.table.empty')}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t('admin.finance.expenses.table.create_trigger')}</p>
              </div>
            ) : expenseList.map((expense: Expense) => (
              <motion.div key={expense.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-transparent transition-all group">
                <div className="col-span-2 text-sm text-muted-foreground">
                  {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}
                </div>
                <div className="col-span-3">
                  <div className="font-medium text-foreground">{(expense as any).expense_category?.name || t('admin.finance.expenses.uncategorized')}</div>
                  <div className="text-xs text-muted-foreground">{expense.vendor_name || '-'}</div>
                </div>
                <div className="col-span-2 font-bold text-foreground">
                  ${parseFloat(expense.amount.toString()).toFixed(2)}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground font-mono">{expense.reference || '-'}</div>
                <div className="col-span-2">
                  <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", getStatusColor(expense.status || 'draft'))}>
                    {t(`finance.expenses.status.${expense.status || 'draft'}`)}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(expense)} className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-600 dark:hover:text-purple-400"><Edit size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(expense.id)} className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={14} /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
              <div className="inline-flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{t('admin.finance.expenses.table.loading')}</span>
              </div>
            </div>
          ) : expenseList.length === 0 ? (
            <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-foreground font-semibold text-sm">{t('admin.finance.expenses.table.empty')}</h3>
              <p className="text-muted-foreground text-xs mt-1">{t('admin.finance.expenses.table.create_trigger')}</p>
            </div>
          ) : expenseList.map((expense: Expense) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{(expense as any).expense_category?.name || t('admin.finance.expenses.uncategorized')}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0", getStatusColor(expense.status || 'draft'))}>
                  {t(`finance.expenses.status.${expense.status || 'draft'}`)}
                </span>
              </div>

              {/* Info Row */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-bold text-foreground text-base">${parseFloat(expense.amount.toString()).toFixed(2)}</span>
                  {expense.vendor_name && (
                    <span className="text-muted-foreground truncate max-w-[100px]">{expense.vendor_name}</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(expense)} className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-500">
                    <Edit size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(expense.id)} className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingExpense ? t('admin.finance.expenses.modal.edit_title') : t('admin.finance.expenses.modal.new_title')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <label className="block text-xs sm:text-sm font-medium text-foreground">{t('admin.finance.expenses.modal.category_label')}</label>
                <button type="button" onClick={() => setOpenManageCategories(true)} className="text-[10px] text-purple-500 hover:text-purple-600 font-medium flex items-center gap-1">
                  <Plus size={10} /> {t('admin.finance.expenses.categories_modal.add_new')}
                </button>
              </div>
              <select value={formData.expense_category_id} onChange={(e) => setFormData({ ...formData, expense_category_id: e.target.value })}
                required className="w-full h-10 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none">
                <option value="">{t('admin.finance.expenses.modal.select_category')}</option>
                {categories?.data?.map((c: ExpenseCategory) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Input label={t('admin.finance.expenses.modal.date_label') as string} type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} required className="h-10 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Input label={t('admin.finance.expenses.modal.amount_label') as string} type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required className="h-10 text-sm" />
            <div>
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">{t('admin.finance.expenses.modal.status_label')}</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none">
                <option value="draft">{t('admin.finance.expenses.status.draft')}</option>
                <option value="approved">{t('admin.finance.expenses.status.approved')}</option>
                <option value="paid">{t('admin.finance.expenses.status.paid')}</option>
                <option value="voided">{t('admin.finance.expenses.status.voided')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label={t('admin.finance.expenses.modal.vendor_label') as string} value={formData.vendor_name} onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })} className="h-10 text-sm" />
            <Input label={t('admin.finance.expenses.modal.reference_label') as string} value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} className="h-10 text-sm" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-1.5">{t('admin.finance.expenses.modal.description_label')}</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none resize-none" />
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11 text-sm">{t('admin.finance.expenses.modal.cancel')}</Button>
            <Button type="submit" variant="primary" className="flex-1 h-10 sm:h-11 text-sm">{t('admin.finance.expenses.modal.save')}</Button>
          </div>
        </form>
      </Modal>

      {/* Categories Management Modal */}
      <Modal open={openManageCategories} onClose={() => setOpenManageCategories(false)} title={t('admin.finance.expenses.categories_modal.title')} size="md">
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder={t('admin.finance.expenses.categories_modal.placeholder') as string}
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => {
                if (newCatName.trim()) createCategoryMutation.mutate({ name: newCatName.trim() });
              }}
              disabled={createCategoryMutation.isPending || !newCatName.trim()}
              variant="primary"
            >
              {t('admin.finance.expenses.categories_modal.add_btn')}
            </Button>
          </div>

          <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border">
            <div className="divide-y divide-border">
              {categories?.data?.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">{t('admin.finance.expenses.categories_modal.empty')}</div>
              ) : categories?.data?.map((c: ExpenseCategory) => (
                <div key={c.id} className="flex items-center justify-between p-3 hover:bg-secondary/50">
                  <span className="text-sm font-medium">{c.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(t('admin.finance.expenses.categories_modal.confirm_delete') as string)) deleteCategoryMutation.mutate(c.id);
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
