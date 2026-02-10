import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/app/context/LanguageContext';
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
    user?: {
        name: string;
    };
    name?: string; // Fallback or if modified
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
    const { t } = useLanguage();
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

    const requestTypes: Record<string, string> = {
        vacation: t('admin.hr.time_off.types.vacation'),
        sick_leave: t('admin.hr.time_off.types.sick_leave'),
        personal: t('admin.hr.time_off.types.personal'),
        bereavement: t('admin.hr.time_off.types.bereavement'),
        maternity: t('admin.hr.time_off.types.maternity'),
        paternity: t('admin.hr.time_off.types.paternity'),
        unpaid: t('admin.hr.time_off.types.unpaid'),
        other: t('admin.hr.time_off.types.other')
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
        queryFn: () => apiGet('/api/admin/employees')
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
            toastSuccess(t('admin.hr.time_off.messages.submitted') as string);
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['time-off-requests'] });
            qc.invalidateQueries({ queryKey: ['time-off-stats'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || t('admin.hr.time_off.messages.create_failed') as string)
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            apiPost(`/api/admin/time-off-requests/${id}/approve`, data),
        onSuccess: () => {
            toastSuccess(t('admin.hr.time_off.messages.approved') as string);
            setOpenApprove(false);
            setSelectedRequest(null);
            setApprovalNotes('');
            qc.invalidateQueries({ queryKey: ['time-off-requests'] });
            qc.invalidateQueries({ queryKey: ['time-off-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || t('admin.hr.time_off.messages.approve_failed') as string)
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            apiPost(`/api/admin/time-off-requests/${id}/reject`, data),
        onSuccess: () => {
            toastSuccess(t('admin.hr.time_off.messages.rejected') as string);
            setOpenReject(false);
            setSelectedRequest(null);
            setApprovalNotes('');
            qc.invalidateQueries({ queryKey: ['time-off-requests'] });
            qc.invalidateQueries({ queryKey: ['time-off-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || t('admin.hr.time_off.messages.reject_failed') as string)
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/time-off-requests/${id}`),
        onSuccess: () => {
            toastSuccess(t('admin.hr.time_off.messages.deleted') as string);
            qc.invalidateQueries({ queryKey: ['time-off-requests'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || t('admin.hr.time_off.messages.delete_failed') as string)
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
            setError(t('admin.hr.time_off.messages.rejection_required') as string);
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
            case 'pending': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
            case 'approved': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
            default: return 'bg-secondary text-muted-foreground border-border';
        }
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
                {/* Decorative Background Elements - Hidden on mobile */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 dark:from-fuchsia-500/10 dark:to-purple-500/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    {/* Header */}
                    <div className="mb-4 sm:mb-6 md:mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* Title Row */}
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent truncate">
                                        {t('admin.hr.time_off.title')}
                                    </h1>
                                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">{t('admin.hr.time_off.subtitle')}</p>
                                </div>
                                <Button
                                    onClick={() => { resetForm(); setOpenCreate(true); }}
                                    className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                                >
                                    <Plus className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">{t('admin.hr.time_off.actions.new_request')}</span>
                                </Button>
                            </div>

                            {/* Stats Row - Horizontal scroll on mobile */}
                            <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
                                <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-4 min-w-max sm:min-w-0">
                                    <div className="bg-card backdrop-blur-md rounded-xl p-2.5 sm:p-3 md:p-4 border border-border min-w-[90px]">
                                        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{t('admin.hr.time_off.stats.pending')}</div>
                                        <div className="text-base sm:text-lg md:text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.pending || 0}</div>
                                    </div>
                                    <div className="bg-card backdrop-blur-md rounded-xl p-2.5 sm:p-3 md:p-4 border border-border min-w-[90px]">
                                        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{t('admin.hr.time_off.stats.approved')}</div>
                                        <div className="text-base sm:text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{stats?.approved || 0}</div>
                                    </div>
                                    <div className="bg-card backdrop-blur-md rounded-xl p-2.5 sm:p-3 md:p-4 border border-border min-w-[90px]">
                                        <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{t('admin.hr.time_off.stats.days')}</div>
                                        <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">{stats?.total_days_approved || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 sm:mb-6"
                    >
                        {/* Mobile: Compact filter row */}
                        <div className="flex gap-2 sm:hidden mb-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder={t('admin.hr.time_off.filters.search')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 text-sm bg-card border-border"
                                />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 bg-card border border-border rounded-lg px-2 text-sm text-foreground w-24">
                                <option value="all">{t('admin.hr.time_off.stats.all')}</option>
                                <option value="pending">{t('admin.hr.time_off.stats.pending')}</option>
                                <option value="approved">{t('admin.hr.time_off.stats.approved')}</option>
                                <option value="rejected">{t('admin.hr.time_off.stats.rejected')}</option>
                            </select>
                        </div>

                        {/* Desktop: Full filter row */}
                        <div className="hidden sm:grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder={t('admin.hr.time_off.filters.search')}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-10 bg-card border-border text-foreground"
                                />
                            </div>

                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 bg-card border border-border rounded-lg px-3 text-sm text-foreground dark:[color-scheme:dark]">
                                <option value="all">{t('admin.hr.time_off.filters.all_status')}</option>
                                <option value="pending">{t('admin.hr.time_off.stats.pending')}</option>
                                <option value="approved">{t('admin.hr.time_off.stats.approved')}</option>
                                <option value="rejected">{t('admin.hr.time_off.stats.rejected')}</option>
                            </select>

                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                                className="h-10 bg-card border border-border rounded-lg px-3 text-sm text-foreground dark:[color-scheme:dark]">
                                <option value="all">{t('admin.hr.time_off.filters.all_types')}</option>
                                {Object.entries(requestTypes).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>

                            <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}
                                className="h-10 bg-card border border-border rounded-lg px-3 text-sm text-foreground dark:[color-scheme:dark]">
                                <option value="all">{t('admin.hr.time_off.filters.all_employees')}</option>
                                {employees?.data?.map((emp: Employee) => (
                                    <option key={emp.id} value={emp.id}>{emp.user?.name || emp.name}</option>
                                ))}
                            </select>

                            <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setEmployeeFilter('all'); }}
                                className="h-10 text-sm border-border hover:bg-accent">{t('admin.hr.time_off.filters.clear')}</Button>
                        </div>
                    </motion.div>

                    {/* Requests Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <Card key={i} className="bg-card border-border backdrop-blur-md">
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="animate-pulse space-y-3">
                                            <div className="h-4 bg-muted rounded w-3/4"></div>
                                            <div className="h-3 bg-muted rounded w-1/2"></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            requests?.data?.map((request: TimeOffRequest, index: number) => (
                                <motion.div key={request.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.05 }}>
                                    <Card className="bg-card border-border backdrop-blur-md hover:bg-accent/50 transition-all duration-300">
                                        <CardContent className="p-3 sm:p-4 md:p-6">
                                            {/* Header: Name + Status */}
                                            <div className="flex justify-between items-start mb-3 gap-2">
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-foreground text-sm sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2 truncate">
                                                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                        <span className="truncate">{request.employee?.user?.name || request.employee?.name || t('admin.hr.time_off.table.unknown_employee')}</span>
                                                    </h3>
                                                    <Badge className="mt-1 bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] sm:text-xs">
                                                        {requestTypes[request.type as keyof typeof requestTypes]}
                                                    </Badge>
                                                </div>
                                                <Badge className={`${getStatusColor(request.status)} text-[10px] sm:text-xs flex-shrink-0`}>
                                                    {request.status.toUpperCase()}
                                                </Badge>
                                            </div>

                                            {/* Details */}
                                            <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {new Date(request.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(request.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                                                    {request.days_requested}{' '}
                                                    {request.days_requested === 1 ? t('admin.hr.time_off.table.day') : t('admin.hr.time_off.table.days')}
                                                </div>
                                                <div className="flex items-start text-xs sm:text-sm text-muted-foreground hidden sm:flex">
                                                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0 mt-0.5" />
                                                    <span className="line-clamp-2">{request.reason || t('admin.hr.time_off.table.no_reason')}</span>
                                                </div>
                                                {request.approvedBy && (
                                                    <div className="flex items-center text-xs text-muted-foreground mt-2 pt-2 border-t border-border hidden sm:flex">
                                                        <span className="font-semibold mr-1">{t('admin.hr.time_off.table.approved_by')}</span>
                                                        {request.approvedBy.user?.name || request.approvedBy.name}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            {request.status === 'pending' && (
                                                <div className="flex gap-2 mb-2">
                                                    <Button size="sm" variant="primary"
                                                        onClick={() => { setSelectedRequest(request); setOpenApprove(true); }}
                                                        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm bg-green-600 hover:bg-green-700">
                                                        <CheckCircle className="w-3 h-3 sm:mr-1" />
                                                        <span className="hidden sm:inline">{t('admin.hr.time_off.actions.approve')}</span>
                                                    </Button>
                                                    <Button size="sm" variant="danger"
                                                        onClick={() => { setSelectedRequest(request); setOpenReject(true); }}
                                                        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm bg-red-600 hover:bg-red-700">
                                                        <XCircle className="w-3 h-3 sm:mr-1" />
                                                        <span className="hidden sm:inline">{t('admin.hr.time_off.actions.reject')}</span>
                                                    </Button>
                                                </div>
                                            )}

                                            <Button size="sm" variant="secondary" onClick={() => { setSelectedRequest(request); setOpenView(true); }}
                                                className="w-full h-8 sm:h-9 text-xs sm:text-sm border-border hover:bg-accent">
                                                <Eye className="w-3 h-3 sm:mr-1" />
                                                <span className="hidden sm:inline">{t('admin.hr.time_off.actions.view_details')}</span>
                                                <span className="sm:hidden">{t('admin.hr.time_off.actions.view_details')}</span>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))
                        )}
                    </div>

                    {/* Create Modal - Mobile optimized */}
                    <Modal open={openCreate} onClose={() => { setOpenCreate(false); resetForm(); }}
                        title={t('admin.hr.time_off.actions.new_request')} size="lg">
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 sm:p-3 text-red-600 dark:text-red-400 text-xs sm:text-sm">{error}</div>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5">{t('admin.hr.time_off.table.employee')} *</label>
                                    <select required value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                        className="w-full h-10 bg-card border border-border rounded-lg px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 transition-all outline-none">
                                        <option value="">{t('admin.hr.time_off.form.select_employee')}</option>
                                        {employees?.data?.map((emp: Employee) => (
                                            <option key={emp.id} value={emp.id}>{emp.user?.name || emp.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5">{t('admin.hr.time_off.table.type')} *</label>
                                    <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full h-10 bg-card border border-border rounded-lg px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 transition-all outline-none">
                                        {Object.entries(requestTypes).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5">{t('admin.hr.time_off.form.start_date')} *</label>
                                    <Input type="date" required value={formData.start_date}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        className="h-10 text-sm bg-card border-border" />
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5">{t('admin.hr.time_off.form.end_date')} *</label>
                                    <Input type="date" required value={formData.end_date}
                                        min={formData.start_date || new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        className="h-10 text-sm bg-card border-border" />
                                </div>

                                {/* Duration Preview */}
                                {formData.start_date && formData.end_date && (
                                    <div className="sm:col-span-2 bg-secondary/20 p-2 sm:p-3 rounded-lg flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                        <span>
                                            {t('admin.hr.time_off.form.duration')}:{' '}
                                            <span className="font-semibold text-foreground">
                                                {Math.max(0, Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1)}
                                            </span>{' '}
                                            {(Math.max(0, Math.ceil((new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1)) === 1
                                                ? t('admin.hr.time_off.table.day')
                                                : t('admin.hr.time_off.table.days')}
                                        </span>
                                    </div>
                                )}

                                <div className="sm:col-span-2">
                                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5">{t('admin.hr.time_off.table.reason')} *</label>
                                    <textarea required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 transition-all outline-none" rows={2}
                                        maxLength={500} placeholder={t('admin.hr.time_off.form.reason_placeholder') as string} />
                                </div>

                                <div className="sm:col-span-2 hidden sm:block">
                                    <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5">{t('admin.hr.time_off.table.notes')}</label>
                                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 transition-all outline-none" rows={2}
                                        placeholder={t('admin.hr.time_off.form.notes_placeholder') as string} />
                                </div>
                            </div>

                            <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
                                <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); resetForm(); }}
                                    className="flex-1 h-10 sm:h-11 text-sm border-border hover:bg-accent">{t('layout.actions.cancel')}</Button>
                                <Button type="submit" variant="primary" disabled={createMutation.isPending}
                                    className="flex-1 h-10 sm:h-11 text-sm bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                                    {createMutation.isPending ? t('admin.hr.time_off.form.saving') : t('admin.hr.time_off.form.submit')}
                                </Button>
                            </div>
                        </form>
                    </Modal>

                    <Modal open={openView} onClose={() => { setOpenView(false); setSelectedRequest(null); }}
                        title={t('admin.hr.time_off.actions.view_details')} size="lg">
                        {selectedRequest && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <h3 className="text-xs sm:text-sm text-muted-foreground">{t('admin.hr.time_off.table.employee')}</h3>
                                        <p className="text-sm sm:text-base text-foreground font-semibold truncate">{selectedRequest.employee?.name}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm text-muted-foreground">{t('admin.hr.time_off.table.type')}</h3>
                                        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs">
                                            {requestTypes[selectedRequest.type as keyof typeof requestTypes]}
                                        </Badge>
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm text-muted-foreground">{t('admin.hr.time_off.form.start_date')}</h3>
                                        <p className="text-sm text-foreground">{new Date(selectedRequest.start_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm text-muted-foreground">{t('admin.hr.time_off.form.end_date')}</h3>
                                        <p className="text-sm text-foreground">{new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm text-muted-foreground">{t('admin.hr.time_off.table.days')}</h3>
                                        <p className="text-sm text-foreground font-semibold">{selectedRequest.days_requested}</p>
                                    </div>
                                    <div>
                                        <h3 className="text-xs sm:text-sm text-muted-foreground">{t('admin.common.status')}</h3>
                                        <Badge className={`${getStatusColor(selectedRequest.status)} text-[10px] sm:text-xs`}>
                                            {selectedRequest.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground mb-1.5">{t('admin.hr.time_off.table.reason')}</h3>
                                    <p className="text-foreground text-xs sm:text-sm">{selectedRequest.reason}</p>
                                </div>

                                {selectedRequest.notes && (
                                    <div>
                                        <h3 className="text-xs sm:text-sm text-muted-foreground mb-1.5">{t('admin.hr.time_off.table.notes')}</h3>
                                        <p className="text-foreground text-xs sm:text-sm">{selectedRequest.notes}</p>
                                    </div>
                                )}

                                {selectedRequest.approval_notes && (
                                    <div>
                                        <h3 className="text-xs sm:text-sm text-muted-foreground mb-1.5">{t('admin.hr.time_off.table.approval_notes')}</h3>
                                        <p className="text-foreground text-xs sm:text-sm">{selectedRequest.approval_notes}</p>
                                    </div>
                                )}

                                <Button variant="secondary" onClick={() => { setOpenView(false); setSelectedRequest(null); }}
                                    className="w-full h-10 sm:h-11 text-sm border-border hover:bg-accent">{t('layout.actions.close')}</Button>
                            </div>
                        )}
                    </Modal>

                    {/* Approve Modal - Mobile optimized */}
                    <Modal open={openApprove} onClose={() => { setOpenApprove(false); setSelectedRequest(null); setApprovalNotes(''); }}
                        title={t('admin.hr.time_off.actions.approve')} size="md">
                        <div className="space-y-3 sm:space-y-4">
                            <p className="text-sm text-muted-foreground">
                                {t('admin.hr.time_off.actions.approve_confirm')} <span className="font-semibold text-foreground">{selectedRequest?.employee?.name}</span>?
                            </p>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5">{t('admin.hr.time_off.form.notes_optional')}</label>
                                <textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground" rows={2}
                                    placeholder={t('admin.hr.time_off.actions.comments_placeholder') as string} />
                            </div>
                            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                                <Button variant="secondary" onClick={() => { setOpenApprove(false); setApprovalNotes(''); }}
                                    className="flex-1 h-10 sm:h-11 text-sm border-border hover:bg-accent">{t('layout.actions.cancel')}</Button>
                                <Button variant="primary" onClick={handleApprove} disabled={approveMutation.isPending}
                                    className="flex-1 h-10 sm:h-11 text-sm bg-green-600 hover:bg-green-700">{t('admin.hr.time_off.actions.approve')}</Button>
                            </div>
                        </div>
                    </Modal>

                    {/* Reject Modal - Mobile optimized */}
                    <Modal open={openReject} onClose={() => { setOpenReject(false); setSelectedRequest(null); setApprovalNotes(''); setError(''); }}
                        title={t('admin.hr.time_off.actions.reject')} size="md">
                        <div className="space-y-3 sm:space-y-4">
                            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-red-600 dark:text-red-400 text-xs sm:text-sm">{error}</div>}
                            <p className="text-sm text-muted-foreground">
                                {t('admin.hr.time_off.actions.reject_confirm')} <span className="font-semibold text-foreground">{selectedRequest?.employee?.name}</span>?
                            </p>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1.5">{t('admin.hr.time_off.actions.rejection_reason')} *</label>
                                <textarea required value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground" rows={2}
                                    placeholder={t('admin.hr.time_off.actions.rejection_reason') + "..."} />
                            </div>
                            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                                <Button variant="secondary" onClick={() => { setOpenReject(false); setApprovalNotes(''); setError(''); }}
                                    className="flex-1 h-10 sm:h-11 text-sm border-border hover:bg-accent">{t('layout.actions.cancel')}</Button>
                                <Button variant="danger" onClick={handleReject} disabled={rejectMutation.isPending}
                                    className="flex-1 h-10 sm:h-11 text-sm bg-red-600 hover:bg-red-700">{t('admin.hr.time_off.actions.reject')}</Button>
                            </div>
                        </div>
                    </Modal>
                </div>
            </div>
        </AdminLayout>
    );
}
