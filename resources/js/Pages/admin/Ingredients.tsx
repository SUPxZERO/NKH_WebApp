import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    DollarSign,
    Package,
    AlertTriangle,
    TrendingUp,
    ShoppingCart
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface Supplier {
    id: number;
    name: string;
}

interface Unit {
    id: number;
    name: string;
    code: string;
}

interface Ingredient {
    id: number;
    code: string;
    name: string;
    description?: string;
    category: string;
    unit_id: number;
    unit?: Unit;
    supplier_id?: number;
    supplier?: Supplier;
    cost_per_unit: number;
    current_stock?: number;
    min_stock_level?: number;
    max_stock_level?: number;
    reorder_point?: number;
    storage_requirements?: string;
    allergens?: string;
    shelf_life_days?: number;
    is_active: boolean;
}

export default function Ingredients() {
    const [search, setSearch] = React.useState('');
    const [categoryFilter, setCategoryFilter] = React.useState('all');
    const [supplierFilter, setSupplierFilter] = React.useState('all');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [selectedIngredient, setSelectedIngredient] = React.useState<Ingredient | null>(null);
    const [error, setError] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    const [formData, setFormData] = React.useState({
        code: '',
        name: '',
        description: '',
        category: 'vegetable',
        unit_id: '',
        supplier_id: '',
        cost_per_unit: '',
        min_stock_level: '',
        max_stock_level: '',
        reorder_point: '',
        storage_requirements: '',
        allergens: '',
        shelf_life_days: '',
        is_active: true
    });

    const categories = {
        protein: 'Protein',
        vegetable: 'Vegetables',
        fruit: 'Fruits',
        dairy: 'Dairy',
        grain: 'Grains',
        spice: 'Spices',
        oil: 'Oils',
        beverage: 'Beverages',
        other: 'Other'
    };

    // Fetch ingredients
    const { data: ingredients, isLoading } = useQuery({
        queryKey: ['ingredients', page, search, categoryFilter, supplierFilter, statusFilter],
        queryFn: () => {
            let url = `/api/admin/ingredients?page=${page}&per_page=${perPage}&search=${search}`;
            if (categoryFilter !== 'all') url += `&category=${categoryFilter}`;
            if (supplierFilter !== 'all') url += `&supplier_id=${supplierFilter}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            return apiGet(url);
        }
    });

    // Fetch suppliers
    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => apiGet('/api/suppliers')
    });

    // Fetch units
    const { data: units } = useQuery({
        queryKey: ['units'],
        queryFn: () => apiGet('/api/units')
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['ingredient-stats'],
        queryFn: () => apiGet('/api/admin/ingredients/stats')
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/ingredients', data),
        onSuccess: () => {
            toastSuccess('Ingredient created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['ingredients'] });
            qc.invalidateQueries({ queryKey: ['ingredient-stats'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to create ingredient')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/ingredients/${id}`, data),
        onSuccess: () => {
            toastSuccess('Ingredient updated successfully!');
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['ingredients'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to update ingredient')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/ingredients/${id}`),
        onSuccess: () => {
            toastSuccess('Ingredient deleted!');
            qc.invalidateQueries({ queryKey: ['ingredients'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to delete')
    });

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            category: 'vegetable',
            unit_id: '',
            supplier_id: '',
            cost_per_unit: '',
            min_stock_level: '',
            max_stock_level: '',
            reorder_point: '',
            storage_requirements: '',
            allergens: '',
            shelf_life_days: '',
            is_active: true
        });
        setSelectedIngredient(null);
        setError('');
    };

    const handleEdit = (ingredient: Ingredient) => {
        setFormData({
            code: ingredient.code,
            name: ingredient.name,
            description: ingredient.description || '',
            category: ingredient.category,
            unit_id: ingredient.unit_id.toString(),
            supplier_id: ingredient.supplier_id?.toString() || '',
            cost_per_unit: ingredient.cost_per_unit.toString(),
            min_stock_level: ingredient.min_stock_level?.toString() || '',
            max_stock_level: ingredient.max_stock_level?.toString() || '',
            reorder_point: ingredient.reorder_point?.toString() || '',
            storage_requirements: ingredient.storage_requirements || '',
            allergens: ingredient.allergens || '',
            shelf_life_days: ingredient.shelf_life_days?.toString() || '',
            is_active: ingredient.is_active
        });
        setSelectedIngredient(ingredient);
        setOpenEdit(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data = {
            code: formData.code,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            unit_id: parseInt(formData.unit_id),
            supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
            cost_per_unit: parseFloat(formData.cost_per_unit),
            min_stock_level: formData.min_stock_level ? parseFloat(formData.min_stock_level) : null,
            max_stock_level: formData.max_stock_level ? parseFloat(formData.max_stock_level) : null,
            reorder_point: formData.reorder_point ? parseFloat(formData.reorder_point) : null,
            storage_requirements: formData.storage_requirements,
            allergens: formData.allergens,
            shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
            is_active: formData.is_active
        };

        if (selectedIngredient) {
            updateMutation.mutate({ id: selectedIngredient.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            protein: 'bg-red-500/20 text-red-400 border-red-500/30',
            vegetable: 'bg-green-500/20 text-green-400 border-green-500/30',
            fruit: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            dairy: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            grain: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            spice: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            oil: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            beverage: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            other: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
        return colors[category] || colors.other;
    };

    const isLowStock = (ingredient: Ingredient) => {
        if (!ingredient.current_stock || !ingredient.reorder_point) return false;
        return ingredient.current_stock <= ingredient.reorder_point;
    };

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
                                Ingredients Catalog
                            </h1>
                            <p className="text-gray-400 mt-1">Manage your ingredient inventory and pricing</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Total Items</div>
                                <div className="text-xl font-bold text-white">{stats?.total_ingredients || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Low Stock</div>
                                <div className="text-xl font-bold text-orange-400">{stats?.low_stock || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Value</div>
                                <div className="text-xl font-bold text-green-400">${Number(stats?.total_inventory_value || 0).toFixed(0)}</div>
                            </div>
                        </div>

                        <Button
                            onClick={() => { resetForm(); setOpenCreate(true); }}
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
                    className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
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

                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Categories</option>
                        {Object.entries(categories).map(([key, label]) => (
                            <option key={key} value={key} className="text-black">{label}</option>
                        ))}
                    </select>

                    <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Suppliers</option>
                        {suppliers?.data?.map((sup: Supplier) => (
                            <option key={sup.id} value={sup.id} className="text-black">{sup.name}</option>
                        ))}
                    </select>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Status</option>
                        <option value="active" className="text-black">Active</option>
                        <option value="inactive" className="text-black">Inactive</option>
                    </select>

                    <Button variant="secondary" onClick={() => { setSearch(''); setCategoryFilter('all'); setSupplierFilter('all'); setStatusFilter('all'); }}
                        className="border-white/20 hover:bg-white/10">Clear</Button>
                </motion.div>

                {/* Ingredients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        ingredients?.data?.map((ingredient: Ingredient, index: number) => (
                            <motion.div key={ingredient.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}>
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white text-lg">{ingredient.name}</h3>
                                                <p className="text-sm text-gray-400">{ingredient.code}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {isLowStock(ingredient) && (
                                                    <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Low
                                                    </Badge>
                                                )}
                                                <Badge className={ingredient.is_active
                                                    ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                    : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                                    {ingredient.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <Badge className={getCategoryColor(ingredient.category)}>
                                                {categories[ingredient.category as keyof typeof categories]}
                                            </Badge>

                                            <div className="flex items-center text-sm text-gray-300">
                                                <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                                                ${Number(ingredient.cost_per_unit).toFixed(2)} / {ingredient.unit?.code || 'unit'}
                                            </div>

                                            {ingredient.supplier && (
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <ShoppingCart className="w-4 h-4 mr-2 text-gray-400" />
                                                    {ingredient.supplier.name}
                                                </div>
                                            )}

                                            {ingredient.current_stock !== undefined && (
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                                                    Stock: {ingredient.current_stock} {ingredient.unit?.code}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => { setSelectedIngredient(ingredient); setOpenView(true); }}
                                                className="flex-1 border-white/20 hover:bg-white/10">
                                                <Eye className="w-3 h-3 mr-1" />View
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(ingredient)}
                                                className="flex-1 border-white/20 hover:bg-white/10">
                                                <Edit className="w-3 h-3 mr-1" />Edit
                                            </Button>
                                            <Button size="sm" variant="danger"
                                                onClick={() => window.confirm('Delete this ingredient?') && deleteMutation.mutate(ingredient.id)}
                                                className="border-red-500/20 hover:bg-red-500/10 text-red-400">
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create/Edit Modal */}
                <Modal open={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                    title={selectedIngredient ? 'Edit Ingredient' : 'Create Ingredient'} size="lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Code *</label>
                                <Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" placeholder="ING-001" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                                <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    {Object.entries(categories).map(([key, label]) => (
                                        <option key={key} value={key} className="bg-gray-800">{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Unit *</label>
                                <select required value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">Select Unit</option>
                                    {units?.data?.map((unit: Unit) => (
                                        <option key={unit.id} value={unit.id} className="bg-gray-800">{unit.name} ({unit.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Supplier</label>
                                <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">No preferred supplier</option>
                                    {suppliers?.data?.map((sup: Supplier) => (
                                        <option key={sup.id} value={sup.id} className="bg-gray-800">{sup.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Cost per Unit *</label>
                                <Input type="number" step="0.01" required value={formData.cost_per_unit}
                                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Min Stock Level</label>
                                <Input type="number" step="0.01" value={formData.min_stock_level}
                                    onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Max Stock Level</label>
                                <Input type="number" step="0.01" value={formData.max_stock_level}
                                    onChange={(e) => setFormData({ ...formData, max_stock_level: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Reorder Point</label>
                                <Input type="number" step="0.01" value={formData.reorder_point}
                                    onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Shelf Life (days)</label>
                                <Input type="number" value={formData.shelf_life_days}
                                    onChange={(e) => setFormData({ ...formData, shelf_life_days: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Allergens</label>
                                <Input value={formData.allergens} onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" placeholder="e.g., Peanuts, Dairy" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Storage Requirements</label>
                                <textarea value={formData.storage_requirements} onChange={(e) => setFormData({ ...formData, storage_requirements: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={2}
                                    placeholder="e.g., Refrigerate at 2-4°C" />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" />
                                    <span className="text-sm text-gray-300">Active</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1">{selectedIngredient ? 'Update' : 'Create'} Ingredient</Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal open={openView} onClose={() => { setOpenView(false); setSelectedIngredient(null); }}
                    title="Ingredient Details" size="lg">
                    {selectedIngredient && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm text-gray-400">Code</h3>
                                    <p className="text-white font-semibold">{selectedIngredient.code}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Name</h3>
                                    <p className="text-white">{selectedIngredient.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Category</h3>
                                    <Badge className={getCategoryColor(selectedIngredient.category)}>
                                        {categories[selectedIngredient.category as keyof typeof categories]}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Cost per Unit</h3>
                                    <p className="text-white font-semibold">${Number(selectedIngredient.cost_per_unit).toFixed(2)}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Unit</h3>
                                    <p className="text-white">{selectedIngredient.unit?.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Supplier</h3>
                                    <p className="text-white">{selectedIngredient.supplier?.name || 'N/A'}</p>
                                </div>
                                {selectedIngredient.allergens && (
                                    <div className="md:col-span-2">
                                        <h3 className="text-sm text-gray-400 mb-2">Allergens</h3>
                                        <p className="text-orange-400 text-sm">{selectedIngredient.allergens}</p>
                                    </div>
                                )}
                                {selectedIngredient.storage_requirements && (
                                    <div className="md:col-span-2">
                                        <h3 className="text-sm text-gray-400 mb-2">Storage Requirements</h3>
                                        <p className="text-white text-sm">{selectedIngredient.storage_requirements}</p>
                                    </div>
                                )}
                            </div>

                            <Button variant="secondary" onClick={() => { setOpenView(false); setSelectedIngredient(null); }}
                                className="w-full border-white/20 hover:bg-white/10">Close</Button>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
