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

// Stats Ribbon
const PositionStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Positions</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Briefcase className="w-8 h-8 text-purple-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Active</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Staff</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{stats.staff}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
            </div>
        </div>
    </div>
);

export default function Positions() {
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
        mutationFn: (data: any) => apiPost('/api/positions', data),
        onSuccess: () => { toastSuccess('Position created'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/positions'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/positions/${id}`, data),
        onSuccess: () => { toastSuccess('Position updated'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/positions'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/positions/${id}`),
        onSuccess: () => { toastSuccess('Position deleted'); qc.invalidateQueries({ queryKey: ['admin/positions'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
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
        if (confirm('Delete this position?')) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPosition) updateMutation.mutate({ id: editingPosition.id, data: formData });
        else createMutation.mutate(formData);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Positions</h1>
                        <p className="text-slate-400 mt-1">Manage job titles</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Position
                    </Button>
                </div>

                <PositionStatsRibbon stats={stats} />

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search positions..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-4">Title</div>
                        <div className="col-span-4">Description</div>
                        <div className="col-span-2">Staff</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : positionList.map((pos: any) => (
                            <motion.div key={pos.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                <div className="col-span-4 font-medium text-white">{pos.title}</div>
                                <div className="col-span-4 text-sm text-gray-400 truncate">{pos.description || '-'}</div>
                                <div className="col-span-2 text-sm text-gray-300 flex items-center gap-2">
                                    <Users size={14} className="text-gray-500" /> {pos.employees_count || 0}
                                </div>
                                <div className="col-span-1">
                                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                                        pos.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                                        {pos.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(pos)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(pos.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingPosition ? 'Edit Position' : 'New Position'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="bg-slate-950 border-white/10" />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded bg-slate-950 border-white/20" />
                        <span className="text-sm text-gray-300">Active</span>
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
