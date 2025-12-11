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

// --- Components ---

const StatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Bookings</p>
        <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
        <Calendar className="w-5 h-5 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Seated Now</p>
        <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.seated}</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
        <Utensils className="w-5 h-5 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Pending</p>
        <p className="text-2xl font-bold text-blue-400 mt-1">{stats.pending}</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
        <Clock className="w-5 h-5 text-blue-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
      <div>
        <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Needs Action</p>
        <p className="text-2xl font-bold text-amber-400 mt-1">{stats.late}</p>
      </div>
      <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
      </div>
    </div>
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const styles = {
    pending: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    confirmed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    seated: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    no_show: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  }[status] || 'bg-gray-500/10 text-gray-400';

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
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium w-fit", styles)}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{status.replace('_', ' ')}</span>
    </div>
  );
};

export default function Reservations() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today'); // Default to today for better UX
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [error, setError] = useState('');

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15); // Increased for density

  // Form state
  const [formData, setFormData] = useState({
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
      late: list.filter(r =>
        (r.status === 'pending' || r.status === 'confirmed') &&
        new Date(r.reserved_for) < lateThreshold
      ).length
    };
  }, [reservationList, reservations]);

  // Fetch tables & customers
  const { data: tables } = useQuery({ queryKey: ['tables'], queryFn: () => apiGet('/api/admin/tables') }) as { data: any };
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => apiGet('/api/admin/customers') }) as { data: any };

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
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/reservations'] });
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Failed to update')
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
    updateMutation.mutate({ id, data: { status } });
  };

  const resetForm = () => {
    setFormData({
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

    setFormData({
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
      <div className="min-h-screen bg-slate-900 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Reservations</h1>
            <p className="text-slate-400 mt-1">Manage bookings and seating flow</p>
          </div>
          <Button
            onClick={() => { resetForm(); setOpenCreate(true); }}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Stats */}
        <StatsRibbon stats={stats} />

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, code, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {['today', 'tomorrow', 'next week', 'all'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDateFilter(filter)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    dateFilter === filter
                      ? "bg-purple-600 text-white"
                      : "bg-slate-800 text-gray-400 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm min-w-[140px]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="seated">Seated</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Main List */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <div className="col-span-2 md:col-span-1">Time</div>
            <div className="col-span-4 md:col-span-3">Customer</div>
            <div className="col-span-3 md:col-span-2">Table</div>
            <div className="col-span-3 md:col-span-2">Status</div>
            <div className="col-span-12 md:col-span-4 text-right hidden md:block">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400">Loading reservations...</div>
            ) : reservationList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-500" />
                </div>
                <h3 className="text-white font-medium">No reservations found</h3>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or create a new booking.</p>
              </div>
            ) : (
              reservationList.map((res) => {
                const late = isLate(res);
                return (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group relative",
                      late && "bg-amber-500/5 border-l-2 border-amber-500"
                    )}
                  >
                    {/* Time */}
                    <div className="col-span-2 md:col-span-1">
                      {res.reserved_for && !isNaN(new Date(res.reserved_for).getTime()) ? (
                        <>
                          <div className="font-bold text-white text-lg">
                            {new Date(res.reserved_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(res.reserved_for).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-500 italic">Invalid Date</div>
                      )}
                    </div>

                    {/* Customer */}
                    <div className="col-span-4 md:col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                          {res.customer?.user?.name?.charAt(0) || 'G'}
                        </div>
                        <div>
                          <div className="font-medium text-white truncate">{res.customer?.user?.name}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {res.guest_count} guests
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="col-span-3 md:col-span-2">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Armchair className="w-4 h-4 text-gray-500" />
                        <span>Table {res.table?.code || 'Unassigned'}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-3 md:col-span-2">
                      <StatusPill status={res.status} />
                      {late && (
                        <div className="text-xs text-amber-500 mt-1 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Late Arrival
                        </div>
                      )}
                    </div>

                    {/* Actions (Desktop) */}
                    <div className="col-span-12 md:col-span-4 flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {res.status === 'confirmed' || res.status === 'pending' ? (
                        <Button
                          size="sm"
                          onClick={() => handleQuickStatus(res.id, 'seated')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                        >
                          <Utensils className="w-3 h-3 mr-1.5" /> Seat Now
                        </Button>
                      ) : null}

                      {res.status === 'seated' ? (
                        <Button
                          size="sm"
                          onClick={() => handleQuickStatus(res.id, 'completed')}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                        >
                          <CheckCircle className="w-3 h-3 mr-1.5" /> Finish
                        </Button>
                      ) : null}

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(res)}
                        className="h-8 w-8 p-0 border-white/10 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (confirm('Cancel this reservation?')) deleteMutation.mutate(res.id);
                        }}
                        className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {reservations?.meta && (
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
              <div className="text-sm text-gray-400">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, reservations.meta.total)} of {reservations.meta.total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="border-white/10 hover:bg-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === reservations.meta.last_page}
                  onClick={() => setPage(p => p + 1)}
                  className="border-white/10 hover:bg-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
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
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Customer</label>
                <select
                  required
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Customer</option>
                  {customers?.data?.map((c: Customer) => (
                    <option key={c.id} value={c.id}>{c.user?.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Date & Time</label>
                <Input
                  type="datetime-local"
                  required
                  value={formData.reserved_for}
                  onChange={(e) => setFormData({ ...formData, reserved_for: e.target.value })}
                  className="bg-slate-900 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Duration (min)</label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="bg-slate-900 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Table</label>
                <select
                  required
                  value={formData.table_id}
                  onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">Select Table</option>
                  {tables?.data?.map((t: DiningTable) => (
                    <option key={t.id} value={t.id}>Table {t.code} ({t.capacity} seats)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Guests</label>
                <Input
                  type="number"
                  required
                  value={formData.guest_count}
                  onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                  className="bg-slate-900 border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
            <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Allergies, special requests, etc."
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setOpenCreate(false); setOpenEdit(false); }}
              className="flex-1 border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingReservation ? 'Save Changes' : 'Create Booking'}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
