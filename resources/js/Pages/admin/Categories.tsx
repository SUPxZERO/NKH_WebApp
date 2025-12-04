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

// Stats Ribbon
const CategoryStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Categories</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <Folder className="w-8 h-8 text-purple-400" />
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
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Sub-Categories</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.sub}</p>
        </div>
        <Layers className="w-8 h-8 text-blue-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Menu Items</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.items}</p>
        </div>
        <FolderOpen className="w-8 h-8 text-amber-400" />
      </div>
    </div>
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
    return cats.map(cat => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isExpanded = expanded.has(cat.id);

      return (
        <React.Fragment key={cat.id}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "grid grid-cols-12 gap-4 p-3 items-center hover:bg-white/5 transition-colors group border-b border-white/5",
              level > 0 && "bg-white/[0.02]"
            )}
          >
            <div className="col-span-5 flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              {hasChildren ? (
                <button onClick={() => toggleExpand(cat.id)} className="p-1 hover:bg-white/10 rounded text-gray-400">
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="w-6" />
              )}
              {cat.image ? (
                <img src={cat.image} alt="" className="w-8 h-8 rounded object-cover bg-slate-800" />
              ) : (
                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-gray-500">
                  <Folder size={14} />
                </div>
              )}
              <span className="font-medium text-white">{cat.name}</span>
            </div>
            <div className="col-span-3 text-sm text-gray-400 font-mono">/{cat.slug}</div>
            <div className="col-span-2 text-sm text-gray-400">
              {cat.menu_items?.length || 0} items
            </div>
            <div className="col-span-1">
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border",
                cat.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                {cat.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary" onClick={() => handleCreate(cat)} className="h-7 w-7 p-0 border-white/10" title="Add Sub-category"><Plus size={12} /></Button>
              <Button size="sm" variant="secondary" onClick={() => handleEdit(cat)} className="h-7 w-7 p-0 border-white/10"><Edit size={12} /></Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(cat)} className="h-7 w-7 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={12} /></Button>
            </div>
          </motion.div>
          {hasChildren && isExpanded && renderTree(cat.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Categories</h1>
            <p className="text-slate-400 mt-1">Manage menu hierarchy</p>
          </div>
          <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>

        <CategoryStatsRibbon stats={stats} />

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-5">Category Name</div>
            <div className="col-span-3">Slug</div>
            <div className="col-span-2">Items</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : renderTree(categories)}
          </div>
        </div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingCategory ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {creatingUnder && !editingCategory && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-blue-300">
              Adding sub-category to: <span className="font-bold text-white">{creatingUnder.name}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-slate-950 border-white/10" />
            <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="bg-slate-950 border-white/10" placeholder="Auto-generated" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Image</label>
            <ImageUploader onChange={(file) => setFormData({ ...formData, image: file })} className="bg-slate-950 border-white/10" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded bg-slate-950 border-white/20" />
              <span className="text-sm text-gray-300">Active</span>
            </div>
            <div className="w-24">
              <Input label="Order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} className="bg-slate-950 border-white/10" />
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