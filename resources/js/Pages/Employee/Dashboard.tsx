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
        mutationFn: (data: any) => apiPost('/api/time-off-requests', data),
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
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sun className="w-8 h-8 text-yellow-500" />
                            {getGreeting()}!
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {stats?.position || 'Employee'} • {stats?.employee_code || 'EMP-000'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/employee/schedule">
                            <Button variant="outline" size="sm" className="gap-2">
                                <Calendar className="w-4 h-4" />
                                View Schedule
                            </Button>
                        </Link>
                        <Link href="/employee/pos">
                            <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                <Zap className="w-4 h-4" />
                                Start POS
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card hover className="h-full bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <Clock className="w-8 h-8 opacity-80" />
                                    <span className="text-xs opacity-80">This Week</span>
                                </div>
                                <p className="text-3xl font-bold mt-2">
                                    {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${stats?.hours_this_week || 0}h`}
                                </p>
                                <p className="text-sm opacity-80">Hours Worked</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <Card hover className="h-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <DollarSign className="w-8 h-8 opacity-80" />
                                    <span className="text-xs opacity-80">This Month</span>
                                </div>
                                <p className="text-3xl font-bold mt-2">
                                    {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `$${stats?.recent_earnings || 0}`}
                                </p>
                                <p className="text-sm opacity-80">Earnings</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card hover className="h-full bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <Coffee className="w-8 h-8 opacity-80" />
                                    <span className="text-xs opacity-80">Available</span>
                                </div>
                                <p className="text-3xl font-bold mt-2">
                                    {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${stats?.vacation_balance || 0}d`}
                                </p>
                                <p className="text-sm opacity-80">Vacation Days</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                    >
                        <Card hover className="h-full bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <ClipboardList className="w-8 h-8 opacity-80" />
                                    <span className="text-xs opacity-80">Today</span>
                                </div>
                                <p className="text-3xl font-bold mt-2">
                                    {statsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : stats?.orders_today || 0}
                                </p>
                                <p className="text-sm opacity-80">Orders Processed</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Next Shift Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="lg:col-span-2"
                    >
                        <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <CalendarDays className="w-5 h-5 text-blue-500" />
                                        Next Shift
                                    </h3>
                                    <Link href="/employee/schedule" className="text-sm text-blue-600 hover:underline">
                                        View All
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {stats?.next_shift ? (
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <div className="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                                                    Upcoming
                                                </span>
                                                <Calendar className="w-5 h-5 text-blue-500" />
                                            </div>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                                {formatDate(stats.next_shift.date)}
                                            </p>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <Timer className="w-4 h-4" />
                                                    <span>{formatTime(stats.next_shift.start_time)} - {formatTime(stats.next_shift.end_time)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{stats.next_shift.location_name}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" className="justify-start gap-2">
                                                <Users className="w-4 h-4" />
                                                Request Swap
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowTimeOffModal(true)}
                                                className="justify-start gap-2"
                                            >
                                                <Coffee className="w-4 h-4" />
                                                Request Time Off
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400 text-lg">No upcoming shifts scheduled</p>
                                        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Check with your manager for your schedule</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Time Off Balance */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Briefcase className="w-5 h-5 text-purple-500" />
                                    Time Off Balance
                                </h3>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                    <span className="text-gray-700 dark:text-gray-300">Vacation</span>
                                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {stats?.vacation_balance || 0} days
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                    <span className="text-gray-700 dark:text-gray-300">Sick Leave</span>
                                    <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                        {stats?.sick_balance || 0} days
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <span className="text-gray-700 dark:text-gray-300">Personal</span>
                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {stats?.personal_balance || 0} days
                                    </span>
                                </div>
                                <Button
                                    onClick={() => setShowTimeOffModal(true)}
                                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                                >
                                    Request Time Off
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Shifts List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-blue-500" />
                                        Upcoming Shifts
                                    </h3>
                                    <span className="text-xs text-gray-500">Next 7 days</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                {upcomingShifts.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">No shifts scheduled</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {upcomingShifts.slice(0, 5).map((shift) => (
                                            <div
                                                key={shift.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {formatDate(shift.date)}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {shift.location_name}
                                                    </span>
                                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Announcements */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Bell className="w-5 h-5 text-amber-500" />
                                        Announcements
                                    </h3>
                                    {(stats?.unread_notifications || 0) > 0 && (
                                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                                            {stats?.unread_notifications} new
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                {announcements.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckCircle className="w-12 h-12 mx-auto text-green-400 mb-2" />
                                        <p className="text-gray-500 dark:text-gray-400">You're all caught up!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {announcements.slice(0, 4).map((announcement) => (
                                            <div
                                                key={announcement.id}
                                                className={cn(
                                                    "p-3 rounded-xl border transition-all",
                                                    announcement.read
                                                        ? "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700"
                                                        : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                                                )}
                                            >
                                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {announcement.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {announcement.message}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Link href="/employee/notifications">
                                    <Button variant="ghost" className="w-full mt-4 text-blue-600">
                                        View All Notifications
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <Link href="/employee/pos">
                                    <Button variant="outline" className="w-full h-16 flex-col gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                        <Zap className="w-5 h-5 text-blue-600" />
                                        <span className="text-xs">Open POS</span>
                                    </Button>
                                </Link>
                                <Link href="/employee/kitchen">
                                    <Button variant="outline" className="w-full h-16 flex-col gap-1 hover:bg-orange-50 dark:hover:bg-orange-900/20">
                                        <ClipboardList className="w-5 h-5 text-orange-600" />
                                        <span className="text-xs">Kitchen Display</span>
                                    </Button>
                                </Link>
                                <Link href="/employee/schedule">
                                    <Button variant="outline" className="w-full h-16 flex-col gap-1 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                        <Calendar className="w-5 h-5 text-purple-600" />
                                        <span className="text-xs">My Schedule</span>
                                    </Button>
                                </Link>
                                <Link href="/employee/performance">
                                    <Button variant="outline" className="w-full h-16 flex-col gap-1 hover:bg-green-50 dark:hover:bg-green-900/20">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        <span className="text-xs">Performance</span>
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Time Off Request Modal */}
            <Modal
                isOpen={showTimeOffModal}
                onClose={() => setShowTimeOffModal(false)}
                title="Request Time Off"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Request Type
                        </label>
                        <select
                            value={timeOffData.request_type}
                            onChange={(e) => setTimeOffData({ ...timeOffData, request_type: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                            <option value="vacation">Vacation</option>
                            <option value="sick">Sick Leave</option>
                            <option value="personal">Personal</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={timeOffData.start_date}
                                onChange={(e) => setTimeOffData({ ...timeOffData, start_date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={timeOffData.end_date}
                                onChange={(e) => setTimeOffData({ ...timeOffData, end_date: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Reason (Optional)
                        </label>
                        <textarea
                            value={timeOffData.reason}
                            onChange={(e) => setTimeOffData({ ...timeOffData, reason: e.target.value })}
                            rows={3}
                            placeholder="Brief description..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl resize-none"
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setShowTimeOffModal(false)} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmitTimeOff}
                            disabled={timeOffMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        >
                            {timeOffMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Submit Request'
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </EmployeeLayout>
    );
}
