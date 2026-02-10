import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/app/layouts/AdminLayout';
import { apiGet, apiPost } from '@/app/libs/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Search, Calendar, Download, Edit2, CheckCircle, AlertCircle, Clock, Users, Filter, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';

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
    const { t } = useLanguage();
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
            apiGet('admin/attendance/history', {
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
        queryFn: () => apiGet('admin/locations'),
    });

    // Adjustment mutation
    const adjustMutation = useMutation({
        mutationFn: (attendanceId: number) =>
            apiPost(`admin/attendance/${attendanceId}/adjust`, editData),
        onSuccess: () => {
            toastSuccess(t('admin.hr.attendance.messages.adjusted') as string);
            setEditingId(null);
            qc.invalidateQueries({ queryKey: ['attendance.management'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || t('admin.hr.attendance.messages.adjust_failed') as string);
        },
    });

    // Export to CSV
    const handleExport = async () => {
        try {
            const data = await apiGet('admin/attendance/history', {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    employee_search: searchEmployee,
                    location_id: selectedLocation,
                    per_page: 10000,
                },
            });

            const csv = [
                [t('admin.hr.attendance.table.employee'), t('admin.hr.attendance.table.date'), t('admin.hr.attendance.table.clock_in'), t('admin.hr.attendance.table.clock_out'), t('admin.hr.attendance.table.hours'), t('admin.hr.attendance.table.status'), t('admin.hr.attendance.table.location')].join(','),
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
            toastSuccess(t('admin.hr.attendance.messages.exported') as string);
        } catch (error: any) {
            toastError(t('admin.hr.attendance.messages.export_failed') as string);
        }
    };

    const getStatusColor = (record: AttendanceRecord) => {
        if (record.is_late) return 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/5';
        if (record.status === 'absent') return 'bg-red-500/10 border-red-500/30 dark:bg-red-500/5';
        if (record.has_overtime) return 'bg-blue-500/10 border-blue-500/30 dark:bg-blue-500/5';
        return 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/5';
    };

    const getStatusBadge = (record: AttendanceRecord) => {
        if (record.is_late) return t('admin.hr.attendance.status.late');
        if (record.has_overtime) return t('admin.hr.attendance.status.overtime');
        if (record.status === 'absent') return t('admin.hr.attendance.status.absent');
        return t('admin.hr.attendance.status.present');
    };

    const getStatusBadgeStyles = (record: AttendanceRecord) => {
        if (record.is_late) {
            return 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30';
        }
        if (record.status === 'absent') {
            return 'bg-gradient-to-r from-red-500/20 to-rose-500/10 text-red-600 dark:text-red-400 border border-red-500/30';
        }
        if (record.has_overtime) {
            return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30';
        }
        return 'bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
    };

    return (
        <AdminLayout>
            <Head title={t('admin.hr.attendance.title')} />

            <div className="min-h-screen bg-background p-6 lg:p-8">
                {/* Decorative Background Elements */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-gradient-to-br from-emerald-500/10 to-green-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10 space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight">
                                <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {t('admin.hr.attendance.title')}
                                </span>
                            </h1>
                            <p className="text-muted-foreground mt-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                {t('admin.hr.attendance.subtitle')}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">
                                    {(attendanceData as any)?.total || 0} {t('admin.hr.attendance.stats.records')}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Filters Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Card className="bg-card backdrop-blur-md border-border overflow-hidden">
                            <CardHeader className="border-b border-border bg-gradient-to-r from-fuchsia-500/5 to-purple-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
                                        <Filter className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">{t('admin.hr.attendance.filters.title')}</h3>
                                        <p className="text-xs text-muted-foreground">{t('admin.hr.attendance.filters.subtitle')}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t('admin.hr.attendance.filters.start_date')}
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
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t('admin.hr.attendance.filters.end_date')}
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
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t('admin.hr.attendance.filters.employee_search')}
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
                                            <Input
                                                placeholder={t('admin.hr.attendance.filters.search_placeholder') as string}
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
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            {t('admin.hr.attendance.filters.location')}
                                        </label>
                                        <select
                                            value={selectedLocation}
                                            onChange={(e) => {
                                                setSelectedLocation(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all"
                                        >
                                            <option value="">{t('admin.hr.attendance.filters.all_locations')}</option>
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
                                        {t('admin.hr.attendance.actions.export')}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Attendance Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Card className="bg-card backdrop-blur-md border-border overflow-hidden">
                            <CardHeader className="border-b border-border bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Calendar className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">
                                            {t('admin.hr.attendance.table.title')}{' '}
                                            {(attendanceData as any)?.total && (
                                                <span className="text-muted-foreground font-normal">
                                                    ({(attendanceData as any).total})
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">{t('admin.hr.attendance.table.subtitle')}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                {isLoading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-600"></div>
                                    </div>
                                ) : (attendanceData as any)?.data?.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="h-16 w-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-4">
                                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">{t('admin.hr.attendance.messages.no_records')}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{t('admin.hr.attendance.messages.try_filters')}</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-secondary/50 border-b border-border">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                        {t('admin.hr.attendance.table.employee')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                        {t('admin.hr.attendance.table.date')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                        {t('admin.hr.attendance.table.clock_in')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                        {t('admin.hr.attendance.table.clock_out')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                        {t('admin.hr.attendance.table.hours')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                        {t('admin.hr.attendance.table.status')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                        {t('admin.hr.attendance.table.location')}
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                                                        {t('admin.hr.attendance.table.actions')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(attendanceData as any)?.data?.map((record: AttendanceRecord, index: number) => (
                                                    <motion.tr
                                                        key={record.id}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.02 }}
                                                        className={cn(
                                                            "border-b border-border transition-colors hover:bg-secondary/30",
                                                            getStatusColor(record)
                                                        )}
                                                    >
                                                        <td className="px-4 py-3 text-sm text-foreground font-medium">
                                                            {record.employee_name}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-foreground">
                                                            {new Date(record.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-foreground">
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
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    {record.clock_in_at
                                                                        ? new Date(record.clock_in_at).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })
                                                                        : '-'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-foreground">
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
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                                                    {record.clock_out_at
                                                                        ? new Date(record.clock_out_at).toLocaleTimeString([], {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })
                                                                        : '-'}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-bold text-foreground">
                                                            {record.total_hours.toFixed(2)}h
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">
                                                            <span
                                                                className={cn(
                                                                    "px-2.5 py-1 rounded-full text-xs font-semibold",
                                                                    getStatusBadgeStyles(record)
                                                                )}
                                                            >
                                                                {getStatusBadge(record)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-muted-foreground">
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
                                                                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                                                                    >
                                                                        {t('admin.hr.attendance.actions.save')}
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setEditingId(null)}
                                                                    >
                                                                        {t('layout.actions.cancel')}
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
                                                                    className="hover:bg-secondary"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination */}
                                {(attendanceData as any)?.total > 20 && (
                                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-border">
                                        <p className="text-sm text-muted-foreground">
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
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
}
