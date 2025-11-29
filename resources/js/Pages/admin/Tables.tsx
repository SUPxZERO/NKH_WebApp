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
  Users, 
  MapPin,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { DiningTable, Floor, Location } from '@/app/types/domain';

export default function Tables() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [floorFilter, setFloorFilter] = React.useState('all');
  const [openCreate, setOpenCreate] = React.useState(false);
  const [openEdit, setOpenEdit] = React.useState(false);
  const [openView, setOpenView] = React.useState(false);
  const [selectedTable, setSelectedTable] = React.useState<DiningTable | null>(null);
  const [editingTable, setEditingTable] = React.useState<DiningTable | null>(null);
  const [error, setError] = React.useState('');

  const qc = useQueryClient();

  // Pagination removed for grouped endpoint

  // Form state
  const [formData, setFormData] = React.useState({
    floor_id: '',
    code: '',
    capacity: '2',
    status: 'available' as 'available' | 'reserved' | 'occupied' | 'unavailable'
  });

  // Fetch grouped tables by floor
  const { data: grouped, isLoading } = useQuery({
    queryKey: ['admin/tables/grouped', search, statusFilter, floorFilter],
    queryFn: () => {
      let url = `/api/admin/tables/grouped?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (floorFilter !== 'all') url += `&floor_id=${floorFilter}`;
      return apiGet(url);
    }
  }) as { data: any, isLoading: boolean };

  // Fetch floors
  const { data: floors } = useQuery({
    queryKey: ['floors'],
    queryFn: () => apiGet('/api/admin/floors')
  }) as { data: any };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/tables', data),
    onSuccess: () => {
      toastSuccess('Table created successfully!');
      setOpenCreate(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/tables'] });
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create table');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/tables/${id}`, data),
    onSuccess: () => {
      toastSuccess('Table updated successfully!');
      setOpenEdit(false);
      resetForm();
      qc.invalidateQueries({ queryKey: ['admin/tables'] });
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to update table');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/tables/${id}`),
    onSuccess: () => {
      toastSuccess('Table deleted successfully!');
      qc.invalidateQueries({ queryKey: ['admin/tables'] });
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (error: any) => {
      toastError(error.response?.data?.message || 'Failed to delete table');
    }
  });

  const resetForm = () => {
    setFormData({
      floor_id: '',
      code: '',
      capacity: '2',
      status: 'available'
    });
    setEditingTable(null);
    setError('');
  };

  const handleCreate = () => {
    resetForm();
    setOpenCreate(true);
  };

  const handleEdit = (table: DiningTable) => {
    setFormData({
      floor_id: table.floor_id.toString(),
      code: table.code,
      capacity: table.capacity.toString(),
      status: table.status
    });
    setEditingTable(table);
    setOpenEdit(true);
  };

  const handleView = (table: DiningTable) => {
    setSelectedTable(table);
    setOpenView(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this table?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const data = {
      ...formData,
      capacity: parseInt(formData.capacity),
      floor_id: parseInt(formData.floor_id)
    };

    if (editingTable) {
      updateMutation.mutate({ id: editingTable.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'reserved': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'occupied': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'unavailable': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'reserved': return <Clock className="w-4 h-4" />;
      case 'occupied': return <Users className="w-4 h-4" />;
      case 'unavailable': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const totalTables = grouped?.totals?.total || 0;
  const availableTables = grouped?.totals?.available || 0;
  const occupiedTables = grouped?.totals?.occupied || 0;
  const reservedTables = grouped?.totals?.reserved || 0;

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
                Tables Management
              </h1>
              <p className="text-gray-400 mt-1">Manage restaurant tables and seating</p>
            </div>

            {/* Summary Cards */}
            <div className="flex gap-4">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Total Tables</div>
                <div className="text-xl font-bold text-white">{totalTables}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Available</div>
                <div className="text-xl font-bold text-green-400">{availableTables}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Occupied</div>
                <div className="text-xl font-bold text-red-400">{occupiedTables}</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                <div className="text-sm text-gray-400">Reserved</div>
                <div className="text-xl font-bold text-yellow-400">{reservedTables}</div>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Table
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
              placeholder="Search tables..."
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
            <option value="available" className='text-black'>Available</option>
            <option value="reserved" className='text-black'>Reserved</option>
            <option value="occupied" className='text-black'>Occupied</option>
            <option value="unavailable" className='text-black'>Unavailable</option>
          </select>

          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="all">All Floors</option>
            {floors?.data?.map((floor: Floor) => (
              <option key={floor.id} value={floor.id} className="bg-gray-800">
                {floor.name}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('');
              setStatusFilter('all');
              setFloorFilter('all');
            }}
            className="border-white/20 hover:bg-white/10"
          >
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </motion.div>

        {/* Tables by Floor */}
        <div className="space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
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
              ))}
            </div>
          ) : (
            (grouped?.floors?.length ? grouped.floors : []).map((section: any, sIdx: number) => (
              <div key={section.floor.id}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">{section.floor.name}</h2>
                  <span className="text-sm text-gray-400">{section.tables.length} tables</span>
                </div>
                {section.tables.length === 0 ? (
                  <div className="text-gray-400 bg-white/5 border border-white/10 rounded-xl p-6">No tables on this floor.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {section.tables.map((table: DiningTable, index: number) => (
                      <motion.div
                        key={table.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300 group">
                          <CardContent className="p-6">
                            {/* Table Header */}
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="font-semibold text-white text-lg">Table {table.code}</h3>
                                <p className="text-sm text-gray-400">{section.floor.name}</p>
                              </div>
                              <Badge className={getStatusColor(table.status)}>
                                <div className="flex items-center gap-1">
                                  {getStatusIcon(table.status)}
                                  {table.status}
                                </div>
                              </Badge>
                            </div>

                            {/* Table Details */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center text-sm text-gray-300">
                                <Users className="w-4 h-4 mr-2 text-gray-400" />
                                Capacity: {table.capacity} people
                              </div>

                              <div className="flex items-center text-sm text-gray-300">
                                <Building className="w-4 h-4 mr-2 text-gray-400" />
                                Floor: {section.floor.name}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleView({ ...table, floor: { name: section.floor.name } } as any)}
                                className="flex-1 border-white/20 hover:bg-white/10"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEdit(table)}
                                className="flex-1 border-white/20 hover:bg-white/10"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDelete(table.id)}
                                className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                              >
                                <Trash2 className="w-3 h-3 text-white" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination removed for grouped view */}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={openCreate || openEdit}
        onClose={() => {
          setOpenCreate(false);
          setOpenEdit(false);
          resetForm();
        }}
        title={editingTable ? 'Edit Table' : 'Create Table'}
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
              <label className="block text-sm font-medium text-gray-300 mb-2">Floor *</label>
              <select
                required
                value={formData.floor_id}
                onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="" className="bg-gray-800">Select Floor</option>
                {floors?.data?.map((floor: Floor) => (
                  <option key={floor.id} value={floor.id} className="bg-gray-800">
                    {floor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Table Code *</label>
              <Input
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., T01, A1, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Capacity *</label>
              <Input
                type="number"
                min="1"
                max="20"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Number of seats"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="available" className="bg-gray-800">Available</option>
                <option value="reserved" className="bg-gray-800">Reserved</option>
                <option value="occupied" className="bg-gray-800">Occupied</option>
                <option value="unavailable" className="bg-gray-800">Unavailable</option>
              </select>
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
              {editingTable ? 'Update' : 'Create'} Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Table Modal */}
      <Modal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setSelectedTable(null);
        }}
        title="Table Details"
        size="md"
      >
        {selectedTable && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Table Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Table Code:</span>
                    <span className="text-white font-semibold">{selectedTable.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Floor:</span>
                    <span className="text-white">{selectedTable.floor?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Capacity:</span>
                    <span className="text-white">{selectedTable.capacity} people</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <Badge className={getStatusColor(selectedTable.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(selectedTable.status)}
                        {selectedTable.status}
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Additional Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Created:</span>
                    <span className="text-white">{new Date(selectedTable.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Updated:</span>
                    <span className="text-white">{new Date(selectedTable.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => handleEdit(selectedTable)}
                className="flex-1 border-white/20 hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Table
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setOpenView(false);
                  setSelectedTable(null);
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
