import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Edit, Trash2, Shield, Users, Lock, CheckCircle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon
const RoleStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Roles</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Shield className="w-8 h-8 text-purple-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Assigned Users</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.users}</p>
                </div>
                <Users className="w-8 h-8 text-emerald-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Permissions</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{stats.permissions}</p>
                </div>
                <Lock className="w-8 h-8 text-blue-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Avg Perms/Role</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{stats.avgPerms}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-amber-400" />
            </div>
        </div>
    </div>
);

export default function Roles() {
    const [search, setSearch] = useState('');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    const qc = useQueryClient();

    const [formData, setFormData] = useState({
        name: '', description: '', permissions: [] as number[]
    });

    // Fetch Data
    const { data: rolesData, isLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => apiGet('/api/admin/roles')
    });

    const { data: permissionsData } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => apiGet('/api/admin/permissions/all')
    });

    const roles = useMemo(() => {
        if (!rolesData?.data) return [];
        return rolesData.data.filter((r: any) =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            r.slug.toLowerCase().includes(search.toLowerCase())
        );
    }, [rolesData, search]);

    const permissions = useMemo(() => permissionsData?.data || {}, [permissionsData]);
    const totalPermissionsCount = useMemo(() =>
        Object.values(permissions).reduce((acc: number, curr: any) => acc + curr.length, 0),
        [permissions]);

    const stats = useMemo(() => ({
        total: roles.length,
        users: roles.reduce((sum: number, r: any) => sum + r.users_count, 0),
        permissions: totalPermissionsCount,
        avgPerms: roles.length ? Math.round(roles.reduce((sum: number, r: any) => sum + r.permissions_count, 0) / roles.length) : 0
    }), [roles, totalPermissionsCount]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/roles', data),
        onSuccess: () => { toastSuccess('Role created'); closeModal(); qc.invalidateQueries({ queryKey: ['roles'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/roles/${id}`, data),
        onSuccess: () => { toastSuccess('Role updated'); closeModal(); qc.invalidateQueries({ queryKey: ['roles'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/roles/${id}`),
        onSuccess: () => { toastSuccess('Role deleted'); qc.invalidateQueries({ queryKey: ['roles'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: [] });
    };

    const handleEdit = async (role: any) => {
        // Fetch full role details to get permissions
        try {
            const res = await apiGet(`/api/admin/roles/${role.id}`);
            const fullRole = res.data;
            setEditingRole(fullRole);
            setFormData({
                name: fullRole.name,
                description: fullRole.description || '',
                permissions: fullRole.permissions?.map((p: any) => p.id) || []
            });
            setOpenEdit(true);
        } catch (e) {
            toastError('Failed to load role details');
        }
    };

    const handleDelete = (role: any) => {
        if (role.users_count > 0) {
            toastError(`Cannot delete role assigned to ${role.users_count} users`);
            return;
        }
        if (confirm(`Delete role "${role.name}"?`)) deleteMutation.mutate(role.id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingRole) updateMutation.mutate({ id: editingRole.id, data: formData });
        else createMutation.mutate(formData);
    };

    const togglePermission = (id: number) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter(p => p !== id)
                : [...prev.permissions, id]
        }));
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Roles & Permissions</h1>
                        <p className="text-slate-400 mt-1">Manage user access control</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Create Role
                    </Button>
                </div>

                <RoleStatsRibbon stats={stats} />

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-4">Role Name</div>
                        <div className="col-span-3">Slug</div>
                        <div className="col-span-2">Users</div>
                        <div className="col-span-2">Permissions</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : roles.map((role: any) => (
                            <motion.div key={role.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                <div className="col-span-4">
                                    <div className="font-medium text-white">{role.name}</div>
                                    <div className="text-xs text-gray-500 truncate">{role.description}</div>
                                </div>
                                <div className="col-span-3 text-sm text-gray-400 font-mono">{role.slug}</div>
                                <div className="col-span-2 text-sm text-gray-300 flex items-center gap-2">
                                    <Users size={14} className="text-gray-500" /> {role.users_count}
                                </div>
                                <div className="col-span-2 text-sm text-gray-300 flex items-center gap-2">
                                    <Lock size={14} className="text-gray-500" /> {role.permissions_count}
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(role)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(role)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingRole ? 'Edit Role' : 'New Role'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Role Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-slate-950 border-white/10" />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white" />
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-3">Permissions</label>
                        <div className="h-64 overflow-y-auto pr-2 space-y-4">
                            {Object.entries(permissions).map(([group, perms]: [string, any]) => (
                                <div key={group}>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">{group}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {perms.map((p: any) => (
                                            <label key={p.id} className={cn(
                                                "flex items-center gap-2 p-2 rounded border cursor-pointer transition-all",
                                                formData.permissions.includes(p.id)
                                                    ? "bg-purple-500/20 border-purple-500/50"
                                                    : "bg-slate-900/50 border-white/10 hover:border-white/20"
                                            )}>
                                                <input type="checkbox" checked={formData.permissions.includes(p.id)} onChange={() => togglePermission(p.id)} className="rounded bg-slate-950 border-white/20 text-purple-500" />
                                                <span className="text-sm text-gray-300">{p.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Save</Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
