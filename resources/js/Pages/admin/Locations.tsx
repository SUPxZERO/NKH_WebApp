import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Edit, Trash2, MapPin, Phone,
    Globe, Truck, ShoppingBag, CheckCircle, XCircle, Building2, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import AddressPicker, { AddressData } from '@/app/components/customer/AddressPicker';
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
                        <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold", styles.text)}>{value}</p>
                    </div>
                    <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

// Stats Ribbon - Mobile optimized
const LocationStatsRibbon = ({ stats }: { stats: any }) => {
    const { t } = useLanguage();
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            <StatCard title={t('admin.locations.stats.locations')} value={stats.total} icon={Building2} color="purple" index={0} />
            <StatCard title={t('admin.locations.stats.active')} value={stats.active} icon={CheckCircle} color="emerald" index={1} />
            <StatCard title={t('admin.locations.stats.online')} value={stats.online} icon={Globe} color="blue" index={2} />
            <StatCard title={t('admin.locations.stats.delivery')} value={stats.delivery} icon={Truck} color="amber" index={3} />
        </div>
    );
};

// LocationCard - Mobile optimized
const LocationCard = ({ loc, onEdit, onDelete }: { loc: any, onEdit: (loc: any) => void, onDelete: (id: number) => void }) => {
    const { t } = useLanguage();
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm shadow-lg"
        >
            <div className="flex justify-between items-start gap-2 mb-2 sm:mb-3">
                <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{loc.name}</h3>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mt-0.5">{loc.code}</p>
                </div>
                <span className={cn(
                    "px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold inline-flex items-center gap-1 flex-shrink-0",
                    loc.is_active
                        ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", loc.is_active ? "bg-emerald-500" : "bg-red-500")} />
                    {loc.is_active ? t('admin.locations.table.active') : t('admin.locations.table.inactive')}
                </span>
            </div>

            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center text-xs sm:text-sm text-foreground">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-fuchsia-500 flex-shrink-0" />
                    <span className="truncate">{loc.city || 'N/A'}</span>
                </div>
                {loc.phone && (
                    <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-fuchsia-500 flex-shrink-0" />
                        <span className="truncate">{loc.phone}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-border/50">
                <div className="flex gap-1.5 sm:gap-2">
                    {loc.accepts_online_orders && <div title={t('admin.locations.table.online') as string} className="p-1 sm:p-1.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-500/30"><Globe size={12} className="sm:w-3.5 sm:h-3.5" /></div>}
                    {loc.accepts_pickup && <div title={t('admin.locations.table.pickup') as string} className="p-1 sm:p-1.5 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 rounded-lg text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30"><ShoppingBag size={12} className="sm:w-3.5 sm:h-3.5" /></div>}
                    {loc.accepts_delivery && <div title={t('admin.locations.table.delivery') as string} className="p-1 sm:p-1.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg text-amber-600 dark:text-amber-400 border border-amber-500/30"><Truck size={12} className="sm:w-3.5 sm:h-3.5" /></div>}
                </div>
                <div className="flex gap-1 sm:gap-2">
                    <Button size="sm" variant="ghost" onClick={() => onEdit(loc)} className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500"><Edit size={14} /></Button>
                    <Button size="sm" variant="ghost" onClick={() => onDelete(loc.id)} className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-red-500/20 hover:text-red-500"><Trash2 size={14} /></Button>
                </div>
            </div>
        </motion.div>
    );
};

export default function Locations() {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingLocation, setEditingLocation] = useState<any>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        code: '', name: '', address_line1: '', address_line2: '',
        city: '', state: '', postal_code: '', country: 'Cambodia', phone: '',
        latitude: 0, longitude: 0,
        is_active: true, accepts_online_orders: true, accepts_pickup: true, accepts_delivery: true,
        operating_hours: [] as any[]
    });

    // Helper for days
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Fetch Data
    const { data: locations, isLoading } = useQuery({
        queryKey: ['admin/locations', page, search, statusFilter],
        queryFn: () => {
            let url = `/api/admin/locations?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            return apiGet(url);
        }
    });

    const locationList = useMemo(() => locations?.data || [], [locations]);

    const stats = useMemo(() => ({
        total: locations?.meta?.total || locationList.length,
        active: locationList.filter((l: any) => l.is_active).length,
        online: locationList.filter((l: any) => l.accepts_online_orders).length,
        delivery: locationList.filter((l: any) => l.accepts_delivery).length
    }), [locationList, locations]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/locations', data),
        onSuccess: () => { toastSuccess(t('admin.locations.messages.created') as string); closeModal(); qc.invalidateQueries({ queryKey: ['admin/locations'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.locations.messages.failed') as string)
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/locations/${id}`, data),
        onSuccess: () => { toastSuccess(t('admin.locations.messages.updated') as string); closeModal(); qc.invalidateQueries({ queryKey: ['admin/locations'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.locations.messages.failed') as string)
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/locations/${id}`),
        onSuccess: () => { toastSuccess(t('admin.locations.messages.deleted') as string); qc.invalidateQueries({ queryKey: ['admin/locations'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.locations.messages.failed') as string)
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingLocation(null);
        setFormData({
            code: '', name: '', address_line1: '', address_line2: '',
            city: '', state: '', postal_code: '', country: 'Cambodia', phone: '',
            latitude: 0, longitude: 0,
            is_active: true, accepts_online_orders: true, accepts_pickup: true, accepts_delivery: true,
            operating_hours: []
        });
    };

    const handleEdit = (loc: any) => {
        setEditingLocation(loc);
        setFormData({
            code: loc.code, name: loc.name, address_line1: loc.address_line1 || '', address_line2: loc.address_line2 || '',
            city: loc.city || '', state: loc.state || '', postal_code: loc.postal_code || '', country: loc.country || 'Cambodia',
            phone: loc.phone || '', is_active: loc.is_active,
            latitude: loc.latitude ? parseFloat(loc.latitude) : 0,
            longitude: loc.longitude ? parseFloat(loc.longitude) : 0,
            accepts_online_orders: loc.accepts_online_orders, accepts_pickup: loc.accepts_pickup, accepts_delivery: loc.accepts_delivery,
            operating_hours: loc.operating_hours || []
        });
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('admin.locations.messages.confirm_delete') as string)) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLocation) updateMutation.mutate({ id: editingLocation.id, data: formData });
        else createMutation.mutate(formData);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
                {/* Decorative Background Elements - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
                    <div className="min-w-0">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent truncate"
                        >
                            {t('admin.locations.title')}
                        </motion.h1>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('admin.locations.subtitle')}</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} variant="primary" className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0">
                        <Plus className="w-4 h-4 sm:mr-2" />
                        <span className="hidden sm:inline">{t('admin.locations.add')}</span>
                    </Button>
                </div>

                <LocationStatsRibbon stats={stats} />

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
                >
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input placeholder={t('admin.locations.filters.search') as string} value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 h-10 text-sm" variant="filled" />
                        </div>
                        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
                            {[
                                { key: 'all', label: t('admin.locations.filters.all') },
                                { key: 'active', label: t('admin.locations.filters.active') },
                                { key: 'inactive', label: t('admin.locations.filters.inactive') }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setStatusFilter(key)}
                                    className={cn(
                                        "px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0",
                                        statusFilter === key
                                            ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30"
                                            : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Table (Desktop) */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="hidden lg:block relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                >
                    {/* Table Header with Gradient */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
                        <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.locations.table.location')}</div>
                        <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.locations.table.contact')}</div>
                        <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.locations.table.services')}</div>
                        <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.locations.table.status')}</div>
                        <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.locations.table.actions')}</div>
                    </div>
                    <div className="divide-y divide-border/30">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center gap-3 text-muted-foreground">
                                    <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                                    {t('admin.locations.table.loading')}
                                </div>
                            </div>
                        ) : locationList.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                    <Building2 className="w-8 h-8 text-fuchsia-500" />
                                </div>
                                <h3 className="text-foreground font-semibold">{t('admin.locations.empty.no_locations')}</h3>
                                <p className="text-muted-foreground text-sm mt-1">{t('admin.locations.empty.add_first')}</p>
                            </div>
                        ) : locationList.map((loc: any, idx: number) => (
                            <motion.div
                                key={loc.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-fuchsia-500/5 hover:to-transparent transition-all group"
                            >
                                <div className="col-span-3">
                                    <div className="font-semibold text-foreground">{loc.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{loc.code}</div>
                                </div>
                                <div className="col-span-3 text-sm">
                                    <div className="flex items-center gap-2 text-foreground"><MapPin size={12} className="text-fuchsia-500" /> {loc.city}</div>
                                    {loc.phone && <div className="flex items-center gap-2 mt-1 text-muted-foreground"><Phone size={12} className="text-fuchsia-500" /> {loc.phone}</div>}
                                </div>
                                <div className="col-span-3 flex gap-2">
                                    {loc.accepts_online_orders && <div title={t('admin.locations.table.online') as string} className="p-1.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-500/30"><Globe size={14} /></div>}
                                    {loc.accepts_pickup && <div title={t('admin.locations.table.pickup') as string} className="p-1.5 bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 rounded-lg text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30"><ShoppingBag size={14} /></div>}
                                    {loc.accepts_delivery && <div title={t('admin.locations.table.delivery') as string} className="p-1.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg text-amber-600 dark:text-amber-400 border border-amber-500/30"><Truck size={14} /></div>}
                                </div>
                                <div className="col-span-2">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1",
                                        loc.is_active
                                            ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                            : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", loc.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                        {loc.is_active ? t('admin.locations.table.active') : t('admin.locations.table.inactive')}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <Button size="sm" variant="ghost" onClick={() => handleEdit(loc)} className="h-8 w-8 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500"><Edit size={14} /></Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(loc.id)} className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Mobile/Tablet Cards */}
                <div className="lg:hidden space-y-3 sm:space-y-4">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center gap-3 text-muted-foreground">
                                <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                                {t('admin.locations.table.loading')}
                            </div>
                        </div>
                    ) : locationList.length === 0 ? (
                        <div className="bg-card/50 rounded-2xl p-12 text-center border border-border/50 backdrop-blur-sm">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                                <Building2 className="w-8 h-8 text-fuchsia-500" />
                            </div>
                            <h3 className="text-foreground font-semibold">{t('admin.locations.empty.no_locations')}</h3>
                            <p className="text-muted-foreground text-sm mt-1">{t('admin.locations.empty.add_first')}</p>
                        </div>
                    ) : (
                        locationList.map((loc: any) => (
                            <LocationCard key={loc.id} loc={loc} onEdit={handleEdit} onDelete={handleDelete} />
                        ))
                    )}
                </div>

                {/* Pagination - Mobile optimized */}
                {locations?.meta && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 mt-4 sm:mt-6 bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                        <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                            <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}</span>-<span className="font-semibold text-foreground">{Math.min(page * perPage, locations.meta.total)}</span>
                            <span className="mx-1">of</span>
                            <span className="font-semibold text-fuchsia-500">{locations.meta.total}</span>
                        </div>
                        <div className="flex gap-1 sm:gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500 hover:border-fuchsia-500/30"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            {/* Show fewer page numbers on mobile */}
                            <div className="hidden sm:flex gap-1">
                                {Array.from({ length: Math.min(locations.meta.last_page || 1, 5) }, (_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? "primary" : "secondary"}
                                            size="sm"
                                            onClick={() => setPage(pageNum)}
                                            className={cn("min-w-[36px] h-9", page === pageNum && "shadow-lg shadow-fuchsia-500/30")}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            {/* Simple page indicator on mobile */}
                            <div className="sm:hidden flex items-center px-3 text-sm font-medium">
                                {page} / {locations.meta.last_page || 1}
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={page === (locations.meta.last_page || 1)}
                                onClick={() => setPage(p => p + 1)}
                                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500 hover:border-fuchsia-500/30"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingLocation ? t('admin.locations.modal.edit') : t('admin.locations.modal.new')} size="lg">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {/* Address Picker */}
                    <AddressPicker
                        label={t('admin.locations.modal.pin_location') as string}
                        initialAddress={formData.address_line1 ? `${formData.address_line1}, ${formData.city}` : ''}
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                        onChange={(data) => {
                            if (data) {
                                setFormData(prev => ({
                                    ...prev,
                                    address_line1: data.address_line_1 || prev.address_line1,
                                    city: data.city || prev.city,
                                    postal_code: data.postal_code || prev.postal_code,
                                    latitude: data.lat,
                                    longitude: data.lng,
                                    country: data.country || prev.country
                                }));
                            }
                        }}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Input label={t('admin.locations.modal.code') as string} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required className="h-10 text-sm" />
                        <Input label={t('admin.locations.modal.name') as string} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-10 text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Input label={t('admin.locations.modal.phone') as string} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-10 text-sm" />
                        <Input label={t('admin.locations.modal.city') as string} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-10 text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <Input label={t('admin.locations.modal.address') as string} value={formData.address_line1} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} className="sm:col-span-2 h-10 text-sm" />
                        <Input label={t('admin.locations.modal.postal') as string} value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} className="h-10 text-sm" />
                    </div>
                    {/* Operating Hours - Hidden on mobile for simplicity */}
                    <div className="border-t border-gray-200 dark:border-white/10 pt-3 sm:pt-4 hidden sm:block">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">{t('admin.locations.modal.hours.title')}</label>
                        <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {formData.operating_hours.map((hour, index) => (
                                <div key={index} className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
                                    <select
                                        value={hour.day_of_week}
                                        onChange={(e) => {
                                            const newHours = [...formData.operating_hours];
                                            newHours[index].day_of_week = parseInt(e.target.value);
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-white h-9"
                                    >
                                        {days.map((d, i) => <option key={i} value={i}>{d.slice(0, 3)}</option>)}
                                    </select>
                                    <select
                                        value={hour.service_type}
                                        onChange={(e) => {
                                            const newHours = [...formData.operating_hours];
                                            newHours[index].service_type = e.target.value;
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-white h-9"
                                    >
                                        <option value="dine-in">{t('admin.locations.modal.hours.dine')}</option>
                                        <option value="pickup">{t('admin.locations.modal.hours.pick')}</option>
                                        <option value="delivery">{t('admin.locations.modal.hours.deliv')}</option>
                                    </select>
                                    <input
                                        type="time"
                                        value={hour.opening_time?.slice(0, 5)}
                                        onChange={(e) => {
                                            const newHours = [...formData.operating_hours];
                                            newHours[index].opening_time = e.target.value;
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-1.5 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-white h-9 w-20 sm:w-auto"
                                    />
                                    <span className="text-gray-400 text-xs">-</span>
                                    <input
                                        type="time"
                                        value={hour.closing_time?.slice(0, 5)}
                                        onChange={(e) => {
                                            const newHours = [...formData.operating_hours];
                                            newHours[index].closing_time = e.target.value;
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-1.5 py-1.5 text-xs sm:text-sm text-gray-900 dark:text-white h-9 w-20 sm:w-auto"
                                    />
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => {
                                            const newHours = formData.operating_hours.filter((_, i) => i !== index);
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="p-1.5 h-8 w-8"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setFormData({
                                    ...formData,
                                    operating_hours: [
                                        ...formData.operating_hours,
                                        { day_of_week: 1, service_type: 'dine-in', opening_time: '09:00', closing_time: '22:00' }
                                    ]
                                });
                            }}
                            className="w-full h-9 flex items-center justify-center gap-2 border-dashed text-xs sm:text-sm"
                        >
                            <Plus className="w-4 h-4" /> {t('admin.locations.modal.hours.add')}
                        </Button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-white/10 pt-3 sm:pt-4">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">{t('admin.locations.modal.services_status')}</label>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                                <input type="checkbox" checked={formData.accepts_online_orders} onChange={(e) => setFormData({ ...formData, accepts_online_orders: e.target.checked })}
                                    className="rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20 accent-purple-600 w-4 h-4" /> {t('admin.locations.modal.online')}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                                <input type="checkbox" checked={formData.accepts_pickup} onChange={(e) => setFormData({ ...formData, accepts_pickup: e.target.checked })}
                                    className="rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20 accent-purple-600 w-4 h-4" /> {t('admin.locations.modal.pickup')}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
                                <input type="checkbox" checked={formData.accepts_delivery} onChange={(e) => setFormData({ ...formData, accepts_delivery: e.target.checked })}
                                    className="rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20 accent-purple-600 w-4 h-4" /> {t('admin.locations.modal.delivery')}
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-xs sm:text-sm sm:ml-auto">
                                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20 accent-purple-600 w-4 h-4" /> {t('admin.locations.modal.active')}
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11 text-sm">{t('admin.common.cancel') || 'Cancel'}</Button>
                        <Button type="submit" className="flex-1 h-10 sm:h-11 text-sm bg-purple-600 hover:bg-purple-700">{t('layout.actions.save')}</Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout >
    );
}
