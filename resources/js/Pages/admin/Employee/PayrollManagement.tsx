import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/app/layouts/AdminLayout';
import { apiGet, apiPost, apiDelete } from '@/app/libs/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { toastSuccess, toastError } from '@/app/utils/toast';
import {
    DollarSign,
    Plus,
    Trash2,
    Eye,
    Download,
    CheckCircle,
    AlertCircle,
    Edit2,
} from 'lucide-react';

interface PayrollRecord {
    id: number;
    employee_id: number;
    employee_name: string;
    period_start: string;
    period_end: string;
    base_pay: number;
    overtime_pay: number;
    bonuses: number;
    gross_pay: number;
    deductions: number;
    taxes: number;
    net_pay: number;
    status: 'draft' | 'approved' | 'paid';
    paid_at?: string;
}

interface PayrollDetail {
    id: number;
    type: 'earning' | 'deduction';
    category: string;
    amount: number;
    percentage?: number;
}

export default function PayrollManagement() {
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().toISOString().split('T')[0].substring(0, 7)
    );
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [viewingPayrollId, setViewingPayrollId] = useState<number | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showAddDetailModal, setShowAddDetailModal] = useState(false);
    const [editingPayrollId, setEditingPayrollId] = useState<number | null>(null);
    const [newDetail, setNewDetail] = useState({
        type: 'earning',
        category: 'bonus',
        amount: 0,
        percentage: 0,
    });

    const qc = useQueryClient();

    // Fetch employees
    const { data: employees, isLoading: employeesLoading } = useQuery({
        queryKey: ['employees'],
        queryFn: () => apiGet('/api/employees'),
    });

    // Fetch payroll records for month
    const { data: payrollData, isLoading: payrollLoading } = useQuery({
        queryKey: ['payroll.management', selectedMonth, selectedEmployees],
        queryFn: () =>
            apiGet('/api/payroll/history', {
                params: {
                    month: selectedMonth,
                    employee_ids: selectedEmployees.length > 0 ? selectedEmployees : undefined,
                    per_page: 100,
                },
            }),
    });

    // Fetch payroll details
    const { data: detailsData } = useQuery({
        queryKey: ['payroll.details', viewingPayrollId],
        queryFn: () => apiGet(`/api/payroll/${viewingPayrollId}/details`),
        enabled: !!viewingPayrollId,
    });

    // Generate payroll mutation
    const generateMutation = useMutation({
        mutationFn: (employeeIds: number[]) =>
            apiPost('/api/payroll/generate', {
                employee_ids: employeeIds.length > 0 ? employeeIds : undefined,
                month: selectedMonth,
                include_overtime: true,
            }),
        onSuccess: () => {
            toastSuccess('Payroll generated successfully');
            qc.invalidateQueries({ queryKey: ['payroll.management'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to generate payroll');
        },
    });

    // Finalize payroll mutation
    const finalizeMutation = useMutation({
        mutationFn: (payrollId: number) =>
            apiPost(`/api/payroll/${payrollId}/finalize`, {}),
        onSuccess: () => {
            toastSuccess('Payroll finalized successfully');
            qc.invalidateQueries({ queryKey: ['payroll.management'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to finalize payroll');
        },
    });

    // Add detail mutation
    const addDetailMutation = useMutation({
        mutationFn: (payrollId: number) =>
            apiPost(`/api/payroll/${payrollId}/add-detail`, newDetail),
        onSuccess: () => {
            toastSuccess('Detail added successfully');
            setNewDetail({
                type: 'earning',
                category: 'bonus',
                amount: 0,
                percentage: 0,
            });
            setShowAddDetailModal(false);
            qc.invalidateQueries({ queryKey: ['payroll.details'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to add detail');
        },
    });

    // Remove detail mutation
    const removeDetailMutation = useMutation({
        mutationFn: (detailId: number) =>
            apiDelete(`/api/payroll-details/${detailId}`),
        onSuccess: () => {
            toastSuccess('Detail removed successfully');
            qc.invalidateQueries({ queryKey: ['payroll.details'] });
        },
        onError: (error: any) => {
            toastError('Failed to remove detail');
        },
    });

    const handleSelectAllEmployees = (checked: boolean) => {
        if (checked) {
            setSelectedEmployees((employees as any)?.data?.map((e: any) => e.id) || []);
        } else {
            setSelectedEmployees([]);
        }
    };

    const handleSelectEmployee = (employeeId: number, checked: boolean) => {
        if (checked) {
            setSelectedEmployees([...selectedEmployees, employeeId]);
        } else {
            setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
        }
    };

    const handleExportPayroll = async () => {
        try {
            const data = (payrollData as any)?.data || [];
            const csv = [
                [
                    'Employee',
                    'Period',
                    'Base Pay',
                    'Overtime',
                    'Bonuses',
                    'Gross Pay',
                    'Deductions',
                    'Taxes',
                    'Net Pay',
                    'Status',
                ].join(','),
                ...data.map((record: PayrollRecord) =>
                    [
                        record.employee_name,
                        `${record.period_start} to ${record.period_end}`,
                        record.base_pay.toFixed(2),
                        record.overtime_pay.toFixed(2),
                        record.bonuses.toFixed(2),
                        record.gross_pay.toFixed(2),
                        record.deductions.toFixed(2),
                        record.taxes.toFixed(2),
                        record.net_pay.toFixed(2),
                        record.status,
                    ].join(',')
                ),
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `payroll_${selectedMonth}.csv`;
            a.click();
            toastSuccess('Payroll exported successfully');
        } catch (error) {
            toastError('Failed to export payroll');
        }
    };

    const totalGross =
        (payrollData as any)?.data?.reduce((sum: number, r: PayrollRecord) => sum + r.gross_pay, 0) || 0;
    const totalNet =
        (payrollData as any)?.data?.reduce((sum: number, r: PayrollRecord) => sum + r.net_pay, 0) || 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'approved':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <AdminLayout>
            <Head title="Payroll Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
                        <p className="mt-2 text-gray-600">Generate, manage, and finalize employee payroll</p>
                    </div>
                    <Button
                        onClick={handleExportPayroll}
                        disabled={!(payrollData as any)?.data?.length}
                        className="flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export CSV
                    </Button>
                </div>

                {/* Controls Card */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Payroll Period</h3>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Month
                                </label>
                                <Input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Employees
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer font-medium">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selectedEmployees.length ===
                                                (employees as any)?.data?.length
                                            }
                                            onChange={(e) =>
                                                handleSelectAllEmployees(e.target.checked)
                                            }
                                            className="rounded"
                                        />
                                        Select All
                                    </label>

                                    {(employees as any)?.data?.map((employee: any) => (
                                        <label
                                            key={employee.id}
                                            className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedEmployees.includes(employee.id)}
                                                onChange={(e) =>
                                                    handleSelectEmployee(
                                                        employee.id,
                                                        e.target.checked
                                                    )
                                                }
                                                className="rounded"
                                            />
                                            {employee.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={() =>
                                    generateMutation.mutate(selectedEmployees)
                                }
                                disabled={generateMutation.isPending || selectedEmployees.length === 0}
                                className="w-full"
                            >
                                Generate Payroll
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Payroll Summary */}
                {(payrollData as any)?.data?.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-gray-600">Total Employees</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {(payrollData as any).data.length}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-gray-600">Total Gross Pay</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    ${totalGross.toFixed(2)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-gray-600">Total Net Pay</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ${totalNet.toFixed(2)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-sm text-gray-600">Total Deductions</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ${(totalGross - totalNet).toFixed(2)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Payroll Table */}
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">Payroll Records</h3>
                    </CardHeader>
                    <CardContent>
                        {payrollLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : !(payrollData as any)?.data?.length ? (
                            <div className="text-center py-12">
                                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                <p className="text-gray-600">No payroll records found</p>
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
                                                Period
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                Base
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                Overtime
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                Bonuses
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                Deductions
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                Taxes
                                            </th>
                                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                                Net Pay
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(payrollData as any).data.map((record: PayrollRecord) => (
                                            <tr
                                                key={record.id}
                                                className="border-b border-gray-200 hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {record.employee_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {new Date(record.period_start).toLocaleDateString()}
                                                    {' - '}
                                                    {new Date(record.period_end).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                    ${record.base_pay.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                    ${record.overtime_pay.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                    ${record.bonuses.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                    ${record.deductions.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-900">
                                                    ${record.taxes.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                                    ${record.net_pay.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                            record.status
                                                        )}`}
                                                    >
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setViewingPayrollId(record.id);
                                                            setShowDetailsModal(true);
                                                        }}
                                                    >
                                                        <Eye size={16} />
                                                    </Button>
                                                    {record.status === 'draft' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setEditingPayrollId(record.id);
                                                                    setShowAddDetailModal(true);
                                                                }}
                                                            >
                                                                <Plus size={16} />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    finalizeMutation.mutate(
                                                                        record.id
                                                                    )
                                                                }
                                                                disabled={finalizeMutation.isPending}
                                                            >
                                                                <CheckCircle size={16} />
                                                            </Button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Details Modal */}
            {showDetailsModal && viewingPayrollId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Payroll Details</h3>
                        </CardHeader>
                        <CardContent>
                            {(detailsData as any)?.data?.length === 0 ? (
                                <p className="text-gray-600">No details added yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {(detailsData as any)?.data?.map((detail: PayrollDetail) => (
                                        <div
                                            key={detail.id}
                                            className="flex justify-between items-center p-3 bg-gray-50 rounded"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {detail.category}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {detail.type}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="font-bold text-gray-900">
                                                    ${detail.amount.toFixed(2)}
                                                </p>
                                                <button
                                                    onClick={() =>
                                                        removeDetailMutation.mutate(
                                                            detail.id
                                                        )
                                                    }
                                                    disabled={removeDetailMutation.isPending}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={() => setShowDetailsModal(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Close
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Add Detail Modal */}
            {showAddDetailModal && editingPayrollId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Add Earning or Deduction</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={newDetail.type}
                                        onChange={(e) =>
                                            setNewDetail({
                                                ...newDetail,
                                                type: e.target.value as any,
                                            })
                                        }
                                        className="w-full rounded border border-gray-300 px-3 py-2"
                                    >
                                        <option value="earning">Earning</option>
                                        <option value="deduction">Deduction</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <Input
                                        placeholder="e.g., Bonus, Health Insurance"
                                        value={newDetail.category}
                                        onChange={(e) =>
                                            setNewDetail({
                                                ...newDetail,
                                                category: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount ($)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={newDetail.amount}
                                        onChange={(e) =>
                                            setNewDetail({
                                                ...newDetail,
                                                amount: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button
                                        onClick={() =>
                                            addDetailMutation.mutate(editingPayrollId)
                                        }
                                        disabled={addDetailMutation.isPending}
                                        className="flex-1"
                                    >
                                        Add
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowAddDetailModal(false);
                                            setEditingPayrollId(null);
                                        }}
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
