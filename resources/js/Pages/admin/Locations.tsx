import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Edit, Trash2, MapPin, Phone,
    Globe, Truck, ShoppingBag, CheckCircle, XCircle, Building2, Clock
} from 'lucide-react';
import AddressPicker, { AddressData } from '@/app/components/customer/AddressPicker';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon with Dark/Light Mode
// Stats Ribbon with Dark/Light Mode
const LocationStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">Total Locations</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">Active</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.active}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">Online Orders</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.online}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">Delivery</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{stats.delivery}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
            </div>
        </div>
    </div>
);

const LocationCard = ({ loc, onEdit, onDelete }: { loc: any, onEdit: (loc: any) => void, onDelete: (id: number) => void }) => (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-start mb-3">
            <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{loc.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{loc.code}</p>
            </div>
            <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                loc.is_active
                    ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20")}>
                {loc.is_active ? 'Active' : 'Inactive'}
            </span>
        </div>

        <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                {loc.city || 'N/A'}
            </div>
            {loc.phone && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {loc.phone}
                </div>
            )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/10">
            <div className="flex gap-2">
                {loc.accepts_online_orders && <div title="Online" className="p-1.5 bg-blue-100 dark:bg-blue-500/10 rounded text-blue-600 dark:text-blue-400"><Globe size={14} /></div>}
                {loc.accepts_pickup && <div title="Pickup" className="p-1.5 bg-purple-100 dark:bg-purple-500/10 rounded text-purple-600 dark:text-purple-400"><ShoppingBag size={14} /></div>}
                {loc.accepts_delivery && <div title="Delivery" className="p-1.5 bg-orange-100 dark:bg-orange-500/10 rounded text-orange-600 dark:text-orange-400"><Truck size={14} /></div>}
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => onEdit(loc)} className="h-8 w-8 p-0"><Edit size={14} /></Button>
                <Button size="sm" variant="danger" onClick={() => onDelete(loc.id)} className="h-8 w-8 p-0"><Trash2 size={14} /></Button>
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
        latitude: 0, longitude: 0,
        is_active: true, accepts_online_orders: true, accepts_pickup: true, accepts_delivery: true,
        operating_hours: [] as any[]
    });

    // Helper for days
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
        mutationFn: (data: any) => apiPost('/api/admin/locations', data),
        onSuccess: () => { toastSuccess('Location created'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/locations'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/locations/${id}`, data),
        onSuccess: () => { toastSuccess('Location updated'); closeModal(); qc.invalidateQueries({ queryKey: ['admin/locations'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/locations/${id}`),
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
            latitude: 0, longitude: 0,
            is_active: true, accepts_online_orders: true, accepts_pickup: true, accepts_delivery: true,
            operating_hours: []
        });
    };

    const handleEdit = (loc: any) => {
        setEditingLocation(loc);
        setFormData({
            code: loc.code, name: loc.name, address_line1: loc.address_line1 || '', address_line2: loc.address_line2 || '',
            city: loc.city || '', state: loc.state || '', postal_code: loc.postal_code || '', country: loc.country || 'Cambodia',
            phone: loc.phone || '', is_active: loc.is_active,
            latitude: loc.latitude ? parseFloat(loc.latitude) : 0,
            longitude: loc.longitude ? parseFloat(loc.longitude) : 0,
            accepts_online_orders: loc.accepts_online_orders, accepts_pickup: loc.accepts_pickup, accepts_delivery: loc.accepts_delivery,
            operating_hours: loc.operating_hours || []
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
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Locations</h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-1">Manage restaurant branches</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Location
                    </Button>
                </div>

                <LocationStatsRibbon stats={stats} />

                {/* Filters */}
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl p-4 mb-6 shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search locations..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Table (Desktop) */}
                <div className="hidden md:block bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        <div className="col-span-3">Location</div>
                        <div className="col-span-3">Contact</div>
                        <div className="col-span-3">Services</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : locationList.length === 0 ? (
                            <div className="p-12 text-center">
                                <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No locations found</p>
                            </div>
                        ) : locationList.map((loc: any) => (
                            <motion.div key={loc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <div className="col-span-3">
                                    <div className="font-medium text-gray-900 dark:text-white">{loc.name}</div>
                                    <div className="text-xs text-gray-500">{loc.code}</div>
                                </div>
                                <div className="col-span-3 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-2"><MapPin size={12} className="text-gray-500" /> {loc.city}</div>
                                    {loc.phone && <div className="flex items-center gap-2 mt-1"><Phone size={12} className="text-gray-500" /> {loc.phone}</div>}
                                </div>
                                <div className="col-span-3 flex gap-2">
                                    {loc.accepts_online_orders && <div title="Online" className="p-1.5 bg-blue-100 dark:bg-blue-500/10 rounded text-blue-600 dark:text-blue-400"><Globe size={14} /></div>}
                                    {loc.accepts_pickup && <div title="Pickup" className="p-1.5 bg-purple-100 dark:bg-purple-500/10 rounded text-purple-600 dark:text-purple-400"><ShoppingBag size={14} /></div>}
                                    {loc.accepts_delivery && <div title="Delivery" className="p-1.5 bg-orange-100 dark:bg-orange-500/10 rounded text-orange-600 dark:text-orange-400"><Truck size={14} /></div>}
                                </div>
                                <div className="col-span-2">
                                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                                        loc.is_active
                                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                            : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20")}>
                                        {loc.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(loc)} className="h-8 w-8 p-0"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(loc.id)} className="h-8 w-8 p-0"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : locationList.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-gray-200 dark:border-white/10">
                            <Building2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No locations found</p>
                        </div>
                    ) : (
                        locationList.map((loc: any) => (
                            <LocationCard key={loc.id} loc={loc} onEdit={handleEdit} onDelete={handleDelete} />
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-medium text-gray-900 dark:text-white">{locationList.length}</span> results
                        {locations?.meta?.total > 0 && <span> of <span className="font-medium text-gray-900 dark:text-white">{locations.meta.total}</span></span>}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-white/10"
                        >
                            Previous
                        </Button>
                        <Button
                            variant="secondary"
                            disabled={!locations?.links?.next && page * perPage >= (locations?.meta?.total || 0)}
                            onClick={() => setPage(p => p + 1)}
                            className="dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-white/10"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingLocation ? 'Edit Location' : 'New Location'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Address Picker */}
                    <AddressPicker
                        label="Search & Pin Location"
                        initialAddress={formData.address_line1 ? `${formData.address_line1}, ${formData.city}` : ''}
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                        onChange={(data) => {
                            if (data) {
                                setFormData(prev => ({
                                    ...prev,
                                    address_line1: data.address_line_1 || prev.address_line1,
                                    city: data.city || prev.city,
                                    postal_code: data.postal_code || prev.postal_code,
                                    latitude: data.lat,
                                    longitude: data.lng,
                                    country: data.country || prev.country
                                }));
                            }
                        }}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Address 1" value={formData.address_line1} onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })} className="col-span-2" />
                        <Input label="Postal Code" value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} />
                    </div>
                    <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Operating Hours</label>
                        <div className="space-y-2 mb-3">
                            {formData.operating_hours.map((hour, index) => (
                                <div key={index} className="flex gap-2 items-center">
                                    <select
                                        value={hour.day_of_week}
                                        onChange={(e) => {
                                            const newHours = [...formData.operating_hours];
                                            newHours[index].day_of_week = parseInt(e.target.value);
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                                    >
                                        {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                    </select>
                                    <select
                                        value={hour.service_type}
                                        onChange={(e) => {
                                            const newHours = [...formData.operating_hours];
                                            newHours[index].service_type = e.target.value;
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                                    >
                                        <option value="dine-in">Dine-in</option>
                                        <option value="pickup">Pickup</option>
                                        <option value="delivery">Delivery</option>
                                    </select>
                                    <input
                                        type="time"
                                        value={hour.opening_time?.slice(0, 5)}
                                        onChange={(e) => {
                                            const newHours = [...formData.operating_hours];
                                            newHours[index].opening_time = e.target.value;
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                                    />
                                    <span className="text-gray-400">-</span>
                                    <input
                                        type="time"
                                        value={hour.closing_time?.slice(0, 5)}
                                        onChange={(e) => {
                                            const newHours = [...formData.operating_hours];
                                            newHours[index].closing_time = e.target.value;
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-sm text-gray-900 dark:text-white"
                                    />
                                    <Button
                                        type="button"
                                        variant="danger"
                                        size="sm"
                                        onClick={() => {
                                            const newHours = formData.operating_hours.filter((_, i) => i !== index);
                                            setFormData({ ...formData, operating_hours: newHours });
                                        }}
                                        className="p-1.5"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setFormData({
                                    ...formData,
                                    operating_hours: [
                                        ...formData.operating_hours,
                                        { day_of_week: 1, service_type: 'dine-in', opening_time: '09:00', closing_time: '22:00' }
                                    ]
                                });
                            }}
                            className="w-full flex items-center justify-center gap-2 border-dashed"
                        >
                            <Plus className="w-4 h-4" /> Add Operating Hours
                        </Button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Services</label>
                        <div className="flex gap-4 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-sm">
                                <input type="checkbox" checked={formData.accepts_online_orders} onChange={(e) => setFormData({ ...formData, accepts_online_orders: e.target.checked })}
                                    className="rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20 accent-purple-600 w-4 h-4" /> Online
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-sm">
                                <input type="checkbox" checked={formData.accepts_pickup} onChange={(e) => setFormData({ ...formData, accepts_pickup: e.target.checked })}
                                    className="rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20 accent-purple-600 w-4 h-4" /> Pickup
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-sm">
                                <input type="checkbox" checked={formData.accepts_delivery} onChange={(e) => setFormData({ ...formData, accepts_delivery: e.target.checked })}
                                    className="rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20 accent-purple-600 w-4 h-4" /> Delivery
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 text-sm ml-auto">
                                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded bg-white dark:bg-slate-900 border-gray-300 dark:border-white/20 accent-purple-600 w-4 h-4" /> Active
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
