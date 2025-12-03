import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Edit, Trash2, Tag, Percent, DollarSign, Gift,
  Calendar, CheckCircle, XCircle, TrendingUp
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import PromotionFormModal from './components/PromotionFormModal';

// Stats Ribbon
const PromotionStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Promotions</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <Tag className="w-8 h-8 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Active</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
        </div>
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Usage</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.usage}</p>
        </div>
        <TrendingUp className="w-8 h-8 text-blue-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Savings</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">${stats.savings}</p>
        </div>
        <DollarSign className="w-8 h-8 text-amber-400" />
      </div>
    </div>
  </div>
);

export default function Promotions() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [error, setError] = useState('');

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [formData, setFormData] = useState<{
    name: string; description: string; code: string; type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_item';
    discount_value: string; min_order_amount: string; max_discount_amount: string;
    usage_limit: string; start_date: string; end_date: string; is_active: boolean;
    applicable_to: 'all' | 'categories' | 'items'; terms_conditions: string;
  }>({
    name: '', description: '', code: '', type: 'percentage',
    discount_value: '', min_order_amount: '', max_discount_amount: '',
    usage_limit: '', start_date: '', end_date: '', is_active: true,
    applicable_to: 'all', terms_conditions: ''
  });

  // Fetch Data
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['admin/promotions', page, search, statusFilter, typeFilter],
    queryFn: () => {
      let url = `/api/admin/promotions?page=${page}&per_page=${perPage}&search=${search}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`; // API might need adjustment or use is_active/expired logic
      if (typeFilter !== 'all') url += `&type=${typeFilter}`;
      return apiGet(url);
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin/promotion-stats'],
    queryFn: () => apiGet('/api/admin/promotion-stats')
  });

  const promotionList = useMemo(() => promotions?.data || [], [promotions]);

  const stats = useMemo(() => ({
    total: promotions?.meta?.total || 0,
    active: promotionList.filter((p: any) => p.is_active).length, // Approximation if not from backend
    usage: statsData?.total_usage || 0,
    savings: statsData?.total_savings || 0
  }), [promotionList, promotions, statsData]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/promotions', data),
    onSuccess: () => { toastSuccess('Promotion created'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/promotions'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/promotions/${id}`, data),
    onSuccess: () => { toastSuccess('Promotion updated'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/promotions'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/promotions/${id}`),
    onSuccess: () => { toastSuccess('Promotion deleted'); qc.invalidateQueries({ queryKey: ['admin/promotions'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const closeModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditingPromotion(null);
    setError('');
    setFormData({
      name: '', description: '', code: '', type: 'percentage',
      discount_value: '', min_order_amount: '', max_discount_amount: '',
      usage_limit: '', start_date: '', end_date: '', is_active: true,
      applicable_to: 'all', terms_conditions: ''
    });
  };

  const handleEdit = (promo: any) => {
    setEditingPromotion(promo);
    setFormData({
      ...promo,
      discount_value: promo.discount_value.toString(),
      min_order_amount: promo.min_order_amount?.toString() || '',
      max_discount_amount: promo.max_discount_amount?.toString() || '',
      usage_limit: promo.usage_limit?.toString() || '',
      start_date: promo.start_date.slice(0, 16),
      end_date: promo.end_date.slice(0, 16)
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this promotion?')) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
    };
    if (editingPromotion) updateMutation.mutate({ id: editingPromotion.id, data });
    else createMutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent size={14} />;
      case 'fixed_amount': return <DollarSign size={14} />;
      case 'buy_x_get_y': return <Gift size={14} />;
      default: return <Tag size={14} />;
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Promotions</h1>
            <p className="text-slate-400 mt-1">Manage marketing campaigns</p>
          </div>
          <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Create Promotion
          </Button>
        </div>

        <PromotionStatsRibbon stats={stats} />

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search promotions..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed_amount">Fixed Amount</option>
              <option value="buy_x_get_y">Buy X Get Y</option>
            </select>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-3">Name / Code</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Discount</div>
            <div className="col-span-2">Usage</div>
            <div className="col-span-2">Valid Until</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : promotionList.map((promo: any) => (
              <motion.div key={promo.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                <div className="col-span-3">
                  <div className="font-medium text-white">{promo.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{promo.code || '-'}</div>
                </div>
                <div className="col-span-2 flex items-center gap-2 text-sm text-gray-300">
                  <div className="p-1.5 bg-white/5 rounded text-purple-400">{getTypeIcon(promo.type)}</div>
                  <span className="capitalize">{promo.type.replace(/_/g, ' ')}</span>
                </div>
                <div className="col-span-2 text-sm font-bold text-emerald-400">
                  {promo.type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                </div>
                <div className="col-span-2 text-sm text-gray-400">
                  {promo.usage_count} / {promo.usage_limit || '∞'}
                </div>
                <div className="col-span-2 text-sm text-gray-400">
                  {new Date(promo.end_date).toLocaleDateString()}
                </div>
                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(promo)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(promo.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <PromotionFormModal
        open={openCreate || openEdit}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingPromotion={editingPromotion}
        error={error}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </AdminLayout>
  );
}
