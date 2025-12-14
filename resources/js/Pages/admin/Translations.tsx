import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Save, Languages, AlertCircle, CheckCircle2,
    Filter, Globe, Type
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon with Dark/Light Mode Support
const TranslationStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Total Keys</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <Languages className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Missing Categories</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.missingCategories}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
            </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Missing Items</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.missingItems}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
            </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Progress</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.progress}%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
        </div>
    </div>
);

interface Translation {
    id: number;
    category?: string;
    translations: {
        en?: { name: string; description: string | null };
        km?: { name: string; description: string | null };
    };
}

export default function Translations() {
    const [translationType, setTranslationType] = useState<'categories' | 'menu_items'>('categories');
    const [search, setSearch] = useState('');
    const [editedValues, setEditedValues] = useState<Record<string, any>>({});

    const qc = useQueryClient();

    // Fetch Data
    const { data: translationsData, isLoading } = useQuery({
        queryKey: ['translations', translationType],
        queryFn: () => translationType === 'categories'
            ? apiGet('/api/admin/translations/categories')
            : apiGet('/api/admin/translations/menu-items')
    });

    const { data: missingData } = useQuery({
        queryKey: ['translations', 'missing'],
        queryFn: () => apiGet('/api/admin/translations/missing')
    });

    const translations: Translation[] = useMemo(() => translationsData?.data || [], [translationsData]);
    const missing = useMemo(() => missingData?.data || { categories: 0, menu_items: 0, total: 0 }, [missingData]);

    const filteredTranslations = useMemo(() => {
        return translations.filter(item => {
            const enName = item.translations.en?.name?.toLowerCase() || '';
            const kmName = item.translations.km?.name?.toLowerCase() || '';
            const query = search.toLowerCase();
            return enName.includes(query) || kmName.includes(query);
        });
    }, [translations, search]);

    const stats = useMemo(() => ({
        total: translations.length,
        missingCategories: missing.categories,
        missingItems: missing.menu_items,
        progress: translations.length > 0 ? Math.round(((translations.length - missing.total) / translations.length) * 100) : 0
    }), [translations, missing]);

    // Mutations
    const saveMutation = useMutation({
        mutationFn: (data: { translations: any[]; type: string }) => apiPost('/api/admin/translations/bulk-update', data),
        onSuccess: () => {
            toastSuccess('Translations saved');
            setEditedValues({});
            qc.invalidateQueries({ queryKey: ['translations'] });
        },
        onError: () => toastError('Failed to save translations')
    });

    const handleValueChange = (id: number, locale: 'en' | 'km', field: 'name' | 'description', value: string) => {
        const key = `${id}_${locale}_${field}`;
        setEditedValues(prev => ({ ...prev, [key]: value }));
    };

    const getValue = (id: number, locale: 'en' | 'km', field: 'name' | 'description', originalValue: string | null) => {
        const key = `${id}_${locale}_${field}`;
        return editedValues[key] !== undefined ? editedValues[key] : (originalValue || '');
    };

    const isEdited = (id: number, locale: 'en' | 'km', field: 'name' | 'description') => {
        return editedValues[`${id}_${locale}_${field}`] !== undefined;
    };

    const handleSave = () => {
        const translationsToUpdate: any[] = [];
        Object.keys(editedValues).forEach(key => {
            const [id, locale, field] = key.split('_');
            const itemId = parseInt(id);
            let existing = translationsToUpdate.find(t => t.id === itemId && t.locale === locale);
            if (!existing) {
                existing = { id: itemId, locale, name: '', description: '' };
                translationsToUpdate.push(existing);
            }
            existing[field] = editedValues[key];
        });

        // Fill missing fields
        translationsToUpdate.forEach(trans => {
            const original = translations.find(t => t.id === trans.id);
            if (original) {
                const localeData = original.translations[trans.locale as 'en' | 'km'];
                if (!trans.name) trans.name = localeData?.name || '';
                if (!trans.description) trans.description = localeData?.description || '';
            }
        });

        saveMutation.mutate({
            type: translationType === 'categories' ? 'category' : 'menu_item',
            translations: translationsToUpdate
        });
    };

    const hasChanges = Object.keys(editedValues).length > 0;

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Translations</h1>
                        <p className="text-muted-foreground mt-1">Manage multi-language content</p>
                    </div>
                    {hasChanges && (
                        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                            <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                </div>

                <TranslationStatsRibbon stats={stats} />

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4 mb-6 backdrop-blur-sm shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input placeholder="Search translations..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground" />
                        </div>
                        <div className="flex bg-secondary border border-border rounded-lg p-1">
                            <button onClick={() => setTranslationType('categories')}
                                className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                                    translationType === 'categories' ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
                                Categories
                            </button>
                            <button onClick={() => setTranslationType('menu_items')}
                                className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                                    translationType === 'menu_items' ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground")}>
                                Menu Items
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-5">English (Default)</div>
                        <div className="col-span-6">Khmer (Translation)</div>
                    </div>
                    <div className="divide-y divide-border/50">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Loading...</div>
                        ) : filteredTranslations.length === 0 ? (
                            <div className="p-12 text-center">
                                <Languages className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No translations found</p>
                            </div>
                        ) : filteredTranslations.map((item) => {
                            const enEdited = isEdited(item.id, 'en', 'name') || isEdited(item.id, 'en', 'description');
                            const kmEdited = isEdited(item.id, 'km', 'name') || isEdited(item.id, 'km', 'description');

                            return (
                                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className={cn("grid grid-cols-12 gap-4 p-4 items-start hover:bg-secondary/50 transition-colors group",
                                        (enEdited || kmEdited) ? "bg-primary/5" : ""
                                    )}>
                                    <div className="col-span-1 text-sm text-muted-foreground font-mono pt-2">#{item.id}</div>

                                    {/* English Column */}
                                    <div className="col-span-5 space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-2 text-xs text-gray-500 font-bold">EN</span>
                                            <Input
                                                value={getValue(item.id, 'en', 'name', item.translations.en?.name || '')}
                                                onChange={(e) => handleValueChange(item.id, 'en', 'name', e.target.value)}
                                                className={cn("pl-8 text-sm", isEdited(item.id, 'en', 'name') && "border-purple-500 dark:border-purple-500/50")}
                                                placeholder="English Name"
                                            />
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={getValue(item.id, 'en', 'description', item.translations.en?.description || '')}
                                                onChange={(e) => handleValueChange(item.id, 'en', 'description', e.target.value)}
                                                rows={2}
                                                className={cn("w-full pl-2 bg-card border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none p-2", isEdited(item.id, 'en', 'description') && "border-primary")}
                                                placeholder="English Description"
                                            />
                                        </div>
                                    </div>

                                    {/* Khmer Column */}
                                    <div className="col-span-6 space-y-2">
                                        <div className="relative">
                                            <span className="absolute left-2 top-2 text-xs text-emerald-600 dark:text-emerald-500 font-bold">KM</span>
                                            <Input
                                                value={getValue(item.id, 'km', 'name', item.translations.km?.name || '')}
                                                onChange={(e) => handleValueChange(item.id, 'km', 'name', e.target.value)}
                                                className={cn("pl-8 text-sm font-khmer", isEdited(item.id, 'km', 'name') && "border-purple-500 dark:border-purple-500/50")}
                                                placeholder="ឈ្មោះជាភាសាខ្មែរ"
                                            />
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={getValue(item.id, 'km', 'description', item.translations.km?.description || '')}
                                                onChange={(e) => handleValueChange(item.id, 'km', 'description', e.target.value)}
                                                rows={2}
                                                className={cn("w-full pl-2 bg-card border border-border rounded-lg text-sm text-foreground focus:border-primary outline-none p-2 font-khmer", isEdited(item.id, 'km', 'description') && "border-primary")}
                                                placeholder="ពណ៌នាជាភាសាខ្មែរ"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
