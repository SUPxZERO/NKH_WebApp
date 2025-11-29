import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    CheckCircle,
    XCircle,
    TrendingUp,
    TrendingDown,
    FileText,
    User
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface Ingredient {
    id: number;
    name: string;
    code: string;
    unit?: { code: string };
}

interface Location {
    id: number;
    name: string;
}

interface Employee {
    id: number;
    name: string;
}

interface Adjustment {
    id: number;
    ingredient_id: number;
    ingredient?: Ingredient;
    location_id: number;
    location?: Location;
    quantity_before: number;
    quantity_after: number;
    quantity_change: number;
    reason: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    adjusted_by: number;
    adjusted_by_employee?: Employee;
    approved_by?: number;
    approved_by_employee?: Employee;
    approval_notes?: string;
    created_at: string;
}

export default function InventoryAdjustments() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [reasonFilter, setReasonFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [openApprove, setOpenApprove] = React.useState(false);
    const [openReject, setOpenReject] = React.useState(false);
    const [selectedAdjustment, setSelectedAdjustment] = React.useState<Adjustment | null>(null);
    const [error, setError] = React.useState('');
    const [approvalNotes, setApprovalNotes] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    const [formData, setFormData] = React.useState({
        ingredient_id: '',
        location_id: '',
        quantity_before: '',
        quantity_after: '',
        reason: 'count_error',
        notes: ''
    });

    const reasons = {
        damaged: 'Damaged',
        expired: 'Expired',
        theft: 'Theft',
        count_error: 'Count Error',
        spillage: 'Spillage',
        returned: 'Returned to Supplier',
        correction: 'Correction',
        other: 'Other'
    };

    // Fetch adjustments
    const { data: adjustments, isLoading } = useQuery({
        queryKey: ['inventory-adjustments', page, search, statusFilter, reasonFilter],
        queryFn: () => {
            let url = `/api/admin/inventory-adjustments?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (reasonFilter !== 'all') url += `&reason=${reasonFilter}`;
            return apiGet(url);
        }
    });

    // Fetch ingredients
    const { data: ingredients } = useQuery({
        queryKey: ['ingredients'],
        queryFn: () => apiGet('/api/admin/ingredients')
    });

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations')
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['adjustment-stats'],
        queryFn: () => apiGet('/api/admin/inventory-adjustments/stats')
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/inventory-adjustments', data),
        onSuccess: () => {
            toastSuccess('Adjustment created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['inventory-adjustments'] });
            qc.invalidateQueries({ queryKey: ['adjustment-stats'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to create adjustment')
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            apiPost(`/api/admin/inventory-adjustments/${id}/approve`, data),
        onSuccess: () => {
            toastSuccess('Adjustment approved!');
            setOpenApprove(false);
            setApprovalNotes('');
            qc.invalidateQueries({ queryKey: ['inventory-adjustments'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to approve')
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            apiPost(`/api/admin/inventory-adjustments/${id}/reject`, data),
        onSuccess: () => {
            toastSuccess('Adjustment rejected');
            setOpenReject(false);
            setApprovalNotes('');
            qc.invalidateQueries({ queryKey: ['inventory-adjustments'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to reject')
    });

    const resetForm = () => {
        setFormData({
            ingredient_id: '',
            location_id: '',
            quantity_before: '',
            quantity_after: '',
            reason: 'count_error',
            notes: ''
        });
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const qtyBefore = parseFloat(formData.quantity_before);
        const qtyAfter = parseFloat(formData.quantity_after);

        if (qtyBefore === qtyAfter) {
            setError('Quantity before and after must be different');
            return;
        }

        const data = {
            ingredient_id: parseInt(formData.ingredient_id),
            location_id: parseInt(formData.location_id),
            quantity_before: qtyBefore,
            quantity_after: qtyAfter,
            quantity_change: qtyAfter - qtyBefore,
            reason: formData.reason,
            notes: formData.notes,
            adjusted_by: 1 // Replace with actual user ID from auth
        };

        createMutation.mutate(data);
    };

    const handleApprove = () => {
        if (!selectedAdjustment) return;

        approveMutation.mutate({
            id: selectedAdjustment.id,
            data: {
                approved_by: 1, // Replace with actual user ID
                approval_notes: approvalNotes
            }
        });
    };

    const handleReject = () => {
        if (!selectedAdjustment || !approvalNotes.trim()) {
            setError('Rejection reason is required');
            return;
        }

        rejectMutation.mutate({
            id: selectedAdjustment.id,
            data: {
                approved_by: 1, // Replace with actual user ID
                approval_notes: approvalNotes
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

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
                                Inventory Adjustments
                            </h1>
                            <p className="text-gray-400 mt-1">Manual stock corrections and audit trail</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Pending</div>
                                <div className="text-xl font-bold text-yellow-400">{stats?.pending || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Approved</div>
                                <div className="text-xl font-bold text-green-400">{stats?.approved || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">This Month</div>
                                <div className="text-xl font-bold text-white">{stats?.this_month || 0}</div>
                            </div>
                        </div>

                        <Button
                            onClick={() => { resetForm(); setOpenCreate(true); }}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Adjustment
                        </Button>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search adjustments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Status</option>
                        <option value="pending" className="text-black">Pending</option>
                        <option value="approved" className="text-black">Approved</option>
                        <option value="rejected" className="text-black">Rejected</option>
                    </select>

                    <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Reasons</option>
                        {Object.entries(reasons).map(([key, label]) => (
                            <option key={key} value={key} className="text-black">{label}</option>
                        ))}
                    </select>

                    <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter('all'); setReasonFilter('all'); }}
                        className="border-white/20 hover:bg-white/10">Clear</Button>
                </motion.div>

                {/* Adjustments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        adjustments?.data?.map((adjustment: Adjustment, index: number) => (
                            <motion.div key={adjustment.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}>
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-white text-lg">{adjustment.ingredient?.name}</h3>
                                                <p className="text-sm text-gray-400">{adjustment.location?.name}</p>
                                            </div>
                                            <Badge className={getStatusColor(adjustment.status)}>
                                                {adjustment.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                                                <div>
                                                    <div className="text-xs text-gray-400">Before</div>
                                                    <div className="text-white font-semibold">{adjustment.quantity_before}</div>
                                                </div>
                                                <div className="text-gray-400">→</div>
                                                <div>
                                                    <div className="text-xs text-gray-400">After</div>
                                                    <div className="text-white font-semibold">{adjustment.quantity_after}</div>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        {adjustment.quantity_change > 0 ? (
                                                            <TrendingUp className="w-4 h-4 text-green-400" />
                                                        ) : (
                                                            <TrendingDown className="w-4 h-4 text-red-400" />
                                                        )}
                                                        <span className={adjustment.quantity_change > 0 ? 'text-green-400' : 'text-red-400'}>
                                                            {adjustment.quantity_change > 0 ? '+' : ''}{adjustment.quantity_change}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center text-sm text-gray-300">
                                                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                                {reasons[adjustment.reason as keyof typeof reasons]}
                                            </div>

                                            <div className="flex items-center text-sm text-gray-300">
                                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                                {adjustment.adjusted_by_employee?.name || 'Unknown'}
                                            </div>

                                            <div className="text-xs text-gray-500">
                                                {new Date(adjustment.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {adjustment.status === 'pending' && (
                                            <div className="flex gap-2 mb-2">
                                                <Button size="sm" variant="primary"
                                                    onClick={() => { setSelectedAdjustment(adjustment); setOpenApprove(true); }}
                                                    className="flex-1 bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="w-3 h-3 mr-1" />Approve
                                                </Button>
                                                <Button size="sm" variant="danger"
                                                    onClick={() => { setSelectedAdjustment(adjustment); setOpenReject(true); }}
                                                    className="flex-1 bg-red-600 hover:bg-red-700">
                                                    <XCircle className="w-3 h-3 mr-1" />Reject
                                                </Button>
                                            </div>
                                        )}

                                        <Button size="sm" variant="secondary" onClick={() => { setSelectedAdjustment(adjustment); setOpenView(true); }}
                                            className="w-full border-white/20 hover:bg-white/10">
                                            <Eye className="w-3 h-3 mr-1" />View Details
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                <Modal open={openCreate} onClose={() => { setOpenCreate(false); resetForm(); }}
                    title="Create Inventory Adjustment" size="lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ingredient *</label>
                                <select required value={formData.ingredient_id} onChange={(e) => setFormData({ ...formData, ingredient_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">Select Ingredient</option>
                                    {ingredients?.data?.map((ing: Ingredient) => (
                                        <option key={ing.id} value={ing.id} className="bg-gray-800">{ing.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                                <select required value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">Select Location</option>
                                    {locations?.data?.map((loc: Location) => (
                                        <option key={loc.id} value={loc.id} className="bg-gray-800">{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity Before *</label>
                                <Input type="number" step="0.01" required value={formData.quantity_before}
                                    onChange={(e) => setFormData({ ...formData, quantity_before: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Quantity After *</label>
                                <Input type="number" step="0.01" required value={formData.quantity_after}
                                    onChange={(e) => setFormData({ ...formData, quantity_after: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Reason *</label>
                                <select required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    {Object.entries(reasons).map(([key, label]) => (
                                        <option key={key} value={key} className="bg-gray-800">{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={3}
                                    placeholder="Provide details about this adjustment..." />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); resetForm(); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={createMutation.isPending}
                                className="flex-1">Create Adjustment</Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal open={openView} onClose={() => { setOpenView(false); setSelectedAdjustment(null); }}
                    title="Adjustment Details" size="lg">
                    {selectedAdjustment && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm text-gray-400">Ingredient</h3>
                                    <p className="text-white font-semibold">{selectedAdjustment.ingredient?.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Location</h3>
                                    <p className="text-white">{selectedAdjustment.location?.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Quantity Before</h3>
                                    <p className="text-white font-semibold">{selectedAdjustment.quantity_before}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Quantity After</h3>
                                    <p className="text-white font-semibold">{selectedAdjustment.quantity_after}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Change</h3>
                                    <p className={selectedAdjustment.quantity_change > 0 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                        {selectedAdjustment.quantity_change > 0 ? '+' : ''}{selectedAdjustment.quantity_change}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Status</h3>
                                    <Badge className={getStatusColor(selectedAdjustment.status)}>
                                        {selectedAdjustment.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Reason</h3>
                                    <p className="text-white">{reasons[selectedAdjustment.reason as keyof typeof reasons]}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Adjusted By</h3>
                                    <p className="text-white">{selectedAdjustment.adjusted_by_employee?.name || 'Unknown'}</p>
                                </div>
                            </div>

                            {selectedAdjustment.notes && (
                                <div>
                                    <h3 className="text-sm text-gray-400 mb-2">Notes</h3>
                                    <p className="text-white text-sm bg-white/5 p-3 rounded-lg">{selectedAdjustment.notes}</p>
                                </div>
                            )}

                            {selectedAdjustment.approval_notes && (
                                <div>
                                    <h3 className="text-sm text-gray-400 mb-2">Approval Notes</h3>
                                    <p className="text-white text-sm bg-white/5 p-3 rounded-lg">{selectedAdjustment.approval_notes}</p>
                                </div>
                            )}

                            <Button variant="secondary" onClick={() => { setOpenView(false); setSelectedAdjustment(null); }}
                                className="w-full border-white/20 hover:bg-white/10">Close</Button>
                        </div>
                    )}
                </Modal>

                {/* Approve Modal */}
                <Modal open={openApprove} onClose={() => { setOpenApprove(false); setApprovalNotes(''); }}
                    title="Approve Adjustment" size="md">
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Approve adjustment for <span className="font-semibold text-white">{selectedAdjustment?.ingredient?.name}</span>?
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Approval Notes (optional)</label>
                            <textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={3} />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => { setOpenApprove(false); setApprovalNotes(''); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button variant="primary" onClick={handleApprove} disabled={approveMutation.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
                        </div>
                    </div>
                </Modal>

                {/* Reject Modal */}
                <Modal open={openReject} onClose={() => { setOpenReject(false); setApprovalNotes(''); setError(''); }}
                    title="Reject Adjustment" size="md">
                    <div className="space-y-4">
                        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
                        <p className="text-gray-300">
                            Reject adjustment for <span className="font-semibold text-white">{selectedAdjustment?.ingredient?.name}</span>?
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Rejection Reason *</label>
                            <textarea required value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={3}
                                placeholder="Please provide a reason..." />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => { setOpenReject(false); setApprovalNotes(''); setError(''); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button variant="danger" onClick={handleReject} disabled={rejectMutation.isPending}
                                className="flex-1 bg-red-600 hover:bg-red-700">Reject</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    );
}
