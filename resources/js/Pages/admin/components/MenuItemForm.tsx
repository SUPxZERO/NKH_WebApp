import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/app/libs/apiClient';
import { MenuItem, Category } from '@/app/types/domain';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import ImageUploader from '@/app/components/ui/ImageUploader';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import {
    LayoutDashboard,
    Utensils,
    Box,
    HeartPulse,
    Info,
    Tags,
    Leaf,
    AlertTriangle,
    Plus,
    X,
    Flame
} from 'lucide-react';

interface MenuItemFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingItem: MenuItem | null;
    categories: Category[];
    locationId: number;
}

const TabButton = ({ isActive, onClick, icon: Icon, label }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-4 py-2 border-b-2 transition-colors font-medium text-sm",
            isActive
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
        )}
    >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const TagInput = ({ label, values, onChange, placeholder }: any) => {
    const [input, setInput] = useState('');

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            if (!values.includes(input.trim())) {
                onChange([...values, input.trim()]);
            }
            setInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        onChange(values.filter((tag: string) => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">{label}</label>
            <div className="flex flex-wrap gap-2 p-2 bg-secondary/30 rounded-lg min-h-[44px] border border-border">
                {values.map((tag: string) => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-background rounded-md text-xs border border-border shadow-sm">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-muted-foreground hover:text-red-500">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={values.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground/50"
                />
            </div>
            <p className="text-xs text-muted-foreground">Press Enter to add</p>
        </div>
    );
};

export const MenuItemForm: React.FC<MenuItemFormProps> = ({
    isOpen,
    onClose,
    editingItem,
    categories,
    locationId
}) => {
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState<'general' | 'prep' | 'inventory' | 'nutrition'>('general');
    const [image, setImage] = useState<File | null>(null);

    const initialFormState = {
        name: '', description: '', slug: '', sku: '', price: '', cost: '',
        category_id: '', is_popular: false, is_active: true, display_order: 0,
        is_featured: false, badge: '',
        // Prep
        prep_time: '', cook_time: '', serving_size: '1 portion', spice_level: 0,
        // Nutrition
        calories: '',
        nutrition: { protein: '', carbs: '', fat: '', fiber: '', sugar: '', sodium: '' },
        ingredients: [] as string[],
        allergens: [] as string[],
        dietary_tags: [] as string[],
        // Inventory
        availability_status: 'available', availability_note: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        if (editingItem) {
            setFormData({
                name: editingItem.name || '',
                description: editingItem.description || '',
                slug: editingItem.slug,
                sku: editingItem.sku || '',
                price: editingItem.price.toString(),
                cost: editingItem.cost?.toString() || '',
                category_id: editingItem.category_id?.toString() || '',
                is_popular: editingItem.is_popular,
                is_active: editingItem.is_active,
                display_order: editingItem.display_order,
                is_featured: editingItem.is_featured || false,
                badge: editingItem.badge || '',
                prep_time: editingItem.prep_time?.toString() || '',
                cook_time: editingItem.cook_time?.toString() || '',
                serving_size: editingItem.serving_size || '1 portion',
                spice_level: editingItem.spice_level || 0,
                calories: editingItem.calories?.toString() || '',
                nutrition: {
                    protein: editingItem.nutrition?.protein?.toString() || '',
                    carbs: editingItem.nutrition?.carbs?.toString() || '',
                    fat: editingItem.nutrition?.fat?.toString() || '',
                    fiber: editingItem.nutrition?.fiber?.toString() || '',
                    sugar: editingItem.nutrition?.sugar?.toString() || '',
                    sodium: editingItem.nutrition?.sodium?.toString() || ''
                },
                ingredients: Array.isArray(editingItem.ingredients) ? editingItem.ingredients : [],
                allergens: Array.isArray(editingItem.allergens) ? editingItem.allergens : [],
                dietary_tags: Array.isArray(editingItem.dietary_tags) ? editingItem.dietary_tags : [],
                availability_status: editingItem.availability_status || 'available',
                availability_note: editingItem.availability_note || ''
            });
        } else {
            setFormData(initialFormState);
        }
        setImage(null);
        setActiveTab('general');
    }, [editingItem, isOpen]);

    const createMutation = useMutation({
        mutationFn: (data: FormData) => apiPost('/menu-items', data),
        onSuccess: () => { toastSuccess('Item created'); onClose(); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData }) => apiPost(`/menu-items/${id}?_method=PUT`, data),
        onSuccess: () => { toastSuccess('Item updated'); onClose(); qc.invalidateQueries({ queryKey: ['menu-items'] }); },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();

        // Basic fields
        Object.entries(formData).forEach(([key, val]) => {
            if (['nutrition', 'ingredients', 'allergens', 'dietary_tags'].includes(key)) return; // Handle explicitly
            if (key === 'is_popular' || key === 'is_active' || key === 'is_featured') data.append(key, val ? '1' : '0');
            else if (key === 'category_id' && (val === '' || val === 'null' || val === undefined)) return;
            else if (val !== null && val !== undefined) data.append(key, String(val));
        });

        // JSON fields
        if (Object.keys(formData.nutrition).some(k => (formData.nutrition as any)[k])) {
            // Only send valid numbers
            const cleanNutrition: any = {};
            Object.entries(formData.nutrition).forEach(([k, v]) => {
                if (v) cleanNutrition[k] = parseFloat(v as string);
            });
            // Loop through the data to make sure it's an array
            Object.keys(cleanNutrition).map(item => Number(cleanNutrition[item]))
            // data.append('nutrition', JSON.stringify(cleanNutrition)); // Laravel handles array input better usually if form-data
            // Actually for form-data, sending arrays is tricky. Best to send individual fields or JSON string if backend decodes.
            // My backend store logic uses $data['nutrition'] from validated. The request validation says 'array'.
            // With FormData, best to structure as nutrition[protein]=10
            Object.entries(cleanNutrition).forEach(([k, v]) => {
                data.append(`nutrition[${k}]`, String(v));
            });
        }

        formData.ingredients.forEach((item, i) => data.append(`ingredients[${i}]`, item));
        formData.allergens.forEach((item, i) => data.append(`allergens[${i}]`, item));
        formData.dietary_tags.forEach((item, i) => data.append(`dietary_tags[${i}]`, item));

        data.append('location_id', String(locationId));
        if (image) data.append('image', image);

        if (editingItem) updateMutation.mutate({ id: editingItem.id, data });
        else createMutation.mutate(data);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? 'Edit Menu Item' : 'Create Menu Item'} className="max-w-4xl">
            <form onSubmit={handleSubmit} className="flex flex-col h-[80vh] sm:h-auto">
                {/* Tabs Header */}
                <div className="flex border-b border-border overflow-x-auto scrollbar-hide mb-4">
                    <TabButton isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={LayoutDashboard} label="General" />
                    <TabButton isActive={activeTab === 'prep'} onClick={() => setActiveTab('prep')} icon={Utensils} label="Preparation" />
                    <TabButton isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={Box} label="Inventory" />
                    <TabButton isActive={activeTab === 'nutrition'} onClick={() => setActiveTab('nutrition')} icon={HeartPulse} label="Nutrition & Health" />
                </div>

                {/* Tab Content - Scrollable area */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">

                    {/* GENERAL TAB */}
                    {activeTab === 'general' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                                <Input label="Slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-secondary/50 border border-border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none sm:h-24"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                        className="w-full h-10 sm:h-11 bg-secondary/50 border border-border rounded-lg sm:rounded-xl px-3 sm:px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    >
                                        <option value="">Select Category</option>
                                        {categories?.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name || cat.translations?.[0]?.name}</option>
                                        ))}
                                    </select>
                                    <div className="mt-4">
                                        <label className="block text-sm font-semibold text-foreground mb-2">Image</label>
                                        <ImageUploader onChange={(file) => setImage(file)} value={editingItem?.image_path || null} />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Price ($)" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required />
                                <Input label="Order Sort" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="flex flex-wrap gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded border-border text-primary focus:ring-primary/20" />
                                    <span className="text-sm font-medium">Active</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_popular} onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })} className="rounded border-border text-primary focus:ring-primary/20" />
                                    <span className="text-sm font-medium">Popular</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_featured} onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })} className="rounded border-border text-amber-500 focus:ring-amber-500/20" />
                                    <span className="text-sm font-medium">Featured</span>
                                </label>
                            </div>
                            {formData.is_featured && (
                                <Input label="Badge Text" value={formData.badge} onChange={(e) => setFormData({ ...formData, badge: e.target.value })} placeholder="e.g. Best Seller" />
                            )}
                        </div>
                    )}

                    {/* PREPARATION TAB */}
                    {activeTab === 'prep' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Prep Time (mins)" type="number" value={formData.prep_time} onChange={(e) => setFormData({ ...formData, prep_time: e.target.value })} />
                                <Input label="Cook Time (mins)" type="number" value={formData.cook_time} onChange={(e) => setFormData({ ...formData, cook_time: e.target.value })} />
                            </div>
                            <Input label="Serving Size" value={formData.serving_size} onChange={(e) => setFormData({ ...formData, serving_size: e.target.value })} placeholder="e.g. 1 bowl, 250g" />

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Spice Level (0-5)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="1"
                                        value={formData.spice_level}
                                        onChange={(e) => setFormData({ ...formData, spice_level: parseInt(e.target.value) })}
                                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-red-500"
                                    />
                                    <span className="flex items-center gap-1 font-bold text-red-500 w-12 justify-end">
                                        <Flame className="w-4 h-4 fill-red-500" /> {formData.spice_level}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                                    <span>None</span>
                                    <span>Mild</span>
                                    <span>Medium</span>
                                    <span>Hot</span>
                                    <span>Very Hot</span>
                                    <span>Extreme</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* INVENTORY TAB */}
                    {activeTab === 'inventory' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="SKU / Code" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
                                <Input label="Cost Price ($)" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Availability Status</label>
                                <select
                                    value={formData.availability_status}
                                    onChange={(e) => setFormData({ ...formData, availability_status: e.target.value })}
                                    className="w-full h-10 sm:h-11 bg-secondary/50 border border-border rounded-lg sm:rounded-xl px-3 sm:px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                >
                                    <option value="available">Available (In Stock)</option>
                                    <option value="low_stock">Low Stock</option>
                                    <option value="out_of_stock">Out of Stock</option>
                                    <option value="seasonal">Seasonal</option>
                                </select>
                            </div>

                            <Input label="Availability Note" value={formData.availability_note} onChange={(e) => setFormData({ ...formData, availability_note: e.target.value })} placeholder="e.g. Back in stock tomorrow" />
                        </div>
                    )}

                    {/* NUTRITION TAB */}
                    {activeTab === 'nutrition' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Calories (kcal)" type="number" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} />
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-foreground mb-3 border-b border-border pb-2">Nutrition Facts (per serving)</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <Input label="Protein (g)" type="number" step="0.1" value={String(formData.nutrition.protein)} onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, protein: e.target.value } })} />
                                    <Input label="Carbs (g)" type="number" step="0.1" value={String(formData.nutrition.carbs)} onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, carbs: e.target.value } })} />
                                    <Input label="Fat (g)" type="number" step="0.1" value={String(formData.nutrition.fat)} onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, fat: e.target.value } })} />
                                    <Input label="Fiber (g)" type="number" step="0.1" value={String(formData.nutrition.fiber)} onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, fiber: e.target.value } })} />
                                    <Input label="Sugar (g)" type="number" step="0.1" value={String(formData.nutrition.sugar)} onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, sugar: e.target.value } })} />
                                    <Input label="Sodium (mg)" type="number" step="1" value={String(formData.nutrition.sodium)} onChange={(e) => setFormData({ ...formData, nutrition: { ...formData.nutrition, sodium: e.target.value } })} />
                                </div>
                            </div>

                            <TagInput
                                label="Ingredients"
                                values={formData.ingredients}
                                onChange={(tags: string[]) => setFormData({ ...formData, ingredients: tags })}
                                placeholder="Type ingredient and press Enter"
                            />

                            <TagInput
                                label="Allergens"
                                values={formData.allergens}
                                onChange={(tags: string[]) => setFormData({ ...formData, allergens: tags })}
                                placeholder="e.g. Peanuts, Shellfish, Gluten"
                            />

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">Dietary Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Keto', 'Spicy', 'Nut-Free', 'Dairy-Free'].map(tag => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                                const current = formData.dietary_tags;
                                                const updated = current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag];
                                                setFormData({ ...formData, dietary_tags: updated });
                                            }}
                                            className={cn(
                                                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                                                formData.dietary_tags.includes(tag)
                                                    ? "bg-green-500/10 border-green-500 text-green-600"
                                                    : "bg-secondary border-border text-muted-foreground hover:border-green-500/50"
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 pt-4 mt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose} className="flex-1 h-10 sm:h-11">Cancel</Button>
                    <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 h-10 sm:h-11">
                        {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingItem ? 'Update Item' : 'Create Item')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
export default MenuItemForm;
