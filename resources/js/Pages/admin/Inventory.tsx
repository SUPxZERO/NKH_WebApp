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
  Package, 
  AlertTriangle,
  TrendingDown,
  DollarSign,
  BarChart3
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Ingredient, Location } from '@/app/types/domain';

export default function Inventory() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [selectedIngredient, setSelectedIngredient] = React.useState<Ingredient | null>(null);
  const [editingIngredient, setEditingIngredient] = React.useState<Ingredient | null>(null);
  const [error, setError] = React.useState('');

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);

  // Form state
  const [formData, setFormData] = React.useState({
    sku: '',
    name: '',
    unit: 'unit',
    quantity_on_hand: '0',
    reorder_level: '0',
    reorder_quantity: '',
    cost: '',
    is_active: true
  });

  // Fetch ingredients
  const { data: ingredients, isLoading } = useQuery({
    queryKey: ['admin/ingredients', page, search, statusFilter],
    queryFn: () => {
      let url = `/api/admin/ingredients?page=${page}&per_page=${perPage}&search=${search}`;
      
      if (statusFilter === 'active') {
        url += '&is_active=1';
      } else if (statusFilter === 'inactive') {
        url += '&is_active=0';
      } else if (statusFilter === 'low_stock') {
        url += '&low_stock=1';
      }
      
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/ingredients', data),
    onSuccess: () => {
      toastSuccess('Ingredient created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/ingredients'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create ingredient');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/ingredients/${id}`, data),
    onSuccess: () => {
      toastSuccess('Ingredient updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/ingredients'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update ingredient');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/ingredients/${id}`),
    onSuccess: () => {
      toastSuccess('Ingredient deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/ingredients'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete ingredient');
    }
  });

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      unit: 'unit',
      quantity_on_hand: '0',
      reorder_level: '0',
      reorder_quantity: '',
      cost: '',
      is_active: true
    });
    setEditingIngredient(null);
    setError('');
  };

  const handleCreate = () => {
    resetForm();
    setOpenCreate(true);
  };

  const handleEdit = (ingredient: Ingredient) => {
    setFormData({
      sku: ingredient.sku || '',
      name: ingredient.name,
      unit: ingredient.unit,
      quantity_on_hand: ingredient.quantity_on_hand.toString(),
      reorder_level: ingredient.reorder_level.toString(),
      reorder_quantity: ingredient.reorder_quantity?.toString() || '',
      cost: ingredient.cost?.toString() || '',
      is_active: ingredient.is_active
    });
    setEditingIngredient(ingredient);
    setOpenEdit(true);
  };

  const handleView = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setOpenView(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this ingredient?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data = {
      ...formData,
      quantity_on_hand: parseFloat(formData.quantity_on_hand),
      reorder_level: parseFloat(formData.reorder_level),
      reorder_quantity: formData.reorder_quantity ? parseFloat(formData.reorder_quantity) : null,
      cost: formData.cost ? parseFloat(formData.cost) : null
    };

    if (editingIngredient) {
      updateMutation.mutate({ id: editingIngredient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLowStock = (ingredient: Ingredient) => {
    return ingredient.quantity_on_hand <= ingredient.reorder_level;
  };

  const getStockStatus = (ingredient: Ingredient) => {
    if (!ingredient.is_active) return 'inactive';
    if (ingredient.quantity_on_hand <= 0) return 'out_of_stock';
    if (isLowStock(ingredient)) return 'low_stock';
    return 'in_stock';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'low_stock': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'out_of_stock': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const totalIngredients = ingredients?.data?.length || 0;
  const activeIngredients = ingredients?.data?.filter((ing: Ingredient) => ing.is_active).length || 0;
  const lowStockIngredients = ingredients?.data?.filter((ing: Ingredient) => ing.is_active && isLowStock(ing)).length || 0;
  const outOfStockIngredients = ingredients?.data?.filter((ing: Ingredient) => ing.is_active && ing.quantity_on_hand <= 0).length || 0;

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
                Inventory Management
              </h1>
              <p className="text-gray-400 mt-1">Manage ingredients and stock levels</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total</div>
                <div className="text-xl font-bold text-white">{totalIngredients}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Active</div>
                <div className="text-xl font-bold text-green-400">{activeIngredients}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Low Stock</div>
                <div className="text-xl font-bold text-yellow-400">{lowStockIngredients}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Out of Stock</div>
                <div className="text-xl font-bold text-red-400">{outOfStockIngredients}</div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Ingredient
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
              placeholder="Search ingredients..."
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
            <option value="all">All Items</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="low_stock">Low Stock</option>
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
        </motion.div>

        {/* Ingredients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      <div className="h-8 bg-white/10 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            ingredients?.data?.map((ingredient: Ingredient, index: number) => (
              <motion.div
                key={ingredient.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Ingredient Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {ingredient.name}
                        </h3>
                        {ingredient.sku && (
                          <p className="text-sm text-gray-400">SKU: {ingredient.sku}</p>
                        )}
                      </div>
                      <Badge className={getStockColor(getStockStatus(ingredient))}>
                        {getStockStatus(ingredient).replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Stock Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">On Hand:</span>
                        <span className="text-white font-semibold">
                          {ingredient.quantity_on_hand} {ingredient.unit}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Reorder Level:</span>
                        <span className="text-white">
                          {ingredient.reorder_level} {ingredient.unit}
                        </span>
                      </div>

                      {ingredient.cost && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Unit Cost:</span>
                          <span className="text-white">${ingredient.cost}</span>
                        </div>
                      )}

                      {isLowStock(ingredient) && ingredient.is_active && (
                        <div className="flex items-center gap-2 text-yellow-400 text-sm">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Low Stock Alert</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleView(ingredient)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(ingredient)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(ingredient.id)}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {ingredients?.meta && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {page} of {ingredients?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === ingredients?.meta?.last_page}
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
        open={openCreate || openEdit}
        onClose={() => {
          setOpenCreate(false);
          setOpenEdit(false);
          resetForm();
        }}
        title={editingIngredient ? 'Edit Ingredient' : 'Add Ingredient'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Ingredient name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SKU</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Stock keeping unit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Unit *</label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="unit">Unit</option>
                <option value="kg">Kilogram</option>
                <option value="g">Gram</option>
                <option value="l">Liter</option>
                <option value="ml">Milliliter</option>
                <option value="lb">Pound</option>
                <option value="oz">Ounce</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quantity on Hand</label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={formData.quantity_on_hand}
                onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reorder Level</label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Reorder Quantity</label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={formData.reorder_quantity}
                onChange={(e) => setFormData({ ...formData, reorder_quantity: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Unit Cost</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="0.00"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-fuchsia-600"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300">
                Active ingredient
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {editingIngredient ? 'Update' : 'Add'} Ingredient
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Ingredient Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedIngredient(null);
        }}
        title="Ingredient Details"
        size="lg"
      >
        {selectedIngredient && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white font-semibold">{selectedIngredient.name}</span>
                  </div>
                  {selectedIngredient.sku && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">SKU:</span>
                      <span className="text-white">{selectedIngredient.sku}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unit:</span>
                    <span className="text-white">{selectedIngredient.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getStockColor(getStockStatus(selectedIngredient))}>
                      {getStockStatus(selectedIngredient).replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Stock Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantity on Hand:</span>
                    <span className="text-white">{selectedIngredient.quantity_on_hand} {selectedIngredient.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reorder Level:</span>
                    <span className="text-white">{selectedIngredient.reorder_level} {selectedIngredient.unit}</span>
                  </div>
                  {selectedIngredient.reorder_quantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Reorder Quantity:</span>
                      <span className="text-white">{selectedIngredient.reorder_quantity} {selectedIngredient.unit}</span>
                    </div>
                  )}
                  {selectedIngredient.cost && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unit Cost:</span>
                      <span className="text-white">${selectedIngredient.cost}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(selectedIngredient.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {isLowStock(selectedIngredient) && selectedIngredient.is_active && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Low Stock Alert</span>
                </div>
                <p className="text-yellow-300 mt-1">
                  This ingredient is below the reorder level. Consider restocking soon.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => handleEdit(selectedIngredient)}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Ingredient
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedIngredient(null);
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
