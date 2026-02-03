import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Edit, Trash2, Tag, Percent, DollarSign, Gift,
  Calendar, CheckCircle, XCircle, TrendingUp, ChevronLeft, ChevronRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';
import PromotionFormModal from './components/PromotionFormModal';

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
        "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[110px] sm:min-w-0",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 transform translate-x-8 -translate-y-8">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-3 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">{title}</p>
            <p className={cn("text-xl sm:text-3xl font-bold", styles.text)}>{value}</p>
          </div>
          <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
            <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon - Horizontal scroll on mobile
const PromotionStatsRibbon = ({ stats }: { stats: any }) => {
  const { t } = useLanguage();
  return (
    <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
      <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
        <StatCard title={t('marketing.promotions.stats.total')} value={stats.total} icon={Tag} color="purple" index={0} />
        <StatCard title={t('marketing.promotions.stats.active')} value={stats.active} icon={CheckCircle} color="emerald" index={1} />
        <StatCard title={t('marketing.promotions.stats.usage')} value={stats.usage} icon={TrendingUp} color="blue" index={2} />
        <StatCard title={t('marketing.promotions.stats.savings')} value={`$${stats.savings}`} icon={DollarSign} color="amber" index={3} />
      </div>
    </div>
  );
};

export default function Promotions() {
  const { t } = useLanguage();
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
    selected_categories: number[]; selected_items: number[];
    buy_quantity: string; get_quantity: string;
  }>({
    name: '', description: '', code: '', type: 'percentage',
    discount_value: '', min_order_amount: '', max_discount_amount: '',
    usage_limit: '', start_date: '', end_date: '', is_active: true,
    applicable_to: 'all', terms_conditions: '',
    selected_categories: [], selected_items: [],
    buy_quantity: '', get_quantity: ''
  });

  // Fetch Data
  const { data: promotions, isLoading } = useQuery({
    queryKey: ['admin/promotions', page, search, statusFilter, typeFilter],
    queryFn: () => {
      let url = `/api/admin/promotions?page=${page}&per_page=${perPage}&search=${search}`;
      if (statusFilter === 'active') url += `&is_active=1`;
      else if (statusFilter === 'inactive') url += `&is_active=0`;
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
    onSuccess: () => { toastSuccess(t('marketing.promotions.messages.created')); closeModal(); qc.invalidateQueries({ queryKey: ['admin/promotions'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || t('marketing.promotions.messages.failed'))
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/promotions/${id}`, data),
    onSuccess: () => { toastSuccess(t('marketing.promotions.messages.updated')); closeModal(); qc.invalidateQueries({ queryKey: ['admin/promotions'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || t('marketing.promotions.messages.failed'))
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/promotions/${id}`),
    onSuccess: () => { toastSuccess(t('marketing.promotions.messages.deleted')); qc.invalidateQueries({ queryKey: ['admin/promotions'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || t('marketing.promotions.messages.failed'))
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
      applicable_to: 'all', terms_conditions: '',
      selected_categories: [], selected_items: [],
      buy_quantity: '', get_quantity: ''
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
      end_date: promo.end_date.slice(0, 16),
      selected_categories: promo.category_ids || [],
      selected_items: promo.menu_item_ids || [],
      buy_quantity: promo.buy_quantity?.toString() || '',
      get_quantity: promo.get_quantity?.toString() || ''
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t('marketing.promotions.messages.delete_confirm'))) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      discount_value: parseFloat(formData.discount_value) || 0,
      min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
      max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      category_ids: formData.applicable_to === 'categories' ? formData.selected_categories : [],
      menu_item_ids: formData.applicable_to === 'items' ? formData.selected_items : [],
      buy_quantity: formData.type === 'buy_x_get_y' ? parseInt(formData.buy_quantity) || 1 : null,
      get_quantity: formData.type === 'buy_x_get_y' ? parseInt(formData.get_quantity) || 1 : null
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
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent truncate"
            >
              {t('marketing.promotions.title')}
            </motion.h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('marketing.promotions.subtitle')}</p>
          </div>
          <Button onClick={() => { closeModal(); setOpenCreate(true); }} variant="primary" className="h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm flex-shrink-0">
            <Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">{t('marketing.promotions.create_button')}</span>
          </Button>
        </div>

        <PromotionStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
        >
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:gap-3 md:gap-4">
            <div className="relative flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder={t('marketing.promotions.filters.search')} value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 sm:pl-10 h-10 text-sm" variant="filled" />
            </div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
              {[
                { key: 'all', label: t('marketing.promotions.filters.status.all') },
                { key: 'active', label: t('marketing.promotions.filters.status.active') },
                { key: 'inactive', label: t('marketing.promotions.filters.status.inactive') }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap touch-manipulation flex-shrink-0",
                    statusFilter === key
                      ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-secondary border border-border rounded-lg sm:rounded-xl px-3 py-2 h-10 text-foreground text-xs sm:text-sm focus:border-fuchsia-500 transition-all touch-manipulation">
              <option value="all">{t('marketing.promotions.filters.type.all')}</option>
              <option value="percentage">{t('marketing.promotions.filters.type.percentage')}</option>
              <option value="fixed_amount">{t('marketing.promotions.filters.type.fixed_amount')}</option>
              <option value="buy_x_get_y">{t('marketing.promotions.filters.type.buy_x_get_y')}</option>
            </select>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {/* Table Header with Gradient - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('marketing.promotions.table.headers.name_code')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('marketing.promotions.table.headers.type')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('marketing.promotions.table.headers.discount')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('marketing.promotions.table.headers.usage')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('marketing.promotions.table.headers.valid_until')}</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('marketing.promotions.table.headers.actions')}</div>
          </div>
          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="inline-flex items-center gap-2 sm:gap-3 text-muted-foreground text-sm">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                  {t('marketing.promotions.table.loading')}
                </div>
              </div>
            ) : promotionList.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                  <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-fuchsia-500" />
                </div>
                <h3 className="text-foreground font-semibold text-sm sm:text-base">{t('marketing.promotions.table.empty.title')}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">{t('marketing.promotions.table.empty.subtitle')}</p>
              </div>
            ) : promotionList.map((promo: any, idx: number) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="group hover:bg-gradient-to-r hover:from-fuchsia-500/5 hover:to-transparent transition-all"
              >
                {/* Desktop row layout */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center">
                  <div className="col-span-3">
                    <div className="font-semibold text-foreground">{promo.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{promo.code || '-'}</div>
                  </div>
                  <div className="col-span-2 flex items-center gap-2 text-sm">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400">{getTypeIcon(promo.type)}</div>
                    <span className="capitalize text-foreground">{(promo.type || 'percentage').replace(/_/g, ' ')}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/30">
                      {promo.type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                    </span>
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{promo.usage_count}</span> / {promo.usage_limit || '∞'}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(promo.end_date).toLocaleDateString()}
                  </div>
                  <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(promo)}
                      className="h-8 w-8 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(promo.id)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Mobile card layout */}
                <div className="md:hidden p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground text-sm truncate">{promo.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{promo.code || 'No code'}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 flex-shrink-0">
                      {promo.type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <div className="p-0.5 bg-purple-500/10 rounded text-purple-600 dark:text-purple-400">{getTypeIcon(promo.type)}</div>
                      <span className="capitalize">{(promo.type || '%').replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(promo.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span><span className="font-semibold text-foreground">{promo.usage_count}</span>/{promo.usage_limit || '∞'}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1 pt-2 border-t border-border/30">
                    <button onClick={() => handleEdit(promo)}
                      className="p-2 rounded-lg hover:bg-fuchsia-500/20 text-muted-foreground hover:text-fuchsia-500 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(promo.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {promotions?.meta && (
            <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-t border-border/50 bg-gradient-to-r from-transparent via-fuchsia-500/5 to-transparent">
              <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                {((page - 1) * perPage) + 1}-{Math.min(page * perPage, promotions.meta.total)} {t('analytics.audit.pagination.page_of').replace('{page}', '').replace('{lastPage}', promotions.meta.total)}
              </div>
              <div className="flex gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-9 px-2 sm:px-3"
                >
                  <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline ml-1">{t('analytics.audit.pagination.previous')}</span>
                </Button>
                <span className="text-sm font-medium text-foreground px-3 py-2 rounded-lg bg-secondary border border-border sm:hidden">
                  {page}/{promotions.meta.last_page}
                </span>
                <div className="hidden sm:flex gap-1.5">
                  {Array.from({ length: Math.min(promotions.meta.last_page, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className={cn("h-9 w-9", page === pageNum && "shadow-lg shadow-fuchsia-500/30")}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === promotions.meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="h-9 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline mr-1">{t('analytics.audit.pagination.next')}</span><ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
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
