import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Edit, Trash2, Truck, Phone, Mail,
    MapPin, CheckCircle, XCircle, Package, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { Location } from '@/app/types/domain';

// StatCard Component with vibrant gradients
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
    const { t } = useLanguage();
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
                "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
                `bg-gradient-to-br ${styles.gradient}`,
                styles.border,
                `shadow-lg ${styles.shadow}`
            )}
        >
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
            </div>
            <div className="relative p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
                        <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
                    </div>
                    <div className={cn("p-3 rounded-xl shadow-lg", styles.iconBg)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Stats Ribbon
const SupplierStatsRibbon = ({ stats }: { stats: any }) => {
    const { t } = useLanguage();
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard title={t('admin.suppliers.stats.total')} value={stats.total} icon={Truck} color="purple" index={0} />
            <StatCard title={t('admin.suppliers.stats.active')} value={stats.active} icon={CheckCircle} color="emerald" index={1} />
            <StatCard title={t('admin.suppliers.stats.food')} value={stats.food} icon={Package} color="blue" index={2} />
            <StatCard title={t('admin.suppliers.stats.beverages')} value={stats.beverage} icon={FileText} color="amber" index={3} />
        </div>
    );
};

export default function Suppliers() {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        location_id: '', code: '', name: '', contact_name: '', contact_phone: '',
        email: '', phone: '', address: '', type: 'produce',
        payment_terms: '', notes: '', tax_id: '', is_active: true
    });

    // Fetch Data
    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers', page, search, statusFilter, typeFilter],
        queryFn: () => {
            let url = `/api/admin/suppliers?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            if (typeFilter !== 'all') url += `&type=${typeFilter}`;
            return apiGet(url);
        }
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/admin/locations')
    });

    const { data: statsData } = useQuery({
        queryKey: ['supplier-stats'],
        queryFn: () => apiGet('/api/admin/suppliers-stats')
    });

    const supplierList = useMemo(() => suppliers?.data || [], [suppliers]);

    const stats = useMemo(() => ({
        total: statsData?.total ?? suppliers?.meta?.total ?? supplierList.length,
        active: statsData?.active ?? supplierList.filter((s: any) => s.is_active).length,
        food: statsData?.food ?? supplierList.filter((s: any) => s.type === 'food_produce').length,
        beverage: statsData?.beverage ?? supplierList.filter((s: any) => s.type === 'beverages').length
    }), [supplierList, suppliers, statsData]);

    const supplierTypes = {
        food_produce: t('admin.suppliers.types.food_produce'),
        beverages: t('admin.suppliers.types.beverages'),
        meat_seafood: t('admin.suppliers.types.meat_seafood'),
        dairy: t('admin.suppliers.types.dairy'),
        equipment: t('admin.suppliers.types.equipment'),
        supplies: t('admin.suppliers.types.supplies'),
        cleaning: t('admin.suppliers.types.cleaning'),
        utilities: t('admin.suppliers.types.utilities'),
        services: t('admin.suppliers.types.services'),
        other: t('admin.suppliers.types.other')
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/suppliers', data),
        onSuccess: () => { toastSuccess(t('admin.suppliers.created') as string); closeModal(); qc.invalidateQueries({ queryKey: ['suppliers'] }); qc.invalidateQueries({ queryKey: ['supplier-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.suppliers.failed') as string)
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/suppliers/${id}`, data),
        onSuccess: () => { toastSuccess(t('admin.suppliers.updated') as string); closeModal(); qc.invalidateQueries({ queryKey: ['suppliers'] }); qc.invalidateQueries({ queryKey: ['supplier-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.suppliers.failed') as string)
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/suppliers/${id}`),
        onSuccess: () => { toastSuccess(t('admin.suppliers.deleted') as string); qc.invalidateQueries({ queryKey: ['suppliers'] }); qc.invalidateQueries({ queryKey: ['supplier-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.suppliers.failed') as string)
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingSupplier(null);
        setFormData({
            location_id: '', code: '', name: '', contact_name: '', contact_phone: '',
            email: '', phone: '', address: '', type: 'food_produce',
            payment_terms: '', notes: '', tax_id: '', is_active: true
        });
    };

    const handleEdit = (supplier: any) => {
        setEditingSupplier(supplier);
        setFormData({
            location_id: supplier.location_id?.toString() || '',
            code: supplier.code,
            name: supplier.name,
            contact_name: supplier.contact_name || '',
            contact_phone: supplier.contact_phone || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            type: supplier.type,
            payment_terms: supplier.payment_terms || '',
            notes: supplier.notes || '',
            tax_id: supplier.tax_id || '',
            is_active: supplier.is_active
        });
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('admin.suppliers.delete_confirm'))) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            location_id: formData.location_id ? parseInt(formData.location_id) : null
        };
        if (editingSupplier) updateMutation.mutate({ id: editingSupplier.id, data });
        else createMutation.mutate(data);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-6">
                {/* Decorative Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent"
                        >
                            {t('admin.suppliers.title')}
                        </motion.h1>
                        <p className="text-muted-foreground mt-1">{t('admin.suppliers.subtitle')}</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} variant="primary">
                        <Plus className="w-4 h-4 mr-2" /> {t('admin.suppliers.add_supplier')}
                    </Button>
                </div>

                <SupplierStatsRibbon stats={stats} />

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative bg-card/50 border border-border/50 rounded-2xl p-4 mb-6 backdrop-blur-sm shadow-lg"
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input placeholder={t('admin.suppliers.filters.search')} value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10" variant="filled" />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { key: 'all', label: t('admin.suppliers.filters.all_status') },
                                { key: 'active', label: t('admin.suppliers.filters.active') },
                                { key: 'inactive', label: t('admin.suppliers.filters.inactive') }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                                        statusFilter === key
                                            ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30"
                                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all">
                            <option value="all">{t('admin.suppliers.filters.all_types')}</option>
                            {Object.entries(supplierTypes).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                >
                    {/* Table Header with Gradient */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
                        <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.suppliers.table.name_code')}</div>
                        <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.suppliers.table.contact')}</div>
                        <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.suppliers.table.type')}</div>
                        <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.suppliers.table.status')}</div>
                        <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.suppliers.table.actions')}</div>
                    </div>
                    <div className="divide-y divide-border/30">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center gap-3 text-muted-foreground">
                                    <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                                    {t('admin.suppliers.table.loading')}
                                </div>
                            </div>
                        ) : supplierList.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Truck className="w-8 h-8 text-fuchsia-500" />
                                </div>
                                <h3 className="text-foreground font-semibold">{t('admin.suppliers.table.empty_title')}</h3>
                                <p className="text-muted-foreground text-sm mt-1">{t('admin.suppliers.table.empty_desc')}</p>
                            </div>
                        ) : supplierList.map((supplier: any, idx: number) => (
                            <motion.div
                                key={supplier.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-fuchsia-500/5 hover:to-transparent transition-all group"
                            >
                                <div className="col-span-3">
                                    <div className="font-semibold text-foreground">{supplier.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{supplier.code}</div>
                                </div>
                                <div className="col-span-3 text-sm">
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Phone size={12} className="text-fuchsia-500" /> {supplier.phone || t('admin.common.na')}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                        <Mail size={12} className="text-fuchsia-500" /> {supplier.email || t('admin.common.na')}
                                    </div>
                                </div>
                                <div className="col-span-3">
                                    <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/30">
                                        {supplierTypes[supplier.type as keyof typeof supplierTypes] || supplier.type || t('admin.suppliers.types.unknown')}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1",
                                        supplier.is_active
                                            ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                            : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                                    )}>
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full",
                                            supplier.is_active ? "bg-emerald-500" : "bg-red-500"
                                        )} />
                                        {supplier.is_active ? t('admin.suppliers.filters.active') : t('admin.suppliers.filters.inactive')}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(supplier)}
                                        className="h-8 w-8 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500">
                                        <Edit className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(supplier.id)}
                                        className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {suppliers?.meta && (
                        <div className="flex items-center justify-between p-4 border-t border-border/50 bg-gradient-to-r from-transparent via-fuchsia-500/5 to-transparent">
                            <div className="text-sm text-muted-foreground">
                                {t('admin.suppliers.table.showing')} <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}</span> {t('admin.suppliers.table.to')}{' '}
                                <span className="font-semibold text-foreground">{Math.min(page * perPage, suppliers.meta.total)}</span> {t('admin.suppliers.table.of')}{' '}
                                <span className="font-semibold text-fuchsia-500">{suppliers.meta.total}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === 1}
                                    onClick={() => setPage(p => p - 1)}
                                    className="hover:bg-fuchsia-500/20 hover:text-fuchsia-500 hover:border-fuchsia-500/30"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                {Array.from({ length: Math.min(suppliers.meta.last_page, 5) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? "primary" : "secondary"}
                                            size="sm"
                                            onClick={() => setPage(pageNum)}
                                            className={cn("min-w-[36px]", page === pageNum && "shadow-lg shadow-fuchsia-500/30")}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page === suppliers.meta.last_page}
                                    onClick={() => setPage(p => p + 1)}
                                    className="hover:bg-fuchsia-500/20 hover:text-fuchsia-500 hover:border-fuchsia-500/30"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingSupplier ? t('admin.suppliers.edit_supplier') : t('admin.suppliers.new_supplier')} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('admin.suppliers.form.code')} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                        <Input label={t('admin.suppliers.form.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.suppliers.form.type')}</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                                {Object.entries(supplierTypes).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.suppliers.form.location')}</label>
                            <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                                <option value="">{t('admin.suppliers.form.no_location')}</option>
                                {locations?.data?.map((l: Location) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('admin.suppliers.form.phone')} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        <Input label={t('admin.suppliers.form.email')} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t('admin.suppliers.form.contact_name')} value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
                        <Input label={t('admin.suppliers.form.contact_phone')} value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} />
                    </div>
                    <Input label={t('admin.suppliers.form.address')} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded bg-white dark:bg-slate-950 border-gray-300 dark:border-white/20" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{t('admin.suppliers.form.active')}</span>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">{t('admin.suppliers.form.cancel')}</Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">{t('admin.suppliers.form.save')}</Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
