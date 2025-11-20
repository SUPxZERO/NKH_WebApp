import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  FolderPlus,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  CornerDownRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { ImageUploader } from '@/app/components/ui/ImageUploader';
import { apiGet, apiPost, apiDelete, apiPut } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Category } from '@/app/types/domain';

// Local response types
type CategoryListResponse = {
  data: Category[];
};

export default function Categories() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<number>>(new Set());
  const [error, setError] = React.useState('');

  const qc = useQueryClient();
  const [authInitialized, setAuthInitialized] = React.useState(false);

  React.useEffect(() => {
    setAuthInitialized(true);
  }, []);

  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    description: '',
    image: null as File | null,
    display_order: 0,
    is_active: true
  });

  const [creatingUnder, setCreatingUnder] = React.useState<Category | null>(null);

  // Fetch category stats
  const { data: categoryStats, error: statsError } = useQuery({
    queryKey: ['admin/category-stats'],
    queryFn: () => apiGet('/api/admin/category-stats'),
    enabled: authInitialized
  }) as { data: any, error?: any };

  // Fetch category list
  const {
    data: categoryList,
    error: categoriesError,
    isLoading
  } = useQuery({
    queryKey: ['admin/categories', { search, statusFilter }],
    queryFn: () => apiGet(`/api/admin/categories?search=${encodeURIComponent(search)}&status=${encodeURIComponent(statusFilter)}`).then((r: any) => r.data),
    enabled: authInitialized
  }) as any;

  React.useEffect(() => {
    if (categoriesError) {
      setError(categoriesError?.response?.data?.message || 'Failed to load categories');
    }
  }, [categoriesError, statsError]);

  // --- Mutations (Create, Update, Delete, Toggle) ---
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiPost('/api/admin/categories', data),
    onSuccess: () => {
      toastSuccess('Category created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/category-stats'] });
      qc.invalidateQueries({ queryKey: ['admin/categories'] });
    },
    onError: (error: any) => setError(error.response?.data?.message || 'Failed to create category')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: FormData }) => apiPost(`/api/admin/categories/${id}?_method=PUT`, data),
    onSuccess: () => {
      toastSuccess('Category updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/category-stats'] });
      qc.invalidateQueries({ queryKey: ['admin/categories'] });
    },
    onError: (error: any) => setError(error.response?.data?.message || 'Failed to update category')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/categories/${id}`),
    onSuccess: () => {
      toastSuccess('Category deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/category-stats'] });
      qc.invalidateQueries({ queryKey: ['admin/categories'] });
    },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed to delete category')
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) => 
      apiPut(`/api/admin/categories/${id}/toggle-status`, { is_active }),
    onSuccess: () => {
      toastSuccess('Category status updated!');
      qc.invalidateQueries({ queryKey: ['admin/categories'] });
    },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed to update status')
  });

  // --- Helpers ---
  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', image: null, display_order: 0, is_active: true });
    setCreatingUnder(null);
    setEditingCategory(null);
    setError('');
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: null,
      display_order: category.display_order,
      is_active: category.is_active
    });
    setEditingCategory(category);
    setOpenEdit(true);
  };

  const handleCreate = (parent?: Category) => {
    setCreatingUnder(parent ?? null);
    setEditingCategory(null);
    setOpenCreate(true);
  };

  const handleView = (category: Category) => {
    setSelectedCategory(category);
    setOpenView(true);
  };

  const handleDelete = async (category: Category) => {
    if (category.children && category.children.length > 0) {
      toastError('Cannot delete category with nested items. Please delete them first.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleToggleStatus = (category: Category) => {
    toggleStatusMutation.mutate({ id: category.id, is_active: !category.is_active });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data = new FormData();
    data.append('name', formData.name);
    data.append('slug', formData.slug || generateSlug(formData.name));
    data.append('description', formData.description);
    data.append('display_order', formData.display_order.toString());
    data.append('is_active', formData.is_active ? '1' : '0');
    if (formData.image) data.append('image', formData.image);

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) newExpanded.delete(categoryId);
    else newExpanded.add(categoryId);
    setExpandedCategories(newExpanded);
  };

  // --- Redesigned Render Logic ---
  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.has(category.id);

      return (
        <div key={category.id} className="relative">
          {/* Tree Connecting Line for Nested Items */}
          {level > 0 && (
            <div 
              className="absolute left-[-24px] top-[-10px] bottom-1/2 w-[2px] bg-white/10 rounded-b-full"
              style={{ height: hasChildren && isExpanded ? '100%' : 'calc(50% + 24px)' }} 
            />
          )}
          
          {/* Horizontal Connector */}
          {level > 0 && (
             <div className="absolute left-[-24px] top-1/2 w-[24px] h-[2px] bg-white/10" />
          )}

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`
              group relative flex flex-col sm:flex-row sm:items-center justify-between 
              p-4 mb-3 rounded-xl border border-white/5 
              bg-slate-800/40 hover:bg-slate-800/80 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5
              transition-all duration-200 backdrop-blur-sm
              ${!category.is_active ? 'opacity-75 grayscale-[0.5]' : ''}
            `}
          >
            <div className="flex items-center gap-4">
              {/* Expand Toggle / Spacer */}
              <div className="flex-shrink-0">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(category.id)}
                    className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                ) : (
                  <div className="w-7 h-7 flex items-center justify-center opacity-30">
                    <CornerDownRight size={14} className="text-gray-500" />
                  </div>
                )}
              </div>

              {/* Icon / Image */}
              <div className="relative">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-10 h-10 rounded-lg object-cover border border-white/10 shadow-sm"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${level === 0 ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                    {isExpanded ? <FolderOpen size={20} /> : <Folder size={20} />}
                  </div>
                )}
                {/* Active Indicator Dot */}
                <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${category.is_active ? 'bg-green-500' : 'bg-gray-500'}`} />
              </div>

              {/* Text Content */}
              <div>
                <h3 className="font-semibold text-white text-base tracking-wide flex items-center gap-2">
                  {category.name}
                  <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                    ID: {category.id}
                  </span>
                </h3>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                  <span className="font-mono opacity-60">/{category.slug}</span>
                  {category.menu_items && category.menu_items.length > 0 && (
                     <span>• {category.menu_items.length} items</span>
                  )}
                  {category.description && (
                    <span className="hidden md:inline-block opacity-50 max-w-[200px] truncate">• {category.description}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3 sm:mt-0 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
               {/* Add Child - Only for top levels if desired, or all levels */}
               <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCreate(category)}
                className="h-8 px-2 bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                title="Add Sub-category"
              >
                <FolderPlus size={14} />
              </Button>

              <div className="w-px h-4 bg-white/10 mx-1" />

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleToggleStatus(category)}
                className={`h-8 px-2 border-white/10 ${category.is_active ? 'hover:bg-red-500/10 hover:text-red-400' : 'hover:bg-green-500/10 hover:text-green-400'}`}
                title="Toggle Status"
              >
                {category.is_active ? <ToggleRight size={16} className="text-green-400" /> : <ToggleLeft size={16} className="text-gray-400" />}
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleView(category)}
                className="h-8 px-2 border-white/10 hover:bg-blue-500/10 hover:text-blue-400"
              >
                <Eye size={14} />
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleEdit(category)}
                className="h-8 px-2 border-white/10 hover:bg-yellow-500/10 hover:text-yellow-400"
              >
                <Edit size={14} />
              </Button>

              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(category)}
                className="h-8 px-2 border-red-500/20 bg-red-500/5 hover:bg-red-500/20 text-red-400"
              >
                <Trash2 className="w-3 h-3 text-white" size={14} />
              </Button>
            </div>
          </motion.div>

          {/* Recursive Children */}
          {hasChildren && isExpanded && (
            <div className="ml-8 border-l border-white/5 pl-4">
              {renderCategoryTree(category.children || [], level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // Safe data access fixes the "not showing" bug
  const totalCategories = categoryStats?.total || 0;
  const activeCategories = categoryStats?.active || 0;
  const menuItems = categoryStats?.menu_items_total ?? categoryStats?.menu_items ?? 0;
  const categoriesCount = categoryStats?.categories || categoryStats?.categories_total || totalCategories;
  
  // Fix: Handle both array response and object wrapper response
  const categoriesToDisplay = Array.isArray(categoryList) ? categoryList : (categoryList?.data || []);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Categories Management
              </h1>
              <p className="text-gray-400 mt-1">Organize your menu hierarchy and structure</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: totalCategories, color: 'text-white' },
                { label: 'Active', value: activeCategories, color: 'text-green-400' },
                { label: 'Sub-Cats', value: categoriesCount, color: 'text-blue-400' },
                { label: 'Items', value: menuItems, color: 'text-purple-400' }
              ].map((stat, i) => (
                <div key={i} className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 min-w-[100px]">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</div>
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handleCreate()}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Main Category
            </Button>
          </motion.div>
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 bg-slate-800/50 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-slate-900 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-purple-500/50"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button
              variant="secondary"
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="border-white/10 bg-slate-900 text-gray-300 hover:bg-white/5"
            >
              <Filter className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : categoriesToDisplay.length > 0 ? (
            <div className="space-y-1 pb-20">
               {/* Header Row for List */}
               <div className="hidden sm:flex px-4 pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex-1">Structure</div>
                  <div className="w-[200px] text-right pr-8">Actions</div>
               </div>
               {renderCategoryTree(categoriesToDisplay)}
            </div>
          ) : (
            <Card className="bg-slate-800 border-white/10 border-dashed">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5 shadow-inner">
                  <Folder className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No Categories Found</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  We couldn't find any categories matching your criteria. Create a new one to get started.
                </p>
                <Button
                  onClick={() => handleCreate()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Category
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* --- Modals remain largely the same, simplified for brevity --- */}
      <Modal open={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }} size="lg" title={editingCategory ? "Edit Category" : "New Category"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
          {creatingUnder && !editingCategory && (
             <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-2 text-blue-300 text-sm">
                <CornerDownRight size={14} />
                Adding sub-category to: <span className="font-semibold text-white">{creatingUnder.name}</span>
             </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-400">Name</label>
              <Input required value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (!formData.slug) setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) })); }} className="bg-slate-950 border-slate-800" placeholder="e.g. Beverages" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-400">Slug</label>
              <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="bg-slate-950 border-slate-800" placeholder="beverages" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-400">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none transition-colors" placeholder="Optional description..." />
          </div>

          <div className="space-y-1.5">
             <label className="text-sm font-medium text-gray-400">Image</label>
             <ImageUploader onChange={(file) => setFormData({ ...formData, image: file })} className="bg-slate-950 border-slate-800" />
          </div>

          <div className="flex items-center justify-between pt-2">
             <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded border-gray-600 bg-transparent text-purple-600 focus:ring-purple-500" />
                <label htmlFor="is_active" className="text-sm text-gray-300 cursor-pointer select-none">Active Status</label>
             </div>
             <div className="w-24">
                <label className="text-xs text-gray-500 block mb-1">Order</label>
                <Input type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} className="bg-slate-950 border-slate-800 h-9" />
             </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" disabled={createMutation.status === 'pending' || updateMutation.status === 'pending'} className="flex-1 bg-purple-600 hover:bg-purple-700">{editingCategory ? 'Update Changes' : 'Create Category'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={openView} onClose={() => { setOpenView(false); setSelectedCategory(null); }} title="Category Details">
        {selectedCategory && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-white/5">
               {selectedCategory.image && <img src={selectedCategory.image} className="w-20 h-20 rounded-lg object-cover" />}
               <div>
                  <h2 className="text-xl font-bold text-white">{selectedCategory.name}</h2>
                  <p className="text-purple-400 text-sm">/{selectedCategory.slug}</p>
                  <Badge className={`mt-2 ${selectedCategory.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{selectedCategory.is_active ? 'Active' : 'Inactive'}</Badge>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
               <div className="bg-white/5 p-3 rounded-lg">Display Order: <span className="text-white font-bold ml-2">{selectedCategory.display_order}</span></div>
               <div className="bg-white/5 p-3 rounded-lg">Items: <span className="text-white font-bold ml-2">{selectedCategory.menu_items?.length || 0}</span></div>
            </div>
            {selectedCategory.children && selectedCategory.children.length > 0 && (
               <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Sub-Categories</h3>
                  <div className="space-y-1">
                     {selectedCategory.children.map(c => (
                        <div key={c.id} className="flex justify-between p-2 bg-white/5 rounded text-sm text-gray-300">
                           <span>{c.name}</span>
                           <span className={c.is_active ? "text-green-400" : "text-gray-500"}>●</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setOpenView(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}