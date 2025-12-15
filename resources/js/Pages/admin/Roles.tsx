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

// Enhanced StatCard Component
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

// Roles Ribbon
const RoleStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Roles" value={stats.total} icon={Shield} color="purple" index={0} />
        <StatCard title="Assigned Users" value={stats.users} icon={Users} color="emerald" index={1} />
        <StatCard title="Total Permissions" value={stats.permissions} icon={Lock} color="blue" index={2} />
        <StatCard title="Avg Perms/Role" value={stats.avgPerms} icon={CheckCircle} color="amber" index={3} />
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
            <div className="min-h-screen bg-background p-6 transition-colors relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 bg-clip-text text-transparent"
                            >
                                Roles & Permissions
                            </motion.h1>
                            <p className="text-muted-foreground mt-1">Manage user access control and security</p>
                        </div>
                        <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-500/20">
                            <Plus className="w-4 h-4 mr-2" /> Create Role
                        </Button>
                    </div>

                    <RoleStatsRibbon stats={stats} />

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-2xl p-4 mb-6 backdrop-blur-sm shadow-lg"
                    >
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:ring-purple-500" />
                        </div>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                    >
                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-purple-500/10">
                            <div className="col-span-4 text-xs font-bold text-foreground uppercase tracking-wider">Role Name</div>
                            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Slug</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Users</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Permissions</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted-foreground">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
                                    <p>Loading...</p>
                                </div>
                            ) : roles.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center">
                                        <Shield className="w-8 h-8 text-purple-500" />
                                    </div>
                                    <h3 className="text-foreground font-semibold">No roles found</h3>
                                    <p className="text-muted-foreground text-sm mt-1">Create a new role to get started</p>
                                </div>
                            ) : roles.map((role: any, idx: number) => (
                                <motion.div
                                    key={role.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-purple-500/5 transition-all group"
                                >
                                    <div className="col-span-4">
                                        <div className="font-semibold text-foreground flex items-center gap-2">
                                            {role.name}
                                            {role.id === 1 && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs border border-amber-500/20">System</span>}
                                        </div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[90%]">{role.description}</div>
                                    </div>
                                    <div className="col-span-3 text-sm text-muted-foreground font-mono bg-secondary/50 px-2 py-1 rounded w-fit">{role.slug}</div>
                                    <div className="col-span-2 text-sm text-foreground flex items-center gap-2">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {Array.from({ length: Math.min(3, role.users_count) }).map((_, i) => (
                                                <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-gradient-to-br from-purple-400 to-fuchsia-400" />
                                            ))}
                                            {role.users_count > 3 && (
                                                <div className="inline-flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background bg-secondary text-[10px] font-medium text-muted-foreground">
                                                    +{role.users_count - 3}
                                                </div>
                                            )}
                                        </div>
                                        {role.users_count === 0 && <span className="text-muted-foreground text-xs">No users</span>}
                                    </div>
                                    <div className="col-span-2 text-sm text-foreground flex items-center gap-2">
                                        <Lock size={14} className="text-purple-500" />
                                        <span className="font-medium">{role.permissions_count}</span>
                                        <span className="text-muted-foreground text-xs">access points</span>
                                    </div>
                                    <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                        <Button size="sm" variant="ghost" onClick={() => handleEdit(role)} className="h-8 w-8 p-0 hover:bg-purple-500/10 hover:text-purple-600"><Edit size={14} /></Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(role)} className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-600"><Trash2 size={14} /></Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingRole ? 'Edit Role' : 'New Role'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Input label="Role Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g. Restaurant Manager" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2}
                            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                            placeholder="Describe what this role can do..." />
                    </div>

                    <div className="border-t border-border pt-4">
                        <label className="block text-sm font-medium text-foreground mb-3 flex items-center justify-between">
                            <span>Permissions</span>
                            <span className="text-xs text-muted-foreground">{formData.permissions.length} selected</span>
                        </label>
                        <div className="h-80 overflow-y-auto pr-2 space-y-5">
                            {Object.entries(permissions).map(([group, perms]: [string, any]) => (
                                <div key={group} className="bg-secondary/20 p-4 rounded-xl border border-border/50">
                                    <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        {group}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {perms.map((p: any) => (
                                            <label key={p.id} className={cn(
                                                "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all",
                                                formData.permissions.includes(p.id)
                                                    ? "bg-purple-500/10 border-purple-500/30"
                                                    : "bg-background border-border hover:border-purple-500/30 hover:bg-purple-500/5"
                                            )}>
                                                <div className={cn(
                                                    "w-5 h-5 rounded flex items-center justify-center border transition-all",
                                                    formData.permissions.includes(p.id)
                                                        ? "bg-purple-600 border-purple-600 text-white"
                                                        : "bg-background border-muted-foreground/30"
                                                )}>
                                                    <input type="checkbox" checked={formData.permissions.includes(p.id)} onChange={() => togglePermission(p.id)}
                                                        className="hidden" />
                                                    {formData.permissions.includes(p.id) && <CheckCircle size={12} />}
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-medium transition-colors",
                                                    formData.permissions.includes(p.id) ? "text-purple-700 dark:text-purple-300" : "text-foreground"
                                                )}>{p.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-lg shadow-purple-500/20">
                            {editingRole ? 'Update Role' : 'Create Role'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AdminLayout>
    );
}
