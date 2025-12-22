import React, { useState, useMemo } from 'react';
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

// Enhanced Stats Card with Gradients
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
        "relative overflow-hidden bg-card border rounded-2xl p-5",
        "hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5",
        styles.border
      )}
    >
      <div className={cn("absolute inset-0 opacity-50", `bg-gradient-to-br ${styles.gradient}`)} />
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">{title}</p>
          <p className={cn("text-3xl font-extrabold mt-1", styles.text)}>{value}</p>
        </div>
        <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-lg", styles.iconBg)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon
const CustomerStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <StatCard title="Total Customers" value={stats.total} icon={Users} color="purple" index={0} />
    <StatCard title="Active" value={stats.active} icon={UserPlus} color="emerald" index={1} />
    <StatCard title="VIP Members" value={stats.vip} icon={Crown} color="amber" index={2} />
    <StatCard title="Total Points" value={stats.totalPoints.toLocaleString()} icon={Gift} color="blue" index={3} />
  </div>
);

export default function Customers() {
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
    onSuccess: () => { toastSuccess('Customer created'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/customers'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/admin/customers/${id}`, data),
    onSuccess: () => { toastSuccess('Customer updated'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/customers'] }); },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/customers/${id}`),
    onSuccess: () => { toastSuccess('Customer deactivated'); qc.invalidateQueries({ queryKey: ['admin/customers'] }); },
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
    if (confirm('Deactivate this customer?')) deleteMutation.mutate(id);
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
      <div className="min-h-screen bg-background p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Customers
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-2">
              <Users className="w-4 h-4 text-fuchsia-500" />
              Manage your customer database and loyalty points
            </p>
          </div>
          <Button
            onClick={() => { resetForm(); setOpenCreate(true); }}
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Add Customer
          </Button>
        </motion.div>

        {/* Stats */}
        <CustomerStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search customers by name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-secondary/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl">
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                    statusFilter === status
                      ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedCustomers.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-2xl p-5 mb-6 shadow-xl shadow-fuchsia-500/20"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{selectedCustomers.size} customer{selectedCustomers.size === 1 ? '' : 's'} selected</p>
                    <p className="text-white/70 text-sm">Ready for bulk actions</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button size="md" onClick={() => setSelectedCustomers(new Set())} className="bg-white/20 text-white hover:bg-white/30 border-0">
                    <X className="w-4 h-4 mr-2" /> Clear Selection
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
        >
          {/* Table Header - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-border bg-gradient-to-r from-secondary/50 to-secondary/30">
            <div className="col-span-1 flex items-center">
              <input
                type="checkbox"
                checked={selectedCustomers.size === customerList.length && customerList.length > 0}
                onChange={toggleSelectAll}
                className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all"
              />
            </div>
            <div className="col-span-3 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Customer</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Contact</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Location</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">Points</div>
            <div className="col-span-2 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-end">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border/50">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 mb-4">
                  <div className="w-8 h-8 border-3 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-muted-foreground font-medium">Loading customers...</p>
              </div>
            ) : customerList.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-secondary to-muted mb-4">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-1">No customers found</h3>
                <p className="text-muted-foreground text-sm">Try adjusting your search or add a new customer</p>
              </div>
            ) : (
              customerList.map((customer, index) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-12 gap-4 px-4 md:px-6 py-4 items-center transition-all duration-200 group cursor-pointer",
                    "hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent",
                    selectedCustomers.has(customer.id) && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  {/* Checkbox - Hidden on mobile */}
                  <div className="hidden md:block col-span-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => toggleSelectCustomer(customer.id)}
                      className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer transition-all hover:border-primary/50"
                    />
                  </div>

                  {/* Customer Info - Full width on mobile */}
                  <div className="col-span-1 md:col-span-3 flex items-center gap-3">
                    <Avatar
                      src={customer.user?.avatar}
                      name={customer.user?.name}
                      size="md"
                      fallbackColor="rose"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-foreground truncate group-hover:text-primary transition-colors flex items-center gap-2">
                        {customer.user?.name || 'Unknown'}
                        {(customer.points_balance || 0) > 1000 && (
                          <Crown className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <div className="mt-1">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          customer.user?.is_active
                            ? "bg-gradient-to-r from-emerald-500/20 to-green-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-gradient-to-r from-red-500/20 to-rose-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                        )}>
                          {customer.user?.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contact - Hidden on mobile */}
                  <div className="hidden md:block col-span-2">
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

                  {/* Location - Hidden on mobile */}
                  <div className="hidden md:block col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {customer.preferred_location?.name || 'None'}
                    </span>
                  </div>

                  {/* Points - Hidden on mobile */}
                  <div className="hidden md:block col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                        <Gift className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <span className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                          {(customer.points_balance || 0).toLocaleString()}
                        </span>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions - Always visible */}
                  <div className="col-span-1 md:col-span-2 flex justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(customer)}
                      className="h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(customer.id)}
                      className="h-9 w-9 p-0"
                      title="Deactivate"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {customers?.meta && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-border bg-gradient-to-r from-secondary/30 to-transparent">
              <div className="flex items-center gap-3">
                <div className="h-9 px-4 rounded-lg bg-secondary border border-border flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{customers.meta.total}</span>
                  <span className="text-sm text-muted-foreground">customers</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}</span> to <span className="font-semibold text-foreground">{Math.min(page * perPage, customers.meta.total)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="h-10 px-4 gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, customers.meta.last_page) }, (_, i) => {
                    let pageNum;
                    if (customers.meta.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= customers.meta.last_page - 2) {
                      pageNum = customers.meta.last_page - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={cn(
                          "hidden sm:block h-10 w-10 rounded-xl text-sm font-semibold transition-all",
                          page === pageNum
                            ? "bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white shadow-lg shadow-fuchsia-500/25"
                            : "bg-secondary border border-border text-muted-foreground hover:bg-secondary-hover hover:text-foreground"
                        )}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {/* Mobile page indicator */}
                  <span className="sm:hidden text-sm font-medium text-foreground px-3 py-2 rounded-xl bg-secondary border border-border">
                    {page} / {customers.meta.last_page}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === customers.meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="h-10 px-4 gap-2"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingCustomer ? 'Edit Customer' : 'New Customer'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Gender</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full h-11 bg-secondary/50 border border-border rounded-xl px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={editingCustomer ? "Password (optional)" : "Password"} type="password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingCustomer} />
            <Input label="Birth Date" type="date" value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Points Balance" type="number" value={formData.points_balance}
              onChange={(e) => setFormData({ ...formData, points_balance: parseInt(e.target.value) || 0 })} />
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Preferred Location</label>
              <select value={formData.preferred_location_id} onChange={(e) => setFormData({ ...formData, preferred_location_id: e.target.value })}
                className="w-full h-11 bg-secondary/50 border border-border rounded-xl px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                <option value="">Select</option>
                {(locations as any)?.data?.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="is_active" checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded-md border-2 border-border bg-card text-primary focus:ring-2 focus:ring-primary/20 cursor-pointer" />
            <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCustomer ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
