import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/app/layouts/AdminLayout';
import { apiGet, apiDelete } from '@/app/libs/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    Filter,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { toastSuccess, toastError } from '@/app/utils/toast';

export default function EmployeeList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [locationFilter, setLocationFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const qc = useQueryClient();

    const { data: employeesData, isLoading } = useQuery({
        queryKey: ['employees', currentPage, searchTerm, locationFilter, statusFilter],
        queryFn: () =>
            apiGet('/api/admin/employees', {
                page: currentPage,
                search: searchTerm,
                location_id: locationFilter || undefined,
                status: statusFilter || undefined,
                per_page: 25,
            }),
    });

    const deleteMutation = useMutation({
        mutationFn: (employeeId: number) => apiDelete(`/api/employees/${employeeId}`),
        onSuccess: () => {
            toastSuccess('Employee deactivated successfully');
            qc.invalidateQueries({ queryKey: ['employees'] });
        },
        onError: () => {
            toastError('Failed to deactivate employee');
        },
    });

    const handleEdit = (employeeId: number) => {
        router.visit(`/admin/employees/${employeeId}/edit`);
    };

    const handleView = (employeeId: number) => {
        router.visit(`/admin/employees/${employeeId}`);
    };

    const handleDelete = (employeeId: number) => {
        if (confirm('Are you sure you want to deactivate this employee?')) {
            deleteMutation.mutate(employeeId);
        }
    };

    const statusBadgeColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-gray-100 text-gray-800';
            case 'on_leave':
                return 'bg-yellow-100 text-yellow-800';
            case 'terminated':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AdminLayout>
            <Head title="Employee Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-8 h-8 text-blue-600" />
                        <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
                    </div>
                    <Button
                        onClick={() => router.visit('/admin/employees/create')}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Employee
                    </Button>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="on_leave">On Leave</option>
                                    <option value="terminated">Terminated</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Filter by location..."
                                    value={locationFilter}
                                    onChange={(e) => {
                                        setLocationFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Employee Table */}
                <Card>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin">
                                    <Users className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-gray-500 mt-2">Loading employees...</p>
                            </div>
                        ) : employeesData?.data && employeesData.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Position</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Location</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {employeesData.data.map((employee: any) => (
                                                <tr
                                                    key={employee.id}
                                                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                                                >
                                                    <td className="py-3 px-4">{employee.user.name}</td>
                                                    <td className="py-3 px-4 text-gray-600">{employee.user.email}</td>
                                                    <td className="py-3 px-4">{employee.position?.title || 'N/A'}</td>
                                                    <td className="py-3 px-4">{employee.location?.name}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadgeColor(employee.status)}`}>
                                                            {employee.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleView(employee.id)}
                                                                className="p-2 hover:bg-blue-100 text-blue-600 rounded transition"
                                                                title="View"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(employee.id)}
                                                                className="p-2 hover:bg-yellow-100 text-yellow-600 rounded transition"
                                                                title="Edit"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(employee.id)}
                                                                className="p-2 hover:bg-red-100 text-red-600 rounded transition"
                                                                title="Deactivate"
                                                                disabled={deleteMutation.isPending}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {employeesData.pagination && employeesData.pagination.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                        <p className="text-sm text-gray-600">
                                            Page {employeesData.pagination.current_page} of {employeesData.pagination.last_page}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(prev => prev + 1)}
                                                disabled={currentPage === employeesData.pagination.last_page}
                                                className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="w-8 h-8 text-gray-400 mx-auto" />
                                <p className="text-gray-500 mt-2">No employees found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
