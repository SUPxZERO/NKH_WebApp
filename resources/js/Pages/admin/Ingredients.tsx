import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, Package, AlertTriangle,
    DollarSign, ShoppingCart, CheckCircle, XCircle, Leaf,
    Beef, Milk, Wheat, Grip
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Enhanced StatCard - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0, subtext }: any) => {
    const colorStyles: Record<string, any> = {
        purple: { gradient: 'from-purple-500/20 to-fuchsia-500/10', iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', shadow: 'shadow-purple-500/20' },
        amber: { gradient: 'from-amber-500/20 to-orange-500/10', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', shadow: 'shadow-amber-500/20' },
        emerald: { gradient: 'from-emerald-500/20 to-green-500/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20' },
        blue: { gradient: 'from-blue-500/20 to-cyan-500/10', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' },
    };
    const styles = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[120px] sm:min-w-0",
                `bg-gradient-to-br ${styles.gradient}`,
                styles.border,
                `shadow-lg ${styles.shadow}`
            )}
        >
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 hidden sm:block">
                <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
            </div>
            <div className="relative p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">{title}</p>
                        <p className={cn("text-lg sm:text-2xl md:text-3xl font-bold", styles.text)}>{value}</p>
                        {subtext && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">{subtext}</p>}
                    </div>
                    <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface Ingredient {
    id: number;
    code: string;
    name: string;
    description?: string;
    category: string;
    unit_id?: number;
    unit?: { id: number; name: string; code: string };
    supplier_id?: number;
    supplier?: { id: number; name: string };
    cost_per_unit?: number;
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
        code: '', name: '', description: '', category: 'vegetables', unit_id: '', supplier_id: '',
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

    const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => apiGet('/api/admin/suppliers') });
    const { data: units } = useQuery({ queryKey: ['units'], queryFn: () => apiGet('/api/admin/units') });
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
            code: ingredient.code || '',
            name: ingredient.name || '',
            description: ingredient.description || '',
            category: ingredient.category || 'vegetable',
            unit_id: ingredient.unit_id?.toString() || '',
            supplier_id: ingredient.supplier_id?.toString() || '',
            cost_per_unit: ingredient.cost_per_unit?.toString() || '',
            min_stock_level: ingredient.min_stock_level?.toString() || '',
            max_stock_level: ingredient.max_stock_level?.toString() || '',
            reorder_point: ingredient.reorder_point?.toString() || '',
            storage_requirements: ingredient.storage_requirements || '',
            allergens: ingredient.allergens || '',
            shelf_life_days: ingredient.shelf_life_days?.toString() || '',
            is_active: ingredient.is_active ?? true
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
            unit_id: formData.unit_id ? parseInt(formData.unit_id) : null,
            supplier_id: formData.supplier_id ? parseInt(formData.supplier_id) : null,
            cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : null,
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
            protein: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
            vegetable: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
            fruit: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
            dairy: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            grain: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
            spice: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
            oil: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            beverage: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
            other: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
        };
        return colors[category] || colors.other;
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'vegetable': return Leaf;
            case 'protein': return Beef;
            case 'dairy': return Milk;
            case 'grain': return Wheat;
            default: return Package;
        }
    };

    const isLowStock = (ingredient: Ingredient) => {
        if (!ingredient.current_stock || !ingredient.reorder_point) return false;
        return ingredient.current_stock <= ingredient.reorder_point;
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 transition-colors relative overflow-x-hidden">
                {/* Decorative Background - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-green-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 w-full mx-auto space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3"
                            >
                                <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
                                <span className="truncate">Ingredients</span>
                            </motion.h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-2 hidden sm:block">Manage inventory items and stock</p>
                        </div>
                        <Button
                            onClick={() => { closeModal(); setOpenCreate(true); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                        >
                            <Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Add Ingredient</span>
                        </Button>
                    </div>

                    {/* Stats Ribbon - Horizontal scroll on mobile */}
                    <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
                        <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-4 min-w-max sm:min-w-0">
                            <StatCard title="Total Items" value={stats.total} icon={Package} color="purple" index={0} />
                            <StatCard title="Low Stock" value={stats.lowStock} icon={AlertTriangle} color="amber" index={1} subtext="Below reorder point" />
                            <StatCard title="Inventory Value" value={`$${stats.totalValue.toLocaleString()}`} icon={DollarSign} color="emerald" index={2} />
                        </div>
                    </div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm shadow-lg"
                    >
                        <div className="flex gap-2 sm:gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 sm:pl-10 h-10 text-sm bg-background/50 border-border/50 focus:border-emerald-500 text-foreground" />
                            </div>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                                className="bg-background/50 border border-border/50 rounded-lg px-2 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-emerald-500 outline-none transition-all">
                                <option value="all">Category</option>
                                {Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="hidden sm:block bg-background/50 border border-border/50 rounded-lg px-2 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-emerald-500 outline-none transition-all">
                                <option value="all">Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                    >
                        {/* Table Header - Desktop only */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-emerald-500/10">
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Code</div>
                            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Name</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Category</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Stock / Cost</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Supplier</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {isLoading ? (
                                <div className="p-8 sm:p-12 text-center text-muted-foreground text-sm">Loading...</div>
                            ) : ingredientList.length === 0 ? (
                                <div className="p-8 sm:p-12 text-center">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">No ingredients found</p>
                                </div>
                            ) : ingredientList.map((ingredient: Ingredient, idx: number) => {
                                const CatIcon = getCategoryIcon(ingredient.category);
                                return (
                                    <motion.div
                                        key={ingredient.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-3 sm:p-4 hover:bg-emerald-500/5 transition-all"
                                    >
                                        {/* Mobile Card Layout */}
                                        <div className="lg:hidden">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium text-foreground text-sm truncate">{ingredient.name}</div>
                                                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{ingredient.code}</div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleEdit(ingredient)} className="p-2 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-600"><Edit size={14} /></button>
                                                    <button onClick={() => handleDelete(ingredient.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1", getCategoryColor(ingredient.category))}>
                                                    <CatIcon size={10} />
                                                    {categories[ingredient.category as keyof typeof categories]}
                                                </span>
                                                <span className="text-xs font-bold text-foreground">{ingredient.current_stock} {ingredient.unit?.code}</span>
                                                <span className="text-[10px] text-muted-foreground">${Number(ingredient.cost_per_unit).toFixed(2)}/{ingredient.unit?.code}</span>
                                            </div>
                                            {isLowStock(ingredient) && (
                                                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                                    <AlertTriangle size={10} /> Low Stock
                                                </div>
                                            )}
                                        </div>

                                        {/* Desktop Grid Layout */}
                                        <div className="hidden lg:grid grid-cols-12 gap-4 items-center group">
                                            <div className="col-span-2 font-mono text-sm text-foreground/70 bg-secondary/50 px-2 py-1 rounded w-fit">{ingredient.code}</div>
                                            <div className="col-span-3">
                                                <div className="font-medium text-foreground">{ingredient.name}</div>
                                                {isLowStock(ingredient) && (
                                                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs mt-1 font-bold animate-pulse">
                                                        <AlertTriangle size={10} /> Low Stock
                                                    </div>
                                                )}
                                            </div>
                                            <div className="col-span-2">
                                                <span className={cn("px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 w-fit", getCategoryColor(ingredient.category))}>
                                                    <CatIcon size={12} />
                                                    {categories[ingredient.category as keyof typeof categories]}
                                                </span>
                                            </div>
                                            <div className="col-span-2 text-sm">
                                                <div className="text-foreground font-bold">{ingredient.current_stock} {ingredient.unit?.code}</div>
                                                <div className="text-muted-foreground text-xs">${Number(ingredient.cost_per_unit).toFixed(2)} / {ingredient.unit?.code}</div>
                                            </div>
                                            <div className="col-span-2 text-sm text-muted-foreground">{ingredient.supplier?.name || '-'}</div>
                                            <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(ingredient)} className="h-8 w-8 p-0 hover:text-blue-600"><Edit size={14} /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(ingredient.id)} className="h-8 w-8 p-0 hover:text-red-500"><Trash2 size={14} /></Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                <Modal open={openCreate || openEdit} onClose={closeModal} title={editingIngredient ? 'Edit Ingredient' : 'New Ingredient'} size="lg">
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <Input label="Item Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required placeholder="e.g. TOM-001" className="h-10 text-sm" />
                            <Input label="Item Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Tomato Ripe" className="h-10 text-sm" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Category</label>
                                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all">
                                    {Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Unit</label>
                                <select value={formData.unit_id} onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })} required
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all">
                                    <option value="">Select</option>
                                    {units?.data?.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-secondary/30 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/50">
                            <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-muted-foreground">Inventory</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                                <Input label="Cost ($)" type="number" step="0.01" value={formData.cost_per_unit} onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })} required placeholder="0.00" className="h-10 text-sm" />
                                <Input label="Reorder Pt" type="number" step="0.01" value={formData.reorder_point} onChange={(e) => setFormData({ ...formData, reorder_point: e.target.value })} placeholder="Min" className="h-10 text-sm" />
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Supplier</label>
                                    <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all">
                                        <option value="">None</option>
                                        {suppliers?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-9 sm:h-10 text-sm">Cancel</Button>
                            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-9 sm:h-10 text-sm">
                                {editingIngredient ? 'Save' : 'Create'}
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
