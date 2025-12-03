import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Edit, Trash2, Building, MapPin,
  Grid3X3, CheckCircle, XCircle, Users
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { Floor, Location } from '@/app/types/domain';

// Stats Ribbon
const FloorStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Floors</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <Building className="w-8 h-8 text-purple-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Active</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
        </div>
        <CheckCircle className="w-8 h-8 text-emerald-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Tables</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.tables}</p>
        </div>
        <Grid3X3 className="w-8 h-8 text-blue-400" />
      </div>
    </div>
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Capacity</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats.capacity}</p>
        </div>
        <Users className="w-8 h-8 text-amber-400" />
      </div>
    </div>
  </div>
);

export default function Floors() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  const [formData, setFormData] = useState({
    location_id: '', name: '', display_order: '0', is_active: true
  });

  // Fetch Data
  const { data: floors, isLoading } = useQuery({
    queryKey: ['admin/floors', page, search, statusFilter, locationFilter],
    queryFn: () => {
      let url = `/api/admin/floors?page=${page}&per_page=${perPage}&search=${search}`;
      if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
      if (locationFilter !== 'all') url += `&location_id=${locationFilter}`;
      return apiGet(url);
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => apiGet('/api/locations')
  });

  const floorList = useMemo(() => floors?.data || [], [floors]);

  const stats = useMemo(() => ({
    total: floors?.meta?.total || floorList.length,
    active: floorList.filter((f: Floor) => f.is_active).length,
    tables: floorList.reduce((sum: number, f: Floor) => sum + (f.tables?.length || 0), 0),
    capacity: floorList.reduce((sum: number, f: Floor) => sum + (f.tables?.reduce((s: number, t: any) => s + t.capacity, 0) || 0), 0)
  }), [floorList, floors]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => apiPost('/api/admin/floors', data),
    onSuccess: () => { toastSuccess('Floor created'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/floors'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/floors/${id}`, data),
    onSuccess: () => { toastSuccess('Floor updated'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/floors'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/admin/floors/${id}`),
    onSuccess: () => { toastSuccess('Floor deleted'); qc.invalidateQueries({ queryKey: ['admin/floors'] }); },
    onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
  });

  const closeModal = () => {
    setOpenCreate(false);
    setOpenEdit(false);
    setEditingFloor(null);
    setFormData({ location_id: '', name: '', display_order: '0', is_active: true });
  };

  const handleEdit = (floor: Floor) => {
    setEditingFloor(floor);
    setFormData({
      location_id: floor.location_id.toString(),
      name: floor.name,
      display_order: floor.display_order.toString(),
      is_active: floor.is_active
    });
    setOpenEdit(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Delete this floor? All tables on this floor will also be deleted.')) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      location_id: parseInt(formData.location_id),
      display_order: parseInt(formData.display_order)
    };
    if (editingFloor) updateMutation.mutate({ id: editingFloor.id, data });
    else createMutation.mutate(data);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-900 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Floors</h1>
            <p className="text-slate-400 mt-1">Manage restaurant layout</p>
          </div>
          <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" /> Add Floor
          </Button>
        </div>

        <FloorStatsRibbon stats={stats} />

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input placeholder="Search floors..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
              <option value="all">All Locations</option>
              {locations?.data?.map((l: Location) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Location</div>
            <div className="col-span-2">Order</div>
            <div className="col-span-2">Tables</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/5">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : floorList.map((floor: Floor) => (
              <motion.div key={floor.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                <div className="col-span-3 font-medium text-white">{floor.name}</div>
                <div className="col-span-3 text-sm text-gray-300 flex items-center gap-2">
                  <MapPin size={14} className="text-gray-500" /> {floor.location?.name}
                </div>
                <div className="col-span-2 text-sm text-gray-400">{floor.display_order}</div>
                <div className="col-span-2 text-sm text-gray-300 flex items-center gap-2">
                  <Grid3X3 size={14} className="text-gray-500" /> {floor.tables?.length || 0}
                </div>
                <div className="col-span-1">
                  <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                    floor.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                    {floor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(floor)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(floor.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingFloor ? 'Edit Floor' : 'New Floor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                required
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select Location</option>
                {locations?.data?.map((l: Location) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-slate-950 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Display Order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} className="bg-slate-950 border-white/10" />
            <div className="flex items-center h-full pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded bg-slate-950 border-white/20" /> Active
              </label>
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
