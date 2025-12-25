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

// StatCard Component with vibrant gradients - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
  const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string; shadow: string }> = {
    purple: {
      gradient: 'from-purple-500/20 to-violet-500/10',
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-500/30',
      shadow: 'shadow-purple-500/20'
    },
    emerald: {
      gradient: 'from-emerald-500/20 to-green-500/10',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      shadow: 'shadow-emerald-500/20'
    },
    blue: {
      gradient: 'from-blue-500/20 to-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-500/30',
      shadow: 'shadow-blue-500/20'
    },
    amber: {
      gradient: 'from-amber-500/20 to-orange-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      shadow: 'shadow-amber-500/20'
    }
  };
  const styles = colorStyles[color] || colorStyles.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm",
        `bg-gradient-to-br ${styles.gradient}`,
        styles.border,
        `shadow-lg ${styles.shadow}`
      )}
    >
      <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 transform translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-8 hidden sm:block">
        <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
      </div>
      <div className="relative p-3 sm:p-4 md:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1 truncate">{title}</p>
            <p className={cn("text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold", styles.text)}>{value}</p>
          </div>
          <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Stats Ribbon - Mobile optimized
const FloorStatsRibbon = ({ stats }: { stats: any }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
    <StatCard title="Floors" value={stats.total} icon={Building} color="purple" index={0} />
    <StatCard title="Active" value={stats.active} icon={CheckCircle} color="emerald" index={1} />
    <StatCard title="Tables" value={stats.tables} icon={Grid3X3} color="blue" index={2} />
    <StatCard title="Capacity" value={stats.capacity} icon={Users} color="amber" index={3} />
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
    queryFn: () => apiGet('/api/admin/locations')
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
      <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
        {/* Decorative Background Elements - Hidden on mobile */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative flex items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
          <div className="min-w-0">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-500 via-violet-500 to-purple-500 bg-clip-text text-transparent truncate"
            >
              Floors
            </motion.h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">Manage restaurant layout</p>
          </div>
          <Button onClick={() => { closeModal(); setOpenCreate(true); }} variant="primary" className="h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm flex-shrink-0">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Floor</span>
          </Button>
        </div>

        <FloorStatsRibbon stats={stats} />

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 text-sm" variant="filled" />
            </div>
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
              {[
                { key: 'all', label: 'All' },
                { key: 'active', label: 'Active' },
                { key: 'inactive', label: 'Inactive' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0",
                    statusFilter === key
                      ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/30"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-secondary border border-border rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-purple-500 outline-none transition-colors">
              <option value="all">All Locations</option>
              {locations?.data?.map((l: Location) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Table - Desktop only */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="hidden md:block relative bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
        >
          {/* Table Header with Gradient */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10">
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Name</div>
            <div className="col-span-3 text-xs font-bold text-foreground uppercase tracking-wider">Location</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Order</div>
            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Tables</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">Status</div>
            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/30">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center gap-3 text-muted-foreground">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  Loading floors...
                </div>
              </div>
            ) : floorList.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                  <Building className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-foreground font-semibold">No floors found</h3>
                <p className="text-muted-foreground text-sm mt-1">Create your first floor to get started</p>
              </div>
            ) : floorList.map((floor: Floor, idx: number) => (
              <motion.div
                key={floor.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-transparent transition-all group"
              >
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/20">
                    <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-semibold text-foreground">{floor.name}</span>
                </div>
                <div className="col-span-3 text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin size={14} className="text-muted-foreground" /> {floor.location?.name}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">{floor.display_order}</div>
                <div className="col-span-2 text-sm text-muted-foreground flex items-center gap-2">
                  <Grid3X3 size={14} className="text-muted-foreground" />
                  <span className="font-semibold text-foreground">{floor.tables?.length || 0}</span> tables
                </div>
                <div className="col-span-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1",
                    floor.is_active
                      ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", floor.is_active ? "bg-emerald-500" : "bg-red-500")} />
                    {floor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(floor)} className="h-7 w-7 p-0 hover:bg-purple-500/20 hover:text-purple-600 dark:hover:text-purple-400">
                    <Edit size={12} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(floor.id)} className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-flex items-center gap-3 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            </div>
          ) : floorList.length === 0 ? (
            <div className="bg-card/50 rounded-xl p-8 text-center border border-border/50 backdrop-blur-sm">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center">
                <Building className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-foreground font-semibold text-sm">No floors found</h3>
              <p className="text-muted-foreground text-xs mt-1">Create your first floor</p>
            </div>
          ) : (
            floorList.map((floor: Floor) => (
              <motion.div
                key={floor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 border border-border/50 rounded-xl p-3 backdrop-blur-sm shadow-lg"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center border border-purple-500/20 flex-shrink-0">
                      <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-foreground truncate">{floor.name}</h3>
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        <MapPin size={10} /> {floor.location?.name}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 flex-shrink-0",
                    floor.is_active
                      ? "bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-gradient-to-r from-red-500/20 to-rose-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", floor.is_active ? "bg-emerald-500" : "bg-red-500")} />
                    {floor.is_active ? 'Active' : 'Off'}
                  </span>
                </div>

                {/* Info Row */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Grid3X3 size={12} className="text-blue-500" />
                      <span className="font-semibold text-foreground">{floor.tables?.length || 0}</span> tables
                    </span>
                    <span className="hidden sm:inline">Order: {floor.display_order}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(floor)} className="h-8 w-8 p-0 hover:bg-purple-500/20 hover:text-purple-500">
                      <Edit size={14} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(floor.id)} className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <Modal open={openCreate || openEdit} onClose={closeModal} title={editingFloor ? 'Edit Floor' : 'New Floor'}>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-muted-foreground mb-1 sm:mb-1.5">Location</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                required
                className="w-full h-10 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-purple-500 outline-none transition-colors"
              >
                <option value="">Select Location</option>
                {locations?.data?.map((l: Location) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-10 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Input label="Display Order" type="number" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: e.target.value })} className="h-10 text-sm" />
            <div className="flex items-center h-full pt-5 sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-foreground text-sm">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded bg-background border-border w-4 h-4" /> Active
              </label>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4">
            <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 h-10 sm:h-11 text-sm">Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1 h-10 sm:h-11 text-sm">Save</Button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
