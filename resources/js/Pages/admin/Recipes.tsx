import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Copy,
    ChefHat,
    Clock,
    DollarSign,
    Users,
    FileText,
    ToggleLeft,
    ToggleRight,
    TrendingUp
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface MenuItem {
    id: number;
    name: string;
}

interface Ingredient {
    id: number;
    name: string;
    unit: string;
    cost_per_unit?: number;
}

interface RecipeIngredient {
    id?: number;
    ingredient_id: number;
    ingredient?: Ingredient;
    quantity: number;
    notes?: string;
}

interface Recipe {
    id: number;
    menu_item_id?: number;
    menu_item?: MenuItem;
    name: string;
    description?: string;
    instructions?: string;
    prep_time_minutes?: number;
    cook_time_minutes?: number;
    servings: number;
    total_cost: number;
    is_active: boolean;
    ingredients?: RecipeIngredient[];
    created_at: string;
}

export default function Recipes() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [menuItemFilter, setMenuItemFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [openCosting, setOpenCosting] = React.useState(false);
    const [selectedRecipe, setSelectedRecipe] = React.useState<Recipe | null>(null);
    const [editingRecipe, setEditingRecipe] = React.useState<Recipe | null>(null);
    const [costingData, setCostingData] = React.useState<any>(null);
    const [error, setError] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    const [formData, setFormData] = React.useState({
        menu_item_id: '',
        name: '',
        description: '',
        instructions: '',
        prep_time_minutes: '',
        cook_time_minutes: '',
        servings: '1',
        is_active: true,
        ingredients: [] as RecipeIngredient[]
    });

    // Fetch recipes
    const { data: recipes, isLoading } = useQuery({
        queryKey: ['recipes', page, search, statusFilter, menuItemFilter],
        queryFn: () => {
            let url = `/api/recipes?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            if (menuItemFilter !== 'all') url += `&menu_item_id=${menuItemFilter}`;
            return apiGet(url);
        }
    });

    // Fetch ingredients
    const { data: ingredients } = useQuery({
        queryKey: ['ingredients'],
        queryFn: () => apiGet('/api/admin/ingredients')
    });

    // Fetch menu items
    const { data: menuItems } = useQuery({
        queryKey: ['menu-items'],
        queryFn: () => apiGet('/api/menu-items')
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['recipes-stats'],
        queryFn: () => apiGet('/api/admin/recipes-stats')
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/recipes', data),
        onSuccess: () => {
            toastSuccess('Recipe created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['recipes'] });
            qc.invalidateQueries({ queryKey: ['recipes-stats'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to create recipe')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/recipes/${id}`, data),
        onSuccess: () => {
            toastSuccess('Recipe updated successfully!');
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['recipes'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to update recipe')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/recipes/${id}`),
        onSuccess: () => {
            toastSuccess('Recipe deleted successfully!');
            qc.invalidateQueries({ queryKey: ['recipes'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to delete recipe')
    });

    const duplicateMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/recipes/${id}/duplicate`, {}),
        onSuccess: () => {
            toastSuccess('Recipe duplicated successfully!');
            qc.invalidateQueries({ queryKey: ['recipes'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to duplicate recipe')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) =>
            apiPut(`/api/recipes/${id}`, { is_active }),
        onSuccess: () => {
            toastSuccess('Recipe status updated!');
            qc.invalidateQueries({ queryKey: ['recipes'] });
        }
    });

    const resetForm = () => {
        setFormData({
            menu_item_id: '',
            name: '',
            description: '',
            instructions: '',
            prep_time_minutes: '',
            cook_time_minutes: '',
            servings: '1',
            is_active: true,
            ingredients: []
        });
        setEditingRecipe(null);
        setError('');
    };

    const handleCreate = () => {
        resetForm();
        setOpenCreate(true);
    };

    const handleEdit = (recipe: Recipe) => {
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
        setEditingRecipe(recipe);
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

    const addIngredient = () => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, { ingredient_id: 0, quantity: 1 }]
        });
    };

    const removeIngredient = (index: number) => {
        const newIngredients = formData.ingredients.filter((_, i) => i !== index);
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const updateIngredient = (index: number, field: keyof RecipeIngredient, value: any) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.ingredients.length === 0) {
            setError('Please add at least one ingredient');
            return;
        }

        const data = {
            ...formData,
            menu_item_id: formData.menu_item_id ? parseInt(formData.menu_item_id) : null,
            prep_time_minutes: formData.prep_time_minutes ? parseInt(formData.prep_time_minutes) : null,
            cook_time_minutes: formData.cook_time_minutes ? parseInt(formData.cook_time_minutes) : null,
            servings: parseInt(formData.servings)
        };

        if (editingRecipe) {
            updateMutation.mutate({ id: editingRecipe.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const totalCost = formData.ingredients.reduce((sum, ing) => {
        const ingredient = ingredients?.data?.find((i: Ingredient) => i.id === ing.ingredient_id);
        return sum + (ing.quantity * (ingredient?.cost_per_unit || 0));
    }, 0);

    const costPerServing = parseInt(formData.servings) > 0 ? totalCost / parseInt(formData.servings) : 0;

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
                                Recipes Management
                            </h1>
                            <p className="text-gray-400 mt-1">Manage menu recipes and ingredient costing</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Total Recipes</div>
                                <div className="text-xl font-bold text-white">{stats?.total || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Active</div>
                                <div className="text-xl font-bold text-green-400">{stats?.active || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Avg Ingredients</div>
                                <div className="text-xl font-bold text-blue-400">{stats?.avg_ingredients || 0}</div>
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Recipe
                        </Button>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search recipes..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Status</option>
                        <option value="active" className="text-black">Active</option>
                        <option value="inactive" className="text-black">Inactive</option>
                    </select>

                    <select value={menuItemFilter} onChange={(e) => setMenuItemFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Menu Items</option>
                        {menuItems?.data?.map((item: MenuItem) => (
                            <option key={item.id} value={item.id} className="text-black">{item.name}</option>
                        ))}
                    </select>

                    <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter('all'); setMenuItemFilter('all'); }}
                        className="border-white/20 hover:bg-white/10">Clear</Button>
                </motion.div>

                {/* Recipes Grid */}
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
                        recipes?.data?.map((recipe: Recipe, index: number) => (
                            <motion.div key={recipe.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}>
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                                                    <ChefHat className="w-4 h-4" />
                                                    {recipe.name}
                                                </h3>
                                                {recipe.menu_item && (
                                                    <p className="text-sm text-gray-400">→ {recipe.menu_item.name}</p>
                                                )}
                                            </div>
                                            <Badge className={recipe.is_active
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                                {recipe.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <Users className="w-4 h-4 text-gray-400" />
                                                <span>{recipe.servings} servings</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span>{recipe.ingredients?.length || 0} ingredients</span>
                                            </div>
                                            {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span>
                                                        {recipe.prep_time_minutes ? `${recipe.prep_time_minutes}m prep` : ''}
                                                        {recipe.prep_time_minutes && recipe.cook_time_minutes ? ' + ' : ''}
                                                        {recipe.cook_time_minutes ? `${recipe.cook_time_minutes}m cook` : ''}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-sm">
                                                <DollarSign className="w-4 h-4 text-green-400" />
                                                <span className="text-white font-semibold">${recipe.total_cost.toFixed(2)}</span>
                                                <span className="text-gray-400">
                                                    (${(recipe.total_cost / recipe.servings).toFixed(2)}/serving)
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex items-center justify-between mb-4">
                                            <button onClick={() => handleViewCosting(recipe)}
                                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                                                <TrendingUp className="w-4 h-4" />
                                                View Costing
                                            </button>
                                            <button onClick={() => toggleStatusMutation.mutate({ id: recipe.id, is_active: !recipe.is_active })}
                                                className="flex items-center gap-1">
                                                {recipe.is_active ? (
                                                    <ToggleRight className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => { setSelectedRecipe(recipe); setOpenView(true); }}
                                                className="flex-1 border-white/20 hover:bg-white/10">
                                                <Eye className="w-3 h-3 mr-1" />View
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(recipe)}
                                                className="flex-1 border-white/20 hover:bg-white/10">
                                                <Edit className="w-3 h-3 mr-1" />Edit
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => duplicateMutation.mutate(recipe.id)}
                                                className="border-white/20 hover:bg-white/10">
                                                <Copy className="w-3 h-3" />
                                            </Button>
                                            <Button size="sm" variant="danger"
                                                onClick={() => window.confirm('Delete this recipe?') && deleteMutation.mutate(recipe.id)}
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
                    title={editingRecipe ? 'Edit Recipe' : 'Create Recipe'} size="xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Recipe Name *</label>
                                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" placeholder="e.g., Classic Burger" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Link to Menu Item</label>
                                <select value={formData.menu_item_id} onChange={(e) => setFormData({ ...formData, menu_item_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">No menu item</option>
                                    {menuItems?.data?.map((item: MenuItem) => (
                                        <option key={item.id} value={item.id} className="bg-gray-800">{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Servings *</label>
                                <Input type="number" required min="1" value={formData.servings}
                                    onChange={(e) => setFormData({ ...formData, servings: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Prep Time (minutes)</label>
                                <Input type="number" min="0" value={formData.prep_time_minutes}
                                    onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Cook Time (minutes)</label>
                                <Input type="number" min="0" value={formData.cook_time_minutes}
                                    onChange={(e) => setFormData({ ...formData, cook_time_minutes: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={2} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Instructions</label>
                                <textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={4}
                                    placeholder="Step-by-step cooking instructions..." />
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-medium text-gray-300">Ingredients *</label>
                                <Button type="button" size="sm" onClick={addIngredient}
                                    className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-3 h-3 mr-1" />Add Ingredient
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {formData.ingredients.map((ing, index) => {
                                    const ingredient = ingredients?.data?.find((i: Ingredient) => i.id === ing.ingredient_id);
                                    const itemCost = ing.quantity * (ingredient?.cost_per_unit || 0);
                                    return (
                                        <div key={index} className="bg-white/5 p-3 rounded-lg border border-white/10 grid grid-cols-12 gap-2">
                                            <select required value={ing.ingredient_id} onChange={(e) => updateIngredient(index, 'ingredient_id', parseInt(e.target.value))}
                                                className="col-span-5 bg-white/10 border border-white/10 rounded px-2 py-1 text-white text-sm">
                                                <option value={0}>Select Ingredient</option>
                                                {ingredients?.data?.map((i: Ingredient) => (
                                                    <option key={i.id} value={i.id} className="bg-gray-800">{i.name}</option>
                                                ))}
                                            </select>
                                            <Input type="number" step="0.01" required min="0.01" placeholder="Qty" value={ing.quantity}
                                                onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value))}
                                                className="col-span-2 bg-white/10 border-white/10 text-white text-sm" />
                                            <div className="col-span-1 text-sm text-gray-400 flex items-center">
                                                {ingredient?.unit || '-'}
                                            </div>
                                            <div className="col-span-3 text-sm text-green-400 flex items-center font-semibold">
                                                ${itemCost.toFixed(2)}
                                            </div>
                                            <button type="button" onClick={() => removeIngredient(index)}
                                                className="col-span-1 text-red-400 hover:text-red-300">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>

                            {formData.ingredients.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 px-4 py-2 rounded-lg">
                                        <span className="text-sm text-gray-400">Total Cost:</span>
                                        <span className="ml-2 text-lg font-bold text-white">${totalCost.toFixed(2)}</span>
                                    </div>
                                    <div className="bg-white/10 px-4 py-2 rounded-lg">
                                        <span className="text-sm text-gray-400">Per Serving:</span>
                                        <span className="ml-2 text-lg font-bold text-green-400">${costPerServing.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" />
                            <span className="text-sm text-gray-300">Active</span>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1">{editingRecipe ? 'Update' : 'Create'} Recipe</Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal open={openView} onClose={() => { setOpenView(false); setSelectedRecipe(null); }}
                    title="Recipe Details" size="lg">
                    {selectedRecipe && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm text-gray-400">Recipe Name</h3>
                                    <p className="text-white font-semibold">{selectedRecipe.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Servings</h3>
                                    <p className="text-white">{selectedRecipe.servings}</p>
                                </div>
                                {selectedRecipe.menu_item && (
                                    <div className="col-span-2">
                                        <h3 className="text-sm text-gray-400">Menu Item</h3>
                                        <p className="text-white">{selectedRecipe.menu_item.name}</p>
                                    </div>
                                )}
                            </div>

                            {selectedRecipe.description && (
                                <div>
                                    <h3 className="text-sm text-gray-400 mb-2">Description</h3>
                                    <p className="text-white text-sm">{selectedRecipe.description}</p>
                                </div>
                            )}

                            {selectedRecipe.instructions && (
                                <div>
                                    <h3 className="text-sm text-gray-400 mb-2">Instructions</h3>
                                    <p className="text-white text-sm whitespace-pre-line">{selectedRecipe.instructions}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Ingredients</h3>
                                <div className="space-y-2">
                                    {selectedRecipe.ingredients?.map((ing, i) => (
                                        <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10 flex justify-between">
                                            <span className="text-white">{ing.ingredient?.name}</span>
                                            <span className="text-gray-400">{ing.quantity} {ing.ingredient?.unit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button variant="secondary" onClick={() => { setOpenView(false); setSelectedRecipe(null); }}
                                className="w-full border-white/20 hover:bg-white/10">Close</Button>
                        </div>
                    )}
                </Modal>

                {/* Costing Modal */}
                <Modal open={openCosting} onClose={() => { setOpenCosting(false); setCostingData(null); }}
                    title="Recipe Costing Breakdown" size="lg">
                    {costingData && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white/10 p-4 rounded-lg">
                                    <div className="text-sm text-gray-400">Total Cost</div>
                                    <div className="text-2xl font-bold text-white">${costingData.total_cost?.toFixed(2)}</div>
                                </div>
                                <div className="bg-white/10 p-4 rounded-lg">
                                    <div className="text-sm text-gray-400">Servings</div>
                                    <div className="text-2xl font-bold text-white">{costingData.servings}</div>
                                </div>
                                <div className="bg-white/10 p-4 rounded-lg">
                                    <div className="text-sm text-gray-400">Per Serving</div>
                                    <div className="text-2xl font-bold text-green-400">${costingData.cost_per_serving?.toFixed(2)}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Cost Breakdown</h3>
                                <div className="space-y-2">
                                    {costingData.breakdown?.map((item: any, i: number) => (
                                        <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-white font-medium">{item.ingredient_name}</span>
                                                <span className="text-green-400 font-semibold">${item.total_cost.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-400">{item.quantity} {item.unit} × ${item.cost_per_unit.toFixed(2)}</span>
                                                <span className="text-gray-400">{item.percentage.toFixed(1)}% of total</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button variant="secondary" onClick={() => { setOpenCosting(false); setCostingData(null); }}
                                className="w-full border-white/20 hover:bg-white/10">Close</Button>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
