import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Languages,
    Save,
    Search,
    AlertCircle,
    CheckCircle2,
    Filter
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPut, apiPost } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';

interface Translation {
    id: number;
    category?: string;
    translations: {
        en?: { name: string; description: string | null };
        km?: { name: string; description: string | null };
    };
}

export default function Translations() {
    const queryClient = useQueryClient();
    const [translationType, setTranslationType] = useState<'categories' | 'menu_items'>('categories');
    const [searchQuery, setSearchQuery] = useState('');
    const [editedValues, setEditedValues] = useState<Record<string, any>>({});

    // Fetch translations based on type
    const { data: translationsData, isLoading } = useQuery({
        queryKey: ['translations', translationType],
        queryFn: () =>
            translationType === 'categories'
                ? apiGet('/api/admin/translations/categories')
                : apiGet('/api/admin/translations/menu-items')
    });

    // Fetch missing translations count
    const { data: missingData } = useQuery({
        queryKey: ['translations', 'missing'],
        queryFn: () => apiGet('/api/admin/translations/missing')
    });

    const translations: Translation[] = translationsData?.data || [];
    const missing = missingData?.data || { categories: 0, menu_items: 0, total: 0 };

    // Filter translations
    const filteredTranslations = translations.filter(item => {
        const enName = item.translations.en?.name?.toLowerCase() || '';
        const kmName = item.translations.km?.name?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        return enName.includes(query) || kmName.includes(query);
    });

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: (data: { translations: any[]; type: string }) =>
            apiPost('/api/admin/translations/bulk-update', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['translations'] });
            setEditedValues({});
        }
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
        const key = `${id}_${locale}_${field}`;
        return editedValues[key] !== undefined;
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

        // Fill in missing fields from original data
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
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Languages className="w-8 h-8 text-purple-600" />
                            Translation Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Manage English and Khmer translations for menu content
                        </p>
                    </div>
                    {hasChanges && (
                        <Button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Missing Categories</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{missing.categories}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Missing Menu Items</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{missing.menu_items}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Translation Progress</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {translations.length > 0
                                            ? Math.round(((translations.length - missing.total) / translations.length) * 100)
                                            : 0}%
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Type Selector */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setTranslationType('categories')}
                        className={cn(
                            "px-6 py-3 rounded-xl font-medium transition-all",
                            translationType === 'categories'
                                ? "bg-purple-600 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                    >
                        Categories
                    </button>
                    <button
                        onClick={() => setTranslationType('menu_items')}
                        className={cn(
                            "px-6 py-3 rounded-xl font-medium transition-all",
                            translationType === 'menu_items'
                                ? "bg-purple-600 text-white shadow-lg"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        )}
                    >
                        Menu Items
                    </button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search translations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Translations Table */}
                {isLoading ? (
                    <Card>
                        <CardContent className="p-6">
                            <div className="animate-pulse space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {filteredTranslations.map((item) => {
                            const hasKhmer = !!item.translations.km?.name;
                            const enEdited = isEdited(item.id, 'en', 'name') || isEdited(item.id, 'en', 'description');
                            const kmEdited = isEdited(item.id, 'km', 'name') || isEdited(item.id, 'km', 'description');

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card className={cn((enEdited || kmEdited) && "ring-2 ring-purple-500")}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                {item.category && (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        Category: {item.category}
                                                    </span>
                                                )}
                                                {!hasKhmer && (
                                                    <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 px-3 py-1 rounded-full">
                                                        Missing Khmer Translation
                                                    </span>
                                                )}
                                                {(enEdited || kmEdited) && (
                                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 px-3 py-1 rounded-full">
                                                        Modified
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* English */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">🇬🇧 English</span>
                                                        {enEdited && <span className="text-xs text-purple-600">•</span>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={getValue(item.id, 'en', 'name', item.translations.en?.name || '')}
                                                            onChange={(e) => handleValueChange(item.id, 'en', 'name', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Description
                                                        </label>
                                                        <textarea
                                                            value={getValue(item.id, 'en', 'description', item.translations.en?.description || '')}
                                                            onChange={(e) => handleValueChange(item.id, 'en', 'description', e.target.value)}
                                                            rows={3}
                                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Khmer */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">🇰🇭 ខ្មែរ (Khmer)</span>
                                                        {kmEdited && <span className="text-xs text-purple-600">•</span>}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={getValue(item.id, 'km', 'name', item.translations.km?.name || '')}
                                                            onChange={(e) => handleValueChange(item.id, 'km', 'name', e.target.value)}
                                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                            placeholder="បំពេញឈ្មោះជាភាសាខ្មែរ"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                            Description
                                                        </label>
                                                        <textarea
                                                            value={getValue(item.id, 'km', 'description', item.translations.km?.description || '')}
                                                            onChange={(e) => handleValueChange(item.id, 'km', 'description', e.target.value)}
                                                            rows={3}
                                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                            placeholder="បំពេញការពិពណ៌នាជាភាសាខ្មែរ"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
