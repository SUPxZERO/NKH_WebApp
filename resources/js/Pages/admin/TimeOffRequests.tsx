import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    Clock,
    FileText,
    TrendingUp
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface Employee {
    id: number;
    name: string;
}

interface TimeOffRequest {
    id: number;
    employee_id: number;
    employee?: Employee;
    approved_by?: number;
    approvedBy?: Employee;
    type: string;
    start_date: string;
    end_date: string;
    days_requested: number;
    reason: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    approval_notes?: string;
    approved_at?: string;
    created_at: string;
}

export default function TimeOffRequests() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [employeeFilter, setEmployeeFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [openApprove, setOpenApprove] = React.useState(false);
    const [openReject, setOpenReject] = React.useState(false);
    const [selectedRequest, setSelectedRequest] = React.useState<TimeOffRequest | null>(null);
    const [error, setError] = React.useState('');
    const [approvalNotes, setApprovalNotes] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    const [formData, setFormData] = React.useState({
        employee_id: '',
        type: 'vacation',
        start_date: '',
        end_date: '',
        reason: '',
        notes: ''
    });

    const requestTypes = {
        vacation: 'Vacation',
        sick_leave: 'Sick Leave',
        personal: 'Personal',
        bereavement: 'Bereavement',
        maternity: 'Maternity',
        paternity: 'Paternity',
        unpaid: 'Unpaid',
        other: 'Other'
    };

    // Fetch time-off requests
    const { data: requests, isLoading } = useQuery({
        queryKey: ['time-off-requests', page, search, statusFilter, typeFilter, employeeFilter],
        queryFn: () => {
            let url = `/api/admin/time-off-requests?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (typeFilter !== 'all') url += `&type=${typeFilter}`;
            if (employeeFilter !== 'all') url += `&employee_id=${employeeFilter}`;
            return apiGet(url);
        }
    });

    // Fetch employees
    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => apiGet('/api/employees')
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['time-off-stats'],
        queryFn: () => apiGet('/api/admin/time-off-requests/stats')
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/time-off-requests', data),
        onSuccess: () => {
            toastSuccess('Time-off request submitted!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['time-off-requests'] });
            qc.invalidateQueries({ queryKey: ['time-off-stats'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to create request')
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            apiPost(`/api/admin/time-off-requests/${id}/approve`, data),
        onSuccess: () => {
            toastSuccess('Request approved!');
            setOpenApprove(false);
            setSelectedRequest(null);
            setApprovalNotes('');
            qc.invalidateQueries({ queryKey: ['time-off-requests'] });
            qc.invalidateQueries({ queryKey: ['time-off-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to approve')
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            apiPost(`/api/admin/time-off-requests/${id}/reject`, data),
        onSuccess: () => {
            toastSuccess('Request rejected');
            setOpenReject(false);
            setSelectedRequest(null);
            setApprovalNotes('');
            qc.invalidateQueries({ queryKey: ['time-off-requests'] });
            qc.invalidateQueries({ queryKey: ['time-off-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to reject')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/time-off-requests/${id}`),
        onSuccess: () => {
            toastSuccess('Request deleted');
            qc.invalidateQueries({ queryKey: ['time-off-requests'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to delete')
    });

    const resetForm = () => {
        setFormData({
            employee_id: '',
            type: 'vacation',
            start_date: '',
            end_date: '',
            reason: '',
            notes: ''
        });
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data = {
            ...formData,
            employee_id: parseInt(formData.employee_id)
        };

        createMutation.mutate(data);
    };

    const handleApprove = () => {
        if (!selectedRequest) return;

        // Using admin's ID - in real app this would come from auth context
        approveMutation.mutate({
            id: selectedRequest.id,
            data: {
                approved_by: 1, // Replace with actual admin ID from auth
                approval_notes: approvalNotes
            }
        });
    };

    const handleReject = () => {
        if (!selectedRequest || !approvalNotes.trim()) {
            setError('Rejection reason is required');
            return;
        }

        rejectMutation.mutate({
            id: selectedRequest.id,
            data: {
                approved_by: 1, // Replace with actual admin ID from auth
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
                                Time Off Requests
                            </h1>
                            <p className="text-gray-400 mt-1">Manage employee leave and vacation requests</p>
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
                                <div className="text-sm text-gray-400">Total Days</div>
                                <div className="text-xl font-bold text-blue-400">{stats?.total_days_approved || 0}</div>
                            </div>
                        </div>

                        <Button
                            onClick={() => { resetForm(); setOpenCreate(true); }}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Request
                        </Button>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search requests..."
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

                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Types</option>
                        {Object.entries(requestTypes).map(([key, label]) => (
                            <option key={key} value={key} className="text-black">{label}</option>
                        ))}
                    </select>

                    <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Employees</option>
                        {employees?.data?.map((emp: Employee) => (
                            <option key={emp.id} value={emp.id} className="text-black">{emp.name}</option>
                        ))}
                    </select>

                    <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setEmployeeFilter('all'); }}
                        className="border-white/20 hover:bg-white/10">Clear</Button>
                </motion.div>

                {/* Requests Grid */}
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
                        requests?.data?.map((request: TimeOffRequest, index: number) => (
                            <motion.div key={request.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}>
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {request.employee?.name}
                                                </h3>
                                                <Badge className="mt-1 bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                    {requestTypes[request.type as keyof typeof requestTypes]}
                                                </Badge>
                                            </div>
                                            <Badge className={getStatusColor(request.status)}>
                                                {request.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm text-gray-300">
                                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-300">
                                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                {request.days_requested} day{request.days_requested > 1 ? 's' : ''}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-300">
                                                <FileText className="w-4 h-4 mr-2 text-gray-400" />
                                                {request.reason.substring(0, 50)}{request.reason.length > 50 ? '...' : ''}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {request.status === 'pending' && (
                                            <div className="flex gap-2 mb-2">
                                                <Button size="sm" variant="primary"
                                                    onClick={() => { setSelectedRequest(request); setOpenApprove(true); }}
                                                    className="flex-1 bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="w-3 h-3 mr-1" />Approve
                                                </Button>
                                                <Button size="sm" variant="danger"
                                                    onClick={() => { setSelectedRequest(request); setOpenReject(true); }}
                                                    className="flex-1 bg-red-600 hover:bg-red-700">
                                                    <XCircle className="w-3 h-3 mr-1" />Reject
                                                </Button>
                                            </div>
                                        )}

                                        <Button size="sm" variant="secondary" onClick={() => { setSelectedRequest(request); setOpenView(true); }}
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
                    title="New Time Off Request" size="lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Employee *</label>
                                <select required value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">Select Employee</option>
                                    {employees?.data?.map((emp: Employee) => (
                                        <option key={emp.id} value={emp.id} className="bg-gray-800">{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
                                <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    {Object.entries(requestTypes).map(([key, label]) => (
                                        <option key={key} value={key} className="bg-gray-800">{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                                <Input type="date" required value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                                <Input type="date" required value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Reason *</label>
                                <textarea required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={3}
                                    maxLength={500} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Additional Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={2} />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); resetForm(); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={createMutation.isPending}
                                className="flex-1">Submit Request</Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal open={openView} onClose={() => { setOpenView(false); setSelectedRequest(null); }}
                    title="Request Details" size="lg">
                    {selectedRequest && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm text-gray-400">Employee</h3>
                                    <p className="text-white font-semibold">{selectedRequest.employee?.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Type</h3>
                                    <Badge className="bg-blue-500/20 text-blue-400">
                                        {requestTypes[selectedRequest.type as keyof typeof requestTypes]}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Start Date</h3>
                                    <p className="text-white">{new Date(selectedRequest.start_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">End Date</h3>
                                    <p className="text-white">{new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Days Requested</h3>
                                    <p className="text-white font-semibold">{selectedRequest.days_requested}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Status</h3>
                                    <Badge className={getStatusColor(selectedRequest.status)}>
                                        {selectedRequest.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm text-gray-400 mb-2">Reason</h3>
                                <p className="text-white text-sm">{selectedRequest.reason}</p>
                            </div>

                            {selectedRequest.notes && (
                                <div>
                                    <h3 className="text-sm text-gray-400 mb-2">Additional Notes</h3>
                                    <p className="text-white text-sm">{selectedRequest.notes}</p>
                                </div>
                            )}

                            {selectedRequest.approval_notes && (
                                <div>
                                    <h3 className="text-sm text-gray-400 mb-2">Approval Notes</h3>
                                    <p className="text-white text-sm">{selectedRequest.approval_notes}</p>
                                </div>
                            )}

                            <Button variant="secondary" onClick={() => { setOpenView(false); setSelectedRequest(null); }}
                                className="w-full border-white/20 hover:bg-white/10">Close</Button>
                        </div>
                    )}
                </Modal>

                {/* Approve Modal */}
                <Modal open={openApprove} onClose={() => { setOpenApprove(false); setSelectedRequest(null); setApprovalNotes(''); }}
                    title="Approve Request" size="md">
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Approve time-off request for <span className="font-semibold text-white">{selectedRequest?.employee?.name}</span>?
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Approval Notes (optional)</label>
                            <textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={3}
                                placeholder="Add any comments..." />
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
                <Modal open={openReject} onClose={() => { setOpenReject(false); setSelectedRequest(null); setApprovalNotes(''); setError(''); }}
                    title="Reject Request" size="md">
                    <div className="space-y-4">
                        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
                        <p className="text-gray-300">
                            Reject time-off request for <span className="font-semibold text-white">{selectedRequest?.employee?.name}</span>?
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
