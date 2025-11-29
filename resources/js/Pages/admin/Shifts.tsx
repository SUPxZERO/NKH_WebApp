import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    MapPin,
    User,
    Edit,
    Trash2,
    Copy,
    CheckCircle,
    XCircle
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
    position?: { name: string };
}

interface Location {
    id: number;
    name: string;
}

interface Position {
    id: number;
    name: string;
}

interface Shift {
    id: number;
    employee_id: number;
    employee?: Employee;
    location_id?: number;
    location?: Location;
    position_id?: number;
    position?: Position;
    start_time: string;
    end_time: string;
    shift_type: 'morning' | 'afternoon' | 'evening' | 'night' | 'split';
    status: 'draft' | 'published' | 'completed' | 'cancelled';
    notes?: string;
}

export default function Shifts() {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [view, setView] = React.useState<'week' | 'month'>('week');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [selectedShift, setSelectedShift] = React.useState<Shift | null>(null);
    const [error, setError] = React.useState('');

    const qc = useQueryClient();

    const [formData, setFormData] = React.useState({
        employee_id: '',
        location_id: '',
        position_id: '',
        start_time: '',
        end_time: '',
        shift_type: 'morning',
        notes: '',
        status: 'draft'
    });

    // Format date for API
    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    // Fetch schedule
    const { data: scheduleData, isLoading } = useQuery({
        queryKey: ['schedule', formatDate(currentDate), view],
        queryFn: () => apiGet(`/api/admin/schedule?date=${formatDate(currentDate)}&view=${view}`)
    });

    // Fetch employees
    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => apiGet('/api/employees')
    });

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations')
    });

    // Fetch positions
    const { data: positions } = useQuery({
        queryKey: ['positions'],
        queryFn: () => apiGet('/api/positions')
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['shift-stats', formatDate(currentDate)],
        queryFn: () => apiGet(`/api/admin/shifts/stats?start_date=${formatDate(currentDate)}`)
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/shifts', data),
        onSuccess: () => {
            toastSuccess('Shift created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['schedule'] });
            qc.invalidateQueries({ queryKey: ['shift-stats'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to create shift')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/shifts/${id}`, data),
        onSuccess: () => {
            toastSuccess('Shift updated successfully!');
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['schedule'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to update shift')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/shifts/${id}`),
        onSuccess: () => {
            toastSuccess('Shift deleted!');
            qc.invalidateQueries({ queryKey: ['schedule'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to delete')
    });

    const publishMutation = useMutation({
        mutationFn: (shiftIds: number[]) => apiPost('/api/admin/shifts/publish', { shift_ids: shiftIds }),
        onSuccess: () => {
            toastSuccess('Shifts published!');
            qc.invalidateQueries({ queryKey: ['schedule'] });
        }
    });

    const resetForm = () => {
        setFormData({
            employee_id: '',
            location_id: '',
            position_id: '',
            start_time: '',
            end_time: '',
            shift_type: 'morning',
            notes: '',
            status: 'draft'
        });
        setSelectedShift(null);
        setError('');
    };

    const handleEdit = (shift: Shift) => {
        setFormData({
            employee_id: shift.employee_id.toString(),
            location_id: shift.location_id?.toString() || '',
            position_id: shift.position_id?.toString() || '',
            start_time: shift.start_time,
            end_time: shift.end_time,
            shift_type: shift.shift_type,
            notes: shift.notes || '',
            status: shift.status
        });
        setSelectedShift(shift);
        setOpenEdit(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data = {
            employee_id: parseInt(formData.employee_id),
            location_id: formData.location_id ? parseInt(formData.location_id) : null,
            position_id: formData.position_id ? parseInt(formData.position_id) : null,
            start_time: formData.start_time,
            end_time: formData.end_time,
            shift_type: formData.shift_type,
            notes: formData.notes,
            status: formData.status
        };

        if (selectedShift) {
            updateMutation.mutate({ id: selectedShift.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const publishDraftShifts = () => {
        const draftShifts = scheduleData?.shifts?.filter((s: Shift) => s.status === 'draft').map((s: Shift) => s.id) || [];
        if (draftShifts.length > 0) {
            publishMutation.mutate(draftShifts);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'published': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (view === 'week') {
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
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
                                Shift Management
                            </h1>
                            <p className="text-gray-400 mt-1">Schedule and manage employee shifts</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Total Shifts</div>
                                <div className="text-xl font-bold text-white">{stats?.total_shifts || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Published</div>
                                <div className="text-xl font-bold text-blue-400">{stats?.published || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Draft</div>
                                <div className="text-xl font-bold text-yellow-400">{stats?.draft || 0}</div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={publishDraftShifts} variant="secondary"
                                className="border-green-500/20 hover:bg-green-500/10 text-green-400">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Publish Drafts
                            </Button>
                            <Button
                                onClick={() => { resetForm(); setOpenCreate(true); }}
                                className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Shift
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Calendar Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 flex items-center justify-between bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10"
                >
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigateDate('prev')}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="text-white font-semibold text-lg">
                            {view === 'week'
                                ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={() => navigateDate('next')}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                            <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                        <Button size="sm" onClick={() => setCurrentDate(new Date())}
                            className="bg-white/10 hover:bg-white/20">
                            Today
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setView('week')}
                            className={`px-4 py-2 rounded-lg transition-colors ${view === 'week' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setView('month')}
                            className={`px-4 py-2 rounded-lg transition-colors ${view === 'month' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                }`}
                        >
                            Month
                        </button>
                    </div>
                </motion.div>

                {/* Shifts List */}
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
                        scheduleData?.shifts?.map((shift: Shift, index: number) => (
                            <motion.div key={shift.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}>
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                                                    <User className="w-4 h-4" />
                                                    {shift.employee?.name}
                                                </h3>
                                                <p className="text-sm text-gray-400">{shift.position?.name || 'No position'}</p>
                                            </div>
                                            <Badge className={getStatusColor(shift.status)}>
                                                {shift.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm text-gray-300">
                                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                {new Date(shift.start_time).toLocaleDateString()} at {new Date(shift.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-300">
                                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                                Ends: {new Date(shift.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            {shift.location && (
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    {shift.location.name}
                                                </div>
                                            )}
                                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                {shift.shift_type}
                                            </Badge>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(shift)}
                                                className="flex-1 border-white/20 hover:bg-white/10">
                                                <Edit className="w-3 h-3 mr-1" />Edit
                                            </Button>
                                            <Button size="sm" variant="danger"
                                                onClick={() => window.confirm('Delete this shift?') && deleteMutation.mutate(shift.id)}
                                                className="border-red-500/20 hover:bg-red-500/10 text-red-400">
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
                <Modal open={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                    title={selectedShift ? 'Edit Shift' : 'Create Shift'} size="lg">
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
                                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                                <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">No specific location</option>
                                    {locations?.data?.map((loc: Location) => (
                                        <option key={loc.id} value={loc.id} className="bg-gray-800">{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
                                <select value={formData.position_id} onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">Use employee's position</option>
                                    {positions?.data?.map((pos: Position) => (
                                        <option key={pos.id} value={pos.id} className="bg-gray-800">{pos.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Shift Type *</label>
                                <select required value={formData.shift_type} onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="morning" className="bg-gray-800">Morning</option>
                                    <option value="afternoon" className="bg-gray-800">Afternoon</option>
                                    <option value="evening" className="bg-gray-800">Evening</option>
                                    <option value="night" className="bg-gray-800">Night</option>
                                    <option value="split" className="bg-gray-800">Split</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time *</label>
                                <Input type="datetime-local" required value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">End Time *</label>
                                <Input type="datetime-local" required value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={3} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                                <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="draft" className="bg-gray-800">Draft</option>
                                    <option value="published" className="bg-gray-800">Published</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1">{selectedShift ? 'Update' : 'Create'} Shift</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
