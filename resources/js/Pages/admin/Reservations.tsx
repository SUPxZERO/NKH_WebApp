import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Plus, Eye, Edit, Trash2, Calendar, Clock,
  Users, MapPin, User, CheckCircle, XCircle, AlertCircle,
  Armchair, MoreHorizontal, Phone, ChevronLeft, ChevronRight,
  Utensils, AlertTriangle, ArrowRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Reservation, DiningTable, Customer } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';
import { useReservationUpdates } from '@/app/hooks/useRealtime';

// --- Components ---

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
    blue: {
      gradient: 'from-blue-500/20 to-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/30',
      shadow: 'shadow-blue-500/20'
    },
    amber: {
      gradient: 'from-amber-500/20 to-orange-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      shadow: 'shadow-amber-500/20'
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

const StatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
    <StatCard title="Total Bookings" value={stats.total} icon={Calendar} color="purple" index={0} />
    <StatCard title="Pending" value={stats.pending} icon={Clock} color="blue" index={1} />
    <StatCard title="Confirmed" value={stats.confirmed} icon={CheckCircle} color="purple" index={2} />
    <StatCard title="Seated Now" value={stats.seated} icon={Utensils} color="emerald" index={3} />
    <StatCard title="Needs Action" value={stats.late} icon={AlertTriangle} color="amber" index={4} />
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const styles = {
    pending: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    confirmed: 'bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/30',
    seated: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    cancelled: 'bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    completed: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
    no_show: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
  }[status] || 'bg-gradient-to-r from-slate-500/20 to-gray-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30';

  const dotColor = {
    pending: 'bg-blue-500',
    confirmed: 'bg-fuchsia-500',
    seated: 'bg-emerald-500',
    cancelled: 'bg-red-500',
    completed: 'bg-slate-500',
    no_show: 'bg-orange-500',
  }[status] || 'bg-slate-500';

  const icon = {
    pending: Clock,
    confirmed: CheckCircle,
    seated: Utensils,
    cancelled: XCircle,
    completed: CheckCircle,
    no_show: AlertCircle,
  }[status] || Clock;

  const Icon = icon;

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold w-fit", styles)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status.replace('_', ' ')}</span>
    </div>
  );
};

export default function Reservations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // Default to all to see all reservations
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useReservationUpdates();

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15); // Increased for density

  // Form state
  const [formData, setFormData] = useState({
    location_id: '',
    floor_id: '',
    table_id: '',
    customer_id: '',
    reserved_for: '',
    duration_minutes: '60',
    guest_count: '2',
    status: 'pending' as 'pending' | 'confirmed' | 'seated' | 'cancelled' | 'completed' | 'no_show',
    notes: ''
  });

  // Fetch reservations
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['admin/reservations', page, search, statusFilter, dateFilter],
    queryFn: () => {
      let url = `/api/admin/reservations?page=${page}&per_page=${perPage}&search=${search}`;

      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }

      if (dateFilter !== 'all') {
        const today = new Date();
        let startDate = '';

        switch (dateFilter) {
          case 'today':
            startDate = today.toISOString().split('T')[0];
            url += `&date=${startDate}`;
            break;
          case 'tomorrow':
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            url += `&date=${tomorrow.toISOString().split('T')[0]}`;
            break;
          case 'next week':
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            url += `&start_date=${today.toISOString().split('T')[0]}&end_date=${weekEnd.toISOString().split('T')[0]}`;
            break;
        }
      }

      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  const reservationList: Reservation[] = useMemo(() => {
    if (!reservations) return [];
    if (Array.isArray(reservations)) return reservations as Reservation[];
    if (reservations.data && Array.isArray(reservations.data)) return reservations.data as Reservation[];
    return [];
  }, [reservations]);

  // Calculate stats
  const stats = useMemo(() => {
    const list = reservationList;
    const now = new Date();
    const lateThreshold = new Date(now.getTime() - 15 * 60000); // 15 mins ago

    return {
      total: reservations?.meta?.total || list.length,
      seated: list.filter(r => r.status === 'seated').length,
      pending: list.filter(r => r.status === 'pending').length,
      confirmed: list.filter(r => r.status === 'confirmed').length,
      late: list.filter(r =>
        (r.status === 'pending' || r.status === 'confirmed') &&
        new Date(r.reserved_for) < lateThreshold
      ).length
    };
  }, [reservationList, reservations]);

  // Fetch tables, customers, locations & floors
  const { data: tables } = useQuery({
    queryKey: ['tables', formData.floor_id],
    queryFn: () => {
      if (!formData.floor_id) return { data: [] };
      return apiGet(`/api/admin/tables?floor_id=${formData.floor_id}`);
    },
    enabled: !!formData.floor_id
  }) as { data: any };
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => apiGet('/api/admin/customers') }) as { data: any };
  const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => apiGet('/api/admin/locations') }) as { data: any };
  const { data: floors } = useQuery({
    queryKey: ['floors', formData.location_id],
    queryFn: () => {
      if (!formData.location_id) return { data: [] };
      return apiGet(`/api/admin/floors?location_id=${formData.location_id}`);
    },
    enabled: !!formData.location_id
  }) as { data: any };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/reservations', data),
    onSuccess: () => {
      toastSuccess('Reservation created');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/reservations'] });
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Failed to create')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/reservations/${id}`, data),
    onSuccess: () => {
      toastSuccess('Reservation updated');
      setOpenEdit(false);
      setUpdatingId(null);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/reservations'] });
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Failed to update';
      setError(message);
      setUpdatingId(null);
      toastError(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/reservations/${id}`),
    onSuccess: () => {
      toastSuccess('Reservation cancelled');
      qc.invalidateQueries({ queryKey: ['admin/reservations'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to delete')
  });

  // Quick Actions
  const handleQuickStatus = (id: number, status: string) => {
    setUpdatingId(id);
    updateMutation.mutate({ id, data: { status } });
  };

  const resetForm = () => {
    setFormData({
      location_id: '',
      floor_id: '',
      table_id: '',
      customer_id: '',
      reserved_for: '',
      duration_minutes: '60',
      guest_count: '2',
      status: 'pending',
      notes: ''
    });
    setEditingReservation(null);
    setError('');
  };

  const handleEdit = (reservation: Reservation) => {
    let dateStr = '';
    if (reservation.reserved_for) {
      try {
        const d = new Date(reservation.reserved_for);
        if (!isNaN(d.getTime())) {
          // Adjust to local ISO string for datetime-local input
          const offset = d.getTimezoneOffset() * 60000;
          dateStr = new Date(d.getTime() - offset).toISOString().slice(0, 16);
        }
      } catch (e) {
        console.error("Invalid date:", reservation.reserved_for);
      }
    }

    // Get location and floor from the table
    const locationId = (reservation as any).location_id?.toString() || '';
    const floorId = (reservation as any).table?.floor_id?.toString() || '';

    setFormData({
      location_id: locationId,
      floor_id: floorId,
      table_id: reservation.table_id.toString(),
      customer_id: reservation.customer_id.toString(),
      reserved_for: dateStr,
      duration_minutes: reservation.duration_minutes.toString(),
      guest_count: reservation.guest_count.toString(),
      status: reservation.status,
      notes: reservation.notes || ''
    });
    setEditingReservation(reservation);
    setOpenEdit(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data = {
      ...formData,
      table_id: parseInt(formData.table_id),
      customer_id: parseInt(formData.customer_id),
      duration_minutes: parseInt(formData.duration_minutes),
      guest_count: parseInt(formData.guest_count)
    };

    if (editingReservation) {
      updateMutation.mutate({ id: editingReservation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLate = (res: Reservation) => {
    if (!res.reserved_for) return false;
    const d = new Date(res.reserved_for);
    if (isNaN(d.getTime())) return false;

    return (res.status === 'pending' || res.status === 'confirmed') &&
      d < new Date(Date.now() - 15 * 60000);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-6">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent"
            >
              Reservations
            </motion.h1>
            <p className="text-muted-foreground mt-1">Manage bookings and seating flow</p>
          </div>
          <Button onClick={() => { resetForm(); setOpenCreate(true); }} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Stats */}
        <StatsRibbon stats={stats} />

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
              <Input
                placeholder="Search by name, code, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                variant="filled"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {[
                { key: 'today', label: 'Today', color: 'fuchsia' },
                { key: 'tomorrow', label: 'Tomorrow', color: 'purple' },
                { key: 'next week', label: 'Next Week', color: 'blue' },
                { key: 'all', label: 'All', color: 'slate' }
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setDateFilter(key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                    dateFilter === key
                      ? color === 'fuchsia' ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white shadow-lg shadow-fuchsia-500/30"
                        : color === 'purple' ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30"
                          : color === 'blue' ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
                            : "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/30"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-secondary border border-border rounded-xl px-4 py-2.5 text-foreground text-sm min-w-[140px] focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </motion.div>

        {/* Main List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {/* Table Header with Gradient - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-fuchsia-500/10 via-purple-500/5 to-fuchsia-500/10">
            <div className="col-span-2 md:col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">Time</div>
            <div className="col-span-4 md:col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Customer</div>
            <div className="col-span-3 md:col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Table</div>
            <div className="col-span-3 md:col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Status</div>
            <div className="col-span-12 md:col-span-4 text-xs font-bold text-foreground uppercase tracking-wider text-right hidden md:block">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />
                  Loading reservations...
                </div>
              </div>
            ) : reservationList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-fuchsia-500" />
                </div>
                <h3 className="text-foreground font-semibold">No reservations found</h3>
                <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or create a new booking.</p>
              </div>
            ) : (
              reservationList.map((res, idx) => {
                const late = isLate(res);
                return (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={cn(
                      "grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-fuchsia-500/5 hover:to-transparent transition-all group relative",
                      late && "bg-gradient-to-r from-amber-500/10 to-transparent border-l-3 border-amber-500"
                    )}
                  >
                    {/* Time */}
                    <div className="col-span-2 md:col-span-1">
                      {res.reserved_for && !isNaN(new Date(res.reserved_for).getTime()) ? (
                        <>
                          <div className="font-bold text-foreground text-lg">
                            {new Date(res.reserved_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(res.reserved_for).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground italic">Invalid Date</div>
                      )}
                    </div>

                    {/* Customer */}
                    <div className="col-span-4 md:col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-fuchsia-500/30">
                          {res.customer?.user?.name?.charAt(0) || 'G'}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground truncate">{res.customer?.user?.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" /> {res.guest_count} guests
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="col-span-3 md:col-span-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                        <Armchair className="w-4 h-4" />
                        <span className="font-medium">Table {res.table?.code || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-3 md:col-span-2">
                      <StatusPill status={res.status} />
                      {late && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Late Arrival
                        </div>
                      )}
                    </div>

                    {/* Actions (Desktop) */}
                    <div className="col-span-12 md:col-span-4 flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                      {/* Pending → Confirm */}
                      {res.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleQuickStatus(res.id, 'confirmed')}
                          disabled={updatingId === res.id}
                          loading={updatingId === res.id}
                          className="h-8 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1.5" /> Confirm
                        </Button>
                      )}

                      {/* Confirmed → Seat */}
                      {res.status === 'confirmed' && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleQuickStatus(res.id, 'seated')}
                          disabled={updatingId === res.id}
                          loading={updatingId === res.id}
                          className="h-8 text-xs"
                        >
                          <Utensils className="w-3 h-3 mr-1.5" /> Seat Now
                        </Button>
                      )}

                      {/* Seated → Complete */}
                      {res.status === 'seated' && (
                        <Button
                          size="sm"
                          variant="info"
                          onClick={() => handleQuickStatus(res.id, 'completed')}
                          disabled={updatingId === res.id}
                          loading={updatingId === res.id}
                          className="h-8 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1.5" /> Finish
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(res)}
                        disabled={updatingId === res.id}
                        className="h-8 w-8 p-0 hover:bg-fuchsia-500/20 hover:text-fuchsia-500"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Cancel this reservation?')) deleteMutation.mutate(res.id);
                        }}
                        disabled={updatingId === res.id}
                        className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination with Gradient Active Page */}
          {reservations?.meta && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/50 bg-gradient-to-r from-transparent via-fuchsia-500/5 to-transparent">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{((page - 1) * perPage) + 1}</span> to{' '}
                <span className="font-semibold text-foreground">{Math.min(page * perPage, reservations.meta.total)}</span> of{' '}
                <span className="font-semibold text-fuchsia-500">{reservations.meta.total}</span>
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
                {Array.from({ length: Math.min(reservations.meta.last_page, 5) }, (_, i) => {
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
                  disabled={page === reservations.meta.last_page}
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
      <Modal
        open={openCreate || openEdit}
        onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
        title={editingReservation ? 'Edit Reservation' : 'New Reservation'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-gradient-to-r from-red-500/10 to-rose-500/10 border border-red-500/30 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Customer <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                >
                  <option value="">Select Customer</option>
                  {customers?.data?.map((c: Customer) => (
                    <option key={c.id} value={c.id}>{c.user?.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Date & Time"
                type="datetime-local"
                required
                value={formData.reserved_for}
                onChange={(e) => setFormData({ ...formData, reserved_for: e.target.value })}
                leftIcon={<Calendar className="w-4 h-4" />}
                variant="filled"
              />

              <Input
                label="Number of Guests"
                type="number"
                required
                value={formData.guest_count}
                onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                leftIcon={<Users className="w-4 h-4" />}
                variant="filled"
              />

              <Input
                label="Duration (minutes)"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                leftIcon={<Clock className="w-4 h-4" />}
                variant="filled"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Location <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.location_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      location_id: e.target.value,
                      floor_id: '',
                      table_id: ''
                    });
                  }}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                >
                  <option value="">Select Location</option>
                  {locations?.data?.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Floor <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.floor_id}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      floor_id: e.target.value,
                      table_id: ''
                    });
                  }}
                  disabled={!formData.location_id}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Floor</option>
                  {floors?.data?.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Table <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={formData.table_id}
                  onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                  disabled={!formData.floor_id}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Table</option>
                  {tables?.data?.map((t: DiningTable) => (
                    <option key={t.id} value={t.id}>Table {t.code} ({t.capacity} seats)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="seated">Seated</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                  <option value="no_show">No Show</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/20 transition-all resize-none"
              placeholder="Allergies, special requests, etc."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
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
                editingReservation ? 'Save Changes' : 'Create Booking'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
