import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import { Card, CardContent } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Clock, LogIn, LogOut, AlertCircle } from 'lucide-react';

export default function TimeClock() {
    const [elapsedTime, setElapsedTime] = useState(0);
    const qc = useQueryClient();

    const { data: statusData, isLoading } = useQuery({
        queryKey: ['attendance.today'],
        queryFn: () => apiGet('/api/attendance/today'),
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    const clockInMutation = useMutation({
        mutationFn: () =>
            apiPost('/api/attendance/clock-in', {
                employee_id: statusData?.employee_id,
                location_id: statusData?.location_id,
                notes: 'Clock in',
            }),
        onSuccess: () => {
            toastSuccess('Clocked in successfully');
            qc.invalidateQueries({ queryKey: ['attendance.today'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to clock in');
        },
    });

    const clockOutMutation = useMutation({
        mutationFn: () =>
            apiPost('/api/attendance/clock-out', {
                attendance_id: statusData?.current_attendance?.id,
                notes: 'Clock out',
            }),
        onSuccess: () => {
            toastSuccess('Clocked out successfully');
            qc.invalidateQueries({ queryKey: ['attendance.today'] });
            setElapsedTime(0);
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to clock out');
        },
    });

    // Timer effect
    useEffect(() => {
        const interval = setInterval(() => {
            if (statusData?.current_status === 'clocked_in') {
                setElapsedTime(prev => prev + 1);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [statusData?.current_status]);

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <EmployeeLayout>
                <Head title="Time Clock" />
                <div className="flex items-center justify-center min-h-screen">
                    <Clock className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </EmployeeLayout>
        );
    }

    const isClockedIn = statusData?.current_status === 'clocked_in';

    return (
        <EmployeeLayout>
            <Head title="Time Clock" />

            <div className="max-w-md mx-auto space-y-6 py-8">
                {/* Status Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <CardContent className="pt-8 pb-6 text-center">
                        <Clock className={`w-16 h-16 mx-auto mb-4 ${isClockedIn ? 'text-green-600' : 'text-gray-400'}`} />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {isClockedIn ? 'Clocked In' : 'Clocked Out'}
                        </h2>
                        <p className="text-4xl font-mono font-bold text-blue-600">
                            {formatTime(elapsedTime)}
                        </p>
                    </CardContent>
                </Card>

                {/* Clock In/Out Button */}
                <div>
                    {!isClockedIn ? (
                        <Button
                            onClick={() => clockInMutation.mutate()}
                            disabled={clockInMutation.isPending}
                            className="w-full py-8 text-2xl font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-3"
                        >
                            <LogIn className="w-8 h-8" />
                            {clockInMutation.isPending ? 'Clocking In...' : 'Clock In'}
                        </Button>
                    ) : (
                        <Button
                            onClick={() => clockOutMutation.mutate()}
                            disabled={clockOutMutation.isPending}
                            className="w-full py-8 text-2xl font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-3"
                        >
                            <LogOut className="w-8 h-8" />
                            {clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out'}
                        </Button>
                    )}
                </div>

                {/* Today's Records */}
                {statusData?.today_records && statusData.today_records.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Today's Records</h3>
                            <div className="space-y-3">
                                {statusData.today_records.map((record: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {record.clock_in_at.split(' ')[1]} - {record.clock_out_at?.split(' ')[1] || 'Ongoing'}
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {record.total_hours ? `${record.total_hours} hours` : 'Clocking...'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info Alert */}
                <Card className="bg-blue-50 border border-blue-200">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <p className="font-medium">Time Clock Instructions</p>
                                <p className="mt-1 text-xs">Click "Clock In" when you arrive at work and "Clock Out" when you leave. Your attendance will be automatically recorded.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </EmployeeLayout>
    );
}
