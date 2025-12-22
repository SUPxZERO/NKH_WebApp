import React, { useState, useMemo } from 'react';
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

// StatCard Component with vibrant gradients
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
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
            <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
          </div>
          <div className={cn("p-3 rounded-xl shadow-lg", styles.iconBg)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon
const CategoryStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <StatCard title="Total Categories" value={stats.total} icon={Folder} color="purple" index={0} />
    <StatCard title="Active" value={stats.active} icon={CheckCircle} color="emerald" index={1} />
    <StatCard title="Sub-Categories" value={stats.sub} icon={Layers} color="blue" index={2} />
    <StatCard title="Menu Items" value={stats.items} icon={FolderOpen} color="amber" index={3} />
  </div>
);

export default function Categories() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [creatingUnder, setCreatingUnder] = useState<any>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

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
      toastError('Cannot delete category with sub-categories');
      return;
    }
    if (confirm(`Delete category "${cat.name}"?`)) deleteMutation.mutate(cat.id);
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

      return (
        <React.Fragment key={cat.id}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={cn(
              "grid grid-cols-1 md:grid-cols-12 gap-4 p-3 items-center hover:bg-gradient-to-r hover:from-fuchsia-500/5 hover:to-transparent transition-all group",
              level > 0 && "bg-fuchsia-500/[0.02]"
            )}
          >
            <div className="col-span-1 md:col-span-5 flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
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
            <div className="hidden md:block col-span-3 text-sm text-muted-foreground font-mono">/{cat.slug}</div>
            <div className="hidden md:block col-span-2 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{cat.menu_items?.length || 0}</span> items
            </div>
            <div className="hidden md:block col-span-1">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                cat.is_active
                  ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", cat.is_active ? "bg-emerald-500" : "bg-red-500")} />
                {cat.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="col-span-1 flex justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
              <Button size="sm" variant="ghost" onClick={() => handleCreate(cat)} className="h-7 w-7 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500" title="Add Sub-category"><Plus size={12} /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleEdit(cat)} className="h-7 w-7 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500"><Edit size={12} /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(cat)} className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-500"><Trash2 size={12} /></Button>
            </div>
          </motion.div>
          {hasChildren && isExpanded && renderTree(cat.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-6">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent"
            >
              Categories
            </motion.h1>
            <p className="text-muted-foreground mt-1">Manage menu hierarchy</p>
          </div>
          <Button onClick={() => { closeModal(); setOpenCreate(true); }} variant="primary">
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>

        <CategoryStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-card/50 border border-border/50 rounded-2xl p-4 mb-6 backdrop-blur-sm shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10" variant="filled" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All Status' },
                { key: 'active', label: 'Active' },
                { key: 'inactive', label: 'Inactive' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                    statusFilter === key
                      ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {/* Table Header with Gradient - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
            <div className="col-span-5 text-xs font-bold text-foreground uppercase tracking-wider">Category Name</div>
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Slug</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Items</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">Status</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                  Loading categories...
                </div>
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                  <Folder className="w-8 h-8 text-fuchsia-500" />
                </div>
                <h3 className="text-foreground font-semibold">No categories found</h3>
                <p className="text-muted-foreground text-sm mt-1">Create your first category to get started</p>
              </div>
            ) : renderTree(categories)}
          </div>
        </motion.div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingCategory ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {creatingUnder && !editingCategory && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
              Adding sub-category to: <span className="font-bold text-blue-900 dark:text-white">{creatingUnder.name}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="Auto-generated" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3}
              className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
            <ImageUploader onChange={(file) => setFormData({ ...formData, image: file })} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded bg-white dark:bg-slate-950 border-gray-300 dark:border-white/20" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </div>
            <div className="w-24">
              <Input label="Order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
            </div>
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