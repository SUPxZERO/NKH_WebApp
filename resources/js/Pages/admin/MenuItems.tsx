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
import { Plus, Search, Edit, Trash2, Star, Eye, EyeOff, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';

// Stats Ribbon
const MenuStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Items</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <Package className="w-8 h-8 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Active</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
        </div>
        <Eye className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Inactive</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.inactive}</p>
        </div>
        <EyeOff className="w-8 h-8 text-red-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Popular</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.popular}</p>
        </div>
        <Star className="w-8 h-8 text-yellow-400" />
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
  const [formData, setFormData] = useState({
    name: '', description: '', slug: '', sku: '', price: '', cost: '',
    category_id: '', is_popular: false, is_active: true, display_order: 0
  });
  const [image, setImage] = useState<File | null>(null);
  const qc = useQueryClient();

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

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet('/categories')
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
      else data.append(key, String(val));
    });
    if (image) data.append('image', image);

    if (editingItem) updateMutation.mutate({ id: editingItem.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.translations?.[0]?.name || '',
      description: item.translations?.[0]?.description || '',
      slug: item.slug, sku: item.sku || '', price: item.price.toString(),
      cost: item.cost?.toString() || '', category_id: item.category_id?.toString() || '',
      is_popular: item.is_popular, is_active: item.is_active, display_order: item.display_order
    });
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
      <div className="min-h-screen bg-slate-900 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Menu Items</h1>
            <p className="text-slate-400 mt-1">Manage products and pricing</p>
          </div>
          <Button onClick={() => { resetForm(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        {/* Stats */}
        <MenuStatsRibbon stats={stats} />

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-w-[180px]">
              <option value="all">All Categories</option>
              {(categories as any)?.data?.map((cat: Category) => (
                <option key={cat.id} value={cat.id}>{cat.name || cat.translations?.[0]?.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-purple-600 border border-purple-500 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-white font-medium">{selectedItems.size} selected</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleBulkEnable} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Eye className="w-4 h-4 mr-2" /> Enable
              </Button>
              <Button size="sm" onClick={handleBulkDisable} className="bg-red-600 hover:bg-red-700 text-white">
                <EyeOff className="w-4 h-4 mr-2" /> Disable
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSelectedItems(new Set())}
                className="border-white/20 hover:bg-white/10">Clear</Button>
            </div>
          </motion.div>
        )}

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-1"><input type="checkbox" checked={selectedItems.size === itemList.length && itemList.length > 0}
              onChange={toggleSelectAll} className="w-4 h-4 rounded border-white/20 bg-slate-900" /></div>
            <div className="col-span-3">Item</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-1">Price</div>
            <div className="col-span-1">Pop</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-12 text-center text-gray-400">Loading items...</div>
            ) : itemList.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium">No items found</h3>
              </div>
            ) : (
              itemList.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                  <div className="col-span-1">
                    <input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-900" />
                  </div>
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex-shrink-0">
                      {item.image_path ? (
                        <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">No img</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white truncate">{item.name || 'Untitled'}</div>
                      <div className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-gray-300 text-sm">{item.category?.name || 'Uncategorized'}</div>
                  <div className="col-span-1 font-semibold text-emerald-400">${item.price}</div>
                  <div className="col-span-1">
                    {item.is_popular && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <div className="col-span-2">
                    <button onClick={() => toggleActiveMutation.mutate({ id: item.id, is_active: !item.is_active })}
                      className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-all",
                        item.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20")}>
                      {item.is_active ? <><Eye className="w-3 h-3" /> Active</> : <><EyeOff className="w-3 h-3" /> Inactive</>}
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}
                      className="h-8 w-8 p-0 border-white/10"><Edit className="w-3 h-3" /></Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {(menuItems as any)?.meta && (
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
              <div className="text-sm text-gray-400">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, (menuItems as any).meta.total)} of {(menuItems as any).meta.total}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <span className="text-sm text-gray-400">
                  Page {page} of {Math.ceil(((menuItems as any)?.meta?.total || 0) / perPage)}
                </span>
                <Button variant="secondary" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(((menuItems as any)?.meta?.total || 0) / perPage)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
        title={editingItem ? 'Edit Menu Item' : 'Create Menu Item'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required className="bg-white/5 border-white/10 text-white" />
            <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required className="bg-white/5 border-white/10 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="">Select Category</option>
                {(categories as any)?.data?.map((cat: Category) => (
                  <option key={cat.id} value={cat.id} className="bg-gray-800">
                    {cat.name || cat.translations?.[0]?.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price" type="number" step="0.01" value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required className="bg-white/5 border-white/10 text-white" />
            <Input label="Cost" type="number" step="0.01" value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
            <ImageUploader onChange={(file) => setImage(file)}
              value={editingItem?.image_path ? `/storage/${editingItem.image_path}` : null} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label="Display Order" type="number" value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              className="bg-white/5 border-white/10 text-white" />
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="is_popular" checked={formData.is_popular}
                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                className="rounded border-white/20 bg-white/5" />
              <label htmlFor="is_popular" className="text-sm text-gray-300">Popular</label>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="is_active" checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-white/20 bg-white/5" />
              <label htmlFor="is_active" className="text-sm text-gray-300">Active</label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); setOpenEdit(false); }}
              className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
