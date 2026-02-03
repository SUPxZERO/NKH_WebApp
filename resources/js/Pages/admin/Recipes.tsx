import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, Copy, ChefHat, Clock,
    DollarSign, Users, FileText, ToggleLeft, ToggleRight, TrendingUp,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
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
        rose: { gradient: 'from-rose-500/20 to-red-500/10', iconBg: 'bg-gradient-to-br from-rose-500 to-red-600', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', shadow: 'shadow-rose-500/20' },
    };
    const styles = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[110px] sm:min-w-0",
                `bg-gradient-to-br ${styles.gradient}`,
                styles.border,
                `shadow-lg ${styles.shadow}`
            )}
        >
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 transform translate-x-8 -translate-y-8">
                <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
            </div>
            <div className="relative p-3 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">{title}</p>
                        <p className={cn("text-xl sm:text-3xl font-bold", styles.text)}>{value}</p>
                        {subtext && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">{subtext}</p>}
                    </div>
                    <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

interface MenuItem { id: number; name: string; price: number; }
interface Ingredient { id: number; name: string; unit: string; cost_per_unit: number; }
interface RecipeIngredient { id?: number; ingredient_id: number; quantity: number; notes?: string; ingredient?: Ingredient; }
interface Recipe {
    id: number; menu_item_id?: number; menu_item?: MenuItem; name: string; description?: string;
    instructions?: string; prep_time_minutes?: number; cook_time_minutes?: number; servings: number;
    total_cost: string | number; is_active: boolean; ingredients?: RecipeIngredient[]; created_at: string;
}

export default function Recipes() {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [menuItemFilter, setMenuItemFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openCosting, setOpenCosting] = useState(false);
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
            let url = `/api/admin/recipes?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            if (menuItemFilter !== 'all') url += `&menu_item_id=${menuItemFilter}`;
            return apiGet(url);
        }
    });

    const { data: ingredients } = useQuery({ queryKey: ['ingredients-all'], queryFn: () => apiGet('/api/admin/ingredients?per_page=100') });
    const { data: menuItems } = useQuery({ queryKey: ['menu-items-all'], queryFn: () => apiGet('/api/menu-items?per_page=100') });
    const { data: statsData } = useQuery({ queryKey: ['recipes-stats'], queryFn: () => apiGet('/api/admin/recipes-stats') });

    const recipeList = useMemo(() => recipes?.data || [], [recipes]);
    const paginationMeta = useMemo(() => recipes?.meta || { current_page: 1, last_page: 1, total: 0 }, [recipes]);

    const stats = useMemo(() => ({
        total: statsData?.total || 0,
        active: statsData?.active || 0,
        avgCost: statsData?.avg_cost || 0,
        avgIngredients: statsData?.avg_ingredients || 0
    }), [statsData]);

    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/recipes', data),
        onSuccess: () => { toastSuccess('Recipe created'); closeModal(); qc.invalidateQueries({ queryKey: ['recipes'] }); qc.invalidateQueries({ queryKey: ['recipes-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/recipes/${id}`, data),
        onSuccess: () => { toastSuccess('Recipe updated'); closeModal(); qc.invalidateQueries({ queryKey: ['recipes'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/recipes/${id}`),
        onSuccess: () => { toastSuccess('Recipe deleted'); qc.invalidateQueries({ queryKey: ['recipes'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const duplicateMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/admin/recipes/${id}/duplicate`, {}),
        onSuccess: () => { toastSuccess('Recipe duplicated'); qc.invalidateQueries({ queryKey: ['recipes'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) => apiPut(`/api/admin/recipes/${id}`, { is_active }),
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
            const data = await apiGet(`/api/admin/recipes/${recipe.id}/costing`);
            setCostingData(data);
            setOpenCosting(true);
        } catch (error) {
            toastError('Failed to load costing data');
            // Mock data if API fails for demo
            setCostingData({
                total_cost: Number(recipe.total_cost),
                servings: recipe.servings,
                cost_per_serving: Number(recipe.total_cost) / recipe.servings,
                breakdown: recipe.ingredients?.map(i => ({
                    ingredient_name: i.ingredient?.name || `Ingredient #${i.ingredient_id}`,
                    quantity: i.quantity,
                    unit: 'units',
                    cost_per_unit: 5,
                    total_cost: i.quantity * 5,
                    percentage: 25
                }))
            });
            setOpenCosting(true);
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
            const ingredient = ingredients?.data?.find((i: any) => i.id === ing.ingredient_id);
            const costPerUnit = parseFloat(String(ingredient?.cost_per_unit)) || 0;
            return sum + (ing.quantity * costPerUnit);
        }, 0);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 transition-colors relative overflow-hidden">
                {/* Decorative Background - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 w-full mx-auto space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3"
                            >
                                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                                <span className="truncate">{t('admin.recipes.title')}</span>
                            </motion.h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-2 hidden sm:block">{t('admin.recipes.subtitle')}</p>
                        </div>
                        <Button
                            onClick={() => { closeModal(); setOpenCreate(true); }}
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 text-xs sm:text-sm px-3 sm:px-4 h-9 sm:h-10 flex-shrink-0"
                        >
                            <Plus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">{t('admin.recipes.create_recipe')}</span>
                        </Button>
                    </div>

                    {/* Stats Ribbon - Horizontal scroll on mobile */}
                    <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
                        <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
                            <StatCard title={t('admin.recipes.stats.total')} value={stats.total} icon={ChefHat} color="purple" index={0} />
                            <StatCard title={t('admin.recipes.stats.active')} value={stats.active} icon={CheckCircle} color="emerald" index={1} />
                            <StatCard title={t('admin.recipes.stats.avg_cost')} value={`$${stats.avgCost.toFixed(2)}`} icon={DollarSign} color="amber" index={2} />
                            <StatCard title={t('admin.recipes.stats.avg_items')} value={stats.avgIngredients.toFixed(1)} icon={FileText} color="blue" index={3} />
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
                                    className="pl-9 sm:pl-10 h-10 text-sm bg-background/50 border-border/50 focus:border-purple-500 text-foreground" />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-background/50 border border-border/50 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none transition-all">
                                <option value="all">{t('admin.recipes.filters.all')}</option>
                                <option value="active">{t('admin.recipes.filters.active')}</option>
                                <option value="inactive">{t('admin.recipes.filters.inactive')}</option>
                            </select>
                            <select value={menuItemFilter} onChange={(e) => setMenuItemFilter(e.target.value)}
                                className="hidden sm:block bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-sm text-foreground focus:border-purple-500 outline-none transition-all">
                                <option value="all">{t('admin.recipes.filters.all_menu_items')}</option>
                                {menuItems?.data?.map((item: MenuItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
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
                        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-purple-500/10">
                            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.recipes.table.recipe_name')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.recipes.table.menu_item')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.recipes.table.cost_serving')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.recipes.table.time')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.recipes.table.status')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.recipes.table.actions')}</div>
                        </div>

                        <div className="divide-y divide-border/30">
                            {isLoading ? (
                                <div className="p-8 sm:p-12 text-center text-muted-foreground text-sm">Loading...</div>
                            ) : recipeList.length === 0 ? (
                                <div className="p-8 sm:p-12 text-center">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                                        <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">{t('admin.recipes.table.empty_title')}</p>
                                </div>
                            ) : recipeList.map((recipe: Recipe, idx: number) => {
                                const recipeName = recipe.name || recipe.menu_item?.name || `Recipe #${recipe.id}`;
                                const servings = Number(recipe.servings) || 1;
                                const totalCost = parseFloat(String(recipe.total_cost)) || 0;
                                const costPerServing = servings > 0 ? totalCost / servings : 0;

                                return (
                                    <motion.div
                                        key={recipe.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="p-3 sm:p-4 hover:bg-purple-500/5 transition-all"
                                    >
                                        {/* Mobile Layout */}
                                        <div className="lg:hidden">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center text-purple-600 flex-shrink-0">
                                                    <ChefHat size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="font-medium text-foreground text-sm truncate">{recipeName}</div>
                                                        <span className="text-sm font-bold text-emerald-500 flex-shrink-0">${costPerServing.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                        <span>{recipe.ingredients?.length || 0} items</span>
                                                        <span className="flex items-center gap-1"><Clock size={10} />{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min</span>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", recipe.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                                                <button onClick={() => toggleStatusMutation.mutate({ id: recipe.id, is_active: !recipe.is_active })} className="transition-transform active:scale-95">
                                                    {recipe.is_active
                                                        ? <ToggleRight className="text-emerald-500 w-6 h-6" />
                                                        : <ToggleLeft className="text-muted-foreground w-6 h-6" />
                                                    }
                                                </button>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleViewCosting(recipe)} className="p-2 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500"><TrendingUp size={16} /></button>
                                                    <button onClick={() => duplicateMutation.mutate(recipe.id)} className="p-2 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500"><Copy size={16} /></button>
                                                    <button onClick={() => handleEdit(recipe)} className="p-2 rounded-lg hover:bg-purple-500/10 text-muted-foreground hover:text-purple-500"><Edit size={16} /></button>
                                                    <button onClick={() => confirm('Delete recipe?') && deleteMutation.mutate(recipe.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Desktop Layout */}
                                        <div className="hidden lg:grid grid-cols-12 gap-4 items-center group">
                                            <div className="col-span-3">
                                                <div className="font-medium text-foreground flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-purple-600">
                                                        <ChefHat size={16} />
                                                    </div>
                                                    {recipeName}
                                                </div>
                                                <div className="text-xs text-muted-foreground ml-10">{recipe.ingredients?.length || 0} ingredients • {servings} servings</div>
                                            </div>
                                            <div className="col-span-2 text-sm text-foreground">{recipe.menu_item?.name || '-'}</div>
                                            <div className="col-span-2">
                                                <div className="text-foreground font-bold flex items-center gap-1">
                                                    ${costPerServing.toFixed(2)}
                                                    {recipe.menu_item && (
                                                        <span className={cn("text-xs font-normal", (recipe.menu_item.price > costPerServing) ? "text-emerald-500" : "text-red-500")}>
                                                            / ${(Number(recipe.menu_item.price) - costPerServing).toFixed(2)} profit
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-muted-foreground text-xs">Batch: ${totalCost.toFixed(2)}</div>
                                            </div>
                                            <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock size={12} /> {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min
                                            </div>
                                            <div className="col-span-1">
                                                <button onClick={() => toggleStatusMutation.mutate({ id: recipe.id, is_active: !recipe.is_active })} className="transition-transform active:scale-95">
                                                    {recipe.is_active
                                                        ? <ToggleRight className="text-emerald-500 w-8 h-8" />
                                                        : <ToggleLeft className="text-muted-foreground w-8 h-8" />
                                                    }
                                                </button>
                                            </div>
                                            <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="ghost" onClick={() => handleViewCosting(recipe)} className="h-8 w-8 p-0 hover:text-emerald-600" title="Costing"><TrendingUp size={16} /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => duplicateMutation.mutate(recipe.id)} className="h-8 w-8 p-0 hover:text-blue-500" title="Duplicate"><Copy size={16} /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(recipe)} className="h-8 w-8 p-0 hover:text-purple-500"><Edit size={16} /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => confirm('Delete recipe?') && deleteMutation.mutate(recipe.id)} className="h-8 w-8 p-0 hover:text-red-500"><Trash2 size={16} /></Button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Pagination */}
                    {paginationMeta.last_page > 1 && (
                        <div className="flex items-center justify-between gap-2 px-1">
                            <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                                {((paginationMeta.current_page - 1) * perPage) + 1}-{Math.min(paginationMeta.current_page * perPage, paginationMeta.total)} of {paginationMeta.total}
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="border-border h-9 px-3">Prev</Button>
                                <span className="text-sm font-medium text-foreground px-3 py-2 rounded-lg bg-secondary border border-border sm:hidden">
                                    {page}/{paginationMeta.last_page}
                                </span>
                                <Button size="sm" variant="secondary" onClick={() => setPage(p => Math.min(paginationMeta.last_page, p + 1))} disabled={page === paginationMeta.last_page} className="border-border h-9 px-3">Next</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create/Edit Modal */}
                <Modal open={openCreate || openEdit} onClose={closeModal} title={editingRecipe ? t('admin.recipes.edit_recipe') : t('admin.recipes.create_recipe')} size="xl">
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <Input label={t('admin.recipes.form.recipe_name') as string} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Signature Burger Sauce" />
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">{t('admin.recipes.form.linked_menu_item')}</label>
                                <select value={formData.menu_item_id} onChange={(e) => setFormData({ ...formData, menu_item_id: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg sm:rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-purple-500/20 outline-none transition-all h-10 sm:h-11">
                                    <option value="">{t('admin.recipes.form.none_internal')}</option>
                                    {menuItems?.data?.map((item: MenuItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <Input label={t('admin.recipes.form.servings') as string} type="number" min="1" value={formData.servings} onChange={(e) => setFormData({ ...formData, servings: e.target.value })} required />
                            <Input label={t('admin.recipes.form.prep_min') as string} type="number" min="0" value={formData.prep_time_minutes} onChange={(e) => setFormData({ ...formData, prep_time_minutes: e.target.value })} />
                            <Input label={t('admin.recipes.form.cook_min') as string} type="number" min="0" value={formData.cook_time_minutes} onChange={(e) => setFormData({ ...formData, cook_time_minutes: e.target.value })} />
                        </div>

                        <div className="border border-border/50 rounded-lg sm:rounded-xl p-3 sm:p-4 bg-secondary/20">
                            <div className="flex justify-between items-center mb-2 sm:mb-3">
                                <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wider text-muted-foreground"><ChefHat size={14} className="inline mr-1" /> {t('admin.recipes.form.ingredients')}</h4>
                                <Button type="button" size="sm" onClick={addIngredient} className="bg-purple-600 text-white h-8 px-2 sm:px-3 text-xs"><Plus className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">{t('admin.recipes.form.add')}</span></Button>
                            </div>

                            <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                                {formData.ingredients.map((ing, i) => (
                                    <div key={i} className="flex gap-2 items-center bg-background p-2 rounded-lg border border-border/50 shadow-sm">
                                        <select value={ing.ingredient_id} onChange={(e) => updateIngredient(i, 'ingredient_id', parseInt(e.target.value))}
                                            className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm font-medium min-w-0">
                                            <option value={0}>{t('admin.recipes.form.select')}</option>
                                            {ingredients?.data?.map((ingItem: any) => <option key={ingItem.id} value={ingItem.id}>{ingItem.name}</option>)}
                                        </select>
                                        <Input type="number" step="0.01" value={ing.quantity} onChange={(e) => updateIngredient(i, 'quantity', parseFloat(e.target.value))} className="w-16 sm:w-20 text-xs sm:text-sm bg-transparent border-none text-right" placeholder={t('admin.recipes.form.qty') as string} />
                                        <button type="button" onClick={() => removeIngredient(i)} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                {formData.ingredients.length === 0 && <p className="text-center text-muted-foreground text-xs sm:text-sm italic py-3 sm:py-4">{t('admin.recipes.form.no_ingredients')}</p>}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm pt-3 sm:pt-4 mt-2 border-t border-border/50">
                                <span className="text-muted-foreground">{t('admin.recipes.form.total_batch')}: <span className="text-foreground font-bold">${calculateTotalCost().toFixed(2)}</span></span>
                                <span className="text-muted-foreground">{t('admin.recipes.form.per_serving')}: <span className="text-emerald-500 font-bold">${(calculateTotalCost() / parseInt(formData.servings || '1')).toFixed(2)}</span></span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3 sm:pt-4">
                            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11">{t('admin.recipes.form.cancel')}</Button>
                            <Button type="submit" className="flex-1 h-10 sm:h-11 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">{t('admin.recipes.form.save')}</Button>
                        </div>
                    </form>
                </Modal>

                <Modal open={openCosting} onClose={() => setOpenCosting(false)} title={t('admin.recipes.costing.title')} size="lg">
                    {costingData && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                <div className="bg-secondary/30 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-border/50 text-center">
                                    <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">{t('admin.recipes.costing.total')}</div>
                                    <div className="text-lg sm:text-2xl font-bold text-foreground">${costingData.total_cost?.toFixed(2)}</div>
                                </div>
                                <div className="bg-secondary/30 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-border/50 text-center">
                                    <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">{t('admin.recipes.costing.serving')}</div>
                                    <div className="text-lg sm:text-2xl font-bold text-emerald-500">${costingData.cost_per_serving?.toFixed(2)}</div>
                                </div>
                                <div className="bg-secondary/30 p-2 sm:p-4 rounded-lg sm:rounded-xl border border-border/50 text-center">
                                    <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">{t('admin.recipes.costing.margin')}</div>
                                    <div className="text-lg sm:text-2xl font-bold text-blue-500">
                                        {((editingRecipe?.menu_item?.price || 0) - (costingData.cost_per_serving || 0) > 0)
                                            ? `${(((editingRecipe?.menu_item?.price || 0) - costingData.cost_per_serving) / (editingRecipe?.menu_item?.price || 1) * 100).toFixed(0)}%`
                                            : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl overflow-hidden">
                                <div className="text-sm font-semibold p-3 bg-muted/50 border-b border-border">{t('admin.recipes.costing.breakdown')}</div>
                                <div className="max-h-96 overflow-y-auto">
                                    {costingData.breakdown?.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center p-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors text-sm">
                                            <div>
                                                <div className="font-medium text-foreground">{item.ingredient_name}</div>
                                                <div className="text-xs text-muted-foreground">{item.quantity} {item.unit} × ${item.cost_per_unit}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-foreground">${item.total_cost.toFixed(2)}</div>
                                                <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}% {t('admin.recipes.costing.of_total')}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button onClick={() => setOpenCosting(false)} variant="secondary" className="w-full">{t('admin.recipes.costing.close')}</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
