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
import { FeaturedManagerModal } from './FeaturedManagerModal';
import MenuItemForm from '@/Pages/admin/components/MenuItemForm';

// Enhanced Stats Card with Gradients - Mobile optimized
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
        "relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-5 min-w-[100px] sm:min-w-0",
        "hover:shadow-lg transition-all duration-300",
        styles.border
      )}
    >
      <div className={cn("absolute inset-0 opacity-50", `bg-gradient-to-br ${styles.gradient}`)} />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold">{title}</p>
          <p className={cn("text-xl sm:text-3xl font-extrabold mt-0.5 sm:mt-1", styles.text)}>{value}</p>
        </div>
        <div className={cn("h-9 w-9 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0", styles.iconBg)}>
          <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon - Horizontal scroll on mobile
const MenuStatsRibbon = ({ stats, onFilterChange }: { stats: any, onFilterChange: (filter: string) => void }) => (
  <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
    <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
      <StatCard title="Total" value={stats.total} icon={Package} color="purple" index={0} />
      <StatCard title="Active" value={stats.active} icon={Eye} color="emerald" index={1} />
      <StatCard title="Inactive" value={stats.inactive} icon={EyeOff} color="red" index={2} />
      <div onClick={() => onFilterChange('featured')} className="cursor-pointer">
        <StatCard title="Featured" value={stats.featured} icon={Sparkles} color="amber" index={3} />
      </div>
    </div>
  </div>
);

export default function MenuItems() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
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
  const [featuredFilter, setFeaturedFilter] = useState(false);
  const [openFeaturedManager, setOpenFeaturedManager] = useState(false);

  // Fetch locations to get valid location_id
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/locations')
  });

  const currentLocationId = useMemo(() => {
    if (locations && Array.isArray(locations)) return locations[0]?.id;
    if ((locations as any)?.data && Array.isArray((locations as any).data)) return (locations as any).data[0]?.id;
    return 1; // Fallback
  }, [locations]);

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menu-items', page, search, categoryFilter, currentLocationId, featuredFilter],
    queryFn: () => {
      let url = `/menu-items?page=${page}&per_page=${perPage}&search=${search}`;
      if (categoryFilter !== 'all') url += `&category_id=${categoryFilter}`;
      if (currentLocationId) url += `&location_id=${currentLocationId}`;
      return apiGet(url);
    }
  });

  // Fetch all categories for selection (flat list)
  const { data: categories } = useQuery({
    queryKey: ['categories-flat'],
    queryFn: () => apiGet('/categories?flat_list=true')
  });

  const itemList: MenuItem[] = useMemo(() => {
    if (!menuItems) return [];
    let items = [];
    if (Array.isArray(menuItems)) items = menuItems;
    else if ((menuItems as any)?.data && Array.isArray((menuItems as any).data)) items = (menuItems as any).data;

    // Client-side filter for featured if enabled
    if (featuredFilter) {
      return items.filter((i: MenuItem) => i.is_featured);
    }
    return items;
  }, [menuItems, featuredFilter]);

  const stats = useMemo(() => ({
    total: (menuItems as any)?.meta?.total || itemList.length,
    active: itemList.filter(i => i.is_active).length,
    inactive: itemList.filter(i => !i.is_active).length,
    popular: itemList.filter(i => i.is_popular).length,
    featured: itemList.filter(i => i.is_featured).length
  }), [itemList, menuItems]);

  // Mutations (Keep Delete/Toggle)
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

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, is_featured }: { id: number; is_featured: boolean }) => {
      const data = new FormData();
      data.append('is_featured', is_featured ? '1' : '0');
      return apiPost(`/menu-items/${id}?_method=PUT`, data);
    },
    onSuccess: () => { toastSuccess('Featured status updated'); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed to update featured status')
  });

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
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
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 mb-4 sm:mb-6"
        >
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold tracking-tight truncate">
              <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Menu Items
              </span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-2 hidden sm:flex items-center gap-2">
              <Utensils className="w-4 h-4 text-fuchsia-500" />
              Manage your restaurant's menu
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setOpenFeaturedManager(true)}
              variant="outline"
              className="text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 flex-shrink-0"
              leftIcon={<Sparkles className="w-4 h-4 text-amber-500" />}
            >
              <span className="hidden sm:inline">Manage Featured</span>
            </Button>
            <Button
              onClick={() => { setEditingItem(null); setOpenCreate(true); }}
              variant="primary"
              className="text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 flex-shrink-0"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Add Item</span>
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <MenuStatsRibbon stats={stats} onFilterChange={(filter) => {
          if (filter === 'featured') {
            setFeaturedFilter(!featuredFilter); // 4. Toggle featuredFilter state
            setPage(1); // Reset to page 1 when filtering
          }
        }} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6 shadow-sm"
        >
          <div className="flex gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-10 sm:h-12 pl-9 sm:pl-12 pr-3 sm:pr-4 bg-secondary/50 border border-border rounded-lg sm:rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="h-10 sm:h-12 px-3 sm:px-4 pr-8 sm:pr-10 bg-secondary/50 border border-border rounded-lg sm:rounded-xl text-foreground text-xs sm:text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none min-w-[100px] sm:min-w-[200px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '14px' }}
            >
              <option value="all">All</option>
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
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6 shadow-xl shadow-fuchsia-500/20"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className="text-white font-bold text-sm sm:text-lg">{selectedItems.size} selected</p>
                </div>
                <div className="flex gap-1.5 sm:gap-3">
                  <Button size="sm" onClick={handleBulkEnable} variant="success" className="h-8 sm:h-10 px-2 sm:px-4">
                    <Eye className="w-4 h-4" /><span className="hidden sm:inline ml-2">Enable</span>
                  </Button>
                  <Button size="sm" onClick={handleBulkDisable} variant="danger" className="h-8 sm:h-10 px-2 sm:px-4">
                    <EyeOff className="w-4 h-4" /><span className="hidden sm:inline ml-2">Disable</span>
                  </Button>
                  <Button size="sm" onClick={() => setSelectedItems(new Set())} className="h-8 sm:h-10 px-2 bg-white/20 text-white hover:bg-white/30 border-0">
                    <X className="w-4 h-4" />
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
          className="bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Table Header - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-gradient-to-r from-secondary/50 to-secondary/30">
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
            <div className="col-span-1 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center">Highlights</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Status</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-end">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border/50">
            {isLoading ? (
              <div className="p-8 sm:p-16 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 mb-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-muted-foreground font-medium text-sm sm:text-base">Loading...</p>
              </div>
            ) : itemList.length === 0 ? (
              <div className="p-8 sm:p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-secondary to-muted mb-4">
                  <Package className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-bold text-base sm:text-lg mb-1">No items found</h3>
                <p className="text-muted-foreground text-xs sm:text-sm">Try adjusting filters or add an item</p>
              </div>
            ) : (
              itemList.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "p-3 sm:p-4 transition-all duration-200 cursor-pointer",
                    "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent",
                    selectedItems.has(item.id) && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  {/* Mobile Layout */}
                  <div className="md:hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex-shrink-0 border border-border">
                        {item.image_path ? (
                          <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="w-5 h-5 text-fuchsia-500/50" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-foreground text-sm truncate">{item.name || 'Untitled'}</div>
                          <span className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent flex-shrink-0">
                            ${item.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground truncate">{item.category?.name || 'Uncategorized'}</span>
                          {item.is_popular && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", item.is_active ? "bg-emerald-500" : "bg-red-500")} />
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => handlePreview(item)} className="p-2 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500"><Maximize2 className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(item)} className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-2 items-center group">
                    <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelectItem(item.id)}
                        className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all hover:border-primary/50"
                      />
                    </div>
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
                        <div className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{item.name || 'Untitled'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="w-3 h-3" />SKU: {item.sku || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground">
                        {item.category?.name || 'Uncategorized'}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">${item.price}</span>
                    </div>
                    <div className="col-span-1 flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFeaturedMutation.mutate({ id: item.id, is_featured: !item.is_featured }); }}
                        className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors hover:bg-amber-500/10"
                        title="Toggle Featured"
                      >
                        {item.is_featured ? (
                          <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : (
                          <Sparkles className="w-4 h-4 text-muted-foreground/30 hover:text-amber-500/50" />
                        )}
                      </button>

                      {item.is_popular ? (
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30" title="Popular Item">
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                          <Star className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="col-span-2">
                      <button
                        onClick={() => toggleActiveMutation.mutate({ id: item.id, is_active: !item.is_active })}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all",
                          item.is_active
                            ? "bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-gradient-to-r from-red-500/20 to-rose-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                        )}
                      >
                        {item.is_active ? <><Eye className="w-3.5 h-3.5" /> Active</> : <><EyeOff className="w-3.5 h-3.5" /> Inactive</>}
                      </button>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button size="sm" variant="ghost" onClick={() => handlePreview(item)} className="h-9 w-9 p-0 hover:bg-blue-500/10 hover:text-blue-500" title="Preview"><Maximize2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(item)} className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30" title="Edit"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)} className="h-9 w-9 p-0" title="Delete"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {(menuItems as any)?.meta && (
            <div className="flex items-center justify-between gap-2 sm:gap-4 p-3 sm:p-5 border-t border-border bg-gradient-to-r from-secondary/30 to-transparent">
              <div className="hidden sm:flex items-center gap-3">
                <div className="h-9 px-4 rounded-lg bg-secondary border border-border flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{(menuItems as any).meta.total}</span>
                  <span className="text-sm text-muted-foreground">items</span>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-9 sm:h-10 px-2 sm:px-4"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Prev</span>
                </Button>
                <span className="text-sm font-medium text-foreground px-3 py-2 rounded-lg bg-secondary border border-border">
                  {page} / {Math.ceil(((menuItems as any)?.meta?.total || 0) / perPage)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= Math.ceil(((menuItems as any)?.meta?.total || 0) / perPage)}
                  onClick={() => setPage(p => p + 1)}
                  className="h-9 sm:h-10 px-2 sm:px-4"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <MenuItemForm
        isOpen={openCreate || openEdit}
        onClose={() => { setOpenCreate(false); setOpenEdit(false); setEditingItem(null); }}
        editingItem={editingItem}
        categories={(categories as any)?.data || []}
        locationId={currentLocationId}
      />

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

      {/* Featured Manager Modal */}
      <FeaturedManagerModal
        isOpen={openFeaturedManager}
        onClose={() => setOpenFeaturedManager(false)}
        locationId={currentLocationId}
      />
    </AdminLayout>
  );
}
