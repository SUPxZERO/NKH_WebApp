import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Shield,
    Plus,
    Edit2,
    Trash2,
    Users,
    Lock,
    CheckCircle2,
    XCircle,
    Search
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';

interface Permission {
    id: number;
    name: string;
    slug: string;
    description: string | null;
}

interface Role {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    users_count: number;
    permissions_count: number;
    permissions?: Permission[];
}

export default function Roles() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: [] as number[]
    });

    // Fetch roles
    const { data: rolesData, isLoading: rolesLoading } = useQuery({
        queryKey: ['roles'],
        queryFn: () => apiGet('/api/admin/roles')
    });

    // Fetch all permissions
    const { data: permissionsData } = useQuery({
        queryKey: ['permissions'],
        queryFn: () => apiGet('/api/admin/permissions/all')
    });

    // Create/Update role mutation
    const saveRoleMutation = useMutation({
        mutationFn: (data: typeof formData) =>
            editingRole
                ? apiPut(`/api/admin/roles/${editingRole.id}`, data)
                : apiPost('/api/admin/roles', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            closeModal();
        }
    });

    // Delete role mutation
    const deleteRoleMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/roles/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        }
    });

    const roles: Role[] = rolesData?.data || [];
    const permissions: Record<string, Permission[]> = permissionsData?.data || {};

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openCreateModal = () => {
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: [] });
        setIsModalOpen(true);
    };

    const openEditModal = async (role: Role) => {
        const response = await apiGet(`/api/admin/roles/${role.id}`);
        const fullRole = response.data;
        setEditingRole(fullRole);
        setFormData({
            name: fullRole.name,
            description: fullRole.description || '',
            permissions: fullRole.permissions?.map((p: Permission) => p.id) || []
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        setFormData({ name: '', description: '', permissions: [] });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveRoleMutation.mutate(formData);
    };

    const handleDelete = (role: Role) => {
        if (role.users_count > 0) {
            alert(`Cannot delete role "${role.name}" because it is assigned to ${role.users_count} user(s).`);
            return;
        }
        if (confirm(`Are you sure you want to delete "${role.name}"?`)) {
            deleteRoleMutation.mutate(role.id);
        }
    };

    const togglePermission = (permissionId: number) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId]
        }));
    };

    return (
        <AdminLayout>
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <Shield className="w-8 h-8 text-purple-600" />
                            Roles & Permissions
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Manage user roles and their permissions
                        </p>
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Role
                    </Button>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search roles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Roles Grid */}
                {rolesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardContent className="p-6 space-y-4">
                                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRoles.map((role) => (
                            <motion.div
                                key={role.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Card className="hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                                                    <Shield className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                                                        {role.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {role.slug}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {role.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                {role.description}
                                            </p>
                                        )}

                                        <div className="flex items-center gap-4 mb-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Users className="w-4 h-4" />
                                                <span>{role.users_count} users</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                <Lock className="w-4 h-4" />
                                                <span>{role.permissions_count} permissions</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditModal(role)}
                                                className="flex-1"
                                            >
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(role)}
                                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                disabled={role.users_count > 0}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <>
                            <motion.div
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={closeModal}
                            />
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div
                                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {editingRole ? 'Edit Role' : 'Create New Role'}
                                        </h2>
                                    </div>

                                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Role Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                placeholder="e.g., Manager, Waiter, Chef"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Description
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows={3}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                                placeholder="Describe the role and its responsibilities"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                                Permissions
                                            </label>
                                            <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                                {Object.entries(permissions).map(([resource, perms]) => (
                                                    <div key={resource} className="space-y-2">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                                                            {resource}
                                                        </h4>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {perms.map((permission) => (
                                                                <label
                                                                    key={permission.id}
                                                                    className={cn(
                                                                        "flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors",
                                                                        formData.permissions.includes(permission.id)
                                                                            ? "bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500"
                                                                            : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-300"
                                                                    )}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.permissions.includes(permission.id)}
                                                                        onChange={() => togglePermission(permission.id)}
                                                                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                            {permission.name}
                                                                        </div>
                                                                        {permission.description && (
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {permission.description}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={closeModal}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={saveRoleMutation.isPending}
                                                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                                            >
                                                {saveRoleMutation.isPending ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                                            </Button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </AdminLayout>
    );
}
