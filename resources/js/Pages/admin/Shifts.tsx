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
    XCircle,
    Sparkles
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

interface ShiftUser {
    name: string;
}

interface Employee {
    id: number;
    user?: ShiftUser;
    position?: { title: string };
    position_id?: number;
    location_id?: number;
}

interface Location {
    id: number;
    name: string;
}

interface Position {
    id: number;
    title: string;
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
    date?: string;
}

// Stats Card Component - Mobile optimized
const StatCard = ({ title, value, color, index = 0 }: { title: string; value: number | string; color: string; index?: number }) => {
    const colorStyles: Record<string, { gradient: string; text: string; border: string; shadow: string }> = {
        purple: {
            gradient: 'from-fuchsia-500/20 to-purple-500/10',
            text: 'text-fuchsia-600 dark:text-fuchsia-400',
            border: 'border-fuchsia-500/30',
            shadow: 'shadow-fuchsia-500/20'
        },
        blue: {
            gradient: 'from-blue-500/20 to-cyan-500/10',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-500/30',
            shadow: 'shadow-blue-500/20'
        },
        amber: {
            gradient: 'from-amber-500/20 to-orange-500/10',
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
                "relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 min-w-[80px]",
                "hover:shadow-lg transition-all duration-300",
                styles.border
            )}
        >
            <div className={cn("absolute inset-0 opacity-50", `bg-gradient-to-br ${styles.gradient}`)} />
            <div className="relative z-10">
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">{title}</div>
                <div className={cn("text-base sm:text-lg md:text-xl font-bold mt-0.5", styles.text)}>{value}</div>
            </div>
        </motion.div>
    );
};

export default function Shifts() {
    // ... (state hooks)
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [view, setView] = React.useState<'week' | 'month'>('week');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openCopy, setOpenCopy] = React.useState(false);
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

    // Helper to get range dates
    const getRange = React.useCallback(() => {
        const start = new Date(currentDate);
        if (view === 'week') {
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
            start.setDate(diff);
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0]
            };
        } else {
            const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
            const endMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
            return {
                start: startMonth.toISOString().split('T')[0],
                end: endMonth.toISOString().split('T')[0]
            };
        }
    }, [currentDate, view]);

    const range = getRange();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    // Queries
    const { data: scheduleData, isLoading } = useQuery({
        queryKey: ['schedule', range.start, range.end, view],
        queryFn: () => apiGet(`/api/admin/schedule?date=${range.start}&view=${view}`)
    });

    const { data: employees } = useQuery({
        queryKey: ['employees'],
        queryFn: () => apiGet('/api/admin/employees')
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/admin/locations')
    });

    const { data: positions } = useQuery({
        queryKey: ['positions'],
        queryFn: () => apiGet('/api/positions')
    });

    const { data: stats } = useQuery({
        queryKey: ['shift-stats', range.start, range.end],
        queryFn: () => apiGet(`/api/admin/shifts/stats?start_date=${range.start}&end_date=${range.end}`)
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
            qc.invalidateQueries({ queryKey: ['shift-stats'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to update shift')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/shifts/${id}`),
        onSuccess: () => {
            toastSuccess('Shift deleted!');
            qc.invalidateQueries({ queryKey: ['schedule'] });
            qc.invalidateQueries({ queryKey: ['shift-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to delete')
    });

    const publishMutation = useMutation({
        mutationFn: (shiftIds: number[]) => apiPost('/api/admin/shifts/publish', { shift_ids: shiftIds }),
        onSuccess: () => {
            toastSuccess('Shifts published!');
            qc.invalidateQueries({ queryKey: ['schedule'] });
            qc.invalidateQueries({ queryKey: ['shift-stats'] });
        }
    });

    const copyMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/shifts/copy', data),
        onSuccess: () => {
            toastSuccess('Shifts copied successfully!');
            setOpenCopy(false);
            qc.invalidateQueries({ queryKey: ['schedule'] });
            qc.invalidateQueries({ queryKey: ['shift-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to copy shifts')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (shift: Shift) => {
            const newStatus = shift.status === 'draft' ? 'published' : 'draft';
            // We need to send ALL required fields to update, or use PATCH if supported.
            // Our API uses PUT usually which requires all fields.
            // But let's try just sending status if the backend validates strictly.
            // Actually, best to use the publish endpoint or a new toggle endpoint.
            // But for now, let's use the update endpoint with existing data.
            // Safer: Call a specific toggle endpoint or just update status.
            return apiPut(`/api/admin/shifts/${shift.id}`, {
                ...shift,
                start_time: formatDateTimeForInput(shift.start_time, shift.date),
                end_time: formatDateTimeForInput(shift.end_time, shift.date),
                employee_id: shift.employee_id,
                status: newStatus
            });
        },
        onSuccess: () => {
            toastSuccess('Status updated!');
            qc.invalidateQueries({ queryKey: ['schedule'] });
            qc.invalidateQueries({ queryKey: ['shift-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to update status')
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

    const formatDateTimeForInput = (timeStr: string, dateStr?: string) => {
        if (!timeStr) return '';
        let date = new Date(timeStr);
        // If Invalid Date (e.g. time string only), combine with date
        if (isNaN(date.getTime())) {
            const baseDate = dateStr ? dateStr.split('T')[0] : new Date().toISOString().split('T')[0];
            date = new Date(`${baseDate}T${timeStr}`);
        }

        // Format to YYYY-MM-DDThh:mm
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const handleEdit = (shift: Shift) => {
        setFormData({
            employee_id: shift.employee_id.toString(),
            location_id: shift.location_id?.toString() || '',
            position_id: shift.position_id?.toString() || '',
            start_time: formatDateTimeForInput(shift.start_time, shift.date),
            end_time: formatDateTimeForInput(shift.end_time, shift.date),
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
            if (window.confirm(`Publish ${draftShifts.length} draft shifts?`)) {
                publishMutation.mutate(draftShifts);
            }
        } else {
            toastError("No draft shifts to publish.");
        }
    };

    const handleCopyWeek = () => {
        const sourceStart = new Date(currentDate);
        sourceStart.setDate(sourceStart.getDate() - 7); // Previous week

        const targetStart = new Date(currentDate); // This week

        // Simple confirmation for now, could be a modal
        if (window.confirm("Copy schedule from previous week to this week?")) {
            copyMutation.mutate({
                source_start_date: sourceStart.toISOString().split('T')[0],
                target_start_date: targetStart.toISOString().split('T')[0]
            });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            case 'published': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20'; // Fixed red for cancelled
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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

    // Group shifts by day for Week view
    const groupShiftsByDay = () => {
        const days = [];
        const start = new Date(range.start);
        for (let i = 0; i < 7; i++) {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const dayShifts = scheduleData?.shifts?.filter((s: Shift) => s.date === dateStr || s.start_time.startsWith(dateStr)) || [];
            days.push({ date, shifts: dayShifts });
        }
        return days;
    };

    const groupedShifts = groupShiftsByDay();

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 text-foreground overflow-x-hidden">
                {/* Decorative Background - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 space-y-4 sm:space-y-6">
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
                                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent truncate">
                                        {view === 'week' ? 'Weekly' : 'Monthly'} Schedule
                                    </h1>
                                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        Manage team shifts
                                    </p>
                                </div>
                                <Button onClick={() => { resetForm(); setOpenCreate(true); }} className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0 bg-primary hover:bg-primary/90">
                                    <Plus className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Add Shift</span>
                                </Button>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                                <StatCard title="Total" value={stats?.total_shifts || 0} color="purple" index={0} />
                                <StatCard title="Published" value={stats?.published || 0} color="blue" index={1} />
                                <StatCard title="Draft" value={stats?.draft || 0} color="amber" index={2} />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                <Button onClick={handleCopyWeek} variant="outline" size="sm" className="border-blue-500/20 hover:bg-blue-500/10 text-blue-500 h-9 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
                                    <Copy className="w-3.5 h-3.5 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Copy Week</span>
                                </Button>
                                <Button onClick={publishDraftShifts} variant="secondary" size="sm"
                                    className="border-green-500/20 hover:bg-green-500/10 text-green-600 h-9 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0">
                                    <CheckCircle className="w-3.5 h-3.5 sm:mr-1.5" />
                                    <span className="hidden sm:inline">Publish</span>
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Navigation Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between bg-card rounded-xl p-3 sm:p-4 border border-border gap-3 sm:gap-4 shadow-sm"
                    >
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button onClick={() => navigateDate('prev')}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-secondary/50 transition-colors text-foreground">
                                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <div className="text-foreground font-semibold text-sm sm:text-base md:text-lg min-w-[140px] sm:min-w-[200px] text-center">
                                {view === 'week'
                                    ? <span className="flex flex-col items-center leading-tight">
                                        <span className="text-[10px] sm:text-xs text-muted-foreground">Week of</span>
                                        <span className="text-xs sm:text-sm md:text-base">{new Date(range.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(range.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </span>
                                    : <span className="text-sm sm:text-base">{new Date(currentDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>}
                            </div>
                            <button onClick={() => navigateDate('next')}
                                className="p-1.5 sm:p-2 rounded-lg hover:bg-secondary/50 transition-colors text-foreground">
                                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <Button size="sm" onClick={() => setCurrentDate(new Date())}
                                variant="secondary" className="hidden sm:flex ml-2 h-8 text-xs">
                                Today
                            </Button>
                        </div>

                        <div className="flex bg-secondary/30 p-1 rounded-lg">
                            {['week', 'month'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setView(v as 'week' | 'month')}
                                    className={cn(
                                        'px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all capitalize',
                                        view === v
                                            ? 'bg-background shadow text-foreground'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Week View - Responsive grid */}
                    {view === 'week' && (
                        <>
                            {/* Desktop: 7-column grid */}
                            <div className="hidden md:grid grid-cols-7 gap-3 md:gap-4 min-h-[500px]">
                                {groupedShifts.map((day, dayIndex) => {
                                    const isToday = new Date().toDateString() === day.date.toDateString();
                                    return (
                                        <div key={dayIndex} className={cn(
                                            "flex flex-col rounded-xl border transition-colors",
                                            isToday ? "bg-primary/5 border-primary/30" : "bg-card/50 border-border"
                                        )}>
                                            <div className={cn(
                                                "p-2 sm:p-3 border-b text-center rounded-t-xl",
                                                isToday ? "bg-primary/10" : "bg-secondary/20"
                                            )}>
                                                <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
                                                    {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className={cn(
                                                    "text-lg sm:text-xl font-bold mt-0.5 sm:mt-1",
                                                    isToday ? "text-primary" : "text-foreground"
                                                )}>
                                                    {day.date.getDate()}
                                                </div>
                                            </div>

                                            <div className="flex-1 p-1.5 sm:p-2 space-y-2 sm:space-y-3 min-h-[120px] sm:min-h-[150px]">
                                                {day.shifts.length === 0 ? (
                                                    <div className="h-full flex items-center justify-center text-[10px] sm:text-xs text-muted-foreground/50 italic py-4 sm:py-8">
                                                        No shifts
                                                    </div>
                                                ) : (
                                                    day.shifts.map((shift: Shift, idx: number) => (
                                                        <motion.div
                                                            key={shift.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: idx * 0.05 }}
                                                            className="group relative bg-card border border-border rounded-lg p-2 sm:p-3 hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
                                                            onClick={() => handleEdit(shift)}
                                                        >
                                                            <div className={cn(
                                                                "absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full",
                                                                shift.status === 'published' ? "bg-blue-500" :
                                                                    shift.status === 'completed' ? "bg-green-500" :
                                                                        shift.status === 'cancelled' ? "bg-red-500" : "bg-gray-500"
                                                            )} />

                                                            <div className="pl-2">
                                                                <div className="font-medium text-xs sm:text-sm text-foreground truncate">
                                                                    {shift.employee?.user?.name || 'Unknown'}
                                                                </div>
                                                                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                                                    {shift.position?.title || 'No Position'}
                                                                </div>
                                                                <div className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 text-blue-500" />
                                                                    {(() => {
                                                                        const getDate = (timeStr: string, dateStr: string) => {
                                                                            if (timeStr.includes('T') || timeStr.includes(' ')) return new Date(timeStr);
                                                                            return new Date(`${dateStr.split('T')[0]}T${timeStr}`);
                                                                        };
                                                                        const start = getDate(shift.start_time, shift.date || new Date().toISOString());
                                                                        const end = getDate(shift.end_time, shift.date || new Date().toISOString());
                                                                        return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mobile: Vertical list */}
                            <div className="md:hidden space-y-3">
                                {groupedShifts.map((day, dayIndex) => {
                                    const isToday = new Date().toDateString() === day.date.toDateString();
                                    if (day.shifts.length === 0) return null;
                                    return (
                                        <div key={dayIndex} className={cn(
                                            "rounded-xl border overflow-hidden",
                                            isToday ? "bg-primary/5 border-primary/30" : "bg-card/50 border-border"
                                        )}>
                                            <div className={cn(
                                                "px-3 py-2 flex items-center justify-between",
                                                isToday ? "bg-primary/10" : "bg-secondary/20"
                                            )}>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("text-lg font-bold", isToday ? "text-primary" : "text-foreground")}>
                                                        {day.date.getDate()}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short' })}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{day.shifts.length} shifts</span>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                {day.shifts.map((shift: Shift) => (
                                                    <div
                                                        key={shift.id}
                                                        className="bg-card border border-border rounded-lg p-3 flex items-center justify-between gap-2"
                                                        onClick={() => handleEdit(shift)}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={cn(
                                                                "w-1 h-10 rounded-full flex-shrink-0",
                                                                shift.status === 'published' ? "bg-blue-500" :
                                                                    shift.status === 'completed' ? "bg-green-500" :
                                                                        shift.status === 'cancelled' ? "bg-red-500" : "bg-gray-500"
                                                            )} />
                                                            <div className="min-w-0">
                                                                <div className="font-medium text-sm text-foreground truncate">
                                                                    {shift.employee?.user?.name || 'Unknown'}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {(() => {
                                                                        const getDate = (timeStr: string, dateStr: string) => {
                                                                            if (timeStr.includes('T') || timeStr.includes(' ')) return new Date(timeStr);
                                                                            return new Date(`${dateStr.split('T')[0]}T${timeStr}`);
                                                                        };
                                                                        const start = getDate(shift.start_time, shift.date || new Date().toISOString());
                                                                        const end = getDate(shift.end_time, shift.date || new Date().toISOString());
                                                                        return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Badge className={cn(getStatusColor(shift.status), "text-[10px]")}>
                                                            {shift.status}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {groupedShifts.every(d => d.shifts.length === 0) && (
                                    <div className="p-8 text-center bg-card/50 rounded-xl border border-border">
                                        <CalendarIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground text-sm">No shifts this week</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Month View - Responsive grid */}
                    {view === 'month' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                            {scheduleData?.shifts?.map((shift: Shift) => (
                                <Card key={shift.id} className="bg-card border-border hover:border-primary/50 transition-all cursor-pointer" onClick={() => handleEdit(shift)}>
                                    <CardContent className="p-3 sm:p-4">
                                        <div className="flex justify-between items-start mb-2 gap-2">
                                            <div className="font-bold text-sm sm:text-base text-foreground truncate">{shift.employee?.user?.name}</div>
                                            <Badge
                                                className={cn(getStatusColor(shift.status), "cursor-pointer hover:opacity-80 transition-opacity text-[10px] sm:text-xs flex-shrink-0")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleStatusMutation.mutate(shift);
                                                }}
                                            >
                                                {shift.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                                            <div>{new Date(shift.date || shift.start_time).toLocaleDateString()}</div>
                                            <div>
                                                {(() => {
                                                    const getDate = (timeStr: string, dateStr: string) => {
                                                        if (timeStr.includes('T') || timeStr.includes(' ')) return new Date(timeStr);
                                                        return new Date(`${dateStr.split('T')[0]}T${timeStr}`);
                                                    };
                                                    const start = getDate(shift.start_time, shift.date || new Date().toISOString());
                                                    const end = getDate(shift.end_time, shift.date || new Date().toISOString());
                                                    return `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                                })()}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Create/Edit Modal - Mobile optimized */}
                    <Modal open={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                        title={selectedShift ? 'Edit Shift' : 'New Shift'} size="lg">
                        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                            {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 sm:p-3 text-red-500 text-xs sm:text-sm">{error}</div>}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs sm:text-sm font-semibold text-foreground">Employee <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select required value={formData.employee_id} onChange={(e) => {
                                            const empId = e.target.value;
                                            const emp = employees?.data?.find((e: Employee) => e.id.toString() === empId);
                                            setFormData({
                                                ...formData,
                                                employee_id: empId,
                                                position_id: emp?.position_id?.toString() || '',
                                                location_id: emp?.location_id?.toString() || ''
                                            });
                                        }}
                                            className="w-full h-10 bg-background border border-input rounded-lg px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                                            <option value="">Select</option>
                                            {employees?.data?.map((emp: Employee) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.user?.name || `Employee #${emp.id}`}
                                                </option>
                                            ))}
                                        </select>
                                        <User className="absolute right-3 top-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs sm:text-sm font-semibold text-foreground">Location</label>
                                    <div className="relative">
                                        <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                            className="w-full h-10 bg-background border border-input rounded-lg px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                                            <option value="">No location</option>
                                            {locations?.data?.map((loc: Location) => (
                                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                                            ))}
                                        </select>
                                        <MapPin className="absolute right-3 top-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5 hidden sm:block">
                                    <label className="block text-xs sm:text-sm font-semibold text-foreground">Position</label>
                                    <select value={formData.position_id} onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                                        className="w-full h-10 bg-background border border-input rounded-lg px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                                        <option value="">Use default</option>
                                        {positions?.data?.map((pos: Position) => (
                                            <option key={pos.id} value={pos.id}>{pos.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs sm:text-sm font-semibold text-foreground">Type <span className="text-red-500">*</span></label>
                                    <select required value={formData.shift_type} onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                                        className="w-full h-10 bg-background border border-input rounded-lg px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                                        <option value="morning">Morning</option>
                                        <option value="afternoon">Afternoon</option>
                                        <option value="evening">Evening</option>
                                        <option value="night">Night</option>
                                        <option value="split">Split</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs sm:text-sm font-semibold text-foreground">Start <span className="text-red-500">*</span></label>
                                    <Input type="datetime-local" required value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="h-10 text-sm rounded-lg" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs sm:text-sm font-semibold text-foreground">End <span className="text-red-500">*</span></label>
                                    <Input type="datetime-local" required value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="h-10 text-sm rounded-lg" />
                                </div>

                                <div className="sm:col-span-2 space-y-1.5 hidden sm:block">
                                    <label className="block text-xs sm:text-sm font-semibold text-foreground">Notes</label>
                                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                        rows={2}
                                        placeholder="Notes..." />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs sm:text-sm font-semibold text-foreground">Status <span className="text-red-500">*</span></label>
                                    <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full h-10 bg-background border border-input rounded-lg px-3 text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
                                <Button type="button" variant="ghost" onClick={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                                    className="flex-1 h-10 sm:h-11 text-sm rounded-lg">
                                    Cancel
                                </Button>
                                <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 h-10 sm:h-11 text-sm rounded-lg bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white">
                                    {selectedShift ? 'Save' : 'Create'}
                                </Button>
                            </div>
                        </form>
                    </Modal>
                </div>
            </div>
        </AdminLayout>
    );
}
