import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Edit, Trash2, MapPin, Phone,
    Globe, Truck, ShoppingBag, CheckCircle, XCircle, Building2
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon
const LocationStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Locations</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-400" />
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
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Online Orders</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{stats.online}</p>
                </div>
                <Globe className="w-8 h-8 text-blue-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Delivery</p>
                    <p className="text-2xl font-bold text-orange-400 mt-1">{stats.delivery}</p>
                </div>
                <Truck className="w-8 h-8 text-orange-400" />
            </div>
        </div>
    </div>
);

export default function Locations() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingLocation, setEditingLocation] = useState<any>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        code: '', name: '', address_line1: '', address_line2: '',
        city: '', state: '', postal_code: '', country: 'Cambodia', phone: '',
        is_active: true, accepts_online_orders: true, accepts_pickup: true, accepts_delivery: true
    });

    // Fetch Data
    const { data: locations, isLoading } = useQuery({
        queryKey: ['admin/locations', page, search, statusFilter],
        queryFn: () => {
            let url = `/api/admin/locations?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            return apiGet(url);
        }
    });

    const locationList = useMemo(() => locations?.data || [], [locations]);

    const stats = useMemo(() => ({
        total: locations?.meta?.total || locationList.length,
        active: locationList.filter((l: any) => l.is_active).length,
        online: locationList.filter((l: any) => l.accepts_online_orders).length,
        delivery: locationList.filter((l: any) => l.accepts_delivery).length
    }), [locationList, locations]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/locations', data),
        onSuccess: () => { toastSuccess('Location created'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/locations'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/locations/${id}`, data),
        onSuccess: () => { toastSuccess('Location updated'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/locations'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/locations/${id}`),
        onSuccess: () => { toastSuccess('Location deleted'); qc.invalidateQueries({ queryKey: ['admin/locations'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingLocation(null);
        setFormData({
            code: '', name: '', address_line1: '', address_line2: '',
            city: '', state: '', postal_code: '', country: 'Cambodia', phone: '',
            is_active: true, accepts_online_orders: true, accepts_pickup: true, accepts_delivery: true
        });
    };

    const handleEdit = (loc: any) => {
        setEditingLocation(loc);
        setFormData({
            code: loc.code, name: loc.name, address_line1: loc.address_line1 || '', address_line2: loc.address_line2 || '',
            city: loc.city || '', state: loc.state || '', postal_code: loc.postal_code || '', country: loc.country || 'Cambodia',
            phone: loc.phone || '', is_active: loc.is_active,
            accepts_online_orders: loc.accepts_online_orders, accepts_pickup: loc.accepts_pickup, accepts_delivery: loc.accepts_delivery
        });
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this location?')) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingLocation) updateMutation.mutate({ id: editingLocation.id, data: formData });
        else createMutation.mutate(formData);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Locations</h1>
                        <p className="text-slate-400 mt-1">Manage restaurant branches</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Location
                    </Button>
                </div>

                <LocationStatsRibbon stats={stats} />

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search locations..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-3">Location</div>
                        <div className="col-span-3">Contact</div>
                        <div className="col-span-3">Services</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : locationList.map((loc: any) => (
                            <motion.div key={loc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                <div className="col-span-3">
                                    <div className="font-medium text-white">{loc.name}</div>
                                    <div className="text-xs text-gray-500">{loc.code}</div>
                                </div>
                                <div className="col-span-3 text-sm text-gray-300">
                                    <div className="flex items-center gap-2"><MapPin size={12} className="text-gray-500" /> {loc.city}</div>
                                    {loc.phone && <div className="flex items-center gap-2 mt-1"><Phone size={12} className="text-gray-500" /> {loc.phone}</div>}
                                </div>
                                <div className="col-span-3 flex gap-2">
                                    {loc.accepts_online_orders && <div title="Online" className="p-1.5 bg-blue-500/10 rounded text-blue-400"><Globe size={14} /></div>}
                                    {loc.accepts_pickup && <div title="Pickup" className="p-1.5 bg-purple-500/10 rounded text-purple-400"><ShoppingBag size={14} /></div>}
                                    {loc.accepts_delivery && <div title="Delivery" className="p-1.5 bg-orange-500/10 rounded text-orange-400"><Truck size={14} /></div>}
                                </div>
                                <div className="col-span-2">
                                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                                        loc.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                                        {loc.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(loc)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(loc.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingLocation ? 'Edit Location' : 'New Location'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required className="bg-slate-950 border-white/10" />
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-slate-950 border-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-950 border-white/10" />
                        <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="bg-slate-950 border-white/10" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Address 1" value={formData.address_line1} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} className="col-span-2 bg-slate-950 border-white/10" />
                        <Input label="Postal Code" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} className="bg-slate-950 border-white/10" />
                    </div>
                    <div className="border-t border-white/10 pt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-3">Services</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-sm">
                                <input type="checkbox" checked={formData.accepts_online_orders} onChange={(e) => setFormData({ ...formData, accepts_online_orders: e.target.checked })} className="rounded bg-slate-950 border-white/20" /> Online
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-sm">
                                <input type="checkbox" checked={formData.accepts_pickup} onChange={(e) => setFormData({ ...formData, accepts_pickup: e.target.checked })} className="rounded bg-slate-950 border-white/20" /> Pickup
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-sm">
                                <input type="checkbox" checked={formData.accepts_delivery} onChange={(e) => setFormData({ ...formData, accepts_delivery: e.target.checked })} className="rounded bg-slate-950 border-white/20" /> Delivery
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-300 text-sm ml-auto">
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
