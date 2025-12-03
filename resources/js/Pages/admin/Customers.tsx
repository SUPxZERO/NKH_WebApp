import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Eye, Edit, Trash2, Users, ChevronLeft, ChevronRight, Mail, Phone, MapPin, Star, Gift } from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import Modal from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Customer, Location } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';

// Stats Ribbon
const CustomerStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total</p>
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
        <Users className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">VIP</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.vip}</p>
        </div>
        <Star className="w-8 h-8 text-yellow-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Points</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.totalPoints}</p>
        </div>
        <Gift className="w-8 h-8 text-amber-400" />
      </div>
    </div>
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
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Customers</h1>
            <p className="text-slate-400 mt-1">Manage customer database</p>
          </div>
          <Button onClick={() => { resetForm(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Customer
          </Button>
        </div>

        <CustomerStatsRibbon stats={stats} />

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <div className="flex gap-2">
              {['all', 'active', 'inactive'].map((status) => (
                <button key={status} onClick={() => setStatusFilter(status)}
                  className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    statusFilter === status ? "bg-purple-600 text-white" : "bg-slate-800 text-gray-400 hover:bg-slate-700")}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedCustomers.size > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-purple-600 border border-purple-500 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-white font-medium">{selectedCustomers.size} selected</span>
            <Button size="sm" variant="secondary" onClick={() => setSelectedCustomers(new Set())}
              className="border-white/20 hover:bg-white/10">Clear</Button>
          </motion.div>
        )}

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-1"><input type="checkbox" checked={selectedCustomers.size === customerList.length && customerList.length > 0}
              onChange={toggleSelectAll} className="w-4 h-4 rounded border-white/20 bg-slate-900" /></div>
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-2">Location</div>
            <div className="col-span-2">Points</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-12 text-center text-gray-400">Loading customers...</div>
            ) : customerList.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-white font-medium">No customers found</h3>
              </div>
            ) : (
              customerList.map((customer) => (
                <motion.div key={customer.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                  <div className="col-span-1">
                    <input type="checkbox" checked={selectedCustomers.has(customer.id)} onChange={() => toggleSelectCustomer(customer.id)}
                      className="w-4 h-4 rounded border-white/20 bg-slate-900" />
                  </div>
                  <div className="col-span-3">
                    <div className="font-medium text-white">{customer.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        customer.user?.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        {customer.user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-300 truncate flex items-center gap-2">
                      <Mail className="w-3 h-3" /> {customer.user?.email || 'N/A'}
                    </div>
                    {customer.user?.phone && (
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3" /> {customer.user.phone}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-gray-300 flex items-center gap-2">
                    <MapPin className="w-3 h-3" /> {customer.preferred_location?.name || 'None'}
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span className="font-semibold text-amber-400">{customer.points_balance || 0}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(customer)}
                      className="h-8 w-8 p-0 border-white/10"><Edit className="w-3 h-3" /></Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(customer.id)}
                      className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {customers?.meta && (
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-white/5">
              <div className="text-sm text-gray-400">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, customers.meta.total)} of {customers.meta.total}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="border-white/10"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="secondary" size="sm" disabled={page === customers.meta.last_page} onClick={() => setPage(p => p + 1)}
                  className="border-white/10"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingCustomer ? 'Edit Customer' : 'New Customer'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required className="bg-white/5 border-white/10 text-white" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
              <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required className="bg-white/5 border-white/10 text-white" />
            <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={editingCustomer ? "Password (optional)" : "Password"} type="password" value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingCustomer}
              className="bg-white/5 border-white/10 text-white" />
            <Input label="Birth Date" type="date" value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="bg-white/5 border-white/10 text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Points" type="number" value={formData.points_balance}
              onChange={(e) => setFormData({ ...formData, points_balance: parseInt(e.target.value) || 0 })}
              className="bg-white/5 border-white/10 text-white" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Location</label>
              <select value={formData.preferred_location_id} onChange={(e) => setFormData({ ...formData, preferred_location_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                <option value="">Select</option>
                {locations?.data?.map((loc: Location) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" />
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-white/20 bg-white/5" />
            <label htmlFor="is_active" className="text-sm text-gray-300">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 border-white/10">Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-purple-600 hover:bg-purple-700">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCustomer ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}