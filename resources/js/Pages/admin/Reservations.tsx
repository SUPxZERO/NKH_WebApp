import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  Users, 
  MapPin,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Armchair
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Reservation, DiningTable, Customer, Location } from '@/app/types/domain';

export default function Reservations() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [dateFilter, setDateFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [selectedReservation, setSelectedReservation] = React.useState<Reservation | null>(null);
  const [editingReservation, setEditingReservation] = React.useState<Reservation | null>(null);
  const [error, setError] = React.useState('');

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);

  // Form state
  const [formData, setFormData] = React.useState({
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
          case 'week':
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            url += `&start_date=${today.toISOString().split('T')[0]}&end_date=${weekEnd.toISOString().split('T')[0]}`;
            break;
        }
      }
      
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  const reservationList: Reservation[] = React.useMemo(() => {
    if (!reservations) return [];
    if (Array.isArray(reservations)) return reservations as Reservation[];
    if (reservations.data && Array.isArray(reservations.data)) return reservations.data as Reservation[];
    return [];
  }, [reservations]);

  const todayTimeline = React.useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return reservationList
      .filter((res) => {
        if (!res.reserved_for) return false;
        const d = new Date(res.reserved_for);
        if (Number.isNaN(d.getTime())) return false;
        return d.toISOString().split('T')[0] === todayStr;
      })
      .sort((a, b) => new Date(a.reserved_for).getTime() - new Date(b.reserved_for).getTime());
  }, [reservationList]);

  // Fetch tables
  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: () => apiGet('/api/admin/tables')
  }) as { data: any };

  // Fetch customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiGet('/api/admin/customers')
  }) as { data: any };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/reservations', data),
    onSuccess: () => {
      toastSuccess('Reservation created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/reservations'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create reservation');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/reservations/${id}`, data),
    onSuccess: () => {
      toastSuccess('Reservation updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/reservations'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update reservation');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/reservations/${id}`),
    onSuccess: () => {
      toastSuccess('Reservation cancelled successfully!');
      qc.invalidateQueries({ queryKey: ['admin/reservations'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete reservation');
    }
  });

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

  const handleCreate = () => {
    resetForm();
    setOpenCreate(true);
  };

  const handleEdit = (reservation: Reservation) => {
    setFormData({
      table_id: reservation.table_id.toString(),
      customer_id: reservation.customer_id.toString(),
      reserved_for: reservation.reserved_for.slice(0, 16), // datetime-local format
      duration_minutes: reservation.duration_minutes.toString(),
      guest_count: reservation.guest_count.toString(),
      status: reservation.status,
      notes: reservation.notes || ''
    });
    setEditingReservation(reservation);
    setOpenEdit(true);
  };

  const handleView = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setOpenView(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      deleteMutation.mutate(id);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'seated': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'no_show': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'seated': return <Armchair className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'no_show': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const totalReservations = reservations?.data?.length || 0;
  const pendingReservations = reservations?.data?.filter((res: Reservation) => res.status === 'pending').length || 0;
  const confirmedReservations = reservations?.data?.filter((res: Reservation) => res.status === 'confirmed').length || 0;
  const seatedReservations = reservations?.data?.filter((res: Reservation) => res.status === 'seated').length || 0;

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Reservations Management
              </h1>
              <p className="text-gray-400 mt-1">Manage table reservations and bookings</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total</div>
                <div className="text-xl font-bold text-white">{totalReservations}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Pending</div>
                <div className="text-xl font-bold text-yellow-400">{pendingReservations}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Confirmed</div>
                <div className="text-xl font-bold text-blue-400">{confirmedReservations}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Seated</div>
                <div className="text-xl font-bold text-green-400">{seatedReservations}</div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Reservation
            </Button>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search reservations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all" className='text-black'>All Status</option>
            <option value="pending" className='text-black'>Pending</option>
            <option value="confirmed" className='text-black'>Confirmed</option>
            <option value="seated" className='text-black'>Seated</option>
            <option value="cancelled" className='text-black'>Cancelled</option>
            <option value="completed" className='text-black'>Completed</option>
            <option value="no_show" className='text-black'>No Show</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all" className='text-black'>All Dates</option>
            <option value="today" className='text-black'>Today</option>
            <option value="tomorrow" className='text-black'>Tomorrow</option>
            <option value="week" className='text-black'>This Week</option>
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setDateFilter('today');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>

        {/* Today's Timeline - compact operational view */}
        {todayTimeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-300" />
                Today's Timeline
              </h2>
              <span className="text-xs text-gray-400">
                {todayTimeline.length} reservation{todayTimeline.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {todayTimeline.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white">
                        {new Date(res.reserved_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-xs text-gray-400">
                        {res.customer?.user?.name || 'Unknown Customer'} • Table {res.table?.code || '-'} •{' '}
                        {res.guest_count} guests
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(res.status)}>
                    <div className="flex items-center gap-1 text-xs">
                      {getStatusIcon(res.status)}
                      {res.status}
                    </div>
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reservations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-3 bg-white/10 rounded w-1/2"></div>
                      <div className="h-8 bg-white/10 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            reservations?.data?.map((reservation: Reservation, index: number) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Reservation Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          #{reservation.code}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {reservation.customer?.user?.name}
                        </p>
                      </div>
                      <Badge className={getStatusColor(reservation.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(reservation.status)}
                          {reservation.status}
                        </div>
                      </Badge>
                    </div>

                    {/* Reservation Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-300">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {new Date(reservation.reserved_for).toLocaleDateString()} at {new Date(reservation.reserved_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="flex items-center text-sm text-gray-300">
                        <Users className="w-4 h-4 mr-2 text-gray-400" />
                        {reservation.guest_count} guests
                      </div>

                      <div className="flex items-center text-sm text-gray-300">
                        <Armchair className="w-4 h-4 mr-2 text-gray-400" />
                        Table {reservation.table?.code}
                      </div>

                      <div className="flex items-center text-sm text-gray-300">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {reservation.duration_minutes} minutes
                      </div>

                      {reservation.notes && (
                        <div className="text-sm text-gray-300 line-clamp-2">
                          <strong>Notes:</strong> {reservation.notes}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleView(reservation)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(reservation)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(reservation.id)}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-3 h-3 text-white" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {reservations?.meta && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {page} of {reservations?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === reservations?.meta?.last_page}
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
        open={openCreate || openEdit}
        onClose={() => {
          setOpenCreate(false);
          setOpenEdit(false);
          resetForm();
        }}
        title={editingReservation ? 'Edit Reservation' : 'Create Reservation'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Customer *</label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Customer</option>
                {customers?.data?.map((customer: Customer) => (
                  <option key={customer.id} value={customer.id} className="bg-gray-800">
                    {customer.user?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Table *</label>
              <select
                required
                value={formData.table_id}
                onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Table</option>
                {tables?.data?.map((table: DiningTable) => (
                  <option key={table.id} value={table.id} className="bg-gray-800">
                    Table {table.code} (Capacity: {table.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time *</label>
              <Input
                type="datetime-local"
                required
                value={formData.reserved_for}
                onChange={(e) => setFormData({ ...formData, reserved_for: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
              <Input
                type="number"
                min="30"
                max="480"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Guest Count *</label>
              <Input
                type="number"
                min="1"
                max="20"
                required
                value={formData.guest_count}
                onChange={(e) => setFormData({ ...formData, guest_count: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Special requests or notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
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
              variant="primary"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {editingReservation ? 'Update' : 'Create'} Reservation
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Reservation Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedReservation(null);
        }}
        title="Reservation Details"
        size="lg"
      >
        {selectedReservation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Reservation Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Code:</span>
                    <span className="text-white font-semibold">#{selectedReservation.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customer:</span>
                    <span className="text-white">{selectedReservation.customer?.user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Table:</span>
                    <span className="text-white">Table {selectedReservation.table?.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getStatusColor(selectedReservation.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedReservation.status)}
                        {selectedReservation.status}
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Booking Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white">{new Date(selectedReservation.reserved_for).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-white">{new Date(selectedReservation.reserved_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{selectedReservation.duration_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Guests:</span>
                    <span className="text-white">{selectedReservation.guest_count} people</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(selectedReservation.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedReservation.notes && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                <p className="text-gray-300 bg-white/5 p-3 rounded-lg">{selectedReservation.notes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => handleEdit(selectedReservation)}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Reservation
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedReservation(null);
                }}
                className="border-white/20 hover:bg-white/10"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
