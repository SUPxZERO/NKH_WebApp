import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/app/layouts/AdminLayout';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Search, Calendar, Download, Edit2, CheckCircle, AlertCircle } from 'lucide-react';

interface AttendanceRecord {
    id: number;
    employee_id: number;
    employee_name: string;
    date: string;
    clock_in_at: string | null;
    clock_out_at: string | null;
    total_hours: number;
    is_late: boolean;
    has_overtime: boolean;
    location_name: string;
    status: 'present' | 'absent' | 'late' | 'half_day';
}

export default function AttendanceManagement() {
    const [startDate, setStartDate] = useState(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchEmployee, setSearchEmployee] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState({
        clock_in_at: '',
        clock_out_at: '',
        notes: '',
    });

    const qc = useQueryClient();

    // Fetch attendance records
    const { data: attendanceData, isLoading } = useQuery({
        queryKey: ['attendance.management', startDate, endDate, searchEmployee, selectedLocation, currentPage],
        queryFn: () =>
            apiGet('/api/attendance/history', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    employee_search: searchEmployee,
                    location_id: selectedLocation,
                    page: currentPage,
                    per_page: 20,
                },
            }),
        gcTime: 1000 * 60 * 5, // 5 minutes
    });

    // Fetch locations for filter
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations'),
    });

    // Adjustment mutation
    const adjustMutation = useMutation({
        mutationFn: (attendanceId: number) =>
            apiPost(`/api/attendance/${attendanceId}/adjust`, editData),
        onSuccess: () => {
            toastSuccess('Attendance adjusted successfully');
            setEditingId(null);
            qc.invalidateQueries({ queryKey: ['attendance.management'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to adjust attendance');
        },
    });

    // Export to CSV
    const handleExport = async () => {
        try {
            const data = await apiGet('/api/attendance/history', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    employee_search: searchEmployee,
                    location_id: selectedLocation,
                    per_page: 10000,
                },
            });

            const csv = [
                ['Employee', 'Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status', 'Location'].join(','),
                ...(data as any).data.map((record: AttendanceRecord) =>
                    [
                        record.employee_name,
                        record.date,
                        record.clock_in_at || '-',
                        record.clock_out_at || '-',
                        record.total_hours.toFixed(2),
                        record.status,
                        record.location_name,
                    ].join(',')
                ),
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_${startDate}_to_${endDate}.csv`;
            a.click();
            toastSuccess('Attendance exported successfully');
        } catch (error: any) {
            toastError('Failed to export attendance');
        }
    };

    const getStatusColor = (record: AttendanceRecord) => {
        if (record.is_late) return 'bg-yellow-50 border-yellow-200';
        if (record.status === 'absent') return 'bg-red-50 border-red-200';
        if (record.has_overtime) return 'bg-blue-50 border-blue-200';
        return 'bg-green-50 border-green-200';
    };

    const getStatusBadge = (record: AttendanceRecord) => {
        if (record.is_late) return 'Late';
        if (record.has_overtime) return 'Overtime';
        if (record.status === 'absent') return 'Absent';
        return 'Present';
    };

    return (
        <AdminLayout>
            <Head title="Attendance Management" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
                    <p className="mt-2 text-gray-600">View, filter, and adjust employee attendance records</p>
                </div>

                {/* Filters Card */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Filters</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    End Date
                                </label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Employee Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <Input
                                        placeholder="Search by name..."
                                        value={searchEmployee}
                                        onChange={(e) => {
                                            setSearchEmployee(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Location
                                </label>
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => {
                                        setSelectedLocation(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full rounded border border-gray-300 px-3 py-2"
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

                        <div className="mt-4 flex gap-2">
                            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
                                <Download size={18} />
                                Export CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendance Table */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">
                            Attendance Records{' '}
                            {(attendanceData as any)?.total && `(${(attendanceData as any).total})`}
                        </h3>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (attendanceData as any)?.data?.length === 0 ? (
                            <div className="text-center py-12">
                                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                <p className="text-gray-600">No attendance records found</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Employee
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Clock In
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Clock Out
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Hours
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Location
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(attendanceData as any)?.data?.map((record: AttendanceRecord) => (
                                            <tr
                                                key={record.id}
                                                className={`border-b border-gray-200 ${getStatusColor(record)}`}
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {record.employee_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {new Date(record.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {editingId === record.id ? (
                                                        <Input
                                                            type="datetime-local"
                                                            value={editData.clock_in_at}
                                                            onChange={(e) =>
                                                                setEditData({
                                                                    ...editData,
                                                                    clock_in_at: e.target.value,
                                                                })
                                                            }
                                                            className="w-full text-xs"
                                                        />
                                                    ) : (
                                                        record.clock_in_at
                                                            ? new Date(record.clock_in_at).toLocaleTimeString([], {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              })
                                                            : '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {editingId === record.id ? (
                                                        <Input
                                                            type="datetime-local"
                                                            value={editData.clock_out_at}
                                                            onChange={(e) =>
                                                                setEditData({
                                                                    ...editData,
                                                                    clock_out_at: e.target.value,
                                                                })
                                                            }
                                                            className="w-full text-xs"
                                                        />
                                                    ) : (
                                                        record.clock_out_at
                                                            ? new Date(record.clock_out_at).toLocaleTimeString([], {
                                                                  hour: '2-digit',
                                                                  minute: '2-digit',
                                                              })
                                                            : '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {record.total_hours.toFixed(2)}h
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            record.is_late
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : record.status === 'absent'
                                                                ? 'bg-red-100 text-red-800'
                                                                : record.has_overtime
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}
                                                    >
                                                        {getStatusBadge(record)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {record.location_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    {editingId === record.id ? (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    adjustMutation.mutate(record.id)
                                                                }
                                                                disabled={adjustMutation.isPending}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setEditingId(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setEditingId(record.id);
                                                                setEditData({
                                                                    clock_in_at: record.clock_in_at || '',
                                                                    clock_out_at: record.clock_out_at || '',
                                                                    notes: '',
                                                                });
                                                            }}
                                                        >
                                                            <Edit2 size={16} />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {(attendanceData as any)?.total > 20 && (
                            <div className="flex justify-between items-center mt-6">
                                <p className="text-sm text-gray-600">
                                    Page {currentPage} of {Math.ceil((attendanceData as any).total / 20)}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(Math.ceil((attendanceData as any).total / 20), p + 1)
                                            )
                                        }
                                        disabled={currentPage === Math.ceil((attendanceData as any).total / 20)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
