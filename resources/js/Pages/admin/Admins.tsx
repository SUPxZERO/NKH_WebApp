import React, { useState, useMemo } from 'react';
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

const AdminStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Total Admins</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{stats?.total || 0}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Active</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats?.active || 0}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider font-medium">Inactive</p>
                    <p className="text-2xl font-bold text-muted-foreground mt-1">{stats?.inactive || 0}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
        </div>
    </div>
);

export default function Admins() {
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
            let url = `/admin/admin-users?page=${page}&per_page=${perPage}`;
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
        queryFn: () => apiGet('/admin/admin-users/stats')
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
        mutationFn: (data: any) => apiPost('/api/admin/admin-users', data),
        onSuccess: () => {
            toastSuccess('Admin created successfully');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['admin/users'] });
            qc.invalidateQueries({ queryKey: ['admin/users/stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to create admin')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/api/admin/admin-users/${id}`, data),
        onSuccess: () => {
            toastSuccess('Admin updated successfully');
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['admin/users'] });
            qc.invalidateQueries({ queryKey: ['admin/users/stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to update admin')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/admin-users/${id}`),
        onSuccess: () => {
            toastSuccess('Admin deactivated');
            qc.invalidateQueries({ queryKey: ['admin/users'] });
            qc.invalidateQueries({ queryKey: ['admin/users/stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to deactivate admin')
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
        if (confirm('Are you sure you want to deactivate this admin?')) deleteMutation.mutate(id);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-6 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-violet-500/10 dark:bg-violet-500/20 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 dark:from-purple-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent tracking-tight">
                                Admin Users
                            </h1>
                            <p className="text-muted-foreground mt-1">Manage system administrators and access</p>
                        </div>
                        <Button onClick={() => { resetForm(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" /> Add New Admin
                        </Button>
                    </div>

                    <AdminStatsRibbon stats={stats} />

                    {/* Filters */}
                    <div className="bg-card border border-border rounded-xl p-4 mb-6 backdrop-blur-sm">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                            </div>
                            <div className="flex gap-2">
                                {['all', 'active', 'inactive'].map((status) => (
                                    <button key={status} onClick={() => setStatusFilter(status)}
                                        className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
                                            statusFilter === status ? "bg-purple-600 text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80")}>
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm">
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary text-xs font-semibold text-muted-foreground uppercase">
                            <div className="col-span-3">Admin User</div>
                            <div className="col-span-3">Contact</div>
                            <div className="col-span-2">Role</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        <div className="divide-y divide-border">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted-foreground">Loading...</div>
                            ) : adminList.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-foreground font-medium">No admin users found</h3>
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
                                                {admin.is_active ? 'Active' : 'Inactive'}
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
                                <div className="text-sm text-muted-foreground">
                                    Page {page} of {(adminsData as any).last_page}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                        className="border-border"><ChevronLeft className="w-4 h-4" /></Button>
                                    <Button variant="secondary" size="sm" disabled={page === (adminsData as any).last_page} onClick={() => setPage(p => p + 1)}
                                        className="border-border"><ChevronRight className="w-4 h-4" /></Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal isOpen={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                title={editingAdmin ? 'Edit Admin User' : 'Create New Admin'} className="max-w-md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required className="bg-card border-border text-foreground" />
                    <Input label="Email Address" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required className="bg-card border-border text-foreground" />

                    <Input label="Phone Number (Optional)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required={!editingAdmin}
                        className="bg-card border-border text-foreground" />

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="admin">Administrator</option>
                            <option value="manager">Manager</option>
                            <option value="super-admin">Super Admin</option>
                        </select>
                    </div>

                    <Input label={editingAdmin ? "New Password (Leave blank to keep current)" : "Password"}
                        type="password" value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingAdmin}
                        className="bg-card border-border text-foreground" />

                    {editingAdmin && (
                        <div className="flex items-center gap-2 mt-2">
                            <label className="text-foreground/80 text-sm">Status:</label>
                            <button type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={cn("px-3 py-1 rounded text-xs font-bold transition-colors",
                                    formData.is_active ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-red-500/20 text-red-600 dark:text-red-400")}>
                                {formData.is_active ? 'Active' : 'Inactive'}
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); setOpenEdit(false); }}
                            className="flex-1 border-border hover:bg-secondary">Cancel</Button>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-1 bg-purple-600 hover:bg-purple-700">
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingAdmin ? 'Update Admin' : 'Create Admin')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
