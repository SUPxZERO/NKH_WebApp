import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Edit, Trash2, Truck, Phone, Mail,
    MapPin, CheckCircle, XCircle, Package, FileText
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';
import { Location } from '@/app/types/domain';

// Stats Ribbon
const SupplierStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total Suppliers</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-400" />
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
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Food & Produce</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{stats.food}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Beverages</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{stats.beverage}</p>
                </div>
                <FileText className="w-8 h-8 text-amber-400" />
            </div>
        </div>
    </div>
);

export default function Suppliers() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<any>(null);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        location_id: '', code: '', name: '', contact_name: '', contact_phone: '',
        email: '', phone: '', address: '', type: 'food_produce',
        payment_terms: '', notes: '', tax_id: '', is_active: true
    });

    // Fetch Data
    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers', page, search, statusFilter, typeFilter],
        queryFn: () => {
            let url = `/api/suppliers?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            if (typeFilter !== 'all') url += `&type=${typeFilter}`;
            return apiGet(url);
        }
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations')
    });

    // Fetch stats from backend for accurate totals
    const { data: statsData } = useQuery({
        queryKey: ['supplier-stats'],
        queryFn: () => apiGet('/api/supplier-stats')
    });

    const supplierList = useMemo(() => suppliers?.data || [], [suppliers]);

    // Use backend stats for accurate totals, with fallback to list-based calculation
    const stats = useMemo(() => ({
        total: statsData?.total ?? suppliers?.meta?.total ?? supplierList.length,
        active: statsData?.active ?? supplierList.filter((s: any) => s.is_active).length,
        food: statsData?.food ?? supplierList.filter((s: any) => s.type === 'food_produce').length,
        beverage: statsData?.beverage ?? supplierList.filter((s: any) => s.type === 'beverages').length
    }), [supplierList, suppliers, statsData]);

    const supplierTypes = {
        food_produce: 'Food & Produce',
        beverages: 'Beverages',
        meat_seafood: 'Meat & Seafood',
        dairy: 'Dairy Products',
        equipment: 'Equipment',
        supplies: 'Supplies & Packaging',
        cleaning: 'Cleaning Products',
        utilities: 'Utilities',
        services: 'Services',
        other: 'Other'
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/suppliers', data),
        onSuccess: () => { toastSuccess('Supplier created'); closeModal(); qc.invalidateQueries({ queryKey: ['suppliers'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/suppliers/${id}`, data),
        onSuccess: () => { toastSuccess('Supplier updated'); closeModal(); qc.invalidateQueries({ queryKey: ['suppliers'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/suppliers/${id}`),
        onSuccess: () => { toastSuccess('Supplier deleted'); qc.invalidateQueries({ queryKey: ['suppliers'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setEditingSupplier(null);
        setFormData({
            location_id: '', code: '', name: '', contact_name: '', contact_phone: '',
            email: '', phone: '', address: '', type: 'food_produce',
            payment_terms: '', notes: '', tax_id: '', is_active: true
        });
    };

    const handleEdit = (supplier: any) => {
        setEditingSupplier(supplier);
        setFormData({
            location_id: supplier.location_id?.toString() || '',
            code: supplier.code,
            name: supplier.name,
            contact_name: supplier.contact_name || '',
            contact_phone: supplier.contact_phone || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            type: supplier.type,
            payment_terms: supplier.payment_terms || '',
            notes: supplier.notes || '',
            tax_id: supplier.tax_id || '',
            is_active: supplier.is_active
        });
        setOpenEdit(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Delete this supplier?')) deleteMutation.mutate(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
            location_id: formData.location_id ? parseInt(formData.location_id) : null
        };
        if (editingSupplier) updateMutation.mutate({ id: editingSupplier.id, data });
        else createMutation.mutate(data);
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Suppliers</h1>
                        <p className="text-slate-400 mt-1">Manage vendor relationships</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Supplier
                    </Button>
                </div>

                <SupplierStatsRibbon stats={stats} />

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Types</option>
                            {Object.entries(supplierTypes).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-3">Name / Code</div>
                        <div className="col-span-3">Contact</div>
                        <div className="col-span-3">Type</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : supplierList.map((supplier: any) => (
                            <motion.div key={supplier.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                <div className="col-span-3">
                                    <div className="font-medium text-white">{supplier.name}</div>
                                    <div className="text-xs text-gray-500">{supplier.code}</div>
                                </div>
                                <div className="col-span-3 text-sm text-gray-300">
                                    <div className="flex items-center gap-2"><Phone size={12} className="text-gray-500" /> {supplier.phone || '-'}</div>
                                    <div className="flex items-center gap-2 mt-1"><Mail size={12} className="text-gray-500" /> {supplier.email || '-'}</div>
                                </div>
                                <div className="col-span-3">
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20">
                                        {supplierTypes[supplier.type as keyof typeof supplierTypes]}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                                        supplier.is_active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>
                                        {supplier.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(supplier)} className="h-8 w-8 p-0 border-white/10"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(supplier.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingSupplier ? 'Edit Supplier' : 'New Supplier'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required className="bg-slate-950 border-white/10" />
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="bg-slate-950 border-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                                {Object.entries(supplierTypes).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                            <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                                <option value="">No specific location</option>
                                {locations?.data?.map((l: Location) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-slate-950 border-white/10" />
                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-slate-950 border-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Contact Name" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} className="bg-slate-950 border-white/10" />
                        <Input label="Contact Phone" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className="bg-slate-950 border-white/10" />
                    </div>
                    <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="bg-slate-950 border-white/10" />

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded bg-slate-950 border-white/20" />
                        <span className="text-sm text-gray-300">Active</span>
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
