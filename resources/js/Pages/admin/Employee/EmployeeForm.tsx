import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { useMutation } from '@tanstack/react-query';
import AdminLayout from '@/app/layouts/AdminLayout';
import { apiPost, apiPut } from '@/app/libs/apiClient';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { ArrowLeft } from 'lucide-react';

interface EmployeeFormData {
    name: string;
    email: string;
    phone: string;
    position_id: number;
    location_id: number;
    salary_type: 'hourly' | 'monthly';
    salary?: number;
    hourly_rate?: number;
    hire_date: string;
    date_of_birth: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    department?: string;
    password?: string;
    password_confirmation?: string;
    role?: string;
}

interface EmployeeFormProps {
    employee?: any;
    positions?: any[];
    locations?: any[];
    isEdit?: boolean;
}

export default function EmployeeForm({ employee, positions = [], locations = [], isEdit = false }: EmployeeFormProps) {
    const [formData, setFormData] = useState<EmployeeFormData>(
        employee
            ? {
                  name: employee.user.name,
                  email: employee.user.email,
                  phone: employee.phone || employee.user.phone || '',
                  position_id: employee.position_id,
                  location_id: employee.location_id,
                  salary_type: employee.salary_type,
                  salary: employee.salary,
                  hourly_rate: employee.hourly_rate,
                  hire_date: employee.hire_date,
                  date_of_birth: employee.date_of_birth,
                  emergency_contact_name: employee.emergency_contact_name || '',
                  emergency_contact_phone: employee.emergency_contact_phone || '',
                  department: employee.department || '',
              }
            : {
                  name: '',
                  email: '',
                  phone: '',
                  position_id: 0,
                  location_id: 0,
                  salary_type: 'monthly',
                  department: '',
                  hire_date: new Date().toISOString().split('T')[0],
                  date_of_birth: '',
                  emergency_contact_name: '',
                  emergency_contact_phone: '',
                  password: '',
                  password_confirmation: '',
                  role: 'staff',
              }
    );

    const [errors, setErrors] = useState<Record<string, string>>({});

    const mutation = useMutation({
        mutationFn: () => {
            if (isEdit && employee) {
                return apiPut(`/api/employees/${employee.id}`, formData);
            } else {
                return apiPost('/api/employees', formData);
            }
        },
        onSuccess: () => {
            toastSuccess(isEdit ? 'Employee updated successfully' : 'Employee created successfully');
            router.visit('/admin/employees');
        },
        onError: (error: any) => {
            const newErrors = error.response?.data?.errors || {};
            setErrors(newErrors);
            toastError(error.response?.data?.message || 'Failed to save employee');
        },
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <AdminLayout>
            <Head title={isEdit ? 'Edit Employee' : 'Create Employee'} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.visit('/admin/employees')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEdit ? 'Edit Employee' : 'Create New Employee'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Personal Information</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <Input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email *
                                    </label>
                                    <Input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@example.com"
                                        disabled={isEdit}
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone *
                                    </label>
                                    <Input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                        className={errors.phone ? 'border-red-500' : ''}
                                    />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth *
                                    </label>
                                    <Input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        className={errors.date_of_birth ? 'border-red-500' : ''}
                                    />
                                    {errors.date_of_birth && <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employment Details */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Employment Details</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Position *
                                    </label>
                                    <select
                                        name="position_id"
                                        value={formData.position_id}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Position</option>
                                        {positions.map(pos => (
                                            <option key={pos.id} value={pos.id}>{pos.title}</option>
                                        ))}
                                    </select>
                                    {errors.position_id && <p className="text-red-500 text-xs mt-1">{errors.position_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location *
                                    </label>
                                    <select
                                        name="location_id"
                                        value={formData.location_id}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Location</option>
                                        {locations.map(loc => (
                                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                                        ))}
                                    </select>
                                    {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department
                                    </label>
                                    <Input
                                        type="text"
                                        name="department"
                                        value={formData.department || ''}
                                        onChange={handleChange}
                                        placeholder="e.g., Kitchen, Front Desk"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hire Date *
                                    </label>
                                    <Input
                                        type="date"
                                        name="hire_date"
                                        value={formData.hire_date}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compensation */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Compensation</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Salary Type *
                                    </label>
                                    <select
                                        name="salary_type"
                                        value={formData.salary_type}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="monthly">Monthly Salary</option>
                                        <option value="hourly">Hourly Rate</option>
                                    </select>
                                </div>

                                {formData.salary_type === 'monthly' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Monthly Salary *
                                        </label>
                                        <Input
                                            type="number"
                                            name="salary"
                                            value={formData.salary || ''}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hourly Rate *
                                        </label>
                                        <Input
                                            type="number"
                                            name="hourly_rate"
                                            value={formData.hourly_rate || ''}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            step="0.01"
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Emergency Contact */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-semibold">Emergency Contact</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Name *
                                    </label>
                                    <Input
                                        type="text"
                                        name="emergency_contact_name"
                                        value={formData.emergency_contact_name}
                                        onChange={handleChange}
                                        placeholder="Jane Doe"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Phone *
                                    </label>
                                    <Input
                                        type="tel"
                                        name="emergency_contact_phone"
                                        value={formData.emergency_contact_phone}
                                        onChange={handleChange}
                                        placeholder="+1234567890"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit */}
                    <div className="flex gap-4 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/admin/employees')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? 'Saving...' : isEdit ? 'Update Employee' : 'Create Employee'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
