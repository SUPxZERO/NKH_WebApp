import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import { Skeleton } from '@/app/components/ui/Loading';
import { toastSuccess, toastError } from '@/app/utils/toast';
import MyRequestsTab from './components/MyRequestsTab';
import { useLanguage } from '@/app/context/LanguageContext';
import {
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Briefcase,
    Plus,
    AlertCircle,
    CheckCircle,
    XCircle,
    Coffee,
    RefreshCw,
    UserCheck,
    Ban,
} from 'lucide-react';

interface Shift {
    id: number;
    employee_id: number;
    date: string;
    start_time: string;
    end_time: string;
    position: string;
    location_name: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    notes?: string;
}

interface TimeOffRequest {
    id: number;
    start_date: string;
    end_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'denied';
    created_at: string;
}

interface ShiftSwap {
    id: number;
    shift_id: number;
    requester_id: number;
    recipient_id: number | null;
    type: 'give_away' | 'trade';
    status: 'pending' | 'accepted_by_peer' | 'approved' | 'denied' | 'cancelled';
    reason: string | null;
    created_at: string;
    approved_at: string | null;
    approved_by: number | null;
    denial_reason: string | null;
    shift: {
        id: number;
        date: string;
        start_time: string;
        end_time: string;
        position: { name: string };
        location: { name: string };
    };
    requester: {
        id: number;
        user: { name: string };
    };
    recipient?: {
        id: number;
        user: { name: string };
    } | null;
}

export default function Schedule() {
    const { t, locale } = useLanguage();
    const [showTimeOffModal, setShowTimeOffModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [swapType, setSwapType] = useState<'give_away' | 'trade'>('give_away');
    const [swapReason, setSwapReason] = useState('');
    const [timeOffData, setTimeOffData] = useState({
        start_date: '',
        end_date: '',
        reason: '',
    });

    const qc = useQueryClient();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Navigate Calendar
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    // Fetch employee shifts
    const { data: shifts, isLoading: shiftsLoading } = useQuery<{ data: Shift[] }>({
        queryKey: ['employee.shifts'],
        queryFn: () => apiGet('/employee/shifts'),
        staleTime: 1000 * 60 * 5,
    });

    // Fetch time off requests
    const { data: timeOfRequests, isLoading: requestsLoading } = useQuery<{ data: TimeOffRequest[] }>({
        queryKey: ['employee.time-off-requests'],
        queryFn: () => apiGet('/employee/time-off-requests'),
        staleTime: 1000 * 60 * 5,
    });

    // Submit time off request mutation
    const timeOffMutation = useMutation({
        mutationFn: (data: typeof timeOffData) => apiPost('/employee/time-off-requests', data),
        onSuccess: () => {
            toastSuccess(t('employee.schedule.request_submitted'));
            setShowTimeOffModal(false);
            setTimeOffData({ start_date: '', end_date: '', reason: '' });
            qc.invalidateQueries({ queryKey: ['employee.time-off-requests'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || t('employee.common.error'));
        },
    });

    // Helper to parse shift datetime properly
    const parseShiftDateTime = (dateStr: string, timeStr: string): Date => {
        // Extract just the date part (YYYY-MM-DD) from ISO timestamp
        const datePart = dateStr.split('T')[0];
        return new Date(`${datePart}T${timeStr}`);
    };

    // Get next shift
    const nextShift = React.useMemo(() => {
        if (!shifts?.data) return null;
        const now = new Date();
        const upcoming = shifts.data
            .filter((s) => parseShiftDateTime(s.date, s.start_time) > now)
            .sort((a, b) => parseShiftDateTime(a.date, a.start_time).getTime() - parseShiftDateTime(b.date, b.start_time).getTime());
        return upcoming[0] || null;
    }, [shifts]);

    // Calculate week hours
    const weekHours = React.useMemo(() => {
        if (!shifts?.data) return 0;
        const now = new Date();
        // Calculate week start (Sunday at 00:00)
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);

        // Calculate week end (Next Sunday at 00:00)
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        return shifts.data
            .filter((s) => {
                // Parse just the date part from ISO timestamp
                const shiftDate = new Date(s.date.split('T')[0]);
                return shiftDate >= weekStart && shiftDate < weekEnd;
            })
            .reduce((total, s) => {
                const start = new Date(`2000-01-01T${s.start_time}`);
                let end = new Date(`2000-01-01T${s.end_time}`);

                // Handle overnight shifts (e.g., 18:00 - 02:00)
                if (end <= start) {
                    end.setDate(end.getDate() + 1); // Add one day to end time
                }

                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return total + hours;
            }, 0);
    }, [shifts]);

    // Group shifts by date (using YYYY-MM-DD format as key)
    const groupedShifts = React.useMemo(() => {
        if (!shifts?.data) return {};
        return shifts.data.reduce((acc, shift) => {
            // Extract just YYYY-MM-DD from ISO timestamp
            const dateKey = shift.date.split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(shift);
            return acc;
        }, {} as Record<string, Shift[]>);
    }, [shifts]);

    // Get week days based on currentDate
    const getWeekDays = () => {
        const days = [];
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        return days;
    };

    // Get month days (grid 6x7)
    const getMonthDays = () => {
        const days = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startDayIndex = firstDayOfMonth.getDay(); // 0-6 (Sun-Sat)

        // Previous month padding
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = startDayIndex - 1; i >= 0; i--) {
            days.push({
                date: new Date(year, month - 1, prevMonthLastDay - i),
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            days.push({
                date: new Date(year, month, i),
                isCurrentMonth: true
            });
        }

        // Next month padding to fill 42 cells (6 rows)
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                date: new Date(year, month + 1, i),
                isCurrentMonth: false
            });
        }

        return days;
    };

    // Tab state
    const [activeTab, setActiveTab] = useState<'schedule' | 'marketplace' | 'my_requests'>('schedule');

    // Fetch marketplace shifts (available swaps)
    const { data: marketplaceShifts, isLoading: marketplaceLoading } = useQuery<{ data: ShiftSwap[] }>({
        queryKey: ['shift-swaps.available'],
        queryFn: () => apiGet('/employee/shift-swaps?view=available'),
        enabled: activeTab === 'marketplace',
    });

    // Fetch my shift swap requests
    const { data: myRequests, isLoading: myRequestsLoading } = useQuery<{ data: ShiftSwap[] }>({
        queryKey: ['shift-swaps.my_requests'],
        queryFn: () => apiGet('/employee/shift-swaps?view=my_requests'),
        enabled: activeTab === 'my_requests',
    });

    // Claim Shift Mutation
    const claimMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/employee/shift-swaps/${id}`, { _method: 'PUT', action: 'claim' }),
        onSuccess: () => {
            toastSuccess(t('employee.schedule.shift_claimed'));
            qc.invalidateQueries({ queryKey: ['shift-swaps.available'] });
            qc.invalidateQueries({ queryKey: ['employee.shifts'] }); // Update my shifts if needed (though pending approval)
        },
        onError: (err: any) => {
            toastError(err?.response?.data?.message || t('employee.common.error'));
        }
    });

    const handleClaimShift = (id: number) => {
        if (confirm(t('employee.schedule.confirm_claim'))) {
            claimMutation.mutate(id);
        }
    };

    // Cancel Request Mutation
    const cancelMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/employee/shift-swaps/${id}`, { _method: 'PUT', action: 'cancel' }),
        onSuccess: () => {
            toastSuccess(t('employee.schedule.request_cancelled'));
            qc.invalidateQueries({ queryKey: ['shift-swaps.my_requests'] });
            qc.invalidateQueries({ queryKey: ['shift-swaps.available'] });
        },
        onError: (err: any) => {
            toastError(err?.response?.data?.message || t('employee.common.error'));
        }
    });

    const handleCancelRequest = (id: number) => {
        if (confirm(t('employee.schedule.confirm_cancel'))) {
            cancelMutation.mutate(id);
        }
    };

    const handleTimeOffSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        timeOffMutation.mutate(timeOffData);
    };

    // Swap Mutation
    const swapMutation = useMutation({
        mutationFn: (data: { shift_id: number, type: string, reason: string }) => apiPost('/employee/shift-swaps', data),
        onSuccess: () => {
            toastSuccess(t('employee.schedule.swap_created'));
            setSwapModalOpen(false);
            setSelectedShift(null);
            setSwapReason('');
        },
        onError: (err: any) => {
            toastError(err?.response?.data?.message || t('employee.common.error'));
        }
    });

    const handleSwapRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedShift) return;

        swapMutation.mutate({
            shift_id: selectedShift.id,
            type: swapType,
            reason: swapReason
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'denied':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
        }
    };

    const getStatusLabel = (status: string) => {
        const key = `employee.schedule.status.${status}`;
        const label = t(key);
        return label === key ? status.toUpperCase() : label;
    };

    return (
        <EmployeeLayout>
            <Head>
                <title>{t('employee.schedule.title')} - {t('meta.app_title')}</title>
            </Head>

            <div className="space-y-6">
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            {activeTab === 'schedule' ? t('employee.schedule.my_schedule') : activeTab === 'marketplace' ? t('employee.schedule.marketplace') : t('employee.schedule.my_requests')}
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {activeTab === 'schedule' ? t('employee.schedule.view_shifts') : activeTab === 'marketplace' ? t('employee.schedule.pickup_shifts') : t('employee.schedule.track_requests')}
                        </p>
                    </div>
                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 self-start md:self-auto">
                        <button
                            onClick={() => setActiveTab('schedule')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'schedule'
                                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/50'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {t('employee.schedule.my_schedule')}
                        </button>
                        <button
                            onClick={() => setActiveTab('marketplace')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'marketplace'
                                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/50'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {t('employee.schedule.marketplace')}
                        </button>
                        <button
                            onClick={() => setActiveTab('my_requests')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'my_requests'
                                ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/50'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {t('employee.schedule.my_requests')}
                        </button>
                    </div>
                    {activeTab === 'schedule' && (
                        <Button
                            onClick={() => setShowTimeOffModal(true)}
                            className="bg-gradient-to-r from-purple-500 to-pink-500"
                            leftIcon={<Plus className="w-4 h-4" />}
                        >
                            {t('employee.schedule.request_time_off')}
                        </Button>
                    )}
                </div>

                {activeTab === 'schedule' ? (
                    <>
                        {/* Next Shift Banner */}
                        {nextShift ? (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="bg-gradient-to-r from-fuchsia-600/20 via-pink-500/10 to-rose-500/20 border border-fuchsia-500/30 backdrop-blur-xl">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.next_shift')}</div>
                                                <div className="text-3xl font-bold text-white mb-2">
                                                    {new Date(nextShift.date).toLocaleDateString(locale || 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                                </div>
                                                <div className="flex flex-wrap gap-4 text-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-5 h-5 text-fuchsia-400" />
                                                        <span>{nextShift.start_time} - {nextShift.end_time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-5 h-5 text-fuchsia-400" />
                                                        <span>{typeof nextShift.position === 'object' ? (nextShift.position as any).title || (nextShift.position as any).name : nextShift.position}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-5 h-5 text-fuchsia-400" />
                                                        <span>{nextShift.location_name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-6xl opacity-50">📅</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6 text-center">
                                    <Coffee className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                                    <p className="text-gray-400">{t('employee.schedule.no_shifts')}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Week Hours Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.week_hours')}</div>
                                    <div className="text-4xl font-bold text-white">{weekHours.toFixed(1)}</div>
                                    <div className="text-sm text-gray-400 mt-1">{t('employee.schedule.hours_scheduled')}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.total_shifts')}</div>
                                    <div className="text-4xl font-bold text-white">{shifts?.data?.length || 0}</div>
                                    <div className="text-sm text-gray-400 mt-1">{t('employee.schedule.upcoming_shiftstext')}</div>
                                </CardContent>
                            </Card>

                            <Card className="bg-white/5 border-white/10">
                                <CardContent className="p-6">
                                    <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.pending_requests')}</div>
                                    <div className="text-4xl font-bold text-white">
                                        {timeOfRequests?.data?.filter((r) => r.status === 'pending').length || 0}
                                    </div>
                                    <div className="text-sm text-gray-400 mt-1">{t('employee.schedule.awaiting_approval')}</div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Week Calendar */}
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-semibold">{viewMode === 'week' ? t('employee.schedule.weekly') : t('employee.schedule.monthly')}</h2>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant={viewMode === 'week' ? 'primary' : 'ghost'} onClick={() => setViewMode('week')}>
                                            {t('employee.schedule.week')}
                                        </Button>
                                        <Button size="sm" variant={viewMode === 'month' ? 'primary' : 'ghost'} onClick={() => setViewMode('month')}>
                                            {t('employee.schedule.month')}
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {shiftsLoading ? (
                                    <div className="space-y-2">
                                        {Array.from({ length: 7 }).map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full" />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {/* Navigation & Header */}
                                        <div className="flex items-center justify-between mb-4 bg-white/5 p-2 rounded-lg">
                                            <Button variant="ghost" size="sm" onClick={handlePrev}>&lt;</Button>
                                            <div className="font-bold text-lg">
                                            {viewMode === 'week'
                                                ? t('employee.schedule.week_of', {
                                                    date: getWeekDays()[0].toLocaleDateString(locale || 'en-US', { month: 'short', day: 'numeric' })
                                                })
                                                : currentDate.toLocaleDateString(locale || 'en-US', { month: 'long', year: 'numeric' })
                                            }
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={handleNext}>&gt;</Button>
                                        </div>

                                        {viewMode === 'week' ? (
                                            <div className="space-y-2">
                                                {getWeekDays().map((day) => {
                                                    const dateStr = day.toISOString().split('T')[0];
                                                    const dayShifts = groupedShifts[dateStr] || [];
                                                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                                                    return (
                                                        <div
                                                            key={dateStr}
                                                            className={`flex items-center gap-4 p-4 rounded-xl border ${isToday
                                                                ? 'border-fuchsia-500/50 bg-fuchsia-500/10'
                                                                : 'border-white/10 bg-white/5'
                                                                }`}
                                                        >
                                                            <div className="w-24 flex-shrink-0">
                                                                <div className="font-semibold">{day.toLocaleDateString(locale || 'en-US', { weekday: 'short' })}</div>
                                                                <div className="text-sm text-gray-400">{day.toLocaleDateString(locale || 'en-US', { month: 'short', day: 'numeric' })}</div>
                                                            </div>

                                                            <div className="flex-1">
                                                                {dayShifts.length === 0 ? (
                                                                    <div className="text-gray-500 text-sm">{t('employee.schedule.no_shifts_day')}</div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {dayShifts.map((shift) => (
                                                                            <button
                                                                                key={shift.id}
                                                                                onClick={() => setSelectedShift(shift)}
                                                                                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 w-full transition-all text-left"
                                                                            >
                                                                                <Clock className="w-4 h-4 text-fuchsia-400" />
                                                                                <span className="font-medium">{shift.start_time} - {shift.end_time}</span>
                                                                                <span className="text-gray-400">•</span>
                                                                                <span className="text-gray-300">
                                                                                    {typeof shift.position === 'object' ? (shift.position as any).title || (shift.position as any).name : shift.position}
                                                                                </span>
                                                                                <span className="text-gray-400">•</span>
                                                                                <span className="text-gray-400 text-sm">{shift.location_name}</span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-7 gap-px bg-white/10 rounded-xl overflow-hidden border border-white/10">
                                                {[
                                                    t('employee.schedule.days.sun'),
                                                    t('employee.schedule.days.mon'),
                                                    t('employee.schedule.days.tue'),
                                                    t('employee.schedule.days.wed'),
                                                    t('employee.schedule.days.thu'),
                                                    t('employee.schedule.days.fri'),
                                                    t('employee.schedule.days.sat'),
                                                ].map(d => (
                                                    <div key={d} className="bg-gray-900/90 p-2 text-center text-sm font-semibold text-gray-400">
                                                        {d}
                                                    </div>
                                                ))}
                                                {getMonthDays().map((item, i) => {
                                                    const dateStr = item.date.toISOString().split('T')[0];
                                                    const dayShifts = groupedShifts[dateStr] || [];
                                                    const isToday = dateStr === new Date().toISOString().split('T')[0];

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`bg-gray-900 p-2 min-h-[100px] border-t border-white/5 ${!item.isCurrentMonth ? 'opacity-50' : ''
                                                                } ${isToday ? 'bg-fuchsia-900/10' : ''} hover:bg-white/5 transition-colors cursor-pointer`}
                                                            onClick={() => {
                                                                if (dayShifts.length > 0) setSelectedShift(dayShifts[0]); // Open first shift for now or separate modal for day
                                                            }}
                                                        >
                                                            <div className={`text-right mb-1 ${isToday ? 'text-fuchsia-400 font-bold' : 'text-gray-400'}`}>
                                                                {item.date.getDate()}
                                                            </div>
                                                            <div className="space-y-1">
                                                                {dayShifts.map(shift => (
                                                                    <div key={shift.id}
                                                                        className="text-xs p-1 rounded bg-fuchsia-600/20 text-fuchsia-200 border border-fuchsia-500/30 truncate"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedShift(shift);
                                                                        }}
                                                                    >
                                                                        {shift.start_time.slice(0, 5)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Time Off Requests */}
                        {timeOfRequests?.data && timeOfRequests.data.length > 0 && (
                            <Card className="bg-white/5 border-white/10">
                                <CardHeader>
                                    <h2 className="text-xl font-semibold">{t('employee.schedule.time_off_requests')}</h2>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {timeOfRequests.data.map((request) => (
                                            <div
                                                key={request.id}
                                                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {getStatusIcon(request.status)}
                                                    <div>
                                                        <div className="font-medium">
                                                            {new Date(request.start_date).toLocaleDateString(locale || 'en-US')} - {new Date(request.end_date).toLocaleDateString(locale || 'en-US')}
                                                        </div>
                                                        <div className="text-sm text-gray-400">{request.reason}</div>
                                                    </div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-sm ${request.status === 'approved'
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : request.status === 'denied'
                                                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                    }`}>
                                                    {getStatusLabel(request.status)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                ) : activeTab === 'marketplace' ? (
                    <div className="grid gap-4">
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <h3 className="text-lg font-semibold">{t('employee.schedule.available_shifts')}</h3>
                                <p className="text-sm text-gray-400">{t('employee.schedule.shifts_claim')}</p>
                            </CardHeader>
                            <CardContent>
                                {marketplaceLoading ? (
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
                                    </div>
                                ) : marketplaceShifts && marketplaceShifts?.data?.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {marketplaceShifts.data.map((swap: any) => (
                                            <div key={swap.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-fuchsia-500/50 transition-colors">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-bold text-lg text-white">
                                                            {new Date(swap.shift.date).toLocaleDateString(locale || 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                        </div>
                                                        <div className="text-fuchsia-400 font-medium">
                                                            {swap.shift.start_time} - {swap.shift.end_time}
                                                        </div>
                                                    </div>
                                                    <div className="px-2 py-1 rounded text-xs bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                                                        {typeof swap.shift.position === 'object' ? (swap.shift.position as any).title || (swap.shift.position as any).name : swap.shift.position}
                                                    </div>
                                                </div>

                                                <div className="space-y-2 text-sm text-gray-400 mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        {swap.shift.location?.name || t('employee.schedule.unknown_location')}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Briefcase className="w-4 h-4" />
                                                        <span>{t('employee.schedule.offered_by', { name: swap.requester?.user?.name || t('employee.schedule.unknown') })}</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    onClick={() => handleClaimShift(swap.id)}
                                                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
                                                    disabled={claimMutation.isPending}
                                                >
                                                    {claimMutation.isPending ? t('employee.common.loading') : t('employee.schedule.claim_shift')}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-400">
                                        <div className="text-4xl mb-2">🤷‍♂️</div>
                                        <p>{t('employee.schedule.no_available_shifts')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : activeTab === 'my_requests' ? (
                    <MyRequestsTab
                        myRequests={myRequests}
                        isLoading={myRequestsLoading}
                        onCancelRequest={handleCancelRequest}
                        isCancelling={cancelMutation.isPending}
                    />
                ) : null}
            </div>

            {/* Time Off Request Modal */}
            <Modal
                isOpen={showTimeOffModal}
                onClose={() => setShowTimeOffModal(false)}
                title={t('employee.schedule.request_time_off')}
                className="max-w-md"
            >
                <form onSubmit={handleTimeOffSubmit} className="space-y-4">
                    <Input
                        type="date"
                        label={t('employee.schedule.start_date')}
                        value={timeOffData.start_date}
                        onChange={(e) => setTimeOffData({ ...timeOffData, start_date: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />

                    <Input
                        type="date"
                        label={t('employee.schedule.end_date')}
                        value={timeOffData.end_date}
                        onChange={(e) => setTimeOffData({ ...timeOffData, end_date: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('employee.schedule.reason')}</label>
                        <textarea
                            value={timeOffData.reason}
                            onChange={(e) => setTimeOffData({ ...timeOffData, reason: e.target.value })}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
                            placeholder={t('employee.schedule.reason_placeholder')}
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowTimeOffModal(false)}
                            className="flex-1 border-white/20 hover:bg-white/10"
                        >
                            {t('employee.common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={timeOffMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                        >
                            {timeOffMutation.isPending ? t('employee.common.loading') : t('employee.common.submit')}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Shift Details Modal */}
            {selectedShift && (
                <Modal
                    isOpen={!!selectedShift}
                    onClose={() => setSelectedShift(null)}
                    title={t('employee.schedule.shift_details')}
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.details.date')}</div>
                            <div className="text-lg font-semibold">
                                {new Date(selectedShift.date).toLocaleDateString(locale || 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.details.time')}</div>
                            <div className="text-lg font-semibold">{selectedShift.start_time} - {selectedShift.end_time}</div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.details.position')}</div>
                            <div className="text-lg font-semibold">{selectedShift.position}</div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.details.location')}</div>
                            <div className="text-lg font-semibold">{selectedShift.location_name}</div>
                        </div>

                        {selectedShift.notes && (
                            <div>
                                <div className="text-sm text-gray-400 mb-1">{t('employee.schedule.details.notes')}</div>
                                <div className="p-3 bg-white/5 rounded-lg text-gray-300">{selectedShift.notes}</div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={() => setSwapModalOpen(true)}
                                className="flex-1 bg-amber-600 hover:bg-amber-700"
                            >
                                {t('employee.schedule.request_swap')}
                            </Button>
                            <Button
                                onClick={() => setSelectedShift(null)}
                                className="flex-1"
                                variant="outline"
                            >
                                {t('employee.common.close')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
            {/* Swap Request Modal */}
            <Modal
                isOpen={swapModalOpen}
                onClose={() => setSwapModalOpen(false)}
                title={t('employee.schedule.swap_title')}
                className="max-w-md"
            >
                <form onSubmit={handleSwapRequest} className="space-y-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-sm rounded-lg mb-4">
                        {t('employee.schedule.swap_requesting')} <br />
                        <strong>{selectedShift && new Date(selectedShift.date).toLocaleDateString(locale || 'en-US')}</strong>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('employee.schedule.swap_type')}</label>
                        <select
                            value={swapType}
                            onChange={(e) => setSwapType(e.target.value as any)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 dark:text-white"
                        >
                            <option className="dark:text-black" value="give_away">{t('employee.schedule.swap_give_away')}</option>
                            <option className="dark:text-black" value="trade">{t('employee.schedule.swap_trade')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('employee.schedule.swap_reason_optional')}</label>
                        <textarea
                            value={swapReason}
                            onChange={(e) => setSwapReason(e.target.value)}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                            placeholder={t('employee.schedule.swap_reason_placeholder')}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSwapModalOpen(false)}
                            className="flex-1"
                        >
                            {t('employee.common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={swapMutation.isPending}
                            className="flex-1 bg-amber-600 hover:bg-amber-700"
                        >
                            {swapMutation.isPending ? t('employee.common.submitting') : t('employee.schedule.confirm_request')}
                        </Button>
                    </div>
                </form>
            </Modal>
        </EmployeeLayout>
    );
}
