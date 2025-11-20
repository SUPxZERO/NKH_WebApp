import React from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { Customer, Location, ApiResponse, PaginatedResponse } from '@/app/types/domain';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import Modal from '@/app/components/ui/Modal';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { 
  Plus, Search, Edit, Trash2, User, Phone, Mail, 
  Calendar, MapPin, Star, Gift, Filter, Users 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Customers() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [editingCustomer, setEditingCustomer] = React.useState<Customer | null>(null);
  
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    birth_date: '',
    gender: '',
    preferred_location_id: '',
    points_balance: 0,
    notes: '',
    is_active: true
  });

  const [error, setError] = React.useState<string | null>(null);
  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);

  // Fetch customers with filters
  // Using 'any' temporarily for data to handle variable API structures safely
  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin/customers', page, search, statusFilter],
    queryFn: () => apiGet(`/admin/customers?page=${page}&per_page=${perPage}&search=${search}&status=${statusFilter}`)
  }) as { data: any, isLoading: boolean };

  // Fetch locations
  const { data: locations } = useQuery<ApiResponse<Location[]>>({
    queryKey: ['locations'],
    queryFn: () => apiGet('/locations')
  });

  // --- SAFE DATA EXTRACTION ---
  // This fixes the issue where data might not show if the API structure is different
  const customerList: Customer[] = React.useMemo(() => {
    if (!customers) return [];
    // If the API returns the array directly
    if (Array.isArray(customers)) return customers;
    // If the API returns { data: [...] } (Paginated)
    if (customers.data && Array.isArray(customers.data)) return customers.data;
    // Fallback
    return [];
  }, [customers]);

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/admin/customers', data),
    onSuccess: () => {
      toastSuccess('Customer created successfully!');
      closeModal();
      qc.invalidateQueries({ queryKey: ['admin/customers'] });
    },
    onError: (error: any) => setError(error.response?.data?.message || 'Failed to create customer')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/admin/customers/${id}`, data),
    onSuccess: () => {
      toastSuccess('Customer updated successfully!');
      closeModal();
      qc.invalidateQueries({ queryKey: ['admin/customers'] });
    },
    onError: (error: any) => setError(error.response?.data?.message || 'Failed to update customer')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/customers/${id}`),
    onSuccess: () => {
      toastSuccess('Customer deactivated successfully!');
      qc.invalidateQueries({ queryKey: ['admin/customers'] });
    },
    onError: (error: any) => toastError(error.response?.data?.message || 'Failed to deactivate customer')
  });

  // --- Helpers ---
  const closeModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', password: '', birth_date: '',
      gender: '', preferred_location_id: '', points_balance: 0, notes: '', is_active: true
    });
    setError(null);
    setEditingCustomer(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const data = {
      ...formData,
      preferred_location_id: formData.preferred_location_id ? parseInt(formData.preferred_location_id) : null,
      points_balance: parseInt(formData.points_balance.toString()) || 0
    };

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.user.name,
      email: customer.user.email,
      phone: customer.user.phone || '',
      password: '',
      birth_date: customer.birth_date || '',
      gender: customer.gender || '',
      preferred_location_id: customer.preferred_location_id?.toString() || '',
      points_balance: customer.points_balance,
      notes: customer.notes || '',
      is_active: customer.user.is_active
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to deactivate this customer?')) deleteMutation.mutate(id);
  };

  const renderGenderIcon = (gender?: string | null) => {
    const g = gender?.toLowerCase();
    if (g === 'male') return <div className="bg-blue-500/20 p-2 rounded-full"><User className="w-5 h-5 text-blue-400" /></div>;
    if (g === 'female') return <div className="bg-pink-500/20 p-2 rounded-full"><User className="w-5 h-5 text-pink-400" /></div>;
    return <div className="bg-gray-500/20 p-2 rounded-full"><User className="w-5 h-5 text-gray-400" /></div>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6 min-h-screen pb-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-gray-400 mt-1 flex items-center gap-2">
              <Users className="w-4 h-4" /> 
              Total: <span className="text-white font-semibold">{customers?.meta?.total || customerList.length || 0}</span> customers
            </p>
          </div>
          <Button
            onClick={() => setOpenCreate(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-900/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Customer
          </Button>
        </div>

        {/* Filters & Search */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50"
              />
            </div>
            <div className="flex gap-2">
              <div className="relative min-w-[160px]">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50 appearance-none"
                >
                  <option className="bg-slate-900" value="all">All Status</option>
                  <option className="bg-slate-900" value="active">Active</option>
                  <option className="bg-slate-900" value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/5 border-white/10 h-[280px]">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : customerList.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">No Customers Found</h3>
              <p className="text-gray-400 mt-2">Try adjusting your search or filters</p>
            </div>
          ) : (
            customerList.map((customer: Customer) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="group bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/[0.07] hover:border-purple-500/30 transition-all duration-300 h-full flex flex-col">
                  <CardContent className="p-6 flex flex-col flex-1">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        {renderGenderIcon(customer.gender)}
                        <div>
                          <h3 className="font-bold text-white text-lg leading-tight">
                            {customer.user?.name || 'Unknown User'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                             <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                                customer.user?.is_active 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }`}>
                                {customer.user?.is_active ? 'Active' : 'Inactive'}
                              </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20">
                          <Gift className="w-3.5 h-3.5" />
                          <span className="text-sm font-bold">{customer.points_balance || 0}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-1">Points</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white transition-colors">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{customer.user?.email || 'No Email'}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white transition-colors">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{customer.user?.phone || 'N/A'}</span>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white transition-colors">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{customer.preferred_location?.name || 'No location preference'}</span>
                      </div>

                      {customer.birth_date && (
                        <div className="flex items-center gap-3 text-sm text-gray-300 group-hover:text-white transition-colors">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>Born: {new Date(customer.birth_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Footer / Actions */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-white/5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(customer)}
                        className="flex-1 h-9 bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white"
                      >
                        <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(customer.id)}
                        className="h-9 w-9 p-0 bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400"
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
        {customers?.meta && customers.meta.last_page > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-400">
              Page <span className="text-white font-medium">{page}</span> of {customers.meta.last_page}
            </span>
            <Button
              variant="secondary"
              disabled={page === customers.meta.last_page}
              onClick={() => setPage(p => p + 1)}
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
        onClose={closeModal}
        title={editingCustomer ? 'Edit Customer Details' : 'Register New Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm flex items-center gap-2">
              <span className="block w-1.5 h-1.5 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Section 1: Personal Info */}
            <div>
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-slate-950 border-white/10"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-300">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="h-10 w-full bg-slate-950 border border-white/10 rounded-lg px-3 text-white text-sm focus:border-purple-500 outline-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <Input
                  label="Birth Date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="bg-slate-950 border-white/10"
                />
              </div>
            </div>

            {/* Section 2: Account & Contact */}
            <div className="pt-2 border-t border-white/5">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 mt-2">Contact & Account</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-slate-950 border-white/10"
                />
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-950 border-white/10"
                />
                <Input
                  label={editingCustomer ? "Reset Password (Optional)" : "Password"}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingCustomer}
                  className="bg-slate-950 border-white/10"
                />
              </div>
            </div>

            {/* Section 3: Loyalty & Preferences */}
            <div className="pt-2 border-t border-white/5">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3 mt-2">Loyalty & Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Loyalty Points"
                  type="number"
                  value={formData.points_balance}
                  onChange={(e) => setFormData({ ...formData, points_balance: parseInt(e.target.value) || 0 })}
                  className="bg-slate-950 border-white/10"
                />
                 <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-gray-300">Preferred Location</label>
                  <select
                    value={formData.preferred_location_id}
                    onChange={(e) => setFormData({ ...formData, preferred_location_id: e.target.value })}
                    className="h-10 w-full bg-slate-950 border border-white/10 rounded-lg px-3 text-white text-sm focus:border-purple-500 outline-none"
                  >
                    <option value="">Select Location</option>
                    {locations?.data?.map((location: Location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Notes */}
            <div>
               <label className="text-xs font-medium text-gray-300 mb-1.5 block">Internal Notes</label>
               <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-600 text-sm focus:border-purple-500 outline-none resize-none"
                placeholder="Add notes about dietary restrictions, VIP status, etc..."
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-500 bg-transparent text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300 cursor-pointer select-none">
                Customer account is active
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="flex-1 border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCustomer ? 'Save Changes' : 'Create Customer')}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}