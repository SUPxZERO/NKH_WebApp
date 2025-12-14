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

// Stats Ribbon with Dark/Light Mode Support
const SupplierStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium">Total Suppliers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium">Active</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium">Food & Produce</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.food}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        </div>
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 backdrop-blur-sm shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-medium">Beverages</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.beverage}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
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
            let url = `/api/admin/suppliers?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            if (typeFilter !== 'all') url += `&type=${typeFilter}`;
            return apiGet(url);
        }
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/admin/locations')
    });

    const { data: statsData } = useQuery({
        queryKey: ['supplier-stats'],
        queryFn: () => apiGet('/api/admin/suppliers-stats')
    });

    const supplierList = useMemo(() => suppliers?.data || [], [suppliers]);

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
        mutationFn: (data: any) => apiPost('/api/admin/suppliers', data),
        onSuccess: () => { toastSuccess('Supplier created'); closeModal(); qc.invalidateQueries({ queryKey: ['suppliers'] }); qc.invalidateQueries({ queryKey: ['supplier-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/admin/suppliers/${id}`, data),
        onSuccess: () => { toastSuccess('Supplier updated'); closeModal(); qc.invalidateQueries({ queryKey: ['suppliers'] }); qc.invalidateQueries({ queryKey: ['supplier-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/suppliers/${id}`),
        onSuccess: () => { toastSuccess('Supplier deleted'); qc.invalidateQueries({ queryKey: ['suppliers'] }); qc.invalidateQueries({ queryKey: ['supplier-stats'] }); },
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
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Suppliers</h1>
                        <p className="text-gray-600 dark:text-slate-400 mt-1">Manage vendor relationships</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Add Supplier
                    </Button>
                </div>

                <SupplierStatsRibbon stats={stats} />

                {/* Filters */}
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm shadow-sm">
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none">
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:border-purple-500 outline-none">
                            <option value="all">All Types</option>
                            {Object.entries(supplierTypes).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden backdrop-blur-sm shadow-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        <div className="col-span-3">Name / Code</div>
                        <div className="col-span-3">Contact</div>
                        <div className="col-span-3">Type</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : supplierList.length === 0 ? (
                            <div className="p-12 text-center">
                                <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-500 dark:text-gray-400">No suppliers found</p>
                            </div>
                        ) : supplierList.map((supplier: any) => (
                            <motion.div key={supplier.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                <div className="col-span-3">
                                    <div className="font-medium text-gray-900 dark:text-white">{supplier.name}</div>
                                    <div className="text-xs text-gray-500">{supplier.code}</div>
                                </div>
                                <div className="col-span-3 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex items-center gap-2"><Phone size={12} className="text-gray-500" /> {supplier.phone || '-'}</div>
                                    <div className="flex items-center gap-2 mt-1"><Mail size={12} className="text-gray-500" /> {supplier.email || '-'}</div>
                                </div>
                                <div className="col-span-3">
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded text-xs border border-blue-200 dark:border-blue-500/20">
                                        {supplierTypes[supplier.type as keyof typeof supplierTypes] || supplier.type || 'Unknown'}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border",
                                        supplier.is_active
                                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                            : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20")}>
                                        {supplier.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="secondary" onClick={() => handleEdit(supplier)} className="h-8 w-8 p-0"><Edit size={14} /></Button>
                                    <Button size="sm" variant="danger" onClick={() => handleDelete(supplier.id)} className="h-8 w-8 p-0"><Trash2 size={14} /></Button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate || openEdit} onClose={closeModal} title={editingSupplier ? 'Edit Supplier' : 'New Supplier'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                        <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                                {Object.entries(supplierTypes).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                            <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white">
                                <option value="">No specific location</option>
                                {locations?.data?.map((l: Location) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Contact Name" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} />
                        <Input label="Contact Phone" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} />
                    </div>
                    <Input label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />

                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="rounded bg-white dark:bg-slate-950 border-gray-300 dark:border-white/20" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
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
