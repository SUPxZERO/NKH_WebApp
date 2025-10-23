import React from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { MenuItem, Category, ApiResponse } from '@/app/types/domain';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import Modal from '@/app/components/ui/Modal';
import ImageUploader from '@/app/components/ui/ImageUploader';
import { toastLoading, toastSuccess, toastError } from '@/app/utils/toast';
import { Plus, Search, Edit, Trash2, Star, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MenuItems() {
  const [search, setSearch] = React.useState('');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MenuItem | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    slug: '',
    sku: '',
    price: '',
    cost: '',
    category_id: '',
    is_popular: false,
    is_active: true,
    display_order: 0
  });
  const [image, setImage] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menu-items', page, search],
    queryFn: () => apiGet(`/menu-items?page=${page}&per_page=${perPage}&search=${search}`)
  });

  // Fetch categories for dropdown
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet('/categories')
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => apiPost('/menu-items', data),
    onSuccess: () => {
      toastSuccess('Menu item created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to create menu item');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => 
      apiPost(`/menu-items/${id}?_method=PUT`, data),
    onSuccess: () => {
      toastSuccess('Menu item updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update menu item');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/menu-items/${id}`),
    onSuccess: () => {
      toastSuccess('Menu item deleted successfully!');
      qc.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete menu item');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      sku: '',
      price: '',
      cost: '',
      category_id: '',
      is_popular: false,
      is_active: true,
      display_order: 0
    });
    setImage(null);
    setError(null);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('slug', formData.slug);
    data.append('sku', formData.sku);
    data.append('price', formData.price);
    data.append('cost', formData.cost);
    data.append('category_id', formData.category_id);
    data.append('is_popular', formData.is_popular ? '1' : '0');
    data.append('is_active', formData.is_active ? '1' : '0');
    data.append('display_order', formData.display_order.toString());
    
    if (image) {
      data.append('image', image);
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.translations?.[0]?.name || '',
      description: item.translations?.[0]?.description || '',
      slug: item.slug,
      sku: item.sku || '',
      price: item.price.toString(),
      cost: item.cost?.toString() || '',
      category_id: item.category_id?.toString() || '',
      is_popular: item.is_popular,
      is_active: item.is_active,
      display_order: item.display_order
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this menu item?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Menu Items
            </h1>
            <p className="text-gray-400 mt-1">Manage your restaurant's menu items</p>
          </div>
          <Button
            onClick={() => setOpenCreate(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-4">
                  <Skeleton className="h-48 w-full mb-4 rounded-lg" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : (
            menuItems?.data?.map((item: MenuItem) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-4">
                    {/* Image */}
                    <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      {item.image_path ? (
                        <img
                          src={`${item.image_path}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      
                      {/* Status badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {item.is_popular && (
                          <span className="bg-yellow-500/80 text-white px-2 py-1 rounded-full text-xs flex items-center">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </span>
                        )}
                        {!item.is_active && (
                          <span className="bg-red-500/80 text-white px-2 py-1 rounded-full text-xs flex items-center">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white text-lg">
                        {item.name || 'Untitled'}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {item.description || 'No description'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-green-400 font-bold text-lg">
                          ${item.price}
                        </span>
                        {item.cost && (
                          <span className="text-gray-400 text-sm">
                            Cost: ${item.cost}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        SKU: {item.sku || 'N/A'} | Order: {item.display_order}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item.id)}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {menuItems?.meta && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {page} of {menuItems.meta.last_page}
            </span>
            <Button
              variant="outline"
              disabled={page === menuItems.meta.last_page}
              onClick={() => setPage(page + 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={openCreate || openEdit}
        onClose={() => {
          setOpenCreate(false);
          setOpenEdit(false);
          resetForm();
        }}
        title={editingItem ? 'Edit Menu Item' : 'Create Menu Item'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label="Slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Category</option>
                {categories?.data?.map((category: Category) => (
                  <option key={category.id} value={category.id} className="bg-gray-800">
                    {category.name || category.translations?.[0]?.name || 'Unnamed Category'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label="Cost"
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Enter item description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Image</label>
            <ImageUploader
              onFileSelect={setImage}
              currentImage={editingItem?.image_path ? `/storage/${editingItem.image_path}` : undefined}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Display Order"
              type="number"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              className="bg-white/5 border-white/10 text-white"
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_popular"
                checked={formData.is_popular}
                onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                className="rounded border-white/20 bg-white/5"
              />
              <label htmlFor="is_popular" className="text-sm text-gray-300">Popular Item</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-white/20 bg-white/5"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300">Active</label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
