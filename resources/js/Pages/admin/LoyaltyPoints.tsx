import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Eye, Edit, Trash2, TrendingUp, Gift, Users,
  Calendar, DollarSign, Star, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// StatCard Component with vibrant gradients - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
  const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string; shadow: string }> = {
    purple: {
      gradient: 'from-purple-500/20 to-fuchsia-500/10',
      iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/30',
      shadow: 'shadow-purple-500/20'
    },
    emerald: {
      gradient: 'from-emerald-500/20 to-green-500/10',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      shadow: 'shadow-emerald-500/20'
    },
    blue: {
      gradient: 'from-blue-500/20 to-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/30',
      shadow: 'shadow-blue-500/20'
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
        "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[100px] sm:min-w-0",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 hidden sm:block">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">{title}</p>
            <p className={cn("text-lg sm:text-2xl md:text-3xl font-bold", styles.text)}>{value}</p>
          </div>
          <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon - Mobile optimized with horizontal scroll
const LoyaltyStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
    <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
      <StatCard title="Earned" value={stats.earned.toLocaleString()} icon={TrendingUp} color="emerald" index={0} />
      <StatCard title="Redeemed" value={stats.redeemed.toLocaleString()} icon={Gift} color="blue" index={1} />
      <StatCard title="Customers" value={stats.activeCustomers} icon={Users} color="purple" index={2} />
      <StatCard title="Txns" value={stats.transactions} icon={Star} color="amber" index={3} />
    </div>
  </div>
);

interface LoyaltyPoint {
  id: number; customer_id: number; customer?: { id: number; user?: { name: string } };
  type: 'earn' | 'redeem' | 'adjust'; points: number; balance_after: number;
  occurred_at: string; order_id?: number; notes?: string; created_at: string;
}

export default function LoyaltyPoints() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<LoyaltyPoint | null>(null);

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [formData, setFormData] = useState({
    customer_id: '', type: 'earn', points: '', occurred_at: '', notes: ''
  });

  // Fetch Data
  const { data: loyaltyPoints, isLoading } = useQuery({
    queryKey: ['loyalty-points', page, search, typeFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/loyalty-points?page=${page}&per_page=${perPage}&search=${search}`;
      if (typeFilter !== 'all') url += `&type=${typeFilter}`;
      // Date filter logic would go here if backend supports it directly or handled via params
      return apiGet(url);
    }
  });

  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => apiGet('/api/admin/customers') });
  const { data: statsData } = useQuery({ queryKey: ['loyalty-stats'], queryFn: () => apiGet('/api/admin/loyalty-points/stats') });

  const transactionList = useMemo(() => loyaltyPoints?.data || [], [loyaltyPoints]);

  const stats = useMemo(() => ({
    earned: statsData?.total_earned || 0,
    redeemed: statsData?.total_redeemed || 0,
    activeCustomers: statsData?.active_customers || 0,
    transactions: loyaltyPoints?.meta?.total || 0
  }), [statsData, loyaltyPoints]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/loyalty-points', data),
    onSuccess: () => { toastSuccess('Transaction created'); closeModal(); qc.invalidateQueries({ queryKey: ['loyalty-points'] }); qc.invalidateQueries({ queryKey: ['loyalty-stats'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/loyalty-points/${id}`, data),
    onSuccess: () => { toastSuccess('Transaction updated'); closeModal(); qc.invalidateQueries({ queryKey: ['loyalty-points'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/loyalty-points/${id}`),
    onSuccess: () => { toastSuccess('Transaction deleted'); qc.invalidateQueries({ queryKey: ['loyalty-points'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const closeModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditingTransaction(null);
    setFormData({ customer_id: '', type: 'earn', points: '', occurred_at: '', notes: '' });
  };

  const handleEdit = (transaction: LoyaltyPoint) => {
    setEditingTransaction(transaction);
    setFormData({
      customer_id: transaction.customer_id.toString(),
      type: transaction.type,
      points: Math.abs(transaction.points).toString(),
      occurred_at: transaction.occurred_at.slice(0, 16),
      notes: transaction.notes || ''
    });
    setOpenEdit(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const points = parseInt(formData.points);
    const data = {
      ...formData,
      customer_id: parseInt(formData.customer_id),
      points: formData.type === 'redeem' ? -Math.abs(points) : Math.abs(points)
    };
    if (editingTransaction) updateMutation.mutate({ id: editingTransaction.id, data });
    else createMutation.mutate(data);
  };

  const getTypeColor = (type: string) => {
    if (type === 'earn') return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (type === 'redeem') return 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent truncate"
            >
              Loyalty Points
            </motion.h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">Customer rewards</p>
          </div>
          <Button onClick={() => { closeModal(); setFormData({ ...formData, occurred_at: new Date().toISOString().slice(0, 16) }); setOpenCreate(true); }} className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0 bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Transaction</span>
          </Button>
        </div>

        <LoyaltyStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
        >
          <div className="flex gap-2 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm" variant="filled" />
            </div>
            <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
              {[
                { key: 'all', label: 'All', mobile: 'All' },
                { key: 'earn', label: 'Earned', mobile: '+' },
                { key: 'redeem', label: 'Redeemed', mobile: '-' },
                { key: 'adjust', label: 'Adjust', mobile: '±' }
              ].map(({ key, label, mobile }) => (
                <button
                  key={key}
                  onClick={() => setTypeFilter(key)}
                  className={cn(
                    "px-2.5 sm:px-4 py-2 h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0",
                    typeFilter === key
                      ? "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  <span className="sm:hidden">{mobile}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Desktop Table - Hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:block relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {/* Table Header with Gradient */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-purple-500/10">
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Customer</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Type</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Points</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Balance</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Date</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              </div>
            ) : transactionList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center">
                  <Star className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-foreground font-semibold">No transactions found</h3>
                <p className="text-muted-foreground text-sm mt-1">Create first transaction</p>
              </div>
            ) : transactionList.map((transaction: LoyaltyPoint, idx: number) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-transparent transition-all group"
              >
                <div className="col-span-3">
                  <div className="font-semibold text-foreground">{transaction.customer?.user?.name || 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">ID: {transaction.customer_id}</div>
                </div>
                <div className="col-span-2">
                  <span className={cn("px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 w-fit", getTypeColor(transaction.type))}>
                    {transaction.type === 'earn' ? <ArrowUpRight size={12} /> : transaction.type === 'redeem' ? <ArrowDownLeft size={12} /> : <Edit size={12} />}
                    {transaction.type.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={cn("font-bold", transaction.points > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground font-mono">
                  {transaction.balance_after}
                </div>
                <div className="col-span-2 text-sm">
                  <div className="text-foreground">{new Date(transaction.occurred_at).toLocaleDateString()}</div>
                  {transaction.order_id && <div className="text-xs text-purple-600">Order #{transaction.order_id}</div>}
                </div>
                <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(transaction)} className="h-7 w-7 p-0 hover:bg-purple-500/20 hover:text-purple-600"><Edit size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm('Delete?') && deleteMutation.mutate(transaction.id)} className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-600"><Trash2 size={14} /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mobile Cards - Hidden on desktop */}
        <div className="md:hidden space-y-2">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading...
            </div>
          ) : transactionList.length === 0 ? (
            <div className="p-8 text-center bg-card/50 rounded-xl border border-border/50">
              <Star className="w-10 h-10 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No transactions found</p>
            </div>
          ) : (
            transactionList.map((transaction: LoyaltyPoint, idx: number) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground text-sm truncate">{transaction.customer?.user?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-muted-foreground">{new Date(transaction.occurred_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(transaction)} className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-600">
                      <Edit size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => confirm('Delete?') && deleteMutation.mutate(transaction.id)} className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-600">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium border flex items-center gap-1", getTypeColor(transaction.type))}>
                    {transaction.type === 'earn' ? <ArrowUpRight size={10} /> : transaction.type === 'redeem' ? <ArrowDownLeft size={10} /> : <Edit size={10} />}
                    {transaction.type.toUpperCase()}
                  </span>
                  <span className={cn("text-sm font-bold", transaction.points > 0 ? "text-emerald-600" : "text-red-600")}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </span>
                  <span className="text-[10px] text-muted-foreground">→ {transaction.balance_after}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingTransaction ? 'Edit' : 'New Transaction'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
              <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} required
                className="w-full h-10 bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all">
                <option value="">Select</option>
                {customers?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.user?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full h-10 bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all">
                <option value="earn">Earn</option>
                <option value="redeem">Redeem</option>
                <option value="adjust">Adjust</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label="Points" type="number" min="1" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} required className="h-10 text-sm" />
            <Input label="Date" type="datetime-local" value={formData.occurred_at} onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })} required className="h-10 text-sm" />
          </div>
          <div className="hidden sm:block">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2}
              className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" placeholder="Notes..." />
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11 text-sm">Cancel</Button>
            <Button type="submit" className="flex-1 h-10 sm:h-11 text-sm bg-purple-600 hover:bg-purple-700">Save</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
