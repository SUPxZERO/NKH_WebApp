import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, Copy, ChefHat, Clock,
    DollarSign, Users, FileText, ToggleLeft, ToggleRight, TrendingUp
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon
const RecipeStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Recipes</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <ChefHat className="w-8 h-8 text-purple-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Active</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
                </div>
                <ToggleRight className="w-8 h-8 text-emerald-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Avg Cost</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">${stats.avgCost.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-amber-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Avg Ingredients</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{stats.avgIngredients}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
            </div>
        </div>
    </div>
);

interface MenuItem { id: number; name: string; price: number; }
interface Ingredient { id: number; name: string; unit: string; cost_per_unit: number; }
interface RecipeIngredient { id?: number; ingredient_id: number; quantity: number; notes?: string; }
interface Recipe {
    id: number; menu_item_id?: number; menu_item?: MenuItem; name: string; description?: string;
    instructions?: string; prep_time_minutes?: number; cook_time_minutes?: number; servings: number;
    total_cost: number; is_active: boolean; ingredients?: RecipeIngredient[]; created_at: string;
}

export default function Recipes() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [menuItemFilter, setMenuItemFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openCosting, setOpenCosting] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [costingData, setCostingData] = useState<any>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        menu_item_id: '', name: '', description: '', instructions: '',
        prep_time_minutes: '', cook_time_minutes: '', servings: '1', is_active: true,
        ingredients: [] as RecipeIngredient[]
    });

    // Fetch Data
    const { data: recipes, isLoading } = useQuery({
        queryKey: ['recipes', page, search, statusFilter, menuItemFilter],
        queryFn: () => {
            let url = `/api/recipes?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            if (menuItemFilter !== 'all') url += `&menu_item_id=${menuItemFilter}`;
            return apiGet(url);
        }
    });

    const { data: ingredients } = useQuery({ queryKey: ['ingredients'], queryFn: () => apiGet('/api/admin/ingredients') });
    const { data: menuItems } = useQuery({ queryKey: ['menu-items'], queryFn: () => apiGet('/api/menu-items') });
    const { data: statsData } = useQuery({ queryKey: ['recipes-stats'], queryFn: () => apiGet('/api/admin/recipes-stats') });

    const recipeList = useMemo(() => recipes?.data || [], [recipes]);

    const stats = useMemo(() => ({
        total: statsData?.total || 0,
        active: statsData?.active || 0,
        avgCost: statsData?.avg_cost || 0,
        avgIngredients: statsData?.avg_ingredients || 0
    }), [statsData]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/recipes', data),
        onSuccess: () => { toastSuccess('Recipe created'); closeModal(); qc.invalidateQueries({ queryKey: ['recipes'] }); qc.invalidateQueries({ queryKey: ['recipes-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/recipes/${id}`, data),
        onSuccess: () => { toastSuccess('Recipe updated'); closeModal(); qc.invalidateQueries({ queryKey: ['recipes'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/recipes/${id}`),
        onSuccess: () => { toastSuccess('Recipe deleted'); qc.invalidateQueries({ queryKey: ['recipes'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const duplicateMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/recipes/${id}/duplicate`, {}),
        onSuccess: () => { toastSuccess('Recipe duplicated'); qc.invalidateQueries({ queryKey: ['recipes'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) => apiPut(`/api/recipes/${id}`, { is_active }),
        onSuccess: () => { toastSuccess('Status updated'); qc.invalidateQueries({ queryKey: ['recipes'] }); }
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingRecipe(null);
        setFormData({
            menu_item_id: '', name: '', description: '', instructions: '',
            prep_time_minutes: '', cook_time_minutes: '', servings: '1', is_active: true,
            ingredients: []
        });
    };

    const handleEdit = (recipe: Recipe) => {
        setEditingRecipe(recipe);
        setFormData({
            menu_item_id: recipe.menu_item_id?.toString() || '',
            name: recipe.name,
            description: recipe.description || '',
            instructions: recipe.instructions || '',
            prep_time_minutes: recipe.prep_time_minutes?.toString() || '',
            cook_time_minutes: recipe.cook_time_minutes?.toString() || '',
            servings: recipe.servings.toString(),
            is_active: recipe.is_active,
            ingredients: recipe.ingredients || []
        });
        setOpenEdit(true);
    };

    const handleViewCosting = async (recipe: Recipe) => {
        try {
            const data = await apiGet(`/api/recipes/${recipe.id}/costing`);
            setCostingData(data);
            setOpenCosting(true);
        } catch (error) {
            toastError('Failed to load costing data');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.ingredients.length === 0) return toastError('Add at least one ingredient');
        const data = {
            ...formData,
            menu_item_id: formData.menu_item_id ? parseInt(formData.menu_item_id) : null,
            prep_time_minutes: formData.prep_time_minutes ? parseInt(formData.prep_time_minutes) : null,
            cook_time_minutes: formData.cook_time_minutes ? parseInt(formData.cook_time_minutes) : null,
            servings: parseInt(formData.servings)
        };
        if (editingRecipe) updateMutation.mutate({ id: editingRecipe.id, data });
        else createMutation.mutate(data);
    };

    const addIngredient = () => setFormData({ ...formData, ingredients: [...formData.ingredients, { ingredient_id: 0, quantity: 1 }] });
    const removeIngredient = (index: number) => setFormData({ ...formData, ingredients: formData.ingredients.filter((_, i) => i !== index) });
    const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const calculateTotalCost = () => {
        return formData.ingredients.reduce((sum, ing) => {
            const ingredient = ingredients?.data?.find((i: Ingredient) => i.id === ing.ingredient_id);
            return sum + (ing.quantity * (ingredient?.cost_per_unit || 0));
        }, 0);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Recipes</h1>
                        <p className="text-slate-400 mt-1">Menu items preparation and costing</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Create Recipe
                    </Button>
                </div>

                <RecipeStatsRibbon stats={stats} />

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search recipes..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select value={menuItemFilter} onChange={(e) => setMenuItemFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Menu Items</option>
                            {menuItems?.data?.map((item: MenuItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-3">Recipe Name</div>
                        <div className="col-span-2">Menu Item</div>
                        <div className="col-span-2">Cost / Serving</div>
                        <div className="col-span-2">Time</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : recipeList.map((recipe: Recipe) => (
                            <motion.div key={recipe.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                <div className="col-span-3">
                                    <div className="font-medium text-white flex items-center gap-2">
                                        <ChefHat size={14} className="text-purple-400" /> {recipe.name}
                                    </div>
                                    <div className="text-xs text-gray-500">{recipe.ingredients?.length || 0} ingredients • {recipe.servings} servings</div>
                                </div>
                                <div className="col-span-2 text-sm text-gray-300">{recipe.menu_item?.name || '-'}</div>
                                <div className="col-span-2">
                                    <div className="text-white font-medium">${(recipe.total_cost / recipe.servings).toFixed(2)}</div>
                                    <div className="text-gray-500 text-xs">Total: ${recipe.total_cost.toFixed(2)}</div>
                                </div>
                                <div className="col-span-2 text-sm text-gray-400 flex items-center gap-1">
                                    <Clock size={12} /> {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}m
                                </div>
                                <div className="col-span-1">
                                    <button onClick={() => toggleStatusMutation.mutate({ id: recipe.id, is_active: !recipe.is_active })}>
                                        {recipe.is_active ? <ToggleRight className="text-emerald-400 w-6 h-6" /> : <ToggleLeft className="text-gray-500 w-6 h-6" />}
                                    </button>
                                </div>
                                <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleViewCosting(recipe)} className="h-8 w-8 p-0 border-white/10" title="Costing"><TrendingUp size={14} /></Button>
                                    <Button size="sm" variant="secondary" onClick={() => duplicateMutation.mutate(recipe.id)} className="h-8 w-8 p-0 border-white/10" title="Duplicate"><Copy size={14} /></Button>
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(recipe)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => confirm('Delete?') && deleteMutation.mutate(recipe.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingRecipe ? 'Edit Recipe' : 'New Recipe'} size="xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-slate-950 border-white/10" />
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Menu Item</label>
                            <select value={formData.menu_item_id} onChange={(e) => setFormData({ ...formData, menu_item_id: e.target.value })}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                                <option value="">None</option>
                                {menuItems?.data?.map((item: MenuItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Servings" type="number" min="1" value={formData.servings} onChange={(e) => setFormData({ ...formData, servings: e.target.value })} required className="bg-slate-950 border-white/10" />
                        <Input label="Prep Time (m)" type="number" min="0" value={formData.prep_time_minutes} onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })} className="bg-slate-950 border-white/10" />
                        <Input label="Cook Time (m)" type="number" min="0" value={formData.cook_time_minutes} onChange={(e) => setFormData({ ...formData, cook_time_minutes: e.target.value })} className="bg-slate-950 border-white/10" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Ingredients</label>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {formData.ingredients.map((ing, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <select value={ing.ingredient_id} onChange={(e) => updateIngredient(i, 'ingredient_id', parseInt(e.target.value))}
                                        className="flex-1 bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-sm">
                                        <option value={0}>Select Ingredient</option>
                                        {ingredients?.data?.map((ingItem: Ingredient) => <option key={ingItem.id} value={ingItem.id}>{ingItem.name} ({ingItem.unit})</option>)}
                                    </select>
                                    <Input type="number" step="0.01" value={ing.quantity} onChange={(e) => updateIngredient(i, 'quantity', parseFloat(e.target.value))} className="w-20 bg-slate-950 border-white/10 text-sm" placeholder="Qty" />
                                    <Button type="button" size="sm" variant="danger" onClick={() => removeIngredient(i)} className="h-8 w-8 p-0"><Trash2 size={14} /></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" size="sm" onClick={addIngredient} className="w-full border-dashed border-white/20 hover:bg-white/5 mt-2">+ Add Ingredient</Button>
                        <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                            <span className="text-gray-400">Total Cost: <span className="text-white font-bold">${calculateTotalCost().toFixed(2)}</span></span>
                            <span className="text-gray-400">Per Serving: <span className="text-green-400 font-bold">${(calculateTotalCost() / parseInt(formData.servings || '1')).toFixed(2)}</span></span>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Save</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={openCosting} onClose={() => setOpenCosting(false)} title="Costing Breakdown" size="lg">
                {costingData && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-white/5 p-3 rounded text-center"><div className="text-xs text-gray-400">Total</div><div className="text-xl font-bold text-white">${costingData.total_cost?.toFixed(2)}</div></div>
                            <div className="bg-white/5 p-3 rounded text-center"><div className="text-xs text-gray-400">Servings</div><div className="text-xl font-bold text-white">{costingData.servings}</div></div>
                            <div className="bg-white/5 p-3 rounded text-center"><div className="text-xs text-gray-400">Per Serving</div><div className="text-xl font-bold text-green-400">${costingData.cost_per_serving?.toFixed(2)}</div></div>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {costingData.breakdown?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-2 border-b border-white/5 text-sm">
                                    <div>
                                        <div className="text-white">{item.ingredient_name}</div>
                                        <div className="text-xs text-gray-500">{item.quantity} {item.unit} × ${item.cost_per_unit}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-medium">${item.total_cost.toFixed(2)}</div>
                                        <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button onClick={() => setOpenCosting(false)} className="w-full mt-4">Close</Button>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
