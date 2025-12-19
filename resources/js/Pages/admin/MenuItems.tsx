import React, { useState, useMemo } from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { MenuItem, Category } from '@/app/types/domain';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import ImageUploader from '@/app/components/ui/ImageUploader';
import { toastSuccess, toastError } from '@/app/utils/toast';
import {
  Plus, Search, Edit, Trash2, Star, Eye, EyeOff, ChevronLeft, ChevronRight,
  Package, Maximize2, Utensils, DollarSign, Tag, Sparkles, Filter, X, Grid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { FoodDetailModal } from '@/app/components/food/FoodDetailModal';

// Enhanced Stats Card with Gradients
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
  const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string }> = {
    purple: {
      gradient: 'from-fuchsia-500/20 to-purple-500/10',
      iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
      text: 'text-fuchsia-600 dark:text-fuchsia-400',
      border: 'border-fuchsia-500/30',
    },
    emerald: {
      gradient: 'from-emerald-500/20 to-green-500/10',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
    },
    red: {
      gradient: 'from-red-500/20 to-rose-500/10',
      iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
      text: 'text-red-600 dark:text-red-400',
      border: 'border-red-500/30',
    },
    amber: {
      gradient: 'from-amber-500/20 to-orange-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
    },
  };

  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden bg-card border rounded-2xl p-5",
        "hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5",
        styles.border
      )}
    >
      <div className={cn("absolute inset-0 opacity-50", `bg-gradient-to-br ${styles.gradient}`)} />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{title}</p>
          <p className={cn("text-3xl font-extrabold mt-1", styles.text)}>{value}</p>
        </div>
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-lg", styles.iconBg)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon
const MenuStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <StatCard title="Total Items" value={stats.total} icon={Package} color="purple" index={0} />
    <StatCard title="Active" value={stats.active} icon={Eye} color="emerald" index={1} />
    <StatCard title="Inactive" value={stats.inactive} icon={EyeOff} color="red" index={2} />
    <StatCard title="Popular" value={stats.popular} icon={Star} color="amber" index={3} />
  </div>
);

export default function MenuItems() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', slug: '', sku: '', price: '', cost: '',
    category_id: '', is_popular: false, is_active: true, display_order: 0
  });
  const [image, setImage] = useState<File | null>(null);
  const qc = useQueryClient();

  // Preview modal state
  const [previewItemId, setPreviewItemId] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (item: MenuItem) => {
    setPreviewItemId(item.id);
    setIsPreviewOpen(true);
  };

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menu-items', page, search, categoryFilter],
    queryFn: () => {
      let url = `/menu-items?page=${page}&per_page=${perPage}&search=${search}`;
      if (categoryFilter !== 'all') url += `&category_id=${categoryFilter}`;
      return apiGet(url);
    }
  });

  // Fetch only sub-categories (leaf categories that can have menu items)
  const { data: categories } = useQuery({
    queryKey: ['categories-subcategories'],
    queryFn: () => apiGet('/categories?sub_categories_only=true')
  });

  const itemList: MenuItem[] = useMemo(() => {
    if (!menuItems) return [];
    if (Array.isArray(menuItems)) return menuItems;
    if ((menuItems as any)?.data && Array.isArray((menuItems as any).data)) return (menuItems as any).data;
    return [];
  }, [menuItems]);

  const stats = useMemo(() => ({
    total: (menuItems as any)?.meta?.total || itemList.length,
    active: itemList.filter(i => i.is_active).length,
    inactive: itemList.filter(i => !i.is_active).length,
    popular: itemList.filter(i => i.is_popular).length
  }), [itemList, menuItems]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiPost('/menu-items', data),
    onSuccess: () => { toastSuccess('Item created'); setOpenCreate(false); resetForm(); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => apiPost(`/menu-items/${id}?_method=PUT`, data),
    onSuccess: () => { toastSuccess('Item updated'); setOpenEdit(false); resetForm(); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/menu-items/${id}`),
    onSuccess: () => { toastSuccess('Item deleted'); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => {
      const data = new FormData();
      data.append('is_active', is_active ? '1' : '0');
      return apiPost(`/menu-items/${id}?_method=PUT`, data);
    },
    onSuccess: () => { toastSuccess('Status updated'); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
    onError: () => toastError('Failed to update status')
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', slug: '', sku: '', price: '', cost: '', category_id: '', is_popular: false, is_active: true, display_order: 0 });
    setImage(null);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      if (key === 'is_popular' || key === 'is_active') data.append(key, val ? '1' : '0');
      else if (key === 'category_id' && (val === '' || val === 'null' || val === undefined)) return;
      else data.append(key, String(val));
    });
    data.append('location_id', '1');
    if (image) data.append('image', image);

    if (editingItem) updateMutation.mutate({ id: editingItem.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      description: item.description || '',
      slug: item.slug, sku: item.sku || '', price: item.price.toString(),
      cost: item.cost?.toString() || '', category_id: item.category_id?.toString() || '',
      is_popular: item.is_popular, is_active: item.is_active, display_order: item.display_order
    });
    setImage(null);
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this menu item?')) deleteMutation.mutate(id);
  };

  const toggleSelectItem = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === itemList.length) setSelectedItems(new Set());
    else setSelectedItems(new Set(itemList.map(i => i.id)));
  };

  const handleBulkEnable = async () => {
    if (selectedItems.size === 0) return;
    try {
      await Promise.all(Array.from(selectedItems).map(id => toggleActiveMutation.mutateAsync({ id, is_active: true })));
      toastSuccess(`${selectedItems.size} items enabled`);
      setSelectedItems(new Set());
    } catch { toastError('Failed to enable items'); }
  };

  const handleBulkDisable = async () => {
    if (selectedItems.size === 0) return;
    try {
      await Promise.all(Array.from(selectedItems).map(id => toggleActiveMutation.mutateAsync({ id, is_active: false })));
      toastSuccess(`${selectedItems.size} items disabled`);
      setSelectedItems(new Set());
    } catch { toastError('Failed to disable items'); }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Menu Items
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-fuchsia-500" />
              Manage your restaurant's menu and pricing
            </p>
          </div>
          <Button
            onClick={() => { resetForm(); setOpenCreate(true); }}
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Add Item
          </Button>
        </motion.div>

        {/* Stats */}
        <MenuStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-12 px-4 pr-10 bg-secondary/50 border border-border rounded-xl text-foreground text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none min-w-[200px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              <option value="all">All Categories</option>
              {(categories as any)?.data?.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>{cat.name || cat.translations?.[0]?.name}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedItems.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl p-5 mb-6 shadow-xl shadow-fuchsia-500/20"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{selectedItems.size} item{selectedItems.size === 1 ? '' : 's'} selected</p>
                    <p className="text-white/70 text-sm">Ready for bulk actions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button size="md" onClick={handleBulkEnable} variant="success" className="shadow-lg">
                    <Eye className="w-4 h-4 mr-2" /> Enable
                  </Button>
                  <Button size="md" onClick={handleBulkDisable} variant="danger" className="shadow-lg">
                    <EyeOff className="w-4 h-4 mr-2" /> Disable
                  </Button>
                  <Button size="md" onClick={() => setSelectedItems(new Set())} className="bg-white/20 text-white hover:bg-white/30 border-0">
                    <X className="w-4 h-4 mr-2" /> Clear
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-gradient-to-r from-secondary/50 to-secondary/30">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedItems.size === itemList.length && itemList.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
              />
            </div>
            <div className="col-span-3 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Item</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Category</div>
            <div className="col-span-1 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Price</div>
            <div className="col-span-1 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Popular</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Status</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-end">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border/50">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 mb-4">
                  <div className="w-8 h-8 border-3 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-muted-foreground font-medium">Loading menu items...</p>
              </div>
            ) : itemList.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-muted mb-4">
                  <Package className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-1">No items found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your filters or add a new item</p>
              </div>
            ) : (
              itemList.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-200 group cursor-pointer",
                    "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent",
                    selectedItems.has(item.id) && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  {/* Checkbox */}
                  <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all hover:border-primary/50"
                    />
                  </div>

                  {/* Item Info */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex-shrink-0 border border-border">
                      {item.image_path ? (
                        <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Utensils className="w-6 h-6 text-fuchsia-500/50" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.name || 'Untitled'}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        SKU: {item.sku || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground">
                      {item.category?.name || 'Uncategorized'}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="col-span-1">
                    <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      ${item.price}
                    </span>
                  </div>

                  {/* Popular */}
                  <div className="col-span-1">
                    {item.is_popular ? (
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                        <Star className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-span-2">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: item.id, is_active: !item.is_active })}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all",
                        item.is_active
                          ? "bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:from-emerald-500/30 hover:to-green-500/20"
                          : "bg-gradient-to-r from-red-500/20 to-rose-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:from-red-500/30 hover:to-rose-500/20"
                      )}
                    >
                      {item.is_active ? <><Eye className="w-3.5 h-3.5" /> Active</> : <><EyeOff className="w-3.5 h-3.5" /> Inactive</>}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePreview(item)}
                      className="h-9 w-9 p-0 hover:bg-blue-500/10 hover:text-blue-500"
                      title="Preview"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(item)}
                      className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item.id)}
                      className="h-9 w-9 p-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {(menuItems as any)?.meta && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-border bg-gradient-to-r from-secondary/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-9 px-4 rounded-lg bg-secondary border border-border flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{(menuItems as any).meta.total}</span>
                  <span className="text-sm text-muted-foreground">items</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * perPage, (menuItems as any).meta.total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-10 px-4 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, Math.ceil(((menuItems as any)?.meta?.total || 0) / perPage)) }, (_, i) => {
                    const totalPages = Math.ceil(((menuItems as any)?.meta?.total || 0) / perPage);
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "h-10 w-10 rounded-xl text-sm font-semibold transition-all",
                          page === pageNum
                            ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25"
                            : "bg-secondary border border-border text-muted-foreground hover:bg-secondary-hover hover:text-foreground"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= Math.ceil(((menuItems as any)?.meta?.total || 0) / perPage)}
                  onClick={() => setPage(p => p + 1)}
                  className="h-10 px-4 gap-2"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
        title={editingItem ? 'Edit Menu Item' : 'Create Menu Item'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
              <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full h-11 bg-secondary/50 border border-border rounded-xl px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="">Select Category</option>
                {/* Only sub-categories (fetched via sub_categories_only=true) */}
                {(categories as any)?.data?.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name || cat.translations?.[0]?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" type="number" step="0.01" value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
            <Input label="Cost" type="number" step="0.01" value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3} className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Image</label>
            <ImageUploader onChange={(file) => setImage(file)}
              value={editingItem?.image_path || null} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Display Order" type="number" value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
            <div className="flex items-center space-x-3 pt-6">
              <input type="checkbox" id="is_popular" checked={formData.is_popular}
                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer" />
              <label htmlFor="is_popular" className="text-sm font-medium text-foreground cursor-pointer">Popular</label>
            </div>
            <div className="flex items-center space-x-3 pt-6">
              <input type="checkbox" id="is_active" checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer" />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">Active</label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); setOpenEdit(false); }} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal - Shows how item looks to customers */}
      <FoodDetailModal
        foodId={previewItemId}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewItemId(null);
        }}
        showAddToCart={false}
      />
    </AdminLayout>
  );
}
