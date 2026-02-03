import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, Scale, Ruler, Package,
    Droplet, Hash, CheckCircle, XCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Enhanced StatCard Component - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0, subtext }: any) => {
    const colorStyles: Record<string, any> = {
        purple: { gradient: 'from-purple-500/20 to-fuchsia-500/10', iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', shadow: 'shadow-purple-500/20' },
        blue: { gradient: 'from-blue-500/20 to-cyan-500/10', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' },
        emerald: { gradient: 'from-emerald-500/20 to-green-500/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20' },
        amber: { gradient: 'from-amber-500/20 to-orange-500/10', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', shadow: 'shadow-amber-500/20' },
        rose: { gradient: 'from-rose-500/20 to-red-500/10', iconBg: 'bg-gradient-to-br from-rose-500 to-red-600', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', shadow: 'shadow-rose-500/20' },
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

interface Unit {
    id: number;
    code: string;
    name: string;
    display_name: string;
    base_unit: string | null;
    conversion_factor: number | null;
    is_base_unit: boolean;
    for_weight: boolean;
    for_volume: boolean;
    for_quantity: boolean;
    for_packaging: boolean;
    for_produce: boolean;
}

export default function Units() {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [baseUnitFilter, setBaseUnitFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        code: '', name: '', display_name: '', base_unit: '', conversion_factor: '',
        is_base_unit: false, for_weight: false, for_volume: false, for_quantity: false,
        for_packaging: false, for_produce: false
    });

    // Fetch Data
    const { data: units, isLoading } = useQuery({
        queryKey: ['units', page, search, typeFilter, baseUnitFilter],
        queryFn: () => {
            let url = `/api/admin/units?page=${page}&per_page=${perPage}&search=${search}`;
            if (typeFilter !== 'all') url += `&${typeFilter}=1`;
            if (baseUnitFilter !== 'all') url += `&is_base_unit=${baseUnitFilter === 'base' ? '1' : '0'}`;
            return apiGet(url);
        }
    });

    const { data: baseUnits } = useQuery({
        queryKey: ['units/base-units'],
        queryFn: () => apiGet('/api/admin/units/base-units')
    });

    const unitList = useMemo(() => units?.data || [], [units]);

    const stats = useMemo(() => ({
        total: unitList.length,
        base: unitList.filter((u: Unit) => u.is_base_unit).length,
        derived: unitList.filter((u: Unit) => !u.is_base_unit).length
    }), [unitList]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/units', data),
        onSuccess: () => { toastSuccess('Unit created'); closeModal(); qc.invalidateQueries({ queryKey: ['units'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/units/${id}`, data),
        onSuccess: () => { toastSuccess('Unit updated'); closeModal(); qc.invalidateQueries({ queryKey: ['units'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/units/${id}`),
        onSuccess: () => { toastSuccess('Unit deleted'); qc.invalidateQueries({ queryKey: ['units'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingUnit(null);
        setFormData({
            code: '', name: '', display_name: '', base_unit: '', conversion_factor: '',
            is_base_unit: false, for_weight: false, for_volume: false, for_quantity: false,
            for_packaging: false, for_produce: false
        });
    };

    const handleEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setFormData({
            code: unit.code,
            name: unit.name,
            display_name: unit.display_name,
            base_unit: unit.base_unit || '',
            conversion_factor: unit.conversion_factor?.toString() || '',
            is_base_unit: unit.is_base_unit,
            for_weight: unit.for_weight,
            for_volume: unit.for_volume,
            for_quantity: unit.for_quantity,
            for_packaging: unit.for_packaging,
            for_produce: unit.for_produce
        });
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this unit?')) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            base_unit: formData.is_base_unit ? null : (formData.base_unit || null),
            conversion_factor: formData.is_base_unit ? null : (formData.conversion_factor ? parseFloat(formData.conversion_factor) : null)
        };
        if (editingUnit) updateMutation.mutate({ id: editingUnit.id, data });
        else createMutation.mutate(data);
    };

    const getUnitIcon = (unit: Unit) => {
        if (unit.for_weight) return <Scale size={14} />;
        if (unit.for_volume) return <Droplet size={14} />;
        if (unit.for_quantity) return <Hash size={14} />;
        if (unit.for_packaging) return <Package size={14} />;
        return <Ruler size={14} />;
    };

    const getUnitType = (unit: Unit) => {
        if (unit.for_weight) return t('admin.units.filters.weight');
        if (unit.for_volume) return t('admin.units.filters.volume');
        if (unit.for_quantity) return t('admin.units.table.quantity');
        if (unit.for_packaging) return t('admin.units.table.packaging');
        if (unit.for_produce) return t('admin.units.table.produce');
        return t('admin.units.table.general');
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 transition-colors relative overflow-x-hidden">
                {/* Decorative Background - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 w-full mx-auto space-y-4 sm:space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <Ruler className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                            <div className="min-w-0">
                                <motion.h1
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent truncate"
                                >
                                    {t('admin.units.title')}
                                </motion.h1>
                                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">{t('admin.units.subtitle')}</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => { closeModal(); setOpenCreate(true); }}
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                        >
                            <Plus className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">{t('admin.units.add_unit')}</span>
                        </Button>
                    </div>

                    {/* Stats Ribbon - Horizontal scroll on mobile */}
                    <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
                        <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-4 min-w-max sm:min-w-0">
                            <StatCard title={t('admin.units.stats.total')} value={stats.total} icon={Ruler} color="purple" index={0} />
                            <StatCard title={t('admin.units.stats.base')} value={stats.base} icon={Scale} color="blue" index={1} subtext={t('admin.units.stats.primary_standards')} />
                            <StatCard title={t('admin.units.stats.derived')} value={stats.derived} icon={Hash} color="emerald" index={2} subtext={t('admin.units.stats.from_base')} />
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm shadow-lg"
                    >
                        <div className="flex gap-2 sm:gap-4">
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 text-sm bg-background/50 border-border/50 focus:border-purple-500 transition-all" />
                            </div>
                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                                className="bg-background/50 border border-border/50 rounded-lg px-2 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none transition-all">
                                <option value="all">{t('admin.units.filters.type')}</option>
                                <option value="for_weight">{t('admin.units.filters.weight')}</option>
                                <option value="for_volume">{t('admin.units.filters.volume')}</option>
                                <option value="for_quantity">{t('admin.units.filters.qty')}</option>
                                <option value="for_packaging">{t('admin.units.filters.pack')}</option>
                            </select>
                            <select value={baseUnitFilter} onChange={(e) => setBaseUnitFilter(e.target.value)}
                                className="hidden sm:block bg-background/50 border border-border/50 rounded-lg px-4 py-2 h-10 text-sm text-foreground focus:border-purple-500 outline-none transition-all">
                                <option value="all">{t('admin.units.filters.all_units')}</option>
                                <option value="base">{t('admin.units.filters.base_only')}</option>
                                <option value="derived">{t('admin.units.filters.derived_only')}</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Desktop Table - Hidden on mobile */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="hidden md:block bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                    >
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-purple-500/10">
                            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.units.table.name_code')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.units.table.type')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.units.table.base_unit')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.units.table.factor')}</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.units.table.usage')}</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.units.table.actions')}</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted-foreground">Loading...</div>
                            ) : unitList.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                                        <Ruler className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">{t('admin.units.table.empty_title')}</p>
                                </div>
                            ) : unitList.map((unit: Unit, idx: number) => (
                                <motion.div
                                    key={unit.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-purple-500/5 transition-all group"
                                >
                                    <div className="col-span-3">
                                        <div className="font-medium text-foreground">{unit.name}</div>
                                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                            <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px]">{unit.code}</span>
                                            <span className="opacity-70">{unit.display_name}</span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="px-2 py-1 rounded-md text-xs font-medium border bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20 flex items-center gap-1 w-fit">
                                            {getUnitIcon(unit)} {getUnitType(unit)}
                                        </span>
                                    </div>
                                    <div className="col-span-2 text-sm text-muted-foreground">
                                        {unit.is_base_unit ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> {t('admin.units.table.base')}
                                            </span>
                                        ) : unit.base_unit}
                                    </div>
                                    <div className="col-span-2 text-sm text-foreground font-mono">
                                        {unit.conversion_factor ? (
                                            <span className="bg-secondary/50 px-2 py-1 rounded">× {unit.conversion_factor}</span>
                                        ) : '-'}
                                    </div>
                                    <div className="col-span-2 flex gap-1">
                                        {unit.for_weight && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 text-[10px] px-1.5 border-none">W</Badge>}
                                        {unit.for_volume && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 text-[10px] px-1.5 border-none">V</Badge>}
                                        {unit.for_quantity && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-[10px] px-1.5 border-none">Q</Badge>}
                                    </div>
                                    <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(unit)} className="h-8 w-8 p-0 hover:text-blue-600"><Edit size={14} /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(unit.id)} className="h-8 w-8 p-0 hover:text-red-600"><Trash2 size={14} /></Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Mobile Cards - Hidden on desktop */}
                    <div className="md:hidden space-y-2">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
                        ) : unitList.length === 0 ? (
                            <div className="p-8 text-center bg-card/50 rounded-xl border border-border/50">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary/50 flex items-center justify-center">
                                    <Ruler className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground text-sm">{t('admin.units.table.empty_mobile')}</p>
                            </div>
                        ) : unitList.map((unit: Unit, idx: number) => (
                            <motion.div
                                key={unit.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-foreground text-sm">{unit.name}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-secondary text-[10px] font-mono">{unit.code}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{unit.display_name}</div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(unit)} className="h-8 w-8 p-0 hover:text-blue-600"><Edit size={14} /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(unit.id)} className="h-8 w-8 p-0 hover:text-red-600"><Trash2 size={14} /></Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="px-2 py-1 rounded-md text-[10px] font-medium border bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20 flex items-center gap-1">
                                        {getUnitIcon(unit)} {getUnitType(unit)}
                                    </span>
                                    {unit.is_base_unit ? (
                                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md">
                                            <CheckCircle className="w-3 h-3" /> {t('admin.units.table.base')}
                                        </span>
                                    ) : (
                                        <>
                                            {unit.base_unit && <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded">→ {unit.base_unit}</span>}
                                            {unit.conversion_factor && <span className="text-[10px] font-mono bg-secondary/50 px-2 py-1 rounded">× {unit.conversion_factor}</span>}
                                        </>
                                    )}
                                    {unit.for_weight && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 text-[8px] px-1 border-none">W</Badge>}
                                    {unit.for_volume && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 text-[8px] px-1 border-none">V</Badge>}
                                    {unit.for_quantity && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 text-[8px] px-1 border-none">Q</Badge>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingUnit ? t('admin.units.edit_unit') : t('admin.units.new_unit')} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Input label={t('admin.units.form.code') as string} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required placeholder="e.g. kg" className="h-10 text-sm" />
                        <Input label={t('admin.units.form.name') as string} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Kilogram" className="h-10 text-sm" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Input label={t('admin.units.form.display') as string} value={formData.display_name} onChange={(e) => setFormData({ ...formData, display_name: e.target.value })} required placeholder="e.g. kg" className="h-10 text-sm" />
                        <div className="flex items-center sm:pt-6">
                            <label className="flex items-center gap-2 sm:gap-3 cursor-pointer p-2.5 sm:p-3 rounded-lg border border-border/50 bg-secondary/30 w-full hover:bg-secondary/50 transition-colors">
                                <input type="checkbox" checked={formData.is_base_unit} onChange={(e) => setFormData({ ...formData, is_base_unit: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                                <span className="text-xs sm:text-sm font-medium text-foreground">{t('admin.units.form.is_base_unit')}</span>
                            </label>
                        </div>
                    </div>

                    {!formData.is_base_unit && (
                        <div className="bg-secondary/30 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/50">
                            <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-muted-foreground flex items-center gap-2">
                                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                                {t('admin.units.form.conversion')}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">{t('admin.units.form.base_unit')}</label>
                                    <select value={formData.base_unit} onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
                                        className="w-full bg-background border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:ring-2 focus:ring-purple-500/20 outline-none transition-all">
                                        <option value="">{t('admin.units.form.select')}</option>
                                        {baseUnits?.map((u: Unit) => <option key={u.code} value={u.code}>{u.name} ({u.code})</option>)}
                                    </select>
                                </div>
                                <Input label={t('admin.units.form.factor') as string} type="number" step="0.001" value={formData.conversion_factor} onChange={(e) => setFormData({ ...formData, conversion_factor: e.target.value })} placeholder="1 = X base" className="h-10 text-sm" />
                            </div>
                        </div>
                    )}

                    <div className="border-t border-border/50 pt-3 sm:pt-4">
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">{t('admin.units.form.usage')}</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                            {['weight', 'volume', 'quantity', 'packaging', 'produce'].map(type => (
                                <label key={type} className={cn(
                                    "flex items-center gap-1.5 sm:gap-2 cursor-pointer p-1.5 sm:p-2 rounded-lg border transition-all text-xs sm:text-sm",
                                    (formData as any)[`for_${type}`] ? "bg-purple-500/10 border-purple-500/30" : "bg-card border-border/50 hover:bg-secondary/50"
                                )}>
                                    <input type="checkbox" checked={(formData as any)[`for_${type}`]}
                                        onChange={(e) => setFormData({ ...formData, [`for_${type}`]: e.target.checked })}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-3 h-3 sm:w-4 sm:h-4" />
                                    <span className="text-foreground capitalize truncate">{t(`admin.units.usage_types.${type.slice(0, 4)}`)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11 text-sm hover:bg-secondary/80">{t('admin.units.form.cancel')}</Button>
                        <Button type="submit" className="flex-1 h-10 sm:h-11 text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">
                            {editingUnit ? t('admin.units.form.save') : t('admin.units.form.create')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
