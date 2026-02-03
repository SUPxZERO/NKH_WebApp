import React, { useState, useMemo } from 'react';
import { useTranslation } from '@/app/hooks/useTranslation';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Edit, Trash2, Folder, FolderOpen,
  ChevronRight, ChevronDown, CheckCircle, XCircle, Layers
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { ImageUploader } from '@/app/components/ui/ImageUploader';

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
        "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[100px] sm:min-w-0",
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
const CategoryStatsRibbon = ({ stats }: { stats: any }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
      <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
        <StatCard title={t('admin.categories.stats.total')} value={stats.total} icon={Folder} color="purple" index={0} />
        <StatCard title={t('admin.categories.stats.active')} value={stats.active} icon={CheckCircle} color="emerald" index={1} />
        <StatCard title={t('admin.categories.stats.sub')} value={stats.sub} icon={Layers} color="blue" index={2} />
        <StatCard title={t('admin.categories.stats.items')} value={stats.items} icon={FolderOpen} color="amber" index={3} />
      </div>
    </div>
  )
};

export default function Categories() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [creatingUnder, setCreatingUnder] = useState<any>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const { t } = useTranslation();

  const qc = useQueryClient();

  const [formData, setFormData] = useState({
    name: '', slug: '', description: '', image: null as File | null, display_order: 0, is_active: true
  });

  // Fetch Data
  const { data: categoryList, isLoading } = useQuery({
    queryKey: ['admin/categories', search, statusFilter],
    queryFn: () => apiGet(`/api/admin/categories/hierarchy?search=${encodeURIComponent(search)}`)
  });

  const { data: statsData } = useQuery({
    queryKey: ['admin/categories/stats'],
    queryFn: () => apiGet('/api/admin/categories/stats')
  });

  const categories = useMemo(() => Array.isArray(categoryList) ? categoryList : (categoryList?.data || []), [categoryList]);

  const stats = useMemo(() => ({
    total: statsData?.total || 0,
    active: statsData?.active || 0,
    sub: statsData?.sub_categories || 0,
    items: statsData?.menu_items_total || 0
  }), [statsData]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiPost('/api/admin/categories', data),
    onSuccess: () => { toastSuccess('Category created'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/categories'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: FormData }) => apiPost(`/api/admin/categories/${id}?_method=PUT`, data),
    onSuccess: () => { toastSuccess('Category updated'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/categories'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/categories/${id}`),
    onSuccess: () => { toastSuccess('Category deleted'); qc.invalidateQueries({ queryKey: ['admin/categories'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const closeModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditingCategory(null);
    setCreatingUnder(null);
    setFormData({ name: '', slug: '', description: '', image: null, display_order: 0, is_active: true });
  };

  const handleEdit = (cat: any) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name, slug: cat.slug, description: cat.description || '',
      image: null, display_order: cat.display_order, is_active: cat.is_active
    });
    setOpenEdit(true);
  };

  const handleCreate = (parent?: any) => {
    setCreatingUnder(parent);
    setOpenCreate(true);
  };

  const handleDelete = (cat: any) => {
    if (cat.children && cat.children.length > 0) {
      toastError(t('admin.categories.actions.cannot_delete') as string);
      return;
    }
    if (confirm(`${t('admin.categories.actions.confirm_delete')} "${cat.name}"?`)) deleteMutation.mutate(cat.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('slug', formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    data.append('description', formData.description);
    data.append('display_order', formData.display_order.toString());
    data.append('is_active', formData.is_active ? '1' : '0');
    if (formData.image) data.append('image', formData.image);
    if (creatingUnder) data.append('parent_id', creatingUnder.id.toString());

    if (editingCategory) updateMutation.mutate({ id: editingCategory.id, data });
    else createMutation.mutate(data);
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpanded(newExpanded);
  };

  const renderTree = (cats: any[], level = 0) => {
    return cats.map((cat, idx) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expanded.has(cat.id);
      const mobileIndent = Math.min(level * 12, 36); // Limit indent on mobile
      const desktopIndent = level * 24;

      return (
        <React.Fragment key={cat.id}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.02 }}
            className={cn(
              "p-3 sm:p-4 hover:bg-gradient-to-r hover:from-fuchsia-500/5 hover:to-transparent transition-all",
              level > 0 && "bg-fuchsia-500/[0.02]"
            )}
          >
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center gap-2" style={{ paddingLeft: `${mobileIndent}px` }}>
                {hasChildren ? (
                  <button onClick={() => toggleExpand(cat.id)} className="p-1.5 hover:bg-fuchsia-500/20 rounded-lg text-muted-foreground hover:text-fuchsia-500 transition-colors flex-shrink-0">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <span className="w-7" />
                )}
                {cat.image ? (
                  <img src={cat.image} alt="" className="w-9 h-9 rounded-lg object-cover bg-secondary border border-border/50 flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center text-fuchsia-500 border border-fuchsia-500/20 flex-shrink-0">
                    <Folder size={16} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-foreground text-sm truncate block">{cat.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{cat.menu_items?.length || 0} {t('admin.categories.table.items')}</span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      cat.is_active ? "bg-emerald-500" : "bg-red-500"
                    )} />
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleCreate(cat)} className="p-2 rounded-lg hover:bg-fuchsia-500/20 text-muted-foreground hover:text-fuchsia-500">
                    <Plus size={16} />
                  </button>
                  <button onClick={() => handleEdit(cat)} className="p-2 rounded-lg hover:bg-fuchsia-500/20 text-muted-foreground hover:text-fuchsia-500">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(cat)} className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:grid grid-cols-12 gap-4 items-center group">
              <div className="col-span-5 flex items-center gap-2" style={{ paddingLeft: `${desktopIndent}px` }}>
                {hasChildren ? (
                  <button onClick={() => toggleExpand(cat.id)} className="p-1 hover:bg-fuchsia-500/20 rounded text-muted-foreground hover:text-fuchsia-500 transition-colors">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                ) : (
                  <span className="w-6" />
                )}
                {cat.image ? (
                  <img src={cat.image} alt="" className="w-8 h-8 rounded-lg object-cover bg-secondary border border-border/50" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center text-fuchsia-500 border border-fuchsia-500/20">
                    <Folder size={14} />
                  </div>
                )}
                <span className="font-semibold text-foreground">{cat.name}</span>
              </div>
              <div className="col-span-3 text-sm text-muted-foreground font-mono">/{cat.slug}</div>
              <div className="col-span-2 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{cat.menu_items?.length || 0}</span> {t('admin.categories.table.items')}
              </div>
              <div className="col-span-1">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                  cat.is_active
                    ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", cat.is_active ? "bg-emerald-500" : "bg-red-500")} />
                  {cat.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                </span>
              </div>
              <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <Button size="sm" variant="ghost" onClick={() => handleCreate(cat)} className="h-7 w-7 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500" title={t('admin.categories.actions.add_sub') as string}><Plus size={12} /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(cat)} className="h-7 w-7 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500"><Edit size={12} /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(cat)} className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-500"><Trash2 size={12} /></Button>
              </div>
            </div>
          </motion.div>
          {hasChildren && isExpanded && renderTree(cat.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent truncate"
            >
              {t('admin.categories.title')}
            </motion.h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">{t('admin.categories.subtitle')}</p>
          </div>
          <Button onClick={() => { closeModal(); setOpenCreate(true); }} variant="primary" className="text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 flex-shrink-0">
            <Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">{t('admin.categories.actions.add')}</span>
          </Button>
        </div>

        <CategoryStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
        >
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder={(t('admin.common.search') as string) || "Search..."} value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 sm:h-11 text-sm" variant="filled" />
          </div>
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {[
              { key: 'all', label: t('admin.common.all') || 'All' },
              { key: 'active', label: t('admin.common.active') || 'Active' },
              { key: 'inactive', label: t('admin.common.inactive') || 'Inactive' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0",
                  statusFilter === key
                    ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-md"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {label}
              </button>
            ))}
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
          <div className="hidden md:grid grid-cols-12 gap-4 p-3 sm:p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
            <div className="col-span-5 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.categories.table.name')}</div>
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.categories.table.slug')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.categories.table.items')}</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.categories.table.status')}</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.categories.table.actions')}</div>
          </div>
          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                  {t('admin.categories.empty.loading')}
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                  <Folder className="w-7 h-7 sm:w-8 sm:h-8 text-fuchsia-500" />
                </div>
                <h3 className="text-foreground font-semibold">{t('admin.categories.empty.no_categories')}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t('admin.categories.empty.create_first')}</p>
              </div>
            ) : renderTree(categories)}
          </div>
        </motion.div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingCategory ? t('admin.categories.actions.edit') : t('admin.categories.actions.add')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {creatingUnder && !editingCategory && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              {t('admin.categories.form.adding_to')}: <span className="font-bold text-blue-900 dark:text-white">{creatingUnder.name}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label={t('admin.categories.form.name') as string} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label={t('admin.categories.form.slug') as string} value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder={(t('admin.categories.form.auto_generated') as string) || "Auto-generated"} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.categories.form.description')}</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
              className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.categories.form.image')}</label>
            <ImageUploader onChange={(file) => setFormData({ ...formData, image: file })} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded bg-white dark:bg-slate-950 border-gray-300 dark:border-white/20" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.categories.form.active')}</span>
            </div>
            <div className="w-20 sm:w-24">
              <Input label={t('admin.categories.form.order') as string} type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11">{t('admin.categories.actions.cancel')}</Button>
            <Button type="submit" className="flex-1 h-10 sm:h-11 bg-purple-600 hover:bg-purple-700">{t('admin.categories.actions.save')}</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}