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

// Stats Ribbon
const LoyaltyStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Earned</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.earned.toLocaleString()}</p>
        </div>
        <TrendingUp className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Redeemed</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.redeemed.toLocaleString()}</p>
        </div>
        <Gift className="w-8 h-8 text-blue-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Active Customers</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.activeCustomers}</p>
        </div>
        <Users className="w-8 h-8 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Transactions</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.transactions}</p>
        </div>
        <Star className="w-8 h-8 text-white" />
      </div>
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
  const { data: statsData } = useQuery({ queryKey: ['loyalty-stats'], queryFn: () => apiGet('/api/admin/loyalty-stats') });

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
    if (type === 'earn') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (type === 'redeem') return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Loyalty Points</h1>
            <p className="text-slate-400 mt-1">Customer rewards and point transactions</p>
          </div>
          <Button onClick={() => { closeModal(); setFormData({ ...formData, occurred_at: new Date().toISOString().slice(0, 16) }); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Transaction
          </Button>
        </div>

        <LoyaltyStatsRibbon stats={stats} />

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Types</option>
              <option value="earn">Earned</option>
              <option value="redeem">Redeemed</option>
              <option value="adjust">Adjustments</option>
            </select>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Points</div>
            <div className="col-span-2">Balance After</div>
            <div className="col-span-2">Date / Order</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : transactionList.map((transaction: LoyaltyPoint) => (
              <motion.div key={transaction.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                <div className="col-span-3">
                  <div className="font-medium text-white">{transaction.customer?.user?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">ID: {transaction.customer_id}</div>
                </div>
                <div className="col-span-2">
                  <span className={cn("px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 w-fit", getTypeColor(transaction.type))}>
                    {transaction.type === 'earn' ? <ArrowUpRight size={12} /> : transaction.type === 'redeem' ? <ArrowDownLeft size={12} /> : <Edit size={12} />}
                    {transaction.type.toUpperCase()}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className={cn("font-bold", transaction.points > 0 ? "text-emerald-400" : "text-red-400")}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-300 font-mono">
                  {transaction.balance_after}
                </div>
                <div className="col-span-2 text-sm">
                  <div className="text-white">{new Date(transaction.occurred_at).toLocaleDateString()}</div>
                  {transaction.order_id && <div className="text-xs text-purple-400">Order #{transaction.order_id}</div>}
                </div>
                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(transaction)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                  <Button size="sm" variant="danger" onClick={() => confirm('Delete?') && deleteMutation.mutate(transaction.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingTransaction ? 'Edit Transaction' : 'New Transaction'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Customer</label>
              <select value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} required
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="">Select Customer</option>
                {customers?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.user?.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="earn">Earn Points</option>
                <option value="redeem">Redeem Points</option>
                <option value="adjust">Adjust Points</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Points" type="number" min="1" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} required className="bg-slate-950 border-white/10" />
            <Input label="Date & Time" type="datetime-local" value={formData.occurred_at} onChange={(e) => setFormData({ ...formData, occurred_at: e.target.value })} required className="bg-slate-950 border-white/10" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500" placeholder="Optional notes..." />
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
