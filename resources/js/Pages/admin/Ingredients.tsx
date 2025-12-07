import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, Package, AlertTriangle,
    DollarSign, ShoppingCart, CheckCircle, XCircle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon with Dark/Light Mode Support
const IngredientStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium">Total Items</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium">Low Stock</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.lowStock}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium">Total Value</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">${stats.totalValue.toFixed(0)}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
        </div>
    </div>
);

interface Ingredient {
    id: number;
    code: string;
    name: string;
    description?: string;
    category: string;
    unit_id: number;
    unit?: { id: number; name: string; code: string };
    supplier_id?: number;
    supplier?: { id: number; name: string };
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
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [supplierFilter, setSupplierFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        code: '', name: '', description: '', category: 'vegetable', unit_id: '', supplier_id: '',
        cost_per_unit: '', min_stock_level: '', max_stock_level: '', reorder_point: '',
        storage_requirements: '', allergens: '', shelf_life_days: '', is_active: true
    });

    // Fetch Data
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

    const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => apiGet('/api/suppliers') });
    const { data: units } = useQuery({ queryKey: ['units'], queryFn: () => apiGet('/api/units') });
    const { data: statsData } = useQuery({ queryKey: ['ingredient-stats'], queryFn: () => apiGet('/api/admin/ingredients/stats') });

    const ingredientList = useMemo(() => ingredients?.data || [], [ingredients]);

    const stats = useMemo(() => ({
        total: statsData?.total_ingredients || 0,
        lowStock: statsData?.low_stock || 0,
        totalValue: Number(statsData?.total_inventory_value || 0)
    }), [statsData]);

    const categories = {
        protein: 'Protein', vegetable: 'Vegetables', fruit: 'Fruits', dairy: 'Dairy',
        grain: 'Grains', spice: 'Spices', oil: 'Oils', beverage: 'Beverages', other: 'Other'
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/ingredients', data),
        onSuccess: () => { toastSuccess('Ingredient created'); closeModal(); qc.invalidateQueries({ queryKey: ['ingredients'] }); qc.invalidateQueries({ queryKey: ['ingredient-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/ingredients/${id}`, data),
        onSuccess: () => { toastSuccess('Ingredient updated'); closeModal(); qc.invalidateQueries({ queryKey: ['ingredients'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/ingredients/${id}`),
        onSuccess: () => { toastSuccess('Ingredient deleted'); qc.invalidateQueries({ queryKey: ['ingredients'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingIngredient(null);
        setFormData({
            code: '', name: '', description: '', category: 'vegetable', unit_id: '', supplier_id: '',
            cost_per_unit: '', min_stock_level: '', max_stock_level: '', reorder_point: '',
            storage_requirements: '', allergens: '', shelf_life_days: '', is_active: true
        });
    };

    const handleEdit = (ingredient: Ingredient) => {
        setEditingIngredient(ingredient);
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
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this ingredient?')) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            unit_id: parseInt(formData.unit_id),
            supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
            cost_per_unit: parseFloat(formData.cost_per_unit),
            min_stock_level: formData.min_stock_level ? parseFloat(formData.min_stock_level) : null,
            max_stock_level: formData.max_stock_level ? parseFloat(formData.max_stock_level) : null,
            reorder_point: formData.reorder_point ? parseFloat(formData.reorder_point) : null,
            shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null
        };
        if (editingIngredient) updateMutation.mutate({ id: editingIngredient.id, data });
        else createMutation.mutate(data);
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            protein: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
            vegetable: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20',
            fruit: 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
            dairy: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
            grain: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20',
            spice: 'bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20',
            oil: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
            beverage: 'bg-cyan-100 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
            other: 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/20'
        };
        return colors[category] || colors.other;
    };

    const isLowStock = (ingredient: Ingredient) => {
        if (!ingredient.current_stock || !ingredient.reorder_point) return false;
        return ingredient.current_stock <= ingredient.reorder_point;
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Ingredients</h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-1">Inventory items and costs</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Ingredient
                    </Button>
                </div>

                <IngredientStatsRibbon stats={stats} />

                {/* Filters */}
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search ingredients..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500" />
                        </div>
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none">
                            <option value="all">All Categories</option>
                            {Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                        <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none">
                            <option value="all">All Suppliers</option>
                            {suppliers?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        <div className="col-span-2">Code</div>
                        <div className="col-span-3">Name</div>
                        <div className="col-span-2">Category</div>
                        <div className="col-span-2">Stock / Cost</div>
                        <div className="col-span-2">Supplier</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : ingredientList.length === 0 ? (
                            <div className="p-12 text-center">
                                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No ingredients found</p>
                            </div>
                        ) : ingredientList.map((ingredient: Ingredient) => (
                            <motion.div key={ingredient.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <div className="col-span-2 font-mono text-sm text-gray-600 dark:text-gray-300">{ingredient.code}</div>
                                <div className="col-span-3">
                                    <div className="font-medium text-gray-900 dark:text-white">{ingredient.name}</div>
                                    {isLowStock(ingredient) && (
                                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs mt-1">
                                            <AlertTriangle size={10} /> Low Stock
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", getCategoryColor(ingredient.category))}>
                                        {categories[ingredient.category as keyof typeof categories]}
                                    </span>
                                </div>
                                <div className="col-span-2 text-sm">
                                    <div className="text-gray-900 dark:text-white font-medium">{ingredient.current_stock} {ingredient.unit?.code}</div>
                                    <div className="text-gray-500 text-xs">${Number(ingredient.cost_per_unit).toFixed(2)} / {ingredient.unit?.code}</div>
                                </div>
                                <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">{ingredient.supplier?.name || '-'}</div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(ingredient)} className="h-8 w-8 p-0"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(ingredient.id)} className="h-8 w-8 p-0"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingIngredient ? 'Edit Ingredient' : 'New Ingredient'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                                {Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
                            <select value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })} required
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                                <option value="">Select Unit</option>
                                {units?.data?.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.code})</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Cost / Unit" type="number" step="0.01" value={formData.cost_per_unit} onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })} required />
                        <Input label="Reorder Point" type="number" step="0.01" value={formData.reorder_point} onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier</label>
                            <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                                <option value="">None</option>
                                {suppliers?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
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
