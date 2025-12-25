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

// Stats Ribbon Component - Mobile optimized
const TableStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
    <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">Tables</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mt-0.5 sm:mt-1">{stats.total}</p>
        </div>
        <LayoutGrid className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">Available</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-1">{stats.available}</p>
        </div>
        <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">Occupied</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5 sm:mt-1">{stats.occupied}</p>
        </div>
        <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
      </div>
    </div>
    <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium truncate">Reserved</p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">{stats.reserved}</p>
        </div>
        <Clock className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-amber-600 dark:text-amber-400 flex-shrink-0" />
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
      case 'available': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'reserved': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'occupied': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 relative overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 dark:from-purple-400 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent truncate">
                Tables
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">Manage restaurant floor plan</p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <div className="bg-secondary p-0.5 sm:p-1 rounded-lg border border-border flex">
                <button
                  onClick={() => setViewMode('list')}
                  className={cn("p-1.5 sm:p-2 rounded-md transition-all", viewMode === 'list' ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <List size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn("p-1.5 sm:p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  <LayoutGrid size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
              <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Table</span>
              </Button>
            </div>
          </div>

          <TableStatsRibbon stats={stats} />

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 text-sm bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex gap-2 sm:gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                </select>
                <select
                  value={floorFilter}
                  onChange={(e) => setFloorFilter(e.target.value)}
                  className="flex-1 sm:flex-none bg-secondary border border-border rounded-lg px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none"
                >
                  <option value="all">All Floors</option>
                  {floors?.data?.map((f: Floor) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'list' ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary text-xs font-semibold text-muted-foreground uppercase">
                  <div className="col-span-2">Code</div>
                  <div className="col-span-3">Floor</div>
                  <div className="col-span-2">Capacity</div>
                  <div className="col-span-3">Status</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                <div className="divide-y divide-border">
                  {allTables.map((table: any) => (
                    <motion.div
                      key={table.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="col-span-2 font-medium text-foreground">{table.code}</div>
                      <div className="col-span-3 text-muted-foreground flex items-center gap-2">
                        <MapPin size={14} className="text-muted-foreground" />
                        {table.floor_name}
                      </div>
                      <div className="col-span-2 text-muted-foreground flex items-center gap-2">
                        <Users size={14} className="text-muted-foreground" />
                        {table.capacity}
                      </div>
                      <div className="col-span-3">
                        <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", getStatusColor(table.status))}>
                          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" onClick={() => handleEdit(table)} className="h-8 w-8 p-0 border-border">
                          <Edit size={14} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(table.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-600 dark:text-red-400">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  {allTables.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">No tables found</div>
                  )}
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {allTables.length === 0 ? (
                  <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                      <LayoutGrid className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-foreground font-semibold text-sm">No tables found</h3>
                    <p className="text-muted-foreground text-xs mt-1">Create your first table</p>
                  </div>
                ) : (
                  allTables.map((table: any) => (
                    <motion.div
                      key={table.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border border-border rounded-xl p-3 backdrop-blur-sm"
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                            <LayoutGrid className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-foreground truncate">{table.code}</h3>
                            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <MapPin size={10} /> {table.floor_name}
                            </p>
                          </div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0", getStatusColor(table.status))}>
                          {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                        </span>
                      </div>

                      {/* Info Row */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users size={12} className="text-blue-500" />
                          <span className="font-semibold text-foreground">{table.capacity}</span> seats
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(table)} className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-500">
                            <Edit size={14} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(table.id)} className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {allTables.map((table: any) => (
                <motion.div
                  key={table.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-xl p-3 sm:p-4 hover:bg-secondary/50 transition-all group relative"
                >
                  <div className="flex justify-between items-start mb-1 sm:mb-2">
                    <span className="font-bold text-foreground text-base sm:text-lg">{table.code}</span>
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
                      table.status === 'available' ? "bg-emerald-500" :
                        table.status === 'occupied' ? "bg-red-500" : "bg-amber-500"
                    )} />
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{table.floor_name}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={10} className="sm:w-3 sm:h-3" /> {table.capacity} seats
                  </div>

                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => handleEdit(table)} className="p-1 sm:p-1.5 bg-secondary rounded text-muted-foreground hover:text-foreground"><Edit size={10} className="sm:w-3 sm:h-3" /></button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingTable ? 'Edit Table' : 'New Table'}>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-1.5">Floor</label>
              <select
                value={formData.floor_id}
                onChange={(e) => setFormData({ ...formData, floor_id: e.target.value })}
                required
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="">Select Floor</option>
                {floors?.data?.map((f: Floor) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <Input label="Table Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required className="bg-secondary border-border h-10 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Input label="Capacity" type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required className="bg-secondary border-border h-10 text-sm" />
            <div>
              <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full h-10 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="occupied">Occupied</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11 text-sm">Cancel</Button>
            <Button type="submit" className="flex-1 h-10 sm:h-11 text-sm bg-purple-600 hover:bg-purple-700">Save</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
