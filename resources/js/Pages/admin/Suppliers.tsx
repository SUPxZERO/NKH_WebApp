import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Phone,
    Mail,
    MapPin,
    User,
    ToggleLeft,
    ToggleRight,
    Package,
    FileText
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Location } from '@/app/types/domain';

interface Supplier {
    id: number;
    location_id: number | null;
    location?: Location;
    code: string;
    name: string;
    contact_name: string | null;
    contact_phone: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    type: string;
    payment_terms: string | null;
    notes: string | null;
    tax_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export default function Suppliers() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [locationFilter, setLocationFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null);
    const [editingSupplier, setEditingSupplier] = React.useState<Supplier | null>(null);
    const [error, setError] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    const [formData, setFormData] = React.useState({
        location_id: '',
        code: '',
        name: '',
        contact_name: '',
        contact_phone: '',
        email: '',
        phone: '',
        address: '',
        type: 'food_produce',
        payment_terms: '',
        notes: '',
        tax_id: '',
        is_active: true
    });

    // Fetch suppliers
    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers', page, search, statusFilter, typeFilter, locationFilter],
        queryFn: () => {
            let url = `/api/suppliers?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            if (typeFilter !== 'all') url += `&type=${typeFilter}`;
            if (locationFilter !== 'all') url += `&location_id=${locationFilter}`;
            return apiGet(url);
        }
    });

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations')
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/suppliers', data),
        onSuccess: () => {
            toastSuccess('Supplier created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['suppliers'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to create supplier')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/suppliers/${id}`, data),
        onSuccess: () => {
            toastSuccess('Supplier updated successfully!');
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['suppliers'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to update supplier')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/suppliers/${id}`),
        onSuccess: () => {
            toastSuccess('Supplier deleted successfully!');
            qc.invalidateQueries({ queryKey: ['suppliers'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to delete supplier')
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) =>
            apiPut(`/api/suppliers/${id}`, { is_active }),
        onSuccess: () => {
            toastSuccess('Supplier status updated!');
            qc.invalidateQueries({ queryKey: ['suppliers'] });
        }
    });

    const resetForm = () => {
        setFormData({
            location_id: '',
            code: '',
            name: '',
            contact_name: '',
            contact_phone: '',
            email: '',
            phone: '',
            address: '',
            type: 'food_produce',
            payment_terms: '',
            notes: '',
            tax_id: '',
            is_active: true
        });
        setEditingSupplier(null);
        setError('');
    };

    const handleEdit = (supplier: Supplier) => {
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
        setEditingSupplier(supplier);
        setOpenEdit(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const data = {
            ...formData,
            location_id: formData.location_id ? parseInt(formData.location_id) : null
        };

        if (editingSupplier) {
            updateMutation.mutate({ id: editingSupplier.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

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

    const totalSuppliers = suppliers?.data?.length || 0;
    const activeSuppliers = suppliers?.data?.filter((s: Supplier) => s.is_active).length || 0;

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
                                Suppliers Management
                            </h1>
                            <p className="text-gray-400 mt-1">Manage vendor relationships and contacts</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Total</div>
                                <div className="text-xl font-bold text-white">{totalSuppliers}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Active</div>
                                <div className="text-xl font-bold text-green-400">{activeSuppliers}</div>
                            </div>
                        </div>

                        <Button
                            onClick={() => { resetForm(); setOpenCreate(true); }}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Supplier
                        </Button>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search suppliers..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Status</option>
                        <option value="active" className="text-black">Active</option>
                        <option value="inactive" className="text-black">Inactive</option>
                    </select>

                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Types</option>
                        {Object.entries(supplierTypes).map(([key, label]) => (
                            <option key={key} value={key} className="text-black">{label}</option>
                        ))}
                    </select>

                    <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Locations</option>
                        {locations?.data?.map((location: Location) => (
                            <option key={location.id} value={location.id} className="text-black">{location.name}</option>
                        ))}
                    </select>

                    <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setLocationFilter('all'); }}
                        className="border-white/20 hover:bg-white/10">
                        Clear
                    </Button>
                </motion.div>

                {/* Suppliers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        suppliers?.data?.map((supplier: Supplier, index: number) => (
                            <motion.div key={supplier.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}>
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-white text-lg">{supplier.name}</h3>
                                                <p className="text-sm text-gray-400">{supplier.code}</p>
                                            </div>
                                            <Badge className={supplier.is_active
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                                                {supplier.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                {supplierTypes[supplier.type as keyof typeof supplierTypes]}
                                            </Badge>

                                            {supplier.contact_name && (
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <User className="w-4 h-4 mr-2 text-gray-400" />
                                                    {supplier.contact_name}
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                    {supplier.phone}
                                                </div>
                                            )}
                                            {supplier.email && (
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                                    {supplier.email}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm text-gray-400">Status:</span>
                                            <button onClick={() => toggleStatusMutation.mutate({ id: supplier.id, is_active: !supplier.is_active })}
                                                className="flex items-center gap-1 text-sm hover:opacity-80">
                                                {supplier.is_active ? (
                                                    <ToggleRight className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => { setSelectedSupplier(supplier); setOpenView(true); }}
                                                className="flex-1 border-white/20 hover:bg-white/10">
                                                <Eye className="w-3 h-3 mr-1" />View
                                            </Button>
                                            <Button size="sm" variant="secondary" onClick={() => handleEdit(supplier)}
                                                className="flex-1 border-white/20 hover:bg-white/10">
                                                <Edit className="w-3 h-3 mr-1" />Edit
                                            </Button>
                                            <Button size="sm" variant="danger"
                                                onClick={() => window.confirm('Delete this supplier?') && deleteMutation.mutate(supplier.id)}
                                                className="border-red-500/20 hover:bg-red-500/10 text-red-400">
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create/Edit Modal */}
                <Modal open={openCreate || openEdit} onClose={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                    title={editingSupplier ? 'Edit Supplier' : 'Create Supplier'} size="lg">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Supplier Code *</label>
                                <Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" placeholder="e.g., SUP-001" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Supplier Name *</label>
                                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Type *</label>
                                <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    {Object.entries(supplierTypes).map(([key, label]) => (
                                        <option key={key} value={key} className="bg-gray-800">{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                                <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">No specific location</option>
                                    {locations?.data?.map((location: Location) => (
                                        <option key={location.id} value={location.id} className="bg-gray-800">{location.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Name</label>
                                <Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Phone</label>
                                <Input value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Terms</label>
                                <Input value={formData.payment_terms} onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" placeholder="e.g., Net 30" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tax ID</label>
                                <Input value={formData.tax_id} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={3} />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="rounded" />
                                    <span className="text-sm text-gray-300">Active</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); setOpenEdit(false); resetForm(); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={createMutation.isPending || updateMutation.isPending}
                                className="flex-1">{editingSupplier ? 'Update' : 'Create'} Supplier</Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal open={openView} onClose={() => { setOpenView(false); setSelectedSupplier(null); }}
                    title="Supplier Details" size="lg">
                    {selectedSupplier && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Basic Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Code:</span>
                                            <span className="text-white font-semibold">{selectedSupplier.code}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Name:</span>
                                            <span className="text-white">{selectedSupplier.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Type:</span>
                                            <span className="text-white">{supplierTypes[selectedSupplier.type as keyof typeof supplierTypes]}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Status:</span>
                                            <Badge className={selectedSupplier.is_active
                                                ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                                                {selectedSupplier.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
                                    <div className="space-y-2 text-sm text-gray-300">
                                        {selectedSupplier.contact_name && <div>Contact: {selectedSupplier.contact_name}</div>}
                                        {selectedSupplier.phone && <div>Phone: {selectedSupplier.phone}</div>}
                                        {selectedSupplier.email && <div>Email: {selectedSupplier.email}</div>}
                                        {selectedSupplier.address && <div>Address: {selectedSupplier.address}</div>}
                                    </div>
                                </div>
                            </div>
                            {selectedSupplier.notes && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Notes</h3>
                                    <p className="text-sm text-gray-300">{selectedSupplier.notes}</p>
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <Button variant="secondary" onClick={() => handleEdit(selectedSupplier)}
                                    className="flex-1 border-white/20 hover:bg-white/10">
                                    <Edit className="w-4 h-4 mr-2" />Edit Supplier
                                </Button>
                                <Button variant="secondary" onClick={() => { setOpenView(false); setSelectedSupplier(null); }}
                                    className="border-white/20 hover:bg-white/10">Close</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
