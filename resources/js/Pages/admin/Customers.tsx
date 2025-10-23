import React from 'react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/libs/apiClient';
import { Customer, Location, ApiResponse, PaginatedResponse } from '@/app/types/domain';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Input } from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { Skeleton } from '@/app/components/ui/Loading';
import Modal from '@/app/components/ui/Modal';
import { toastLoading, toastSuccess, toastError } from '@/app/utils/toast';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, Calendar, MapPin, Star, Gift } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Customers() {
  const [search, setSearch] = React.useState('');
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
  const [perPage, setPerPage] = React.useState(15);

  // Fetch customers
  const { data: customers, isLoading } = useQuery<PaginatedResponse<Customer>>({
    queryKey: ['admin/customers', page, search],
    queryFn: () => apiGet(`/admin/customers?page=${page}&per_page=${perPage}&search=${search}`)
  });

  // Fetch locations for dropdown
  const { data: locations } = useQuery<ApiResponse<Location[]>>({
    queryKey: ['locations'],
    queryFn: () => apiGet('/locations')
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/admin/customers', data),
    onSuccess: () => {
      toastSuccess('Customer created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/customers'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to create customer');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiPut(`/admin/customers/${id}`, data),
    onSuccess: () => {
      toastSuccess('Customer updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/customers'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update customer');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/admin/customers/${id}`),
    onSuccess: () => {
      toastSuccess('Customer deactivated successfully!');
      qc.invalidateQueries({ queryKey: ['admin/customers'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to deactivate customer');
    }
  });

  const resetForm = () => {
    setFormData({
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
    if (confirm('Are you sure you want to deactivate this customer?')) {
      deleteMutation.mutate(id);
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Customers
            </h1>
            <p className="text-gray-400 mt-1">Manage your restaurant customers</p>
          </div>
          <Button
            onClick={() => setOpenCreate(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        {/* Search */}
        <Card className="bg-white/5 backdrop-blur-md border-white/10">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search customers by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : (
            customers?.data?.map((customer: Customer) => (
              <motion.div
                key={customer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                        {getGenderIcon(customer.gender || '')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-lg">
                          {customer.user.name}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Customer ID: {customer.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Gift className="w-4 h-4" />
                        <span className="text-sm font-medium">{customer.points_balance}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Mail className="w-4 h-4" />
                        {customer.user.email}
                      </div>
                      {customer.user.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Phone className="w-4 h-4" />
                          {customer.user.phone}
                        </div>
                      )}
                      {customer.birth_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Calendar className="w-4 h-4" />
                          Born: {new Date(customer.birth_date).toLocaleDateString()}
                        </div>
                      )}
                      {customer.preferred_location && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <MapPin className="w-4 h-4" />
                          {customer.preferred_location.name}
                        </div>
                      )}
                      {customer.addresses && customer.addresses.length > 0 && (
                        <div className="text-sm text-gray-400">
                          {customer.addresses.length} address{customer.addresses.length !== 1 ? 'es' : ''}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-2 py-1 rounded-full text-xs border ${
                        customer.user.is_active 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {customer.user.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-400">
                        Joined: {new Date(customer.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(customer)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(customer.id)}
                        className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {customers?.meta && (
          <div className="flex justify-center gap-2">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-white/20 hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-white">
              Page {page} of {customers?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === customers?.meta?.last_page}
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
        title={editingCustomer ? 'Edit Customer' : 'Create Customer'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
            <Input
              label={editingCustomer ? "New Password (optional)" : "Password"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingCustomer}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Birth Date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Gender</option>
                <option value="male" className="bg-gray-800">Male</option>
                <option value="female" className="bg-gray-800">Female</option>
                <option value="other" className="bg-gray-800">Other</option>
              </select>
            </div>
            <Input
              label="Loyalty Points"
              type="number"
              value={formData.points_balance}
              onChange={(e) => setFormData({ ...formData, points_balance: parseInt(e.target.value) || 0 })}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Preferred Location</label>
            <select
              value={formData.preferred_location_id}
              onChange={(e) => setFormData({ ...formData, preferred_location_id: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
            >
              <option value="">Select Location</option>
              {locations?.data?.map((location: Location) => (
                <option key={location.id} value={location.id} className="bg-gray-800">
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-gray-400"
              placeholder="Enter customer notes..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-white/20 bg-white/5"
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">Active Customer</label>
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
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingCustomer ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
