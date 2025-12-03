import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Filter, Plus, Eye, Edit, Trash2,
  Users, MapPin, CheckCircle, XCircle, Clock, AlertTriangle,
  LayoutGrid, List
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { DiningTable, Floor } from '@/app/types/domain';
import { cn } from '@/app/utils/cn';

// Stats Ribbon Component
const TableStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Tables</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <LayoutGrid className="w-8 h-8 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Available</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.available}</p>
        </div>
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Occupied</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.occupied}</p>
        </div>
        <Users className="w-8 h-8 text-red-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Reserved</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.reserved}</p>
        </div>
        <Clock className="w-8 h-8 text-amber-400" />
      </div>
    </div>
  </div>
);

export default function Tables() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);

  const qc = useQueryClient();
  const [formData, setFormData] = useState({
    floor_id: '',
    code: '',
    capacity: '2',
    status: 'available' as 'available' | 'reserved' | 'occupied' | 'unavailable'
  });

  // Fetch Data
  const { data: grouped } = useQuery({
    queryKey: ['admin/tables/grouped', search, statusFilter, floorFilter],
    queryFn: () => {
      let url = `/api/admin/tables/grouped?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (floorFilter !== 'all') url += `&floor_id=${floorFilter}`;
      return apiGet(url);
    }
  });

  const { data: floors } = useQuery({
    queryKey: ['floors'],
    queryFn: () => apiGet('/api/admin/floors')
  });

  // Flatten tables for list view
  const allTables = useMemo(() => {
    if (!grouped?.floors) return [];
    return grouped.floors.flatMap((f: any) =>
      f.tables.map((t: any) => ({ ...t, floor_name: f.floor.name }))
    );
  }, [grouped]);

  const stats = useMemo(() => ({
    total: grouped?.totals?.total || 0,
    available: grouped?.totals?.available || 0,
    occupied: grouped?.totals?.occupied || 0,
    reserved: grouped?.totals?.reserved || 0
  }), [grouped]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/tables', data),
    onSuccess: () => {
      toastSuccess('Table created');
      closeModal();
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to create')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/tables/${id}`, data),
    onSuccess: () => {
      toastSuccess('Table updated');
      closeModal();
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to update')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/tables/${id}`),
    onSuccess: () => {
      toastSuccess('Table deleted');
      qc.invalidateQueries({ queryKey: ['admin/tables/grouped'] });
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed to delete')
  });

  // Handlers
  const closeModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditingTable(null);
    setFormData({ floor_id: '', code: '', capacity: '2', status: 'available' });
  };

  const handleEdit = (table: DiningTable) => {
    setEditingTable(table);
    setFormData({
      floor_id: table.floor_id.toString(),
      code: table.code,
      capacity: table.capacity.toString(),
      status: table.status
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this table?')) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      capacity: parseInt(formData.capacity),
      floor_id: parseInt(formData.floor_id)
    };
    if (editingTable) updateMutation.mutate({ id: editingTable.id, data });
    else createMutation.mutate(data);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'reserved': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'occupied': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Tables</h1>
            <p className="text-slate-400 mt-1">Manage restaurant floor plan</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-slate-800 p-1 rounded-lg border border-white/10 flex">
              <button
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-white/10 text-white" : "text-gray-400 hover:text-white")}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" /> Add Table
            </Button>
          </div>
        </div>

        <TableStatsRibbon stats={stats} />

        {/* Filters */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tables..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="occupied">Occupied</option>
            </select>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none"
            >
              <option value="all">All Floors</option>
              {floors?.data?.map((f: Floor) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
              <div className="col-span-2">Code</div>
              <div className="col-span-3">Floor</div>
              <div className="col-span-2">Capacity</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            <div className="divide-y divide-white/5">
              {allTables.map((table: any) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group"
                >
                  <div className="col-span-2 font-medium text-white">{table.code}</div>
                  <div className="col-span-3 text-gray-300 flex items-center gap-2">
                    <MapPin size={14} className="text-gray-500" />
                    {table.floor_name}
                  </div>
                  <div className="col-span-2 text-gray-300 flex items-center gap-2">
                    <Users size={14} className="text-gray-500" />
                    {table.capacity}
                  </div>
                  <div className="col-span-3">
                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", getStatusColor(table.status))}>
                      {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(table)} className="h-8 w-8 p-0 border-white/10">
                      <Edit size={14} />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(table.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))}
              {allTables.length === 0 && (
                <div className="p-8 text-center text-gray-500">No tables found</div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {allTables.map((table: any) => (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all group relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-white text-lg">{table.code}</span>
                  <span className={cn("w-2 h-2 rounded-full",
                    table.status === 'available' ? "bg-emerald-500" :
                      table.status === 'occupied' ? "bg-red-500" : "bg-amber-500"
                  )} />
                </div>
                <div className="text-xs text-gray-400 mb-1">{table.floor_name}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Users size={12} /> {table.capacity} seats
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button onClick={() => handleEdit(table)} className="p-1 bg-slate-800 rounded text-gray-300 hover:text-white"><Edit size={12} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingTable ? 'Edit Table' : 'New Table'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Floor</label>
              <select
                value={formData.floor_id}
                onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                required
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Floor</option>
                {floors?.data?.map((f: Floor) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <Input label="Table Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required className="bg-slate-950 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required className="bg-slate-950 border-white/10" />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Save</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
