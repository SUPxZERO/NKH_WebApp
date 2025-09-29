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
  Building, 
  MapPin,
  ToggleLeft,
  ToggleRight,
  ArrowUp,
  ArrowDown,
  Grid3X3
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Floor, Location } from '@/app/types/domain';

export default function Floors() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [locationFilter, setLocationFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [selectedFloor, setSelectedFloor] = React.useState<Floor | null>(null);
  const [editingFloor, setEditingFloor] = React.useState<Floor | null>(null);
  const [error, setError] = React.useState('');

  const qc = useQueryClient();

  // Pagination state
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(12);

  // Form state
  const [formData, setFormData] = React.useState({
    location_id: '',
    name: '',
    display_order: '0',
    is_active: true
  });

  // Fetch floors
  const { data: floors, isLoading } = useQuery({
    queryKey: ['admin/floors', page, search, statusFilter, locationFilter],
    queryFn: () => {
      let url = `/api/admin/floors?page=${page}&per_page=${perPage}&search=${search}`;
      
      if (statusFilter !== 'all') {
        url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
      }
      
      if (locationFilter !== 'all') {
        url += `&location_id=${locationFilter}`;
      }
      
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  // Fetch locations
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/locations')
  }) as { data: any };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/floors', data),
    onSuccess: () => {
      toastSuccess('Floor created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/floors'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create floor');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/floors/${id}`, data),
    onSuccess: () => {
      toastSuccess('Floor updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/floors'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update floor');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/floors/${id}`),
    onSuccess: () => {
      toastSuccess('Floor deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/floors'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete floor');
    }
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) => 
      apiPut(`/api/admin/floors/${id}`, { is_active }),
    onSuccess: () => {
      toastSuccess('Floor status updated successfully!');
      qc.invalidateQueries({ queryKey: ['admin/floors'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to update floor status');
    }
  });

  const resetForm = () => {
    setFormData({
      location_id: '',
      name: '',
      display_order: '0',
      is_active: true
    });
    setEditingFloor(null);
    setError('');
  };

  const handleCreate = () => {
    resetForm();
    setOpenCreate(true);
  };

  const handleEdit = (floor: Floor) => {
    setFormData({
      location_id: floor.location_id.toString(),
      name: floor.name,
      display_order: floor.display_order.toString(),
      is_active: floor.is_active
    });
    setEditingFloor(floor);
    setOpenEdit(true);
  };

  const handleView = (floor: Floor) => {
    setSelectedFloor(floor);
    setOpenView(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this floor? This will also delete all tables on this floor.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (floor: Floor) => {
    toggleStatusMutation.mutate({ id: floor.id, is_active: !floor.is_active });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data = {
      ...formData,
      location_id: parseInt(formData.location_id),
      display_order: parseInt(formData.display_order)
    };

    if (editingFloor) {
      updateMutation.mutate({ id: editingFloor.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const totalFloors = floors?.data?.length || 0;
  const activeFloors = floors?.data?.filter((floor: Floor) => floor.is_active).length || 0;
  const inactiveFloors = floors?.data?.filter((floor: Floor) => !floor.is_active).length || 0;

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
                Floors Management
              </h1>
              <p className="text-gray-400 mt-1">Manage restaurant floors and layout</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Floors</div>
                <div className="text-xl font-bold text-white">{totalFloors}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Active</div>
                <div className="text-xl font-bold text-green-400">{activeFloors}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Inactive</div>
                <div className="text-xl font-bold text-red-400">{inactiveFloors}</div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Floor
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
              placeholder="Search floors..."
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
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Locations</option>
            {locations?.data?.map((location: Location) => (
              <option key={location.id} value={location.id} className="bg-gray-800">
                {location.name}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setLocationFilter('all');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>

        {/* Floors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
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
            floors?.data?.map((floor: Floor, index: number) => (
              <motion.div
                key={floor.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                  <CardContent className="p-6">
                    {/* Floor Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {floor.name}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {floor.location?.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={floor.is_active 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                        }>
                          {floor.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Floor Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center text-sm text-gray-300">
                        <Building className="w-4 h-4 mr-2 text-gray-400" />
                        Order: {floor.display_order}
                      </div>

                      <div className="flex items-center text-sm text-gray-300">
                        <Grid3X3 className="w-4 h-4 mr-2 text-gray-400" />
                        Tables: {floor.tables?.length || 0}
                      </div>

                      <div className="flex items-center text-sm text-gray-300">
                        <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                        {floor.location?.name}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-400">Status:</span>
                      <button
                        onClick={() => handleToggleStatus(floor)}
                        className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                      >
                        {floor.is_active ? (
                          <ToggleRight className="w-5 h-5 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={floor.is_active ? 'text-green-400' : 'text-gray-400'}>
                          {floor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleView(floor)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(floor)}
                        className="flex-1 border-white/20 hover:bg-white/10"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDelete(floor.id)}
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
        {floors?.meta && (
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
              Page {page} of {floors?.meta?.last_page || 1}
            </span>
            <Button
              variant="secondary"
              disabled={page === floors?.meta?.last_page}
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
        title={editingFloor ? 'Edit Floor' : 'Create Floor'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
              <select
                required
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Floor Name *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Ground Floor, 1st Floor, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Display Order</label>
              <Input
                type="number"
                min="0"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Display order (0 = first)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className="flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
                >
                  {formData.is_active ? (
                    <ToggleRight className="w-6 h-6 text-green-400" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <span className={formData.is_active ? 'text-green-400' : 'text-gray-400'}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </button>
              </div>
            </div>
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
              {editingFloor ? 'Update' : 'Create'} Floor
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Floor Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedFloor(null);
        }}
        title="Floor Details"
        size="lg"
      >
        {selectedFloor && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Floor Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white font-semibold">{selectedFloor.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Location:</span>
                    <span className="text-white">{selectedFloor.location?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Display Order:</span>
                    <span className="text-white">{selectedFloor.display_order}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={selectedFloor.is_active 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }>
                      {selectedFloor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Additional Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tables:</span>
                    <span className="text-white">{selectedFloor.tables?.length || 0} tables</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(selectedFloor.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Updated:</span>
                    <span className="text-white">{new Date(selectedFloor.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedFloor.tables && selectedFloor.tables.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Tables on this Floor</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedFloor.tables.map((table: any) => (
                    <div key={table.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                      <div className="text-sm font-medium text-white">Table {table.code}</div>
                      <div className="text-xs text-gray-400">Capacity: {table.capacity}</div>
                      <div className="text-xs text-gray-400">Status: {table.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => handleEdit(selectedFloor)}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Floor
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedFloor(null);
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
