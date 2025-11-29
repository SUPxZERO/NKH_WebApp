import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/app/layouts/AdminLayout';
import { apiGet, apiPost, apiPut } from '@/app/libs/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { ChevronLeft, ChevronRight, Plus, Trash2, AlertCircle } from 'lucide-react';

interface Shift {
    id: number;
    employee_id: number;
    employee_name: string;
    position_name: string;
    date: string;
    start_time: string;
    end_time: string;
    location_id: number;
    location_name: string;
    status: 'draft' | 'published' | 'completed';
    notes: string;
}

interface ShiftTemplate {
    id: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    location_id: number;
    position_id: number;
}

export default function ShiftScheduler() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [newShift, setNewShift] = useState({
        employee_id: '',
        date: '',
        start_time: '09:00',
        end_time: '17:00',
        location_id: '',
        notes: '',
    });

    const qc = useQueryClient();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Fetch shifts for current month
    const { data: shiftsData, isLoading } = useQuery({
        queryKey: ['shifts.calendar', monthStart.toISOString(), selectedLocation],
        queryFn: () =>
            apiGet('/api/shifts', {
                params: {
                    start_date: monthStart.toISOString().split('T')[0],
                    end_date: monthEnd.toISOString().split('T')[0],
                    location_id: selectedLocation,
                },
            }),
    });

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations'),
    });

    // Fetch employees
    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => apiGet('/api/employees'),
    });

    // Fetch shift templates
    const { data: templates } = useQuery({
        queryKey: ['shift-templates'],
        queryFn: () => apiGet('/api/shift-templates'),
    });

    // Create shift mutation
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/shifts', data),
        onSuccess: () => {
            toastSuccess('Shift created successfully');
            setShowCreateModal(false);
            setNewShift({
                employee_id: '',
                date: '',
                start_time: '09:00',
                end_time: '17:00',
                location_id: '',
                notes: '',
            });
            qc.invalidateQueries({ queryKey: ['shifts.calendar'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to create shift');
        },
    });

    // Delete shift mutation
    const deleteMutation = useMutation({
        mutationFn: (shiftId: number) => apiPost(`/api/shifts/${shiftId}/delete`, {}),
        onSuccess: () => {
            toastSuccess('Shift deleted successfully');
            qc.invalidateQueries({ queryKey: ['shifts.calendar'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to delete shift');
        },
    });

    // Apply template
    const applyTemplateMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/shifts/apply-template', data),
        onSuccess: () => {
            toastSuccess('Template applied successfully');
            qc.invalidateQueries({ queryKey: ['shifts.calendar'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to apply template');
        },
    });

    // Get calendar days for current month
    const getDaysInMonth = () => {
        const days = [];
        const firstDay = monthStart.getDay();
        const daysInMonth = monthEnd.getDate();

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Days of month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
        }

        return days;
    };

    const getShiftsForDate = (date: Date | null) => {
        if (!date || !(shiftsData as any)?.data) return [];
        const dateStr = date.toISOString().split('T')[0];
        return (shiftsData as any).data.filter((shift: Shift) => shift.date === dateStr);
    };

    const handlePreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleCreateShift = () => {
        if (!newShift.employee_id || !newShift.date || !newShift.location_id) {
            toastError('Please fill all required fields');
            return;
        }
        createMutation.mutate(newShift);
    };

    const days = getDaysInMonth();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <AdminLayout>
            <Head title="Shift Scheduler" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Shift Scheduler</h1>
                        <p className="mt-2 text-gray-600">Create, manage, and schedule employee shifts</p>
                    </div>
                    <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                        <Plus size={18} />
                        New Shift
                    </Button>
                </div>

                {/* Controls */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Calendar View</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-4">
                                <Button variant="outline" onClick={handlePreviousMonth}>
                                    <ChevronLeft size={18} />
                                </Button>
                                <h2 className="text-xl font-bold min-w-48 text-center">
                                    {currentDate.toLocaleString('default', {
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </h2>
                                <Button variant="outline" onClick={handleNextMonth}>
                                    <ChevronRight size={18} />
                                </Button>
                            </div>

                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <select
                                        value={selectedLocation}
                                        onChange={(e) => setSelectedLocation(e.target.value)}
                                        className="rounded border border-gray-300 px-3 py-2"
                                    >
                                        <option value="">All Locations</option>
                                        {(locations as any)?.data?.map((loc: any) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Week headers */}
                                <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
                                    {weekDays.map((day) => (
                                        <div
                                            key={day}
                                            className="p-4 text-center font-semibold text-gray-700 text-sm"
                                        >
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar days */}
                                <div className="grid grid-cols-7">
                                    {days.map((date, idx) => (
                                        <div
                                            key={idx}
                                            className={`min-h-24 p-2 border border-gray-200 ${
                                                !date ? 'bg-gray-50' : ''
                                            }`}
                                        >
                                            {date && (
                                                <>
                                                    <p className="text-sm font-semibold text-gray-900 mb-1">
                                                        {date.getDate()}
                                                    </p>
                                                    <div className="space-y-1">
                                                        {getShiftsForDate(date).map((shift: Shift) => (
                                                            <div
                                                                key={shift.id}
                                                                className={`text-xs p-1 rounded truncate cursor-pointer group relative ${
                                                                    shift.status === 'published'
                                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                                                }`}
                                                                title={`${shift.employee_name}: ${shift.start_time} - ${shift.end_time}`}
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <span className="flex-1">
                                                                        {shift.employee_name.split(' ')[0]}
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            deleteMutation.mutate(
                                                                                shift.id
                                                                            )
                                                                        }
                                                                        className="opacity-0 group-hover:opacity-100 ml-1"
                                                                        disabled={
                                                                            deleteMutation.isPending
                                                                        }
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                                <span className="text-xs">
                                                                    {shift.start_time.substring(0, 5)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Shift Templates Card */}
                {(templates as any)?.data?.length > 0 && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Quick Apply Templates</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {(templates as any).data.map((template: ShiftTemplate) => (
                                    <Button
                                        key={template.id}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            applyTemplateMutation.mutate({
                                                template_id: template.id,
                                                month: currentDate.getMonth() + 1,
                                                year: currentDate.getFullYear(),
                                            });
                                        }}
                                    >
                                        Apply Template {template.id}
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Create Shift Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Create New Shift</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employee *
                                    </label>
                                    <select
                                        value={newShift.employee_id}
                                        onChange={(e) =>
                                            setNewShift({ ...newShift, employee_id: e.target.value })
                                        }
                                        className="w-full rounded border border-gray-300 px-3 py-2"
                                    >
                                        <option value="">Select Employee</option>
                                        {(employees as any)?.data?.map((emp: any) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location *
                                    </label>
                                    <select
                                        value={newShift.location_id}
                                        onChange={(e) =>
                                            setNewShift({ ...newShift, location_id: e.target.value })
                                        }
                                        className="w-full rounded border border-gray-300 px-3 py-2"
                                    >
                                        <option value="">Select Location</option>
                                        {(locations as any)?.data?.map((loc: any) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={newShift.date}
                                        onChange={(e) =>
                                            setNewShift({ ...newShift, date: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Time
                                        </label>
                                        <Input
                                            type="time"
                                            value={newShift.start_time}
                                            onChange={(e) =>
                                                setNewShift({
                                                    ...newShift,
                                                    start_time: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Time
                                        </label>
                                        <Input
                                            type="time"
                                            value={newShift.end_time}
                                            onChange={(e) =>
                                                setNewShift({ ...newShift, end_time: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={newShift.notes}
                                        onChange={(e) =>
                                            setNewShift({ ...newShift, notes: e.target.value })
                                        }
                                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleCreateShift}
                                        disabled={createMutation.isPending}
                                        className="flex-1"
                                    >
                                        Create Shift
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AdminLayout>
    );
}
