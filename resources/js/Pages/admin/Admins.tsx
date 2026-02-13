import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import AdminLayout from '@/app/layouts/AdminLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import { toastSuccess, toastError } from '@/app/utils/toast';
import {
    Plus, Search, Edit, Trash2, Shield, Mail, Phone,
    CheckCircle, XCircle, ChevronLeft, ChevronRight, UserCog
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';

// Stats Ribbon - Mobile optimized with horizontal scroll
const AdminStatsRibbon = ({ stats }: { stats: any }) => {
    const { t } = useLanguage();
    return (
        <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
            <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-4 min-w-max sm:min-w-0">
                <div className="bg-card border border-border rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[110px] sm:min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">{t('admin.people.admins.stats.total')}</p>
                            <p className="text-lg sm:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{stats?.total || 0}</p>
                        </div>
                        <Shield className="w-5 h-5 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[110px] sm:min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">{t('admin.people.admins.stats.active')}</p>
                            <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">{stats?.active || 0}</p>
                        </div>
                        <CheckCircle className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-3 sm:p-4 backdrop-blur-sm min-w-[110px] sm:min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">{t('admin.people.admins.stats.inactive')}</p>
                            <p className="text-lg sm:text-2xl font-bold text-muted-foreground mt-0.5 sm:mt-1">{stats?.inactive || 0}</p>
                        </div>
                        <XCircle className="w-5 h-5 sm:w-8 sm:h-8 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Admins() {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', is_active: true, role: 'admin'
    });
    const qc = useQueryClient();

    const [page, setPage] = useState(1);
    const [perPage] = useState(10);

    // Fetch admins
    const { data: adminsData, isLoading } = useQuery({
        queryKey: ['admin/users', page, search, statusFilter],
        queryFn: async () => {
            let url = `admin/users?page=${page}&per_page=${perPage}`;
            if (search) url += `&search=${search}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            console.log('Fetching admins from:', url);
            try {
                const response = await apiGet(url);
                console.log('Admins API response:', response);
                return response;
            } catch (error) {
                console.error('Admins API error:', error);
                throw error;
            }
        }
    });

    const { data: stats } = useQuery({
        queryKey: ['admin/users/stats'],
        queryFn: () => apiGet('admin/users/stats')
    });

    const adminList = useMemo(() => {
        if (!adminsData) return [];
        // Handle direct array (if API unwraps it completely)
        if (Array.isArray(adminsData)) return adminsData;
        // Handle Laravel legacy Paginator structure { data: [...], ... }
        if (Array.isArray((adminsData as any)?.data)) return (adminsData as any).data;
        // Handle Resource Collection structure { data: [...], meta: ... }
        if (Array.isArray((adminsData as any)?.data?.data)) return (adminsData as any).data.data;

        console.warn('Unexpected admin data structure:', adminsData);
        return [];
    }, [adminsData]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('admin/users', data),
        onSuccess: () => {
            toastSuccess(t('admin.people.admins.created') as string);
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['admin/users'] });
            qc.invalidateQueries({ queryKey: ['admin/users/stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || t('admin.people.admins.create_failed') as string)
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`admin/users/${id}`, data),
        onSuccess: () => {
            toastSuccess(t('admin.people.admins.updated') as string);
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['admin/users'] });
            qc.invalidateQueries({ queryKey: ['admin/users/stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || t('admin.people.admins.update_failed') as string)
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`admin/users/${id}`),
        onSuccess: () => {
            toastSuccess(t('admin.people.admins.deactivated') as string);
            qc.invalidateQueries({ queryKey: ['admin/users'] });
            qc.invalidateQueries({ queryKey: ['admin/users/stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || t('admin.people.admins.deactivate_failed') as string)
    });

    const resetForm = () => {
        setFormData({ name: '', email: '', phone: '', password: '', is_active: true, role: 'admin' });
        setEditingAdmin(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAdmin) updateMutation.mutate({ id: editingAdmin.id, data: formData });
        else createMutation.mutate(formData);
    };

    const handleEdit = (admin: any) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            email: admin.email,
            phone: admin.phone || '',
            password: '', // Don't fill password
            is_active: !!admin.is_active,
            role: admin.roles && admin.roles.length > 0 ? admin.roles[0].slug : (admin.role || 'admin')
        });
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('admin.people.admins.confirm_deactivate') as string)) deleteMutation.mutate(id);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
                {/* Decorative background elements - Hidden on mobile */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 dark:from-purple-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent tracking-tight truncate">
                                {t('admin.people.admins.title')}
                            </h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">{t('admin.people.admins.subtitle')}</p>
                        </div>
                        <Button onClick={() => { resetForm(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0">
                            <Plus className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">{t('admin.people.admins.add_admin')}</span>
                        </Button>
                    </div>

                    <AdminStatsRibbon stats={stats} />

                    {/* Filters */}
                    <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm">
                        <div className="flex gap-2 sm:gap-4">
                            <div className="relative flex-1 min-w-0">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input placeholder={t('common.search') as string} value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                            </div>
                            <div className="flex gap-1.5 sm:gap-2">
                                {['all', 'active', 'inactive'].map((status) => (
                                    <button key={status} onClick={() => setStatusFilter(status)}
                                        className={cn("px-2.5 sm:px-4 py-2 h-10 rounded-lg text-xs sm:text-sm font-medium transition-all capitalize flex-shrink-0",
                                            statusFilter === status ? "bg-purple-600 text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}>
                                        {status === 'all' ? t('admin.menu.stats.total') : status === 'active' ? t('admin.menu.stats.active') : t('admin.menu.stats.inactive')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table - Hidden on mobile */}
                    <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary text-xs font-semibold text-muted-foreground uppercase">
                            <div className="col-span-3">{t('admin.people.admins.table.admin')}</div>
                            <div className="col-span-3">{t('admin.people.admins.table.contact')}</div>
                            <div className="col-span-2">{t('admin.people.admins.table.role')}</div>
                            <div className="col-span-2">{t('admin.people.admins.table.status')}</div>
                            <div className="col-span-2 text-right">{t('admin.people.admins.table.actions')}</div>
                        </div>

                        <div className="divide-y divide-border">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted-foreground">{t('common.loading')}</div>
                            ) : adminList.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-foreground font-medium">{t('admin.people.admins.empty')}</h3>
                                </div>
                            ) : (
                                adminList.map((admin: any) => (
                                    <motion.div key={admin.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/50 transition-colors group">
                                        <div className="col-span-3 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <UserCog className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-foreground">{admin.name}</div>
                                                <div className="text-xs text-muted-foreground">Since {new Date(admin.created_at).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="text-sm text-foreground/80 flex items-center gap-2"><Mail className="w-3 h-3" /> {admin.email}</div>
                                            {admin.phone && <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1"><Phone className="w-3 h-3" /> {admin.phone}</div>}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                                                {admin.roles && admin.roles.length > 0 ? admin.roles[0].name || admin.roles[0].slug : (admin.role || 'Admin')}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className={cn("px-2.5 py-1 rounded-full border text-xs font-medium",
                                                admin.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20")}>
                                                {admin.is_active ? t('admin.menu.stats.active') : t('admin.menu.stats.inactive')}
                                            </span>
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(admin)}
                                                className="h-8 w-8 p-0 border-border"><Edit className="w-3 h-3" /></Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(admin.id)}
                                                className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400"><Trash2 className="w-3 h-3" /></Button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {(adminsData as any)?.last_page > 1 && (
                            <div className="flex items-center justify-between p-4 border-t border-border bg-secondary">
                                <div className="text-sm text-muted-foreground">Page {page} of {(adminsData as any).last_page}</div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                        className="border-border"><ChevronLeft className="w-4 h-4" /></Button>
                                    <Button variant="secondary" size="sm" disabled={page === (adminsData as any).last_page} onClick={() => setPage(p => p + 1)}
                                        className="border-border"><ChevronRight className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Cards - Hidden on desktop */}
                    <div className="md:hidden space-y-2">
                        {isLoading ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                {t('common.loading')}
                            </div>
                        ) : adminList.length === 0 ? (
                            <div className="p-8 text-center bg-card rounded-xl border border-border">
                                <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground text-sm">{t('admin.people.admins.empty')}</p>
                            </div>
                        ) : (
                            adminList.map((admin: any) => (
                                <motion.div
                                    key={admin.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card border border-border rounded-xl p-3 backdrop-blur-sm"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                                <UserCog className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-foreground text-sm truncate">{admin.name}</div>
                                                <div className="text-[10px] text-muted-foreground truncate">{admin.email}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(admin)}
                                                className="h-8 w-8 p-0 border-border"><Edit className="w-3.5 h-3.5" /></Button>
                                            <Button size="sm" variant="danger" onClick={() => handleDelete(admin.id)}
                                                className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400"><Trash2 className="w-3.5 h-3.5" /></Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 capitalize">
                                            {admin.roles && admin.roles.length > 0 ? admin.roles[0].name || admin.roles[0].slug : (admin.role || 'Admin')}
                                        </span>
                                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium",
                                            admin.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400")}>
                                            {admin.is_active ? t('admin.menu.stats.active') : t('admin.menu.stats.inactive')}
                                        </span>
                                    </div>
                                </motion.div>
                            ))
                        )}

                        {/* Mobile Pagination */}
                        {(adminsData as any)?.last_page > 1 && (
                            <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl">
                                <div className="text-xs text-muted-foreground">Page {page}/{(adminsData as any).last_page}</div>
                                <div className="flex gap-1">
                                    <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                        className="h-8 w-8 p-0"><ChevronLeft className="w-4 h-4" /></Button>
                                    <Button variant="secondary" size="sm" disabled={page === (adminsData as any).last_page} onClick={() => setPage(p => p + 1)}
                                        className="h-8 w-8 p-0"><ChevronRight className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                title={editingAdmin ? t('admin.people.admins.edit_admin') : t('admin.people.admins.new_admin')} className="max-w-md">
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    <Input label={t('auth.full_name') as string} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required className="bg-card border-border text-foreground h-10 text-sm" />
                    <Input label={t('auth.email_label') as string} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required className="bg-card border-border text-foreground h-10 text-sm" />

                    <Input label={t('auth.phone_label') as string} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required={!editingAdmin}
                        className="bg-card border-border text-foreground h-10 text-sm" />

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">{t('admin.people.admins.table.role')}</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="admin">{t('admin.people.admins.roles.admin')}</option>
                            <option value="manager">{t('admin.people.admins.roles.manager')}</option>
                            <option value="super-admin">{t('admin.people.admins.roles.super_admin')}</option>
                        </select>
                    </div>

                    <Input label={editingAdmin ? t('auth.new_password_title') as string : t('auth.password_label') as string}
                        type="password" value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingAdmin}
                        className="bg-card border-border text-foreground h-10 text-sm" />

                    {editingAdmin && (
                        <div className="flex items-center gap-2">
                            <label className="text-foreground/80 text-xs sm:text-sm">{t('admin.people.admins.table.status')}:</label>
                            <button type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={cn("px-3 py-1 rounded text-xs font-bold transition-colors",
                                    formData.is_active ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/20 text-red-600 dark:text-red-400")}>
                                {formData.is_active ? t('admin.menu.stats.active') : t('admin.menu.stats.inactive')}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                        <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); setOpenEdit(false); }}
                            className="flex-1 h-10 sm:h-11 text-sm border-border hover:bg-secondary">{t('common.cancel')}</Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-1 h-10 sm:h-11 text-sm bg-purple-600 hover:bg-purple-700">
                            {createMutation.isPending || updateMutation.isPending ? t('customer.profile.saving') : (editingAdmin ? t('common.save') : t('layout.actions.create'))}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
