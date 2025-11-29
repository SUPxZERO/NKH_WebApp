import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { toastSuccess, toastError } from '@/app/utils/toast';
import {
    Clock,
    Calendar,
    DollarSign,
    TrendingUp,
    FileText,
    AlertCircle,
    CheckCircle,
    ChevronRight,
} from 'lucide-react';

interface QuickStats {
    hours_this_week: number;
    hours_this_month: number;
    vacation_balance: number;
    sick_balance: number;
    personal_balance: number;
    next_shift?: {
        date: string;
        start_time: string;
        end_time: string;
        location_name: string;
    };
}

interface Shift {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    location_name: string;
    status: string;
}

interface PayStub {
    id: number;
    period_start: string;
    period_end: string;
    gross_pay: number;
    net_pay: number;
    status: string;
}

interface AttendanceDay {
    date: string;
    status: 'present' | 'absent' | 'late' | 'half_day';
    is_late: boolean;
    has_overtime: boolean;
}

export default function EmployeeDashboard() {
    const [showTimeOffModal, setShowTimeOffModal] = useState(false);
    const [timeOffData, setTimeOffData] = useState({
        request_type: 'vacation',
        start_date: '',
        end_date: '',
        reason: '',
    });

    const qc = useQueryClient();

    // Fetch quick stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['employee.stats'],
        queryFn: () => apiGet('/api/employee/dashboard/stats'),
    });

    // Fetch upcoming shifts (7 days)
    const { data: upcomingShifts } = useQuery({
        queryKey: ['employee.shifts.upcoming'],
        queryFn: () =>
            apiGet('/api/shifts/upcoming', {
                params: { days: 7 },
            }),
    });

    // Fetch recent pay stubs
    const { data: payStubs } = useQuery({
        queryKey: ['employee.pay-stubs'],
        queryFn: () =>
            apiGet('/api/payroll/history', {
                params: { per_page: 3 },
            }),
    });

    // Fetch recent attendance (30 days)
    const { data: attendanceData } = useQuery({
        queryKey: ['employee.attendance.recent'],
        queryFn: () =>
            apiGet('/api/attendance/history', {
                params: { days: 30, per_page: 100 },
            }),
    });

    // Request time off mutation
    const timeOffMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/time-off-requests', data),
        onSuccess: () => {
            toastSuccess('Time off request submitted successfully');
            setShowTimeOffModal(false);
            setTimeOffData({
                request_type: 'vacation',
                start_date: '',
                end_date: '',
                reason: '',
            });
            qc.invalidateQueries({ queryKey: ['employee.stats'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to submit time off request');
        },
    });

    const handleSubmitTimeOff = () => {
        if (!timeOffData.start_date || !timeOffData.end_date) {
            toastError('Please fill all required fields');
            return;
        }
        timeOffMutation.mutate(timeOffData);
    };

    const calculateAverageHours = () => {
        const data = (attendanceData as any)?.data || [];
        if (data.length === 0) return 0;
        const totalHours = data.reduce(
            (sum: number, day: AttendanceDay & { total_hours: number }) => sum + day.total_hours,
            0
        );
        return (totalHours / data.length).toFixed(1);
    };

    const getTotalEarnings = () => {
        return (payStubs as any)?.data?.reduce(
            (sum: number, stub: PayStub) => sum + stub.gross_pay,
            0
        ) || 0;
    };

    return (
        <EmployeeLayout>
            <Head title="Employee Dashboard" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="mt-2 text-gray-600">
                        Here's your work summary for this week
                    </p>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Hours This Week */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Hours This Week</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {statsLoading ? '-' : `${(stats as any)?.hours_this_week || 0}h`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Target: 40h
                                    </p>
                                </div>
                                <Clock className="text-blue-600" size={28} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hours This Month */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Hours This Month</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {statsLoading ? '-' : `${(stats as any)?.hours_this_month || 0}h`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Average: {calculateAverageHours()}h/day
                                    </p>
                                </div>
                                <Calendar className="text-green-600" size={28} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Vacation Balance */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Vacation Balance</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {statsLoading ? '-' : `${(stats as any)?.vacation_balance || 0}d`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Remaining
                                    </p>
                                </div>
                                <TrendingUp className="text-purple-600" size={28} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sick Days Balance */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Sick Balance</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {statsLoading ? '-' : `${(stats as any)?.sick_balance || 0}d`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Remaining
                                    </p>
                                </div>
                                <AlertCircle className="text-orange-600" size={28} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Current Shift / Next Shift */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Next Shift</h3>
                        </CardHeader>
                        <CardContent>
                            {(stats as any)?.next_shift ? (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Next Scheduled</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {new Date((stats as any).next_shift.date).toLocaleDateString(
                                                    'en-US',
                                                    {
                                                        weekday: 'long',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    }
                                                )}
                                            </p>
                                        </div>
                                        <Calendar className="text-blue-600" size={24} />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Time:</span>
                                            <span className="font-medium text-gray-900">
                                                {(stats as any).next_shift.start_time.substring(0, 5)} -{' '}
                                                {(stats as any).next_shift.end_time.substring(0, 5)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Location:</span>
                                            <span className="font-medium text-gray-900">
                                                {(stats as any).next_shift.location_name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                    <p className="text-gray-600">No upcoming shifts</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Time Off Request */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Time Off</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Personal Days</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {statsLoading ? '-' : `${(stats as any)?.personal_balance || 0}d`}
                                    </p>
                                </div>

                                <Button
                                    onClick={() => setShowTimeOffModal(true)}
                                    className="w-full"
                                >
                                    Request Time Off
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Upcoming Shifts */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Upcoming Shifts (7 Days)</h3>
                    </CardHeader>
                    <CardContent>
                        {(upcomingShifts as any)?.data?.length === 0 ? (
                            <div className="text-center py-8">
                                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-gray-600">No upcoming shifts scheduled</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(upcomingShifts as any)?.data?.map((shift: Shift) => (
                                    <div
                                        key={shift.id}
                                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {new Date(shift.date).toLocaleDateString(
                                                    'en-US',
                                                    {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                    }
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {shift.start_time.substring(0, 5)} -{' '}
                                                {shift.end_time.substring(0, 5)} • {shift.location_name}
                                            </p>
                                        </div>
                                        <ChevronRight className="text-gray-400" size={20} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Pay Stubs */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Recent Pay Stubs</h3>
                    </CardHeader>
                    <CardContent>
                        {(payStubs as any)?.data?.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-gray-600">No pay stubs available</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                                Period
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                                Gross
                                            </th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                                Net
                                            </th>
                                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(payStubs as any).data.map((stub: PayStub) => (
                                            <tr
                                                key={stub.id}
                                                className="border-b border-gray-200 hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 text-gray-900">
                                                    {new Date(stub.period_start).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }
                                                    )}{' '}
                                                    -{' '}
                                                    {new Date(stub.period_end).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-gray-900">
                                                    ${stub.gross_pay.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-green-600">
                                                    ${stub.net_pay.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            stub.status === 'paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : stub.status === 'approved'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {stub.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Attendance Calendar Mini */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Attendance (Last 30 Days)</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-2">
                            {(attendanceData as any)?.data?.slice(0, 30).map((day: AttendanceDay, idx: number) => {
                                const statusColor =
                                    day.status === 'present'
                                        ? 'bg-green-100 text-green-800'
                                        : day.status === 'absent'
                                        ? 'bg-red-100 text-red-800'
                                        : day.status === 'late'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-blue-100 text-blue-800';

                                return (
                                    <div
                                        key={idx}
                                        className={`p-2 rounded text-center text-xs font-medium cursor-pointer hover:opacity-80 transition ${statusColor}`}
                                        title={`${new Date(day.date).toLocaleDateString()}: ${day.status}`}
                                    >
                                        {new Date(day.date).getDate()}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-600 mt-3">
                            🟢 Present | 🔴 Absent | 🟡 Late | 🔵 Half Day
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Time Off Modal */}
            {showTimeOffModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Request Time Off</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type of Leave *
                                    </label>
                                    <select
                                        value={timeOffData.request_type}
                                        onChange={(e) =>
                                            setTimeOffData({
                                                ...timeOffData,
                                                request_type: e.target.value,
                                            })
                                        }
                                        className="w-full rounded border border-gray-300 px-3 py-2"
                                    >
                                        <option value="vacation">Vacation</option>
                                        <option value="sick">Sick Leave</option>
                                        <option value="personal">Personal</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Start Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={timeOffData.start_date}
                                        onChange={(e) =>
                                            setTimeOffData({
                                                ...timeOffData,
                                                start_date: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={timeOffData.end_date}
                                        onChange={(e) =>
                                            setTimeOffData({
                                                ...timeOffData,
                                                end_date: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason
                                    </label>
                                    <textarea
                                        value={timeOffData.reason}
                                        onChange={(e) =>
                                            setTimeOffData({
                                                ...timeOffData,
                                                reason: e.target.value,
                                            })
                                        }
                                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={handleSubmitTimeOff}
                                        disabled={timeOffMutation.isPending}
                                        className="flex-1"
                                    >
                                        Submit Request
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowTimeOffModal(false)}
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
        </EmployeeLayout>
    );
}
