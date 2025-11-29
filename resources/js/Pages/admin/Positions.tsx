import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Users,
    ToggleLeft,
    ToggleRight,
    Briefcase
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface Position {
    id: number;
    title: string;
    description: string | null;
    is_active: boolean;
    employees_count?: number;
    created_at: string;
    updated_at: string;
}

export default function Positions() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [selectedPosition, setSelectedPosition] = React.useState<Position | null>(null);
    const [editingPosition, setEditingPosition] = React.useState<Position | null>(null);
    const [error, setError] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    const [formData, setFormData] = React.useState({
        title: '',
        description: '',
        is_active: true
    });

    // Fetch positions
    const { data: positions, isLoading } = useQuery({
        queryKey: ['admin/positions', page, search, statusFilter],
        queryFn: () => {
            let url = `/api/admin/positions?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') {
                url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            }
            return apiGet(url);
        }
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/positions', data),
        onSuccess: () => {
            toastSuccess('Position created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['admin/positions'] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Failed to create position');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/positions/${id}`, data),
        onSuccess: () => {
            toastSuccess('Position updated successfully!');
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['admin/positions'] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Failed to update position');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/positions/${id}`),
        onSuccess: () => {
            toastSuccess('Position deleted successfully!');
            qc.invalidateQueries({ queryKey: ['admin/positions'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to delete position');
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) =>
            apiPut(`/api/positions/${id}`, { is_active }),
        onSuccess: () => {
            toastSuccess('Position status updated!');
            qc.invalidateQueries({ queryKey: ['admin/positions'] });
        }
    });

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            is_active: true
        });
        setEditingPosition(null);
        setError('');
    };

    const handleCreate = () => {
        resetForm();
        setOpenCreate(true);
    };

    const handleEdit = (position: Position) => {
        setFormData({
            title: position.title,
            description: position.description || '',
            is_active: position.is_active
        });
        setEditingPosition(position);
        setOpenEdit(true);
    };

    const handleView = (position: Position) => {
        setSelectedPosition(position);
        setOpenView(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this position? Employees with this position will need to be reassigned.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = (position: Position) => {
        toggleStatusMutation.mutate({ id: position.id, is_active: !position.is_active });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (editingPosition) {
            updateMutation.mutate({ id: editingPosition.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const totalPositions = positions?.data?.length || 0;
    const activePositions = positions?.data?.filter((pos: Position) => pos.is_active).length || 0;
    const totalEmployees = positions?.data?.reduce((sum: number, pos: Position) => sum + (pos.employees_count || 0), 0) || 0;

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                {/* Header */}
                <div className="mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                Positions Management
                            </h1>
                            <p className="text-gray-400 mt-1">Manage job titles and roles</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Total Positions</div>
                                <div className="text-xl font-bold text-white">{totalPositions}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Active</div>
                                <div className="text-xl font-bold text-green-400">{activePositions}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Total Staff</div>
                                <div className="text-xl font-bold text-blue-400">{totalEmployees}</div>
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Position
                        </Button>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search positions..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    >
                        <option value="all" className="text-black">All Status</option>
                        <option value="active" className="text-black">Active</option>
                        <option value="inactive" className="text-black">Inactive</option>
                    </select>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                        }}
                        className="border-white/20 hover:bg-white/10"
                    >
                        Clear Filters
                    </Button>
                </motion.div>

                {/* Positions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                        <div className="h-8 bg-white/10 rounded"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        positions?.data?.map((position: Position, index: number) => (
                            <motion.div
                                key={position.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white text-lg">{position.title}</h3>
                                                {position.description && (
                                                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{position.description}</p>
                                                )}
                                            </div>
                                            <Badge className={position.is_active
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                                            }>
                                                {position.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center text-sm text-gray-300">
                                                <Users className="w-4 h-4 mr-2 text-gray-400" />
                                                <span>{position.employees_count || 0} Employees</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-300">
                                                <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                                                Position
                                            </div>
                                        </div>

                                        {/* Status Toggle */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm text-gray-400">Status:</span>
                                            <button
                                                onClick={() => handleToggleStatus(position)}
                                                className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                                            >
                                                {position.is_active ? (
                                                    <ToggleRight className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleView(position)}
                                                className="flex-1 border-white/20 hover:bg-white/10"
                                            >
                                                <Eye className="w-3 h-3 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleEdit(position)}
                                                className="flex-1 border-white/20 hover:bg-white/10"
                                            >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(position.id)}
                                                className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create/Edit Modal */}
                <Modal
                    open={openCreate || openEdit}
                    onClose={() => {
                        setOpenCreate(false);
                        setOpenEdit(false);
                        resetForm();
                    }}
                    title={editingPosition ? 'Edit Position' : 'Create Position'}
                    size="md"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Position Title *</label>
                            <Input
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="e.g., Chef, Waiter, Manager"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                rows={4}
                                placeholder="Describe the role and responsibilities..."
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded"
                                />
                                <span className="text-sm text-gray-300">Active</span>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setOpenCreate(false);
                                    setOpenEdit(false);
                                    resetForm();
                                }}
                                className="flex-1 border-white/20 hover:bg-white/10"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1"
                            >
                                {editingPosition ? 'Update' : 'Create'} Position
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal
                    open={openView}
                    onClose={() => {
                        setOpenView(false);
                        setSelectedPosition(null);
                    }}
                    title="Position Details"
                    size="md"
                >
                    {selectedPosition && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Position Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Title:</span>
                                            <span className="text-white font-semibold">{selectedPosition.title}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Employees:</span>
                                            <span className="text-white">{selectedPosition.employees_count || 0}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Status:</span>
                                            <Badge className={selectedPosition.is_active
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                                            }>
                                                {selectedPosition.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Created:</span>
                                            <span className="text-white">{new Date(selectedPosition.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedPosition.description && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                                        <p className="text-sm text-gray-300">{selectedPosition.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleEdit(selectedPosition)}
                                    className="flex-1 border-white/20 hover:bg-white/10"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Position
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setOpenView(false);
                                        setSelectedPosition(null);
                                    }}
                                    className="border-white/20 hover:bg-white/10"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
