import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { apiGet, apiPost } from '@/app/utils/api';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import Modal from '@/app/components/ui/Modal';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { motion } from 'framer-motion';
import {
    Clock,
    Calendar,
    DollarSign,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    ChevronRight,
    Bell,
    MapPin,
    Timer,
    Coffee,
    CalendarDays,
    Briefcase,
    Loader2,
    ClipboardList,
    Users,
    Sun,
    Zap,
} from 'lucide-react';

interface DashboardStats {
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
    recent_earnings: number;
    orders_today: number;
    pending_tasks: number;
    unread_notifications: number;
    employee_code: string;
    position: string;
}

interface Shift {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    location_name: string;
    status: string;
}

interface Announcement {
    id: number;
    title: string;
    message: string;
    read: boolean;
    created_at: string;
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

    // Fetch dashboard stats
    const { data: statsResponse, isLoading: statsLoading } = useQuery({
        queryKey: ['employee.dashboard.stats'],
        queryFn: () => apiGet('/api/employee/dashboard/stats'),
    });
    const stats = (statsResponse as any)?.data as DashboardStats | undefined;

    // Fetch upcoming shifts
    const { data: shiftsResponse } = useQuery({
        queryKey: ['employee.dashboard.shifts'],
        queryFn: () => apiGet('/api/employee/dashboard/shifts'),
    });
    const upcomingShifts = ((shiftsResponse as any)?.data || []) as Shift[];

    // Fetch announcements
    const { data: announcementsResponse } = useQuery({
        queryKey: ['employee.dashboard.announcements'],
        queryFn: () => apiGet('/api/employee/dashboard/announcements'),
    });
    const announcements = ((announcementsResponse as any)?.data || []) as Announcement[];

    // Time off mutation
    const timeOffMutation = useMutation({
        mutationFn: (data: any) => apiPost('/employee/time-off-requests', data),
        onSuccess: () => {
            toastSuccess('Time off request submitted successfully');
            setShowTimeOffModal(false);
            setTimeOffData({ request_type: 'vacation', start_date: '', end_date: '', reason: '' });
            qc.invalidateQueries({ queryKey: ['employee.dashboard.stats'] });
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

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        return time.substring(0, 5);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <EmployeeLayout>
            <Head title="Employee Dashboard" />

            <div className="min-h-screen p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
                {/* Header - Compact Node */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-6"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sun className="w-5 h-5 sm:w-8 sm:h-8 text-yellow-500" />
                                {getGreeting()}!
                            </h1>
                            <p className="text-xs sm:text-base text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                                {stats?.position || 'Employee'}
                            </p>
                        </div>
                        {/* Mobile Action Buttons (Visible only on mobile) */}
                        <div className="flex sm:hidden gap-2">
                            <Link href="/employee/pos">
                                <Button size="sm" className="h-9 w-9 p-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg text-white">
                                    <Zap className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Desktop Action Buttons */}
                    <div className="hidden sm:flex items-center gap-3">
                        <Link href="/employee/schedule">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Calendar className="w-4 h-4" />
                                View Schedule
                            </Button>
                        </Link>
                        <Link href="/employee/pos">
                            <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                                <Zap className="w-4 h-4" />
                                Start POS
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Grid - Compact 2x2 on mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-blue-500/10 relative overflow-hidden">
                            <Clock className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10" />
                            <div className="relative z-10">
                                <p className="text-[10px] sm:text-xs font-medium text-blue-100 uppercase tracking-wide">This Week</p>
                                <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">
                                    {statsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${stats?.hours_this_week || 0}h`}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden">
                            <DollarSign className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10" />
                            <div className="relative z-10">
                                <p className="text-[10px] sm:text-xs font-medium text-emerald-100 uppercase tracking-wide">Earnings</p>
                                <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">
                                    {statsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `$${stats?.recent_earnings || 0}`}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-purple-500/10 relative overflow-hidden">
                            <Coffee className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10" />
                            <div className="relative z-10">
                                <p className="text-[10px] sm:text-xs font-medium text-purple-100 uppercase tracking-wide">Leave</p>
                                <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">
                                    {statsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${stats?.vacation_balance || 0}d`}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-3 sm:p-4 text-white shadow-lg shadow-orange-500/10 relative overflow-hidden">
                            <ClipboardList className="absolute right-[-10px] bottom-[-10px] w-16 h-16 opacity-10" />
                            <div className="relative z-10">
                                <p className="text-[10px] sm:text-xs font-medium text-orange-100 uppercase tracking-wide">Orders</p>
                                <p className="text-xl sm:text-3xl font-bold mt-0.5 sm:mt-1">
                                    {statsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : stats?.orders_today || 0}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Main Content Grid - Adjusted for Compactness */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Next Shift Section */}
                    <div className="lg:col-span-2 space-y-4">
                        {stats?.next_shift ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 sm:p-5 text-white shadow-lg shadow-blue-500/20"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center flex-shrink-0 border border-white/10">
                                            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-white/20 rounded-md text-[10px] font-bold uppercase tracking-wider">Next Shift</span>
                                                <span className="text-sm text-blue-100">{formatDate(stats.next_shift.date).split(',')[0]}</span>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold leading-none mb-1">
                                                {formatTime(stats.next_shift.start_time)} - {formatTime(stats.next_shift.end_time)}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-blue-100 text-xs sm:text-sm">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="truncate max-w-[200px]">{stats.next_shift.location_name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <Button size="sm" variant="secondary" className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 border-0 text-white h-9">
                                            Swap
                                        </Button>
                                        <Button size="sm" variant="secondary" onClick={() => setShowTimeOffModal(true)} className="flex-1 sm:flex-none bg-white/10 hover:bg-white/20 border-0 text-white h-9">
                                            Time Off
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <Card className="p-6 text-center border-dashed">
                                <p className="text-gray-500">No upcoming shifts</p>
                            </Card>
                        )}

                        {/* Upcoming Shifts List - Integrated */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Upcoming This Week</h3>
                                <Link href="/employee/schedule" className="text-xs text-blue-600 hover:underline">View All</Link>
                            </div>
                            {upcomingShifts.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No more shifts this week</p>
                            ) : (
                                <div className="space-y-2">
                                    {upcomingShifts.slice(0, 3).map((shift) => (
                                        <div key={shift.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <div className="w-10 h-10 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">{new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(shift.date).getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{shift.location_name}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column Stack */}
                    <div className="space-y-4">
                        {/* Quick Actions - Compact Tile Grid */}
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <div className="p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3">
                                <Link href="/employee/pos">
                                    <div className="flex flex-col items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 active:scale-95 transition-transform cursor-pointer h-20 sm:h-24">
                                        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mb-1" />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">POS</span>
                                    </div>
                                </Link>
                                <Link href="/employee/kitchen">
                                    <div className="flex flex-col items-center justify-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 active:scale-95 transition-transform cursor-pointer h-20 sm:h-24">
                                        <ClipboardList className="w-5 h-5 text-orange-600 dark:text-orange-400 mb-1" />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Kitchen</span>
                                    </div>
                                </Link>
                                <Link href="/employee/schedule">
                                    <div className="flex flex-col items-center justify-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 active:scale-95 transition-transform cursor-pointer h-20 sm:h-24">
                                        <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400 mb-1" />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Schedule</span>
                                    </div>
                                </Link>
                                <Link href="/employee/performance">
                                    <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 active:scale-95 transition-transform cursor-pointer h-20 sm:h-24">
                                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mb-1" />
                                        <span className="text-xs font-medium text-gray-900 dark:text-white">Stats</span>
                                    </div>
                                </Link>
                            </div>
                        </Card>

                        {/* Time Off Balance - Compact */}
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Time Off Balance</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Vacation</span>
                                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{stats?.vacation_balance || 0}d</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Sick</span>
                                        <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{stats?.sick_balance || 0}d</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">Personal</span>
                                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats?.personal_balance || 0}d</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Announcements Row */}
                <div className="grid grid-cols-1">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                        <Card className="bg-amber-50/50 dark:bg-gray-800 border-amber-100 dark:border-gray-700">
                            <CardHeader className="py-3 px-4 sm:px-6 border-b border-amber-100/50 dark:border-gray-700/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Bell className="w-4 h-4 text-amber-500" />
                                        Latest Announcements
                                    </h3>
                                </div>
                            </CardHeader>
                            <CardContent className="p-3 sm:p-4">
                                {announcements.length === 0 ? (
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>No new announcements</span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {announcements.slice(0, 2).map((announcement) => (
                                            <div
                                                key={announcement.id}
                                                className="flex items-start gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-800/50"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {announcement.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                                        {announcement.message}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>


            {/* Time Off Request Modal */}
            <Modal
                isOpen={showTimeOffModal}
                onClose={() => setShowTimeOffModal(false)}
                title="Request Time Off"
            >
                <div className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                            Request Type
                        </label>
                        <select
                            value={timeOffData.request_type}
                            onChange={(e) => setTimeOffData({ ...timeOffData, request_type: e.target.value })}
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base"
                        >
                            <option value="vacation">Vacation</option>
                            <option value="sick">Sick Leave</option>
                            <option value="personal">Personal</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={timeOffData.start_date}
                                onChange={(e) => setTimeOffData({ ...timeOffData, start_date: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={timeOffData.end_date}
                                onChange={(e) => setTimeOffData({ ...timeOffData, end_date: e.target.value })}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl text-sm sm:text-base"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                            Reason (Optional)
                        </label>
                        <textarea
                            value={timeOffData.reason}
                            onChange={(e) => setTimeOffData({ ...timeOffData, reason: e.target.value })}
                            rows={3}
                            placeholder="Brief description..."
                            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl resize-none text-sm sm:text-base"
                        />
                    </div>
                    <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                        <Button variant="outline" onClick={() => setShowTimeOffModal(false)} className="flex-1 text-sm sm:text-base py-2.5 sm:py-3">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitTimeOff}
                            disabled={timeOffMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base py-2.5 sm:py-3"
                        >
                            {timeOffMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Submit'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </EmployeeLayout >
    );
}
