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
import { useLanguage } from '@/app/context/LanguageContext';

// StatCard Component with vibrant gradients - Mobile optimized
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
        "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[100px] sm:min-w-0",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 hidden sm:block">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">{title}</p>
            <p className={cn("text-lg sm:text-2xl md:text-3xl font-bold", styles.text)}>{value}</p>
          </div>
          <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon - Mobile optimized horizontal scroll
const EmployeeStatsRibbon = ({ stats }: { stats: any }) => {
  const { t } = useLanguage();
  return (
    <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
      <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
        <StatCard title={t('admin.hr.employees.stats.total')} value={stats.total} icon={Users} color="purple" index={0} />
        <StatCard title={t('admin.hr.employees.stats.active')} value={stats.active} icon={UserCheck} color="emerald" index={1} />
        <StatCard title={t('admin.hr.employees.stats.leave')} value={stats.onLeave} icon={Clock} color="amber" index={2} />
        <StatCard title={t('admin.hr.employees.stats.inactive')} value={stats.inactive} icon={UserX} color="slate" index={3} />
      </div>
    </div>
  );
};

export default function Employees() {
  const { t, locale } = useLanguage();
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
    onSuccess: () => { toastSuccess(t('admin.hr.employees.messages.created') as string); setOpenCreate(false); resetForm(); qc.invalidateQueries({ queryKey: ['admin/employees'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || t('admin.hr.employees.messages.failed') as string)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/admin/employees/${id}`, data),
    onSuccess: () => { toastSuccess(t('admin.hr.employees.messages.updated') as string); setOpenEdit(false); resetForm(); qc.invalidateQueries({ queryKey: ['admin/employees'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || t('admin.hr.employees.messages.failed') as string)
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/employees/${id}`),
    onSuccess: () => { toastSuccess(t('admin.hr.employees.messages.deleted') as string); qc.invalidateQueries({ queryKey: ['admin/employees'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || t('admin.hr.employees.messages.failed') as string)
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
      address: employee.address || '',
      latitude: employee.user.latitude ? parseFloat(String(employee.user.latitude)) : null,
      longitude: employee.user.longitude ? parseFloat(String(employee.user.longitude)) : null,
      position_id: employee.position_id?.toString() || '', location_id: employee.location_id?.toString() || '',
      status: employee.status, role: employee.user.roles?.[0] || 'employee'
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t('admin.hr.employees.messages.confirm_delete') as string)) deleteMutation.mutate(id);
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
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent truncate"
            >
              {t('admin.hr.employees.title')}
            </motion.h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">{t('admin.hr.employees.subtitle')}</p>
          </div>
          <Button onClick={() => { resetForm(); setOpenCreate(true); }} variant="primary" className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('admin.hr.employees.add')}</span>
          </Button>
        </div>

        {/* Stats */}
        <EmployeeStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
        >
          <div className="flex gap-2 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder={t('layout.ui.search.placeholder.default') as string} value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 text-sm" variant="filled" />
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
              {[
                { key: 'all', label: t('admin.hr.employees.filters.all'), color: 'fuchsia' },
                { key: 'active', label: t('admin.hr.employees.filters.active'), color: 'emerald' },
                { key: 'on_leave', label: t('admin.hr.employees.filters.leave'), color: 'amber' },
                { key: 'inactive', label: t('admin.hr.employees.filters.off'), color: 'slate' }
              ].map(({ key, label, color }) => (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-2.5 sm:px-4 py-2 h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0",
                    statusFilter === key
                      ? color === 'fuchsia' ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg"
                        : color === 'emerald' ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg"
                          : color === 'amber' ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white shadow-lg"
                            : "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Desktop Table - Hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative hidden md:block bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.employees.table.employee')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.employees.table.position')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.employees.table.contact')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.employees.table.hire_date')}</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">{t('admin.hr.employees.table.status')}</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider text-right">{t('admin.hr.employees.table.actions')}</div>
          </div>

          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                  {t('common.loading')}
                </div>
              </div>
            ) : employeeList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-fuchsia-500" />
                </div>
                <h3 className="text-foreground font-semibold">{t('admin.hr.employees.messages.not_found')}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t('admin.hr.employees.messages.adjust_filters')}</p>
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
                      <Avatar src={employee.user?.avatar} name={employee.user?.name} size="md" fallbackColor="blue" />
                      {employee.status === 'active' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{employee.user?.name || t('admin.hr.employees.table.unknown')}</div>
                      <div className="text-xs text-muted-foreground font-mono">{employee.employee_code}</div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium">
                      {employee.position?.title || t('admin.hr.employees.table.no_position')}
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
                    {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString(locale) : 'N/A'}
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
        </motion.div>

        {/* Mobile Cards - Hidden on desktop */}
        <div className="md:hidden space-y-2">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              {t('common.loading')}
            </div>
          ) : employeeList.length === 0 ? (
            <div className="p-8 text-center bg-card/50 rounded-xl border border-border/50">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-fuchsia-500" />
              </div>
              <p className="text-muted-foreground text-sm">{t('admin.hr.employees.messages.not_found')}</p>
            </div>
          ) : (
            employeeList.map((employee, idx) => (
              <motion.div
                key={employee.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Avatar src={employee.user?.avatar} name={employee.user?.name} size="sm" fallbackColor="blue" />
                      {employee.status === 'active' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-sm truncate">{employee.user?.name || t('admin.hr.employees.table.unknown')}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{employee.employee_code}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(employee)}
                      className="h-8 w-8 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(employee.id)}
                      className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-medium">
                    {employee.position?.title || t('admin.hr.employees.table.no_position')}
                  </span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                    employee.status === 'active'
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : employee.status === 'on_leave'
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-slate-500/20 text-slate-600 dark:text-slate-400"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      employee.status === 'active' ? "bg-emerald-500" :
                        employee.status === 'on_leave' ? "bg-amber-500" : "bg-slate-500"
                    )} />
                    {(employee.status || 'active').replace('_', ' ')}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination - Mobile optimized */}
        {(employees as any)?.meta && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl backdrop-blur-sm shadow-lg">
            <div className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}-{Math.min(page * perPage, (employees as any).meta.total)}</span>
              <span className="hidden sm:inline"> of </span>
              <span className="sm:hidden">/</span>
              <span className="font-semibold text-fuchsia-500">{(employees as any).meta.total}</span>
            </div>
            <div className="flex gap-1 sm:gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="h-8 w-8 p-0 hover:bg-fuchsia-500/20"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {/* Page Numbers - Show fewer on mobile */}
              {Array.from({ length: Math.min((employees as any).meta.last_page, 3) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="h-8 min-w-[32px] text-xs sm:text-sm"
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
                className="h-8 w-8 p-0 hover:bg-fuchsia-500/20"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal - Mobile optimized */}
      <Modal isOpen={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
        title={editingEmployee ? t('admin.hr.employees.modal.edit_title') : t('admin.hr.employees.modal.create_title')} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label={t('admin.hr.employees.modal.name') as string}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              leftIcon={<User className="w-4 h-4" />}
              variant="filled"
              className="h-10 text-sm"
            />
            <Input
              label={t('admin.hr.employees.modal.email') as string}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              leftIcon={<Mail className="w-4 h-4" />}
              variant="filled"
              className="h-10 text-sm"
            />
          </div>

          {/* Phone & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label={t('admin.hr.employees.modal.phone') as string}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              leftIcon={<Phone className="w-4 h-4" />}
              variant="filled"
              className="h-10 text-sm"
            />
            <Input
              label={editingEmployee ? t('admin.hr.employees.modal.new_password') as string : t('admin.hr.employees.modal.password') as string}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingEmployee}
              variant="filled"
              className="h-10 text-sm"
            />
          </div>

          {/* Employee Code & Hire Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label={t('admin.hr.employees.modal.code') as string}
              value={formData.employee_code}
              placeholder={editingEmployee ? '' : t('admin.hr.employees.modal.auto_generated') as string}
              onChange={() => { }} // Read-only
              disabled
              leftIcon={<BadgeIcon className="w-4 h-4" />}
              variant="filled"
              className="h-10 text-sm opacity-70 cursor-not-allowed"
            />
            <Input
              label={t('admin.hr.employees.modal.hire_date') as string}
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              leftIcon={<Calendar className="w-4 h-4" />}
              variant="filled"
              className="h-10 text-sm"
            />
          </div>

          {/* Salary Type, Salary, Status */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">{t('admin.hr.employees.modal.type')}</label>
              <select
                value={formData.salary_type}
                onChange={(e) => setFormData({ ...formData, salary_type: e.target.value as any })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:border-fuchsia-500 transition-all"
              >
                <option value="monthly">{t('admin.hr.employees.modal.types.monthly')}</option>
                <option value="hourly">{t('admin.hr.employees.modal.types.hourly')}</option>
              </select>
            </div>
            <Input
              label={t('admin.hr.employees.modal.salary') as string}
              type="number"
              step="0.01"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              leftIcon={<DollarSign className="w-4 h-4" />}
              variant="filled"
              className="h-10 text-sm"
            />
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">{t('admin.hr.employees.modal.status')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:border-fuchsia-500 transition-all"
              >
                <option value="active">{t('admin.hr.employees.modal.statuses.active')}</option>
                <option value="inactive">{t('admin.hr.employees.modal.statuses.inactive')}</option>
                <option value="on_leave">{t('admin.hr.employees.modal.statuses.on_leave')}</option>
                <option value="terminated">{t('admin.hr.employees.modal.statuses.terminated')}</option>
              </select>
            </div>
          </div>

          {/* Position & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">{t('admin.hr.employees.modal.position')}</label>
              <select
                value={formData.position_id}
                onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:border-fuchsia-500 transition-all"
              >
                <option value="">{t('admin.hr.employees.modal.select')}</option>
                {(positions as any)?.data?.map((pos: Position) => (
                  <option key={pos.id} value={pos.id}>{pos.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">
                {t('admin.hr.employees.modal.location')} <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                required
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:border-fuchsia-500 transition-all"
              >
                <option value="">{t('admin.hr.employees.modal.select')}</option>
                {(locations as any)?.data?.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address - Hidden on mobile for compactness */}
          <div className="hidden sm:block">
            <AddressPicker
              key={editingEmployee ? `edit-${editingEmployee.id}` : 'create'}
              label={t('admin.hr.employees.modal.address') as string}
              initialAddress={formData.address}
              initialLat={formData.latitude || undefined}
              initialLng={formData.longitude || undefined}
              onChange={handleAddressChange}
              placeholder={t('admin.hr.employees.modal.search_address') as string}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setOpenCreate(false); setOpenEdit(false); }}
              className="flex-1 h-10 sm:h-11 text-sm"
            >
              {t('layout.actions.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 h-10 sm:h-11 text-sm"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </span>
              ) : (
                editingEmployee ? t('layout.actions.save') : t('layout.actions.create')
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout >
  );
}