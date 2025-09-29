import React from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { Employee, Position, Location, ApiResponse } from '@/app/types/domain';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import Modal from '@/app/components/ui/Modal';
import { toastLoading, toastSuccess, toastError } from '@/app/utils/toast';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, Calendar, DollarSign, MapPin, Badge } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Employees() {
  const [search, setSearch] = React.useState('');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    employee_code: '',
    hire_date: '',
    salary_type: 'monthly' as 'hourly' | 'monthly',
    salary: '',
    address: '',
    position_id: '',
    location_id: '',
    status: 'active' as 'active' | 'inactive' | 'terminated' | 'on_leave',
    role: 'employee'
  });
  const [error, setError] = React.useState<string | null>(null);
  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(15);

  // Fetch employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ['admin/employees', page, search],
    queryFn: () => apiGet(`/api/admin/employees?page=${page}&per_page=${perPage}&search=${search}`)
  });

  // Fetch positions for dropdown
  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: () => apiGet('/api/positions')
  });

  // Fetch locations for dropdown
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/locations')
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/employees', data),
    onSuccess: () => {
      toastSuccess('Employee created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/employees'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to create employee');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiPut(`/api/admin/employees/${id}`, data),
    onSuccess: () => {
      toastSuccess('Employee updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/employees'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update employee');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/employees/${id}`),
    onSuccess: () => {
      toastSuccess('Employee deactivated successfully!');
      qc.invalidateQueries({ queryKey: ['admin/employees'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to deactivate employee');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      employee_code: '',
      hire_date: '',
      salary_type: 'monthly',
      salary: '',
      address: '',
      position_id: '',
      location_id: '',
      status: 'active',
      role: 'employee'
    });
    setError(null);
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const data = {
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      position_id: formData.position_id ? parseInt(formData.position_id) : null,
      location_id: parseInt(formData.location_id)
    };

    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.user.name,
      email: employee.user.email,
      phone: employee.phone || '',
      password: '',
      employee_code: employee.employee_code,
      hire_date: employee.hire_date || '',
      salary_type: employee.salary_type,
      salary: employee.salary?.toString() || '',
      address: employee.address || '',
      position_id: employee.position_id?.toString() || '',
      location_id: employee.location_id.toString(),
      status: employee.status,
      role: employee.user.roles[0] || 'employee'
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to deactivate this employee?')) {
      deleteMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'terminated': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'on_leave': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Employees
            </h1>
            <p className="text-gray-400 mt-1">Manage your restaurant staff</p>
          </div>
          <Button
            onClick={() => setOpenCreate(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search employees by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : (
            employees?.data?.map((employee: Employee) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">
                          {employee.user.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          {employee.position?.title || 'No Position'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(employee.status)}`}>
                        {employee.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Mail className="w-4 h-4" />
                        {employee.user.email}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone className="w-4 h-4" />
                          {employee.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Badge className="w-4 h-4" />
                        {employee.employee_code}
                      </div>
                      {employee.hire_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4" />
                          Hired: {new Date(employee.hire_date).toLocaleDateString()}
                        </div>
                      )}
                      {employee.salary && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <DollarSign className="w-4 h-4" />
                          ${employee.salary} ({employee.salary_type})
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin className="w-4 h-4" />
                        {employee.location?.name || 'No Location'}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(employee)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(employee.id)}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {employees?.meta && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {page} of {employees.meta.last_page}
            </span>
            <Button
              variant="outline"
              disabled={page === employees.meta.last_page}
              onClick={() => setPage(page + 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={openCreate || openEdit}
        onClose={() => {
          setOpenCreate(false);
          setOpenEdit(false);
          resetForm();
        }}
        title={editingEmployee ? 'Edit Employee' : 'Create Employee'}
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label={editingEmployee ? "New Password (optional)" : "Password"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingEmployee}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Employee Code"
              value={formData.employee_code}
              onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label="Hire Date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Salary Type</label>
              <select
                value={formData.salary_type}
                onChange={(e) => setFormData({ ...formData, salary_type: e.target.value as 'hourly' | 'monthly' })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="monthly" className="bg-gray-800">Monthly</option>
                <option value="hourly" className="bg-gray-800">Hourly</option>
              </select>
            </div>
            <Input
              label="Salary"
              type="number"
              step="0.01"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="active" className="bg-gray-800">Active</option>
                <option value="inactive" className="bg-gray-800">Inactive</option>
                <option value="on_leave" className="bg-gray-800">On Leave</option>
                <option value="terminated" className="bg-gray-800">Terminated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <select
                value={formData.position_id}
                onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Position</option>
                {positions?.data?.map((position: Position) => (
                  <option key={position.id} value={position.id} className="bg-gray-800">
                    {position.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Location</option>
                {locations?.data?.map((location: Location) => (
                  <option key={location.id} value={location.id} className="bg-gray-800">
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Enter employee address..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpenCreate(false);
                setOpenEdit(false);
                resetForm();
              }}
              className="flex-1 border-white/20 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingEmployee ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
