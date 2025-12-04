import React, { useState, useMemo } from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { Employee, Position, Location } from '@/app/types/domain';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, Calendar, DollarSign, MapPin, Badge as BadgeIcon, ChevronLeft, ChevronRight, Users, UserCheck, UserX, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/app/utils/cn';

// Stats Ribbon
const EmployeeStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Staff</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <Users className="w-8 h-8 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Active</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
        </div>
        <UserCheck className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">On Leave</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.onLeave}</p>
        </div>
        <Clock className="w-8 h-8 text-yellow-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Inactive</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{stats.inactive}</p>
        </div>
        <UserX className="w-8 h-8 text-gray-400" />
      </div>
    </div>
  </div>
);

export default function Employees() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', employee_code: '', hire_date: '',
    salary_type: 'monthly' as 'hourly' | 'monthly', salary: '', address: '',
    position_id: '', location_id: '', status: 'active' as 'active' | 'inactive' | 'terminated' | 'on_leave',
    role: 'employee'
  });
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Fetch employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ['admin/employees', page, search, statusFilter],
    queryFn: () => {
      let url = `/admin/employees?page=${page}&per_page=${perPage}&search=${search}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      return apiGet(url);
    }
  });

  const { data: positions } = useQuery({ queryKey: ['positions'], queryFn: () => apiGet('/positions') });
  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => apiGet('/locations') });

  // Fetch stats from backend for accurate totals
  const { data: statsData } = useQuery({
    queryKey: ['employee-stats'],
    queryFn: () => apiGet('/admin/employee-stats')
  });

  const employeeList: Employee[] = useMemo(() => {
    if (!employees) return [];
    if (Array.isArray(employees)) return employees;
    if ((employees as any)?.data && Array.isArray((employees as any).data)) return (employees as any).data;
    return [];
  }, [employees]);

  // Use backend stats with fallback to list-based calculation
  const stats = useMemo(() => ({
    total: (statsData as any)?.total ?? (employees as any)?.meta?.total ?? employeeList.length,
    active: (statsData as any)?.active ?? employeeList.filter(e => e.status === 'active').length,
    onLeave: (statsData as any)?.on_leave ?? employeeList.filter(e => e.status === 'on_leave').length,
    inactive: (statsData as any)?.inactive ?? employeeList.filter(e => e.status === 'inactive' || e.status === 'terminated').length
  }), [employeeList, employees, statsData]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/admin/employees', data),
    onSuccess: () => { toastSuccess('Employee created'); setOpenCreate(false); resetForm(); qc.invalidateQueries({ queryKey: ['admin/employees'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/admin/employees/${id}`, data),
    onSuccess: () => { toastSuccess('Employee updated'); setOpenEdit(false); resetForm(); qc.invalidateQueries({ queryKey: ['admin/employees'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/employees/${id}`),
    onSuccess: () => { toastSuccess('Employee deactivated'); qc.invalidateQueries({ queryKey: ['admin/employees'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', employee_code: '', hire_date: '', salary_type: 'monthly', salary: '', address: '', position_id: '', location_id: '', status: 'active', role: 'employee' });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      position_id: formData.position_id ? parseInt(formData.position_id) : null,
      location_id: parseInt(formData.location_id)
    };
    if (editingEmployee) updateMutation.mutate({ id: editingEmployee.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.user.name, email: employee.user.email, phone: employee.phone || '', password: '',
      employee_code: employee.employee_code, hire_date: employee.hire_date || '',
      salary_type: employee.salary_type, salary: employee.salary?.toString() || '', address: employee.address || '',
      position_id: employee.position_id?.toString() || '', location_id: employee.location_id?.toString() || '',
      status: employee.status, role: employee.user.roles?.[0] || 'employee'
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Deactivate this employee?')) deleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Employees</h1>
            <p className="text-slate-400 mt-1">Manage restaurant staff</p>
          </div>
          <Button onClick={() => { resetForm(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        </div>

        {/* Stats */}
        <EmployeeStatsRibbon stats={stats} />

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'on_leave', 'inactive'].map((status) => (
                <button key={status} onClick={() => setStatusFilter(status)}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    statusFilter === status ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-400 hover:bg-slate-700")}>
                  {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-3">Employee</div>
            <div className="col-span-2">Position</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-2">Hire Date</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-12 text-center text-gray-400">Loading employees...</div>
            ) : employeeList.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium">No employees found</h3>
              </div>
            ) : (
              employeeList.map((employee) => (
                <motion.div key={employee.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{employee.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{employee.employee_code}</div>
                    </div>
                  </div>
                  <div className="col-span-2 text-gray-300 text-sm">{employee.position?.title || 'No Position'}</div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-300 truncate">{employee.user?.email}</div>
                    {employee.phone && <div className="text-xs text-gray-500">{employee.phone}</div>}
                  </div>
                  <div className="col-span-2 text-sm text-gray-300">
                    {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="col-span-1">
                    <span className={cn("px-2.5 py-1 rounded-full border text-xs font-medium",
                      employee.status === 'active' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        employee.status === 'on_leave' ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                          "bg-gray-500/10 text-gray-400 border-gray-500/20")}>
                      {(employee.status || 'active').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(employee)}
                      className="h-8 w-8 p-0 border-white/10"><Edit className="w-3 h-3" /></Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(employee.id)}
                      className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {(employees as any)?.meta && (
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
              <div className="text-sm text-gray-400">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, (employees as any).meta.total)} of {(employees as any).meta.total}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="border-white/10"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="secondary" size="sm" disabled={page === (employees as any).meta.last_page} onClick={() => setPage(p => p + 1)}
                  className="border-white/10"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
        title={editingEmployee ? 'Edit Employee' : 'Create Employee'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required className="bg-white/5 border-white/10 text-white" />
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required className="bg-white/5 border-white/10 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <Input label={editingEmployee ? "New Password (optional)" : "Password"} type="password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingEmployee}
              className="bg-white/5 border-white/10 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Employee Code" value={formData.employee_code} onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
              required className="bg-white/5 border-white/10 text-white" />
            <Input label="Hire Date" type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Salary Type</label>
              <select value={formData.salary_type} onChange={(e) => setFormData({ ...formData, salary_type: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="monthly" className="bg-gray-800">Monthly</option>
                <option value="hourly" className="bg-gray-800">Hourly</option>
              </select>
            </div>
            <Input label="Salary" type="number" step="0.01" value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="active" className="bg-gray-800">Active</option>
                <option value="inactive" className="bg-gray-800">Inactive</option>
                <option value="on_leave" className="bg-gray-800">On Leave</option>
                <option value="terminated" className="bg-gray-800">Terminated</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <select value={formData.position_id} onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="">Select Position</option>
                {(positions as any)?.data?.map((pos: Position) => (
                  <option key={pos.id} value={pos.id} className="bg-gray-800">{pos.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                required className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="">Select Location</option>
                {(locations as any)?.data?.map((loc: Location) => (
                  <option key={loc.id} value={loc.id} className="bg-gray-800">{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
            <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setOpenCreate(false); setOpenEdit(false); }}
              className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingEmployee ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}