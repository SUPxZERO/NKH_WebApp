import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Edit, Trash2, Briefcase, Users, CheckCircle, XCircle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';

// StatCard Component with vibrant gradients - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
    const { t } = useLanguage();
    const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string; shadow: string }> = {
        purple: {
            gradient: 'from-purple-500/20 to-fuchsia-500/10',
            iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600',
            text: 'text-purple-600 dark:text-purple-400',
            border: 'border-purple-500/30',
            shadow: 'shadow-purple-500/20'
        },
        emerald: {
            gradient: 'from-emerald-500/20 to-green-500/10',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-500/30',
            shadow: 'shadow-emerald-500/20'
        },
        blue: {
            gradient: 'from-blue-500/20 to-cyan-500/10',
            iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-500/30',
            shadow: 'shadow-blue-500/20'
        },
        amber: {
            gradient: 'from-amber-500/20 to-orange-500/10',
            iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-500/30',
            shadow: 'shadow-amber-500/20'
        }
    };
    const styles = colorStyles[color] || colorStyles.purple;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[100px] sm:min-w-0",
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
                    </div>
                    <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Stats Ribbon - Mobile optimized with horizontal scroll
// Stats Ribbon - Mobile optimized with horizontal scroll
const PositionStatsRibbon = ({ stats }: { stats: any }) => {
    const { t } = useLanguage();
    return (
        <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
            <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-4 min-w-max sm:min-w-0">
                <StatCard title={t('admin.hr.positions.stats.total')} value={stats.total} icon={Briefcase} color="purple" index={0} />
                <StatCard title={t('admin.hr.positions.stats.active')} value={stats.active} icon={CheckCircle} color="emerald" index={1} />
                <StatCard title={t('admin.hr.positions.stats.staff')} value={stats.staff} icon={Users} color="blue" index={2} />
            </div>
        </div>
    );
};

export default function Positions() {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingPosition, setEditingPosition] = useState<any>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        title: '', description: '', is_active: true
    });

    // Fetch Data
    const { data: positions, isLoading } = useQuery({
        queryKey: ['admin/positions', page, search, statusFilter],
        queryFn: () => {
            let url = `/api/admin/positions?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            return apiGet(url);
        }
    });

    const positionList = useMemo(() => positions?.data || [], [positions]);

    const stats = useMemo(() => ({
        total: positions?.meta?.total || positionList.length,
        active: positionList.filter((p: any) => p.is_active).length,
        staff: positionList.reduce((sum: number, p: any) => sum + (p.employees_count || 0), 0)
    }), [positionList, positions]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/positions', data),
        onSuccess: () => { toastSuccess(t('admin.hr.positions.messages.created') as string); closeModal(); qc.invalidateQueries({ queryKey: ['admin/positions'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.hr.positions.messages.failed') as string)
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/positions/${id}`, data),
        onSuccess: () => { toastSuccess(t('admin.hr.positions.messages.updated') as string); closeModal(); qc.invalidateQueries({ queryKey: ['admin/positions'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.hr.positions.messages.failed') as string)
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/positions/${id}`),
        onSuccess: () => { toastSuccess(t('admin.hr.positions.messages.deleted') as string); qc.invalidateQueries({ queryKey: ['admin/positions'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.hr.positions.messages.failed') as string)
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingPosition(null);
        setFormData({ title: '', description: '', is_active: true });
    };

    const handleEdit = (pos: any) => {
        setEditingPosition(pos);
        setFormData({ title: pos.title, description: pos.description || '', is_active: pos.is_active });
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('admin.hr.positions.messages.confirm_delete') as string)) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPosition) updateMutation.mutate({ id: editingPosition.id, data: formData });
        else createMutation.mutate(formData);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
                {/* Decorative Background Elements - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
                    <div className="min-w-0">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent truncate"
                        >

                            {t('admin.hr.positions.title')}
                        </motion.h1>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">{t('admin.hr.positions.subtitle')}</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} variant="primary" className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0">
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('admin.hr.positions.add')}</span>
                    </Button>
                </div>

                <PositionStatsRibbon stats={stats} />

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
                >
                    <div className="flex gap-2 sm:gap-4">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input placeholder={t('layout.common.search') as string} value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-10 text-sm" variant="filled" />
                        </div>
                        <div className="flex gap-1.5 sm:gap-2">
                            {[
                                { key: 'all', label: t('admin.hr.positions.filters.all'), mobileLabel: t('admin.hr.positions.filters.all') },
                                { key: 'active', label: t('admin.hr.positions.filters.active'), mobileLabel: t('admin.hr.positions.filters.on') },
                                { key: 'inactive', label: t('admin.hr.positions.filters.inactive'), mobileLabel: t('admin.hr.positions.filters.off') }
                            ].map(({ key, label, mobileLabel }) => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={cn(
                                        "px-2.5 sm:px-4 py-2 h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0",
                                        statusFilter === key
                                            ? "bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg"
                                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                    )}
                                >
                                    <span className="sm:hidden">{mobileLabel}</span>
                                    <span className="hidden sm:inline">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Desktop Table - Hidden on mobile */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="hidden md:block relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                >
                    {/* Table Header with Gradient */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-purple-500/10">
                        <div className="col-span-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.positions.table.title')}</div>
                        <div className="col-span-4 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.positions.table.description')}</div>
                        <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.positions.table.staff')}</div>
                        <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.positions.table.status')}</div>
                        <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.positions.table.actions')}</div>
                    </div>
                    <div className="divide-y divide-border/30">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center gap-3 text-muted-foreground">
                                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                    {t('layout.common.loading')}
                                </div>
                            </div>
                        ) : positionList.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center">
                                    <Briefcase className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className="text-foreground font-semibold">{t('admin.hr.positions.messages.not_found')}</h3>
                                <p className="text-muted-foreground text-sm mt-1">{t('admin.hr.positions.messages.create_first')}</p>
                            </div>
                        ) : positionList.map((pos: any, idx: number) => (
                            <motion.div
                                key={pos.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-transparent transition-all group"
                            >
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                        <Briefcase size={14} />
                                    </div>
                                    <span className="font-semibold text-foreground">{pos.title}</span>
                                </div>
                                <div className="col-span-4 text-sm text-muted-foreground truncate">{pos.description || '-'}</div>
                                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                                    <Users size={14} className="text-blue-600 dark:text-blue-400" />
                                    <span className="font-semibold text-foreground">{pos.employees_count || 0}</span>
                                </div>
                                <div className="col-span-1">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                                        pos.is_active
                                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                            : "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", pos.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                        {pos.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(pos)} className="h-7 w-7 p-0 hover:bg-purple-500/20 hover:text-purple-600"><Edit size={12} /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(pos.id)} className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-600"><Trash2 size={12} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Mobile Cards - Hidden on desktop */}
                <div className="md:hidden space-y-2">
                    {isLoading ? (
                        <div className="p-6 text-center text-muted-foreground text-sm">
                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            {t('layout.common.loading')}
                        </div>
                    ) : positionList.length === 0 ? (
                        <div className="p-8 text-center bg-card/50 rounded-xl border border-border/50">
                            <Briefcase className="w-10 h-10 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">{t('admin.hr.positions.messages.not_found')}</p>
                        </div>
                    ) : (
                        positionList.map((pos: any, idx: number) => (
                            <motion.div
                                key={pos.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-500/20 flex-shrink-0">
                                            <Briefcase size={12} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-foreground text-sm truncate">{pos.title}</div>
                                            <div className="text-[10px] text-muted-foreground truncate">{pos.description || t('admin.hr.positions.table.no_desc')}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(pos)} className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-600">
                                            <Edit size={14} />
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(pos.id)} className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-600">
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                                        pos.is_active
                                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                            : "bg-red-500/20 text-red-600 dark:text-red-400"
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", pos.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                        {pos.is_active ? t('admin.hr.positions.filters.active') : t('admin.hr.positions.filters.inactive')}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                        <Users size={10} />
                                        {pos.employees_count || 0} {t('admin.hr.positions.stats.staff')}
                                    </span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingPosition ? t('admin.hr.positions.modal.edit_title') : t('admin.hr.positions.modal.create_title')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label={t('admin.hr.positions.modal.title') as string}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        className="h-10 text-sm"
                        placeholder={t('admin.hr.positions.modal.placeholder.title') as string}
                    />

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">{t('admin.hr.positions.modal.description')}</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder={t('admin.hr.positions.modal.placeholder.description') as string}
                            className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-border/50">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded bg-background border-input text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer select-none">
                            {t('admin.hr.positions.modal.active_status')}
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={closeModal} className="flex-1">{t('admin.hr.positions.modal.cancel')}</Button>
                        <Button type="submit" variant="primary" className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-md">
                            {editingPosition ? t('admin.hr.positions.modal.update') : t('admin.hr.positions.modal.create')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
