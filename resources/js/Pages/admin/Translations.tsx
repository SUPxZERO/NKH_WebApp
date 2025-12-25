import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Save, Languages, AlertCircle, CheckCircle2,
    LayoutGrid
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Enhanced StatCard Component - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
    const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string; shadow: string }> = {
        purple: {
            gradient: 'from-fuchsia-500/20 to-purple-500/10',
            iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
            text: 'text-fuchsia-600 dark:text-fuchsia-400',
            border: 'border-fuchsia-500/30',
            shadow: 'shadow-fuchsia-500/20'
        },
        emerald: {
            gradient: 'from-emerald-500/20 to-green-500/10',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-500/30',
            shadow: 'shadow-emerald-500/20'
        },
        amber: {
            gradient: 'from-amber-500/20 to-orange-500/10',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-500/30',
            shadow: 'shadow-amber-500/20'
        },
        red: {
            gradient: 'from-red-500/20 to-rose-500/10',
            iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-500/30',
            shadow: 'shadow-red-500/20'
        }
    };
    const styles = colorStyles[color] || colorStyles.purple;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm",
                `bg-gradient-to-br ${styles.gradient}`,
                styles.border,
                `shadow-lg ${styles.shadow}`
            )}
        >
            <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 transform translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-8 hidden sm:block">
                <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
            </div>
            <div className="relative p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">{title}</p>
                        <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate", styles.text)}>{value}</p>
                    </div>
                    <div className={cn("p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Premium Stats Ribbon - Mobile optimized
const TranslationStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
        <StatCard title="Keys" value={stats.total} icon={Languages} color="purple" index={0} />
        <StatCard title="Missing Cat" value={stats.missingCategories} icon={LayoutGrid} color="red" index={1} />
        <StatCard title="Missing Items" value={stats.missingItems} icon={AlertCircle} color="amber" index={2} />
        <StatCard title="Progress" value={`${stats.progress}%`} icon={CheckCircle2} color="emerald" index={3} />
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
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 transition-colors relative overflow-x-hidden">
                {/* Decorative Background Elements - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 w-full mx-auto">
                    <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
                        <div className="min-w-0">
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent truncate"
                            >
                                Translations
                            </motion.h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">Manage multi-language content</p>
                        </div>
                        {hasChanges && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <Button onClick={handleSave} disabled={saveMutation.isPending} className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
                                    <Save className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    <TranslationStatsRibbon stats={stats} />

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
                    >
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-10 text-sm bg-background/50 border-border text-foreground placeholder:text-muted-foreground" />
                            </div>
                            <div className="flex bg-secondary/50 border border-border rounded-lg sm:rounded-xl p-1">
                                <button onClick={() => setTranslationType('categories')}
                                    className={cn("flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                                        translationType === 'categories' ? "bg-white dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                                    <span className="hidden sm:inline">Categories</span>
                                    <span className="sm:hidden">Cat</span>
                                </button>
                                <button onClick={() => setTranslationType('menu_items')}
                                    className={cn("flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all",
                                        translationType === 'menu_items' ? "bg-white dark:bg-slate-800 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                                    <span className="hidden sm:inline">Menu Items</span>
                                    <span className="sm:hidden">Items</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Desktop Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:block bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                    >
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">ID</div>
                            <div className="col-span-5 text-xs font-bold text-foreground uppercase tracking-wider">English (Default)</div>
                            <div className="col-span-6 text-xs font-bold text-foreground uppercase tracking-wider">Khmer (Translation)</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600 mb-2"></div>
                                    <p>Loading...</p>
                                </div>
                            ) : filteredTranslations.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                        <Languages className="w-8 h-8 text-fuchsia-500" />
                                    </div>
                                    <h3 className="text-foreground font-semibold">No translations found</h3>
                                </div>
                            ) : filteredTranslations.map((item, idx) => {
                                const enEdited = isEdited(item.id, 'en', 'name') || isEdited(item.id, 'en', 'description');
                                const kmEdited = isEdited(item.id, 'km', 'name') || isEdited(item.id, 'km', 'description');

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={cn("grid grid-cols-12 gap-4 p-4 items-start hover:bg-fuchsia-500/5 transition-all group",
                                            (enEdited || kmEdited) ? "bg-fuchsia-500/5" : ""
                                        )}>
                                        <div className="col-span-1 text-sm text-muted-foreground font-mono pt-3">#{item.id}</div>

                                        {/* English Column */}
                                        <div className="col-span-5 space-y-3">
                                            <div className="relative group/input">
                                                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold pointer-events-none group-focus-within/input:text-fuchsia-500 transition-colors">EN</span>
                                                <Input
                                                    value={getValue(item.id, 'en', 'name', item.translations.en?.name || '')}
                                                    onChange={(e) => handleValueChange(item.id, 'en', 'name', e.target.value)}
                                                    className={cn("pl-10 text-sm transition-all", isEdited(item.id, 'en', 'name') && "border-fuchsia-500 ring-1 ring-fuchsia-500/20")}
                                                    placeholder="English Name"
                                                />
                                            </div>
                                            <div className="relative group/input">
                                                <textarea
                                                    value={getValue(item.id, 'en', 'description', item.translations.en?.description || '')}
                                                    onChange={(e) => handleValueChange(item.id, 'en', 'description', e.target.value)}
                                                    rows={2}
                                                    className={cn("w-full pl-3 bg-background/50 border border-border rounded-xl text-sm text-foreground focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/20 outline-none p-2 transition-all resize-none", isEdited(item.id, 'en', 'description') && "border-fuchsia-500")}
                                                    placeholder="English Description"
                                                />
                                            </div>
                                        </div>

                                        {/* Khmer Column */}
                                        <div className="col-span-6 space-y-3">
                                            <div className="relative group/input">
                                                <span className="absolute left-3 top-2.5 text-xs text-emerald-600 dark:text-emerald-500 font-bold pointer-events-none">KM</span>
                                                <Input
                                                    value={getValue(item.id, 'km', 'name', item.translations.km?.name || '')}
                                                    onChange={(e) => handleValueChange(item.id, 'km', 'name', e.target.value)}
                                                    className={cn("pl-10 text-sm font-khmer transition-all", isEdited(item.id, 'km', 'name') && "border-emerald-500 ring-1 ring-emerald-500/20")}
                                                    placeholder="ឈ្មោះជាភាសាខ្មែរ"
                                                />
                                            </div>
                                            <div className="relative group/input">
                                                <textarea
                                                    value={getValue(item.id, 'km', 'description', item.translations.km?.description || '')}
                                                    onChange={(e) => handleValueChange(item.id, 'km', 'description', e.target.value)}
                                                    rows={2}
                                                    className={cn("w-full pl-3 bg-background/50 border border-border rounded-xl text-sm text-foreground focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none p-2 font-khmer transition-all resize-none", isEdited(item.id, 'km', 'description') && "border-emerald-500")}
                                                    placeholder="ពណ៌នាជាភាសាខ្មែរ"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {isLoading ? (
                            <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
                                <div className="inline-flex items-center gap-3 text-muted-foreground">
                                    <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Loading...</span>
                                </div>
                            </div>
                        ) : filteredTranslations.length === 0 ? (
                            <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Languages className="w-7 h-7 text-fuchsia-500" />
                                </div>
                                <h3 className="text-foreground font-semibold text-sm">No translations found</h3>
                            </div>
                        ) : filteredTranslations.map((item, idx) => {
                            const enEdited = isEdited(item.id, 'en', 'name') || isEdited(item.id, 'en', 'description');
                            const kmEdited = isEdited(item.id, 'km', 'name') || isEdited(item.id, 'km', 'description');

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={cn(
                                        "bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm",
                                        (enEdited || kmEdited) && "border-fuchsia-500/30 bg-fuchsia-500/5"
                                    )}
                                >
                                    {/* Header */}
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center border border-fuchsia-500/20 flex-shrink-0">
                                            <Languages className="w-3.5 h-3.5 text-fuchsia-600 dark:text-fuchsia-400" />
                                        </div>
                                        <span className="font-mono text-xs text-muted-foreground">#{item.id}</span>
                                        <span className="text-sm text-foreground font-medium truncate flex-1">
                                            {item.translations.en?.name || 'Untitled'}
                                        </span>
                                    </div>

                                    {/* English Section */}
                                    <div className="mb-3">
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-[10px] font-bold text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wider">English</span>
                                            {enEdited && <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                value={getValue(item.id, 'en', 'name', item.translations.en?.name || '')}
                                                onChange={(e) => handleValueChange(item.id, 'en', 'name', e.target.value)}
                                                className={cn("h-9 text-sm", isEdited(item.id, 'en', 'name') && "border-fuchsia-500 ring-1 ring-fuchsia-500/20")}
                                                placeholder="English Name"
                                            />
                                            <textarea
                                                value={getValue(item.id, 'en', 'description', item.translations.en?.description || '')}
                                                onChange={(e) => handleValueChange(item.id, 'en', 'description', e.target.value)}
                                                rows={2}
                                                className={cn("w-full bg-background/50 border border-border rounded-lg text-sm text-foreground focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500/20 outline-none p-2 transition-all resize-none", isEdited(item.id, 'en', 'description') && "border-fuchsia-500")}
                                                placeholder="English Description"
                                            />
                                        </div>
                                    </div>

                                    {/* Khmer Section */}
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Khmer</span>
                                            {kmEdited && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                        </div>
                                        <div className="space-y-2">
                                            <Input
                                                value={getValue(item.id, 'km', 'name', item.translations.km?.name || '')}
                                                onChange={(e) => handleValueChange(item.id, 'km', 'name', e.target.value)}
                                                className={cn("h-9 text-sm font-khmer", isEdited(item.id, 'km', 'name') && "border-emerald-500 ring-1 ring-emerald-500/20")}
                                                placeholder="ឈ្មោះជាភាសាខ្មែរ"
                                            />
                                            <textarea
                                                value={getValue(item.id, 'km', 'description', item.translations.km?.description || '')}
                                                onChange={(e) => handleValueChange(item.id, 'km', 'description', e.target.value)}
                                                rows={2}
                                                className={cn("w-full bg-background/50 border border-border rounded-lg text-sm text-foreground font-khmer focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none p-2 transition-all resize-none", isEdited(item.id, 'km', 'description') && "border-emerald-500")}
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
