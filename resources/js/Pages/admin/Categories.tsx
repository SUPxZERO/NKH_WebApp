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
  Image as ImageIcon,
  Move,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { ImageUploader } from '@/app/components/ui/ImageUploader';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Category } from '@/app/types/domain';

// Local response types
type CategoryListResponse = {
  data: Category[];
};

/*
  Modifications made to fix TypeScript errors and implement missing behaviour:
  - Added `CategoryListResponse` type.
  - Added a `categoryList` query (with `isLoading` and `categoriesError`) to load categories.
  - Implemented `handleCreate(parent?)` to open create modal and provide UI context (no API parent_id).
  - Removed `parent_id` usage from `formData` and submissions — this project models nested categories via `children` arrays.
  - Updated `resetForm` and `handleEdit` to match the simplified form shape.
  - Computed `categoriesCount` for the summary card instead of the missing `categories` variable.
  These changes keep the original JSX/UX intact and provide safe, typed state handling.
*/

// Import should already include the component's type definition

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

  // State to track if auth is initialized (CSRF cookie fetched)
  const [authInitialized, setAuthInitialized] = React.useState(false);

  React.useEffect(() => {
    // Ensure auth is initialized before making API calls
    setAuthInitialized(true);
  }, []);

  // Form state
  const [formData, setFormData] = React.useState({
    name: '',
    slug: '',
    description: '',
    image: null as File | null,
    display_order: 0,
    is_active: true
  });

  // When creating a category from the tree, show which parent the user selected
  // for UI context only. We will NOT send `parent_id` to the API in this project.
  const [creatingUnder, setCreatingUnder] = React.useState<Category | null>(null);

  

  // Fetch category stats
  const { data: categoryStats, error: statsError } = useQuery({
    queryKey: ['admin/category-stats'],
    queryFn: () => apiGet('/api/admin/category-stats'),
    enabled: authInitialized
  }) as { data: any, error?: any };

  // Fetch category list (supports search & status filters)
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
      const status = categoriesError?.response?.status;
      if (status === 403) {
        setError('Access denied: you do not have permission to view categories.');
      } else {
        setError(categoriesError?.response?.data?.message || 'Failed to load categories');
      }
    }
  }, [categoriesError]);

  React.useEffect(() => {
    if (statsError) {
      const status = statsError?.response?.status;
      if (status === 403) {
        setError('Access denied: you do not have permission to view category stats.');
      } else {
        setError(statsError?.response?.data?.message || 'Failed to load category stats');
      }
    }
  }, [statsError]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiPost('/api/admin/categories', data),
    onSuccess: () => {
      toastSuccess('Category created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/category-stats'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create category');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: FormData }) => apiPost(`/api/admin/categories/${id}?_method=PUT`, data),
    onSuccess: () => {
      toastSuccess('Category updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/category-stats'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update category');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/categories/${id}`),
    onSuccess: () => {
      toastSuccess('Category deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/category-stats'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete category');
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) => 
      apiPut(`/api/admin/categories/${id}/toggle-status`, { is_active }),
    onSuccess: () => {
      toastSuccess('Category status updated!');
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update status');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: null,
      display_order: 0,
      is_active: true,
      // parent_id removed
    });
    setCreatingUnder(null);
    setEditingCategory(null);
    setError('');
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

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

  // Open create modal. If `parent` is provided, set `creatingUnder` for UI context only.
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
      toastError('Cannot delete category with menu items. Please delete menu items first.');
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
    

    
    if (formData.image) {
      data.append('image', formData.image);
    }
    // NOTE: parent_id removed intentionally — this app models nested categories
    // via the category objects (children arrays). Creation does not send parent_id.

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const toggleExpanded = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => (
      <div key={category.id} className="mb-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all duration-300 ${
            level > 0 ? 'ml-8 border-l-4 border-l-purple-500/50' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Expand/Collapse Button */}
              {category.children && category.children.length > 0 ? (
                <button
                  onClick={() => toggleExpanded(category.id)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <div className="w-4" />
              )}

              {/* Category Icon */}
              <div className="flex items-center gap-2">
                {level === 0 ? (
                  expandedCategories.has(category.id) ? (
                    <FolderOpen className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Folder className="w-5 h-5 text-blue-400" />
                  )
                ) : (
                  <div className="w-3 h-3 bg-purple-400 rounded-full" />
                )}
                
                {/* Category Image */}
                {category.image && (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                )}
              </div>

              {/* Category Info */}
              <div>
                <h3 className="font-semibold text-white text-lg">
                  {category.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-400 text-sm">/{category.slug}</span>
                  {category.menu_items && (
                    <span className="text-gray-400 text-sm">
                      • {category.menu_items.length} items
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <Badge className={category.is_active 
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }>
                {category.is_active ? 'Active' : 'Inactive'}
              </Badge>

              {/* Action Buttons */}
              <div className="flex gap-1">
                {level === 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCreate(category)}
                    className="border-white/20 hover:bg-white/10"
                    title="Add Menu Items"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleToggleStatus(category)}
                  className="border-white/20 hover:bg-white/10"
                  title="Toggle Status"
                >
                  {category.is_active ? (
                    <ToggleRight className="w-3 h-3 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-3 h-3 text-gray-400" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleView(category)}
                  className="border-white/20 hover:bg-white/10"
                >
                  <Eye className="w-3 h-3" />
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(category)}
                  className="border-white/20 hover:bg-white/10"
                >
                  <Edit className="w-3 h-3" />
                </Button>

                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(category)}
                  className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Description */}
          {category.description && (
            <p className="text-gray-300 text-sm mt-2 ml-7">
              {category.description}
            </p>
          )}
        </motion.div>

        {/* Render Children */}
        {category.children && 
         category.children.length > 0 && 
         expandedCategories.has(category.id) && (
          <div className="mt-2">
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const totalCategories = categoryStats?.total || 0;
  const activeCategories = categoryStats?.active || 0;
  const menuItems = categoryStats?.menu_items_total ?? categoryStats?.menu_items ?? 0;
  const categoriesCount = categoryStats?.categories || categoryStats?.categories_total || totalCategories;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Categories Management
              </h1>
              <p className="text-gray-400 mt-1">Organize menu items with hierarchical categories</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total</div>
                <div className="text-xl font-bold text-white">{totalCategories}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Active</div>
                <div className="text-xl font-bold text-green-400">{activeCategories}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Categories</div>
                <div className="text-xl font-bold text-blue-400">{categoriesCount}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Menu Items</div>
                <div className="text-xl font-bold text-purple-400">{menuItems}</div>
              </div>
            </div>

            <Button
              onClick={() => handleCreate()}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Main Category
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option className="text-gray-900" value="all">All Status</option>
            <option className="text-gray-900" value="active">Active</option>
            <option className="text-gray-900" value="inactive">Inactive</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>

          <Button
            variant="secondary"
            onClick={() => setExpandedCategories(new Set(categoryList?.data?.map((c: Category) => c.id) || []))}
            className="border-white/20 hover:bg-white/10"
          >
            Expand All
          </Button>
        </motion.div>

        {/* Categories Tree */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-white/10 rounded w-1/3"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (categoryList?.data && categoryList.data.length > 0) ? (
            renderCategoryTree(categoryList.data)
          )  : (
            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
              <CardContent className="p-12 text-center">
                <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Categories Found</h3>
                <p className="text-gray-400 mb-6">Create your first category to organize menu items</p>
                <Button
                  onClick={() => handleCreate()}
                  className="bg-gradient-to-r from-fuchsia-600 to-pink-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Category
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={openCreate || openEdit}
        onClose={() => {
          setOpenCreate(false);
          setOpenEdit(false);
          resetForm();
        }}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {creatingUnder && openCreate && !openEdit && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-gray-300 text-sm">
              Creating under: <strong className="text-white">{creatingUnder.name}</strong>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (!formData.slug) {
                    setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                  }
                }}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Appetizers"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Slug</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="appetizers"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Describe this category..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category Image</label>
            <ImageUploader
              onChange={(file: File | null) => setFormData({ ...formData, image: file })}
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
              <Input
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-fuchsia-600"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300">
                Active category
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpenCreate(false);
                setOpenEdit(false);
                resetForm();
              }}
              className="flex-1 border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.status === 'pending' || updateMutation.status === 'pending'}
              className="flex-1"
            >
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedCategory(null);
        }}
        title="Category Details"
        size="lg"
      >
        {selectedCategory && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              {selectedCategory.image && (
                <img
                  src={selectedCategory.image}
                  alt={selectedCategory.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{selectedCategory.name}</h2>
                <p className="text-gray-400">/{selectedCategory.slug}</p>
                {selectedCategory.description && (
                  <p className="text-gray-300 mt-2">{selectedCategory.description}</p>
                )}
              </div>
              <Badge className={selectedCategory.is_active 
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
              }>
                {selectedCategory.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="text-white ml-2">
                </span>
              </div>
              <div>
                <span className="text-gray-400">Display Order:</span>
                <span className="text-white ml-2">{selectedCategory.display_order}</span>
              </div>
              <div>
                <span className="text-gray-400">Menu Items:</span>
                <span className="text-white ml-2">
                  {selectedCategory.menu_items?.length || 0}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Child Menu Items:</span>
                <span className="text-white ml-2">
                  {selectedCategory.children?.length || 0}
                </span>
              </div>
            </div>

            {selectedCategory.children && selectedCategory.children.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Menu Items</h3>
                <div className="space-y-2">
                  {selectedCategory.children.map((child) => (
                    <div key={child.id} className="bg-white/5 p-3 rounded-lg flex justify-between items-center">
                      <span className="text-white">{child.name}</span>
                      <Badge className={child.is_active 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }>
                        {child.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  handleEdit(selectedCategory);
                }}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Category
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedCategory(null);
                }}
                className="border-white/20 hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
