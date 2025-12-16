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
import Avatar from '@/app/components/ui/Avatar';
import AddressPicker, { AddressData } from '@/app/components/customer/AddressPicker';

// StatCard Component with vibrant gradients
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
  const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string; shadow: string }> = {
    purple: {
      gradient: 'from-fuchsia-500/20 to-purple-500/10',
      iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
      text: 'text-fuchsia-600 dark:text-fuchsia-400',
      border: 'border-fuchsia-500/30',
      shadow: 'shadow-fuchsia-500/20'
    },
    emerald: {
      gradient: 'from-emerald-500/20 to-green-500/10',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      shadow: 'shadow-emerald-500/20'
    },
    amber: {
      gradient: 'from-amber-500/20 to-yellow-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-600',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      shadow: 'shadow-amber-500/20'
    },
    slate: {
      gradient: 'from-slate-500/20 to-gray-500/10',
      iconBg: 'bg-gradient-to-br from-slate-500 to-gray-600',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-500/30',
      shadow: 'shadow-slate-500/20'
    }
  };
  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
            <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
          </div>
          <div className={cn("p-3 rounded-xl shadow-lg", styles.iconBg)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon
const EmployeeStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <StatCard title="Total Staff" value={stats.total} icon={Users} color="purple" index={0} />
    <StatCard title="Active" value={stats.active} icon={UserCheck} color="emerald" index={1} />
    <StatCard title="On Leave" value={stats.onLeave} icon={Clock} color="amber" index={2} />
    <StatCard title="Inactive" value={stats.inactive} icon={UserX} color="slate" index={3} />
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
    latitude: null as number | null, longitude: null as number | null,
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
    setFormData({ name: '', email: '', phone: '', password: '', employee_code: '', hire_date: '', salary_type: 'monthly', salary: '', address: '', latitude: null, longitude: null, position_id: '', location_id: '', status: 'active', role: 'employee' });
    setEditingEmployee(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      salary: formData.salary ? parseFloat(formData.salary) : null,
      position_id: formData.position_id ? parseInt(formData.position_id) : null,
      location_id: parseInt(formData.location_id),
      latitude: formData.latitude,
      longitude: formData.longitude
    };
    if (editingEmployee) updateMutation.mutate({ id: editingEmployee.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.user.name, email: employee.user.email, phone: employee.phone || '', password: '',
      employee_code: employee.employee_code, hire_date: employee.hire_date || '',
      salary_type: employee.salary_type, salary: employee.salary?.toString() || '',
      address: employee.address || '', latitude: employee.user.latitude || null, longitude: employee.user.longitude || null,
      position_id: employee.position_id?.toString() || '', location_id: employee.location_id?.toString() || '',
      status: employee.status, role: employee.user.roles?.[0] || 'employee'
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Deactivate this employee?')) deleteMutation.mutate(id);
  };

  const handleAddressChange = (data: AddressData | null) => {
    if (data) {
      setFormData(prev => ({
        ...prev,
        address: data.address,
        latitude: data.lat,
        longitude: data.lng
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        address: '',
        latitude: null,
        longitude: null
      }));
    }
  };



  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-6">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent"
            >
              Employees
            </motion.h1>
            <p className="text-muted-foreground mt-1">Manage restaurant staff</p>
          </div>
          <Button onClick={() => { resetForm(); setOpenCreate(true); }} variant="primary">
            <Plus className="w-4 h-4 mr-2" /> Add Employee
          </Button>
        </div>

        {/* Stats */}
        <EmployeeStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-card/50 border border-border/50 rounded-2xl p-4 mb-6 backdrop-blur-sm shadow-lg"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10" variant="filled" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All', color: 'fuchsia' },
                { key: 'active', label: 'Active', color: 'emerald' },
                { key: 'on_leave', label: 'On Leave', color: 'amber' },
                { key: 'inactive', label: 'Inactive', color: 'slate' }
              ].map(({ key, label, color }) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                    statusFilter === key
                      ? color === 'fuchsia' ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30"
                        : color === 'emerald' ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30"
                          : color === 'amber' ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg shadow-amber-500/30"
                            : "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/30"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {/* Table Header with Gradient */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Employee</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Position</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Contact</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Hire Date</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">Status</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
          </div>

          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                  Loading employees...
                </div>
              </div>
            ) : employeeList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-fuchsia-500" />
                </div>
                <h3 className="text-foreground font-semibold">No employees found</h3>
                <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters</p>
              </div>
            ) : (
              employeeList.map((employee, idx) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-fuchsia-500/5 hover:to-transparent transition-all group"
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="relative">
                      <Avatar
                        src={employee.user?.avatar}
                        name={employee.user?.name}
                        size="md"
                        fallbackColor="blue"
                      />
                      {employee.status === 'active' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{employee.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground font-mono">{employee.employee_code}</div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium">
                      {employee.position?.title || 'No Position'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-foreground truncate flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      {employee.user?.email}
                    </div>
                    {employee.phone && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Phone className="w-3 h-3" />
                        {employee.phone}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="col-span-1">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1",
                      employee.status === 'active'
                        ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : employee.status === 'on_leave'
                          ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        employee.status === 'active' ? "bg-emerald-500" :
                          employee.status === 'on_leave' ? "bg-amber-500" : "bg-slate-500"
                      )} />
                      {(employee.status || 'active').replace('_', ' ')}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(employee)}
                      className="h-8 w-8 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(employee.id)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination with Gradient Active Page */}
          {(employees as any)?.meta && (
            <div className="flex items-center justify-between p-4 border-t border-border/50 bg-gradient-to-r from-transparent via-fuchsia-500/5 to-transparent">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}</span> to{' '}
                <span className="font-semibold text-foreground">{Math.min(page * perPage, (employees as any).meta.total)}</span> of{' '}
                <span className="font-semibold text-fuchsia-500">{(employees as any).meta.total}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="hover:bg-fuchsia-500/20 hover:text-fuchsia-500 hover:border-fuchsia-500/30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {/* Page Numbers */}
                {Array.from({ length: Math.min((employees as any).meta.last_page, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "min-w-[36px]",
                        page === pageNum && "shadow-lg shadow-fuchsia-500/30"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === (employees as any).meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="hover:bg-fuchsia-500/20 hover:text-fuchsia-500 hover:border-fuchsia-500/30"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
        title={editingEmployee ? 'Edit Employee' : 'Create Employee'} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              leftIcon={<User className="w-4 h-4" />}
              variant="filled"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              leftIcon={<Mail className="w-4 h-4" />}
              variant="filled"
            />
          </div>

          {/* Phone & Password */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
              variant="filled"
            />
            <Input
              label={editingEmployee ? "New Password (optional)" : "Password"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingEmployee}
              variant="filled"
            />
          </div>

          {/* Employee Code & Hire Date */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employee Code"
              value={formData.employee_code}
              onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
              required
              leftIcon={<BadgeIcon className="w-4 h-4" />}
              variant="filled"
            />
            <Input
              label="Hire Date"
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              leftIcon={<Calendar className="w-4 h-4" />}
              variant="filled"
            />
          </div>

          {/* Salary Type, Salary, Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Salary Type</label>
              <select
                value={formData.salary_type}
                onChange={(e) => setFormData({ ...formData, salary_type: e.target.value as any })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
              >
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <Input
              label="Salary"
              type="number"
              step="0.01"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              leftIcon={<DollarSign className="w-4 h-4" />}
              variant="filled"
            />
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Position & Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Position</label>
              <select
                value={formData.position_id}
                onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
              >
                <option value="">Select Position</option>
                {(positions as any)?.data?.map((pos: Position) => (
                  <option key={pos.id} value={pos.id}>{pos.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Location <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                required
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
              >
                <option value="">Select Location</option>
                {(locations as any)?.data?.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <AddressPicker
              label="Address"
              initialAddress={formData.address}
              initialLat={formData.latitude || undefined}
              initialLng={formData.longitude || undefined}
              onChange={handleAddressChange}
              placeholder="Search employee address..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setOpenCreate(false); setOpenEdit(false); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                editingEmployee ? 'Update Employee' : 'Create Employee'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}