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

export default function Schedule() {
    const [showTimeOffModal, setShowTimeOffModal] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
    const [timeOffData, setTimeOffData] = useState({
        start_date: '',
        end_date: '',
        reason: '',
    });

    const qc = useQueryClient();

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
            toastSuccess('Time off request submitted successfully!');
            setShowTimeOffModal(false);
            setTimeOffData({ start_date: '', end_date: '', reason: '' });
            qc.invalidateQueries({ queryKey: ['employee.time-off-requests'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to submit request');
        },
    });

    // Get next shift
    const nextShift = React.useMemo(() => {
        if (!shifts?.data) return null;
        const now = new Date();
        const upcoming = shifts.data
            .filter((s) => new Date(s.date + ' ' + s.start_time) > now)
            .sort((a, b) => new Date(a.date + ' ' + a.start_time).getTime() - new Date(b.date + ' ' + b.start_time).getTime());
        return upcoming[0] || null;
    }, [shifts]);

    // Calculate week hours
    const weekHours = React.useMemo(() => {
        if (!shifts?.data) return 0;
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return shifts.data
            .filter((s) => {
                const shiftDate = new Date(s.date);
                return shiftDate >= weekStart && shiftDate < weekEnd;
            })
            .reduce((total, s) => {
                const start = new Date(`2000-01-01 ${s.start_time}`);
                const end = new Date(`2000-01-01 ${s.end_time}`);
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return total + hours;
            }, 0);
    }, [shifts]);

    // Group shifts by date
    const groupedShifts = React.useMemo(() => {
        if (!shifts?.data) return {};
        return shifts.data.reduce((acc, shift) => {
            if (!acc[shift.date]) acc[shift.date] = [];
            acc[shift.date].push(shift);
            return acc;
        }, {} as Record<string, Shift[]>);
    }, [shifts]);

    // Get week days
    const getWeekDays = () => {
        const days = [];
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const handleTimeOffSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        timeOffMutation.mutate(timeOffData);
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

    return (
        <EmployeeLayout>
            <Head>
                <title>My Schedule - NKH Restaurant</title>
            </Head>

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                            My Schedule
                        </h1>
                        <p className="text-gray-400 mt-1">View your shifts and manage time off</p>
                    </div>
                    <Button
                        onClick={() => setShowTimeOffModal(true)}
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                        leftIcon={<Plus className="w-4 h-4" />}
                    >
                        Request Time Off
                    </Button>
                </div>

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
                                        <div className="text-sm text-gray-400 mb-1">Next Shift</div>
                                        <div className="text-3xl font-bold text-white mb-2">
                                            {new Date(nextShift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </div>
                                        <div className="flex flex-wrap gap-4 text-lg">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-5 h-5 text-fuchsia-400" />
                                                <span>{nextShift.start_time} - {nextShift.end_time}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-5 h-5 text-fuchsia-400" />
                                                <span>{nextShift.position}</span>
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
                            <p className="text-gray-400">No upcoming shifts scheduled</p>
                        </CardContent>
                    </Card>
                )}

                {/* Week Hours Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-6">
                            <div className="text-sm text-gray-400 mb-1">This Week's Hours</div>
                            <div className="text-4xl font-bold text-white">{weekHours.toFixed(1)}</div>
                            <div className="text-sm text-gray-400 mt-1">hours scheduled</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-6">
                            <div className="text-sm text-gray-400 mb-1">Total Shifts</div>
                            <div className="text-4xl font-bold text-white">{shifts?.data?.length || 0}</div>
                            <div className="text-sm text-gray-400 mt-1">upcoming shifts</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-6">
                            <div className="text-sm text-gray-400 mb-1">Pending Requests</div>
                            <div className="text-4xl font-bold text-white">
                                {timeOfRequests?.data?.filter((r) => r.status === 'pending').length || 0}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">awaiting approval</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Week Calendar */}
                <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">Weekly Schedule</h2>
                            <div className="flex gap-2">
                                <Button size="sm" variant={viewMode === 'week' ? 'primary' : 'ghost'} onClick={() => setViewMode('week')}>
                                    Week
                                </Button>
                                <Button size="sm" variant={viewMode === 'month' ? 'primary' : 'ghost'} onClick={() => setViewMode('month')}>
                                    Month
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
                                                <div className="font-semibold">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                                <div className="text-sm text-gray-400">{day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                            </div>

                                            <div className="flex-1">
                                                {dayShifts.length === 0 ? (
                                                    <div className="text-gray-500 text-sm">No shifts</div>
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
                                                                <span className="text-gray-300">{shift.position}</span>
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
                        )}
                    </CardContent>
                </Card>

                {/* Time Off Requests */}
                {timeOfRequests?.data && timeOfRequests.data.length > 0 && (
                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Time Off Requests</h2>
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
                                                    {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
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
                                            {request.status.toUpperCase()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Time Off Request Modal */}
            <Modal
                isOpen={showTimeOffModal}
                onClose={() => setShowTimeOffModal(false)}
                title="Request Time Off"
                className="max-w-md"
            >
                <form onSubmit={handleTimeOffSubmit} className="space-y-4">
                    <Input
                        type="date"
                        label="Start Date"
                        value={timeOffData.start_date}
                        onChange={(e) => setTimeOffData({ ...timeOffData, start_date: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />

                    <Input
                        type="date"
                        label="End Date"
                        value={timeOffData.end_date}
                        onChange={(e) => setTimeOffData({ ...timeOffData, end_date: e.target.value })}
                        required
                        className="bg-white/5 border-white/10 text-white"
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Reason (Optional)</label>
                        <textarea
                            value={timeOffData.reason}
                            onChange={(e) => setTimeOffData({ ...timeOffData, reason: e.target.value })}
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
                            placeholder="Vacation, doctor appointment, etc."
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowTimeOffModal(false)}
                            className="flex-1 border-white/20 hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={timeOffMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                        >
                            {timeOffMutation.isPending ? 'Submitting...' : 'Submit Request'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Shift Details Modal */}
            {selectedShift && (
                <Modal
                    isOpen={!!selectedShift}
                    onClose={() => setSelectedShift(null)}
                    title="Shift Details"
                    className="max-w-md"
                >
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm text-gray-400 mb-1">Date</div>
                            <div className="text-lg font-semibold">
                                {new Date(selectedShift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400 mb-1">Time</div>
                            <div className="text-lg font-semibold">{selectedShift.start_time} - {selectedShift.end_time}</div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400 mb-1">Position</div>
                            <div className="text-lg font-semibold">{selectedShift.position}</div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-400 mb-1">Location</div>
                            <div className="text-lg font-semibold">{selectedShift.location_name}</div>
                        </div>

                        {selectedShift.notes && (
                            <div>
                                <div className="text-sm text-gray-400 mb-1">Notes</div>
                                <div className="p-3 bg-white/5 rounded-lg text-gray-300">{selectedShift.notes}</div>
                            </div>
                        )}

                        <Button
                            onClick={() => setSelectedShift(null)}
                            className="w-full"
                            variant="outline"
                        >
                            Close
                        </Button>
                    </div>
                </Modal>
            )}
        </EmployeeLayout>
    );
}
