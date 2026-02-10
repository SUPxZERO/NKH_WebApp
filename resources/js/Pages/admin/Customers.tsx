import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Eye, Edit, Trash2, Users, ChevronLeft, ChevronRight,
  Mail, Phone, MapPin, Star, Gift, UserPlus, X, Crown, Sparkles
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Customer, Location } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';
import Avatar from '@/app/components/ui/Avatar';

// Enhanced Stats Card with Gradients - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
  const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string }> = {
    purple: {
      gradient: 'from-fuchsia-500/20 to-purple-500/10',
      iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
      text: 'text-fuchsia-600 dark:text-fuchsia-400',
      border: 'border-fuchsia-500/30',
    },
    emerald: {
      gradient: 'from-emerald-500/20 to-green-500/10',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
    },
    amber: {
      gradient: 'from-amber-500/20 to-orange-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
    },
    blue: {
      gradient: 'from-blue-500/20 to-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/30',
    },
  };

  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden bg-card border rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 min-w-[100px] sm:min-w-0",
        "hover:shadow-lg transition-all duration-300",
        styles.border
      )}
    >
      <div className={cn("absolute inset-0 opacity-50", `bg-gradient-to-br ${styles.gradient}`)} />
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div>
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold">{title}</p>
          <p className={cn("text-lg sm:text-2xl md:text-3xl font-extrabold mt-0.5 sm:mt-1", styles.text)}>{value}</p>
        </div>
        <div className={cn("h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0", styles.iconBg)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon - Mobile optimized with horizontal scroll
const CustomerStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
    <div className="flex sm:grid sm:grid-cols-4 gap-2 sm:gap-4 min-w-max sm:min-w-0">
      <StatCard title={stats.totalLabel} value={stats.total} icon={Users} color="purple" index={0} />
      <StatCard title={stats.activeLabel} value={stats.active} icon={UserPlus} color="emerald" index={1} />
      <StatCard title={stats.vipLabel} value={stats.vip} icon={Crown} color="amber" index={2} />
      <StatCard title={stats.pointsLabel} value={stats.totalPoints.toLocaleString()} icon={Gift} color="blue" index={3} />
    </div>
  </div>
);

export default function Customers() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<number>>(new Set());
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', birth_date: '',
    gender: '', preferred_location_id: '', points_balance: 0, notes: '', is_active: true
  });
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin/customers', page, search, statusFilter],
    queryFn: () => apiGet(`/admin/customers?page=${page}&per_page=${perPage}&search=${search}&status=${statusFilter}`)
  }) as { data: any, isLoading: boolean };

  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => apiGet('/locations') });

  const customerList: Customer[] = useMemo(() => {
    if (!customers) return [];
    if (Array.isArray(customers)) return customers;
    if (customers.data && Array.isArray(customers.data)) return customers.data;
    return [];
  }, [customers]);

  const stats = useMemo(() => ({
    total: customers?.meta?.total || customerList.length,
    active: customerList.filter(c => c.user?.is_active).length,
    vip: customerList.filter(c => (c.points_balance || 0) > 1000).length,
    totalPoints: customerList.reduce((sum, c) => sum + (c.points_balance || 0), 0)
  }), [customerList, customers]);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/admin/customers', data),
    onSuccess: () => { toastSuccess(t('admin.people.customers.created') as string); closeModal(); qc.invalidateQueries({ queryKey: ['admin/customers'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/admin/customers/${id}`, data),
    onSuccess: () => { toastSuccess(t('admin.people.customers.updated') as string); closeModal(); qc.invalidateQueries({ queryKey: ['admin/customers'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/customers/${id}`),
    onSuccess: () => { toastSuccess(t('admin.people.customers.deactivated') as string); qc.invalidateQueries({ queryKey: ['admin/customers'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const closeModal = () => { setOpenCreate(false); setOpenEdit(false); resetForm(); };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', password: '', birth_date: '', gender: '', preferred_location_id: '', points_balance: 0, notes: '', is_active: true });
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      preferred_location_id: formData.preferred_location_id ? parseInt(formData.preferred_location_id) : null,
      points_balance: parseInt(formData.points_balance.toString()) || 0
    };
    if (editingCustomer) updateMutation.mutate({ id: editingCustomer.id, data });
    else createMutation.mutate(data);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.user.name, email: customer.user.email, phone: customer.user.phone || '', password: '',
      birth_date: customer.birth_date || '', gender: customer.gender || '',
      preferred_location_id: customer.preferred_location_id?.toString() || '',
      points_balance: customer.points_balance, notes: customer.notes || '', is_active: customer.user.is_active
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t('admin.people.customers.confirm_deactivate') as string)) deleteMutation.mutate(id);
  };

  const toggleSelectCustomer = (id: number) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedCustomers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === customerList.length) setSelectedCustomers(new Set());
    else setSelectedCustomers(new Set(customerList.map(c => c.id)));
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8"
        >
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight truncate">
              <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                {t('admin.people.customers.title')}
              </span>
            </h1>
            <p className="text-muted-foreground mt-0.5 sm:mt-1 text-xs sm:text-sm hidden sm:flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-fuchsia-500" />
              {t('admin.people.customers.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => { resetForm(); setOpenCreate(true); }}
            variant="primary"
            className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t('admin.people.customers.add_customer')}</span>
          </Button>
        </motion.div>

        {/* Stats */}
        <CustomerStatsRibbon stats={
          {
            ...stats,
            totalLabel: t('admin.people.customers.stats.total'),
            activeLabel: t('admin.people.customers.stats.active'),
            vipLabel: t('admin.people.customers.stats.vip'),
            pointsLabel: t('admin.people.customers.stats.points')
          }
        } />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 mb-4 sm:mb-6 shadow-sm"
        >
          <div className="flex gap-2 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder={t('common.search') as string}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-semibold transition-all whitespace-nowrap",
                    statusFilter === status
                      ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {status === 'all' ? t('admin.menu.stats.total') : status === 'active' ? t('admin.menu.stats.active') : t('admin.menu.stats.inactive')}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions - Mobile optimized */}
        <AnimatePresence>
          {selectedCustomers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-xl"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm sm:text-lg">{t('admin.people.customers.selected', { count: selectedCustomers.size })}</p>
                  </div>
                </div>
                <Button size="sm" onClick={() => setSelectedCustomers(new Set())} className="bg-white/20 text-white hover:bg-white/30 border-0 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm">
                  <X className="w-3.5 h-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">{t('admin.people.customers.clear')}</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Table - Hidden on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:block bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-gradient-to-r from-secondary/50 to-secondary/30">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedCustomers.size === customerList.length && customerList.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
              />
            </div>
            <div className="col-span-3 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">{t('admin.people.customers.table.customer')}</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">{t('admin.people.customers.table.contact')}</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">{t('admin.people.customers.table.location')}</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">{t('admin.people.customers.table.points')}</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-end">{t('admin.people.customers.table.actions')}</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border/50">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 mb-4">
                  <div className="w-8 h-8 border-3 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-muted-foreground font-medium">{t('common.loading')}</p>
              </div>
            ) : customerList.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-muted mb-4">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-1">{t('admin.people.customers.empty')}</h3>
                <p className="text-muted-foreground text-sm">{t('admin.menu.try_adjusting')}</p>
              </div>
            ) : (
              customerList.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-200 group cursor-pointer",
                    "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent",
                    selectedCustomers.has(customer.id) && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => toggleSelectCustomer(customer.id)}
                      className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    />
                  </div>
                  <div className="col-span-3 flex items-center gap-3">
                    <Avatar src={customer.user?.avatar} name={customer.user?.name} size="md" fallbackColor="rose" />
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate flex items-center gap-2">
                        {customer.user?.name || 'Unknown'}
                        {(customer.points_balance || 0) > 1000 && <Crown className="w-4 h-4 text-amber-500" />}
                      </div>
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                        customer.user?.is_active
                          ? "bg-emerald-500/20 text-emerald-600 border-emerald-500/30"
                          : "bg-red-500/20 text-red-600 border-red-500/30"
                      )}>
                        {customer.user?.is_active ? t('admin.menu.stats.active') : t('admin.menu.stats.inactive')}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-foreground truncate flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{customer.user?.email || 'N/A'}</span>
                    </div>
                    {customer.user?.phone && (
                      <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        {customer.user.phone}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {customer.preferred_location?.name || 'None'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                        <Gift className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                          {(customer.points_balance || 0).toLocaleString()}
                        </span>
                        <p className="text-xs text-muted-foreground">{t('admin.people.customers.stats.points')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(customer)} className="h-9 w-9 p-0">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(customer.id)} className="h-9 w-9 p-0">
                      <Trash2 className="w-4 h-4" />
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
          ) : customerList.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-xl border border-border">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">{t('admin.people.customers.empty')}</p>
            </div>
          ) : (
            customerList.map((customer, index) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="bg-card border border-border rounded-xl p-3 backdrop-blur-sm"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar src={customer.user?.avatar} name={customer.user?.name} size="sm" fallbackColor="rose" />
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground text-sm truncate flex items-center gap-1">
                        {customer.user?.name || 'Unknown'}
                        {(customer.points_balance || 0) > 1000 && <Crown className="w-3 h-3 text-amber-500" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">{customer.user?.email}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(customer)} className="h-8 w-8 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(customer.id)} className="h-8 w-8 p-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                    customer.user?.is_active ? "bg-emerald-500/20 text-emerald-600" : "bg-red-500/20 text-red-600"
                  )}>
                    {customer.user?.is_active ? t('admin.menu.stats.active') : t('admin.menu.stats.inactive')}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/20 text-amber-600 flex items-center gap-1">
                    <Gift className="w-2.5 h-2.5" />
                    {(customer.points_balance || 0).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination - Mobile optimized */}
        {customers?.meta && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 md:p-5 border-t border-border bg-gradient-to-r from-secondary/30 to-transparent">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 sm:h-9 px-2 sm:px-4 rounded-lg bg-secondary border border-border flex items-center gap-1.5 sm:gap-2">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium text-foreground">{customers.meta.total}</span>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                {((page - 1) * perPage) + 1}-{Math.min(page * perPage, customers.meta.total)}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="h-8 sm:h-10 w-8 sm:w-auto p-0 sm:px-3"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {/* Mobile page indicator */}
              <span className="text-xs sm:text-sm font-medium text-foreground px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-secondary border border-border">
                {page}/{customers.meta.last_page}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page === customers.meta.last_page}
                onClick={() => setPage(p => p + 1)}
                className="h-8 sm:h-10 w-8 sm:w-auto p-0 sm:px-3"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal - Mobile optimized */}
      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingCustomer ? t('admin.people.customers.edit_customer') : t('admin.people.customers.new_customer')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label={t('auth.full_name') as string} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-10 text-sm" />
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">{t('profile.gender')}</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-10 bg-secondary/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="">{t('admin.common.select') || 'Select'}</option>
                <option value="male">{t('profile.genders.male')}</option>
                <option value="female">{t('profile.genders.female')}</option>
                <option value="other">{t('profile.genders.other')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label={t('auth.email_label') as string} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="h-10 text-sm" />
            <Input label={t('auth.phone_label') as string} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-10 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label={editingCustomer ? t('auth.new_password_title') as string : t('auth.password_label') as string} type="password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingCustomer} className="h-10 text-sm" />
            <Input label={t('profile.birth_date') as string} type="date" value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} className="h-10 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input label={t('admin.people.customers.table.points') as string} type="number" value={formData.points_balance}
              onChange={(e) => setFormData({ ...formData, points_balance: parseInt(e.target.value) || 0 })} className="h-10 text-sm" />
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">{t('admin.people.customers.location_label')}</label>
              <select value={formData.preferred_location_id} onChange={(e) => setFormData({ ...formData, preferred_location_id: e.target.value })}
                className="w-full h-10 bg-secondary/50 border border-border rounded-lg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
                <option value="">{t('admin.common.select') || 'Select'}</option>
                {(locations as any)?.data?.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden sm:block">
            <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-2">{t('admin.people.customers.notes_label')}</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <input type="checkbox" id="is_active" checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 sm:w-5 sm:h-5 rounded border-2 border-border bg-card cursor-pointer" />
            <label htmlFor="is_active" className="text-xs sm:text-sm font-medium text-foreground cursor-pointer">{t('admin.menu.stats.active')}</label>
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11 text-sm">{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 h-10 sm:h-11 text-sm">
              {createMutation.isPending || updateMutation.isPending ? t('profile.saving') : (editingCustomer ? t('common.save') : t('layout.actions.create'))}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout >
  );
}
