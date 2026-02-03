import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import { MenuItem } from '@/app/types/domain';
import Modal from '@/app/components/ui/Modal';
import { Button } from '@/app/components/ui/Button';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Sparkles, X, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface FeaturedManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    locationId: number;
}

export const FeaturedManagerModal: React.FC<FeaturedManagerModalProps> = ({
    isOpen,
    onClose,
    locationId
}) => {
    const { t } = useLanguage();
    const qc = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch all menu items for the location
    const { data: allItems } = useQuery({
        queryKey: ['menu-items-all', locationId],
        queryFn: () => apiGet(`/menu-items?location_id=${locationId}&per_page=1000`),
        enabled: isOpen
    });

    const itemList = useMemo(() => {
        if (!allItems) return [];
        if (Array.isArray(allItems)) return allItems;
        if ((allItems as any)?.data && Array.isArray((allItems as any).data)) return (allItems as any).data;
        return [];
    }, [allItems]);

    const featuredItems = useMemo(() =>
        itemList.filter((item: MenuItem) => item.is_featured),
        [itemList]
    );

    const nonFeaturedItems = useMemo(() =>
        itemList.filter((item: MenuItem) => !item.is_featured && item.is_active)
            .filter((item: MenuItem) => {
                if (!searchTerm) return true;
                return item.name?.toLowerCase().includes(searchTerm.toLowerCase());
            }),
        [itemList, searchTerm]
    );

    const toggleFeaturedMutation = useMutation({
        mutationFn: ({ id, is_featured }: { id: number; is_featured: boolean }) => {
            const data = new FormData();
            data.append('is_featured', is_featured ? '1' : '0');
            return apiPost(`/menu-items/${id}?_method=PUT`, data);
        },
        onSuccess: () => {
            toastSuccess(t('admin.menu.featured_manager.status_updated'));
            qc.invalidateQueries({ queryKey: ['menu-items'] });
            qc.invalidateQueries({ queryKey: ['menu-items-all'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
    });

    const handleRemove = (id: number) => {
        toggleFeaturedMutation.mutate({ id, is_featured: false });
    };

    const handleAdd = (id: number) => {
        if (featuredItems.length >= 4) {
            toastError(t('admin.menu.featured_manager.max_limit_error'));
            return;
        }
        toggleFeaturedMutation.mutate({
            id,
            is_featured: true
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('admin.menu.featured_manager.title')} className="max-w-4xl">
            <div className="space-y-6">
                {/* Current Featured Items */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            {t('admin.menu.featured_manager.current_featured')} ({featuredItems.length}/4)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {featuredItems.map((item: MenuItem) => (
                            <div
                                key={item.id}
                                className={cn(
                                    "relative p-3 rounded-xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5",
                                    "flex items-center gap-3 group transition-all hover:shadow-md"
                                )}
                            >
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                    {item.image_path ? (
                                        <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-amber-500/50" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-foreground text-sm truncate">{item.name}</div>
                                    <div className="text-xs text-muted-foreground">${item.price}</div>
                                </div>
                                <button
                                    onClick={() => handleRemove(item.id)}
                                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove from featured"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: 4 - featuredItems.length }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="p-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 flex items-center justify-center h-[88px]"
                            >
                                <div className="text-center text-muted-foreground text-xs">
                                    <Sparkles className="w-6 h-6 mx-auto mb-1 opacity-30" />
                                    {t('admin.menu.featured_manager.empty_slot')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Add Items Section */}
                {featuredItems.length < 4 && (
                    <div>
                        <h3 className="text-sm font-bold text-foreground mb-3">{t('admin.menu.featured_manager.add_item')}</h3>

                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder={t('admin.menu.featured_manager.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-10 pl-10 pr-3 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        {/* Available Items */}
                        <div className="max-h-[300px] overflow-y-auto space-y-2 border border-border rounded-lg p-2">
                            {nonFeaturedItems.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    {searchTerm ? t('admin.menu.featured_manager.no_items') : t('admin.menu.featured_manager.all_featured')}
                                </div>
                            ) : (
                                nonFeaturedItems.slice(0, 10).map((item: MenuItem) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors group"
                                    >
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                                            {item.image_path ? (
                                                <img src={item.image_path} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-foreground text-sm truncate">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">${item.price}</div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => handleAdd(item.id)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            leftIcon={<Sparkles className="w-3 h-3" />}
                                        >
                                            {t('admin.menu.featured_manager.add_btn')}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                    <Button variant="secondary" onClick={onClose}>
                        {t('admin.inventory.adjustments.form.cancel')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
