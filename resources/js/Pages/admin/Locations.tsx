import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    MapPin,
    Phone,
    ToggleLeft,
    ToggleRight,
    CheckCircle,
    XCircle,
    Building2,
    ShoppingBag,
    Truck
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface Location {
    id: number;
    code: string;
    name: string;
    address_line1: string | null;
    address_line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    phone: string | null;
    is_active: boolean;
    accepts_online_orders: boolean;
    accepts_pickup: boolean;
    accepts_delivery: boolean;
    created_at: string;
    updated_at: string;
}

export default function Locations() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [serviceFilter, setServiceFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [selectedLocation, setSelectedLocation] = React.useState<Location | null>(null);
    const [editingLocation, setEditingLocation] = React.useState<Location | null>(null);
    const [error, setError] = React.useState('');

    const qc = useQueryClient();

    // Pagination
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    // Form state
    const [formData, setFormData] = React.useState({
        code: '',
        name: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Cambodia',
        phone: '',
        is_active: true,
        accepts_online_orders: true,
        accepts_pickup: true,
        accepts_delivery: true
    });

    // Fetch locations
    const { data: locations, isLoading } = useQuery({
        queryKey: ['admin/locations', page, search, statusFilter, serviceFilter],
        queryFn: () => {
            let url = `/api/admin/locations?page=${page}&per_page=${perPage}&search=${search}`;

            if (statusFilter !== 'all') {
                url += `&is_active=${statusFilter === 'active' ? '1' : '0'}`;
            }

            if (serviceFilter !== 'all') {
                url += `&service_type=${serviceFilter}`;
            }

            return apiGet(url);
        }
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/locations', data),
        onSuccess: () => {
            toastSuccess('Location created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['admin/locations'] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Failed to create location');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => apiPut(`/api/locations/${id}`, data),
        onSuccess: () => {
            toastSuccess('Location updated successfully!');
            setOpenEdit(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['admin/locations'] });
        },
        onError: (error: any) => {
            setError(error.response?.data?.message || 'Failed to update location');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/locations/${id}`),
        onSuccess: () => {
            toastSuccess('Location deleted successfully!');
            qc.invalidateQueries({ queryKey: ['admin/locations'] });
        },
        onError: (error: any) => {
            toastError(error.response?.data?.message || 'Failed to delete location');
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, is_active }: { id: number, is_active: boolean }) =>
            apiPut(`/api/locations/${id}`, { is_active }),
        onSuccess: () => {
            toastSuccess('Location status updated!');
            qc.invalidateQueries({ queryKey: ['admin/locations'] });
        }
    });

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            address_line1: '',
            address_line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: 'Cambodia',
            phone: '',
            is_active: true,
            accepts_online_orders: true,
            accepts_pickup: true,
            accepts_delivery: true
        });
        setEditingLocation(null);
        setError('');
    };

    const handleCreate = () => {
        resetForm();
        setOpenCreate(true);
    };

    const handleEdit = (location: Location) => {
        setFormData({
            code: location.code,
            name: location.name,
            address_line1: location.address_line1 || '',
            address_line2: location.address_line2 || '',
            city: location.city || '',
            state: location.state || '',
            postal_code: location.postal_code || '',
            country: location.country || 'Cambodia',
            phone: location.phone || '',
            is_active: location.is_active,
            accepts_online_orders: location.accepts_online_orders,
            accepts_pickup: location.accepts_pickup,
            accepts_delivery: location.accepts_delivery
        });
        setEditingLocation(location);
        setOpenEdit(true);
    };

    const handleView = (location: Location) => {
        setSelectedLocation(location);
        setOpenView(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this location? This will affect all related data.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = (location: Location) => {
        toggleStatusMutation.mutate({ id: location.id, is_active: !location.is_active });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (editingLocation) {
            updateMutation.mutate({ id: editingLocation.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const totalLocations = locations?.data?.length || 0;
    const activeLocations = locations?.data?.filter((loc: Location) => loc.is_active).length || 0;

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
                                Locations Management
                            </h1>
                            <p className="text-gray-400 mt-1">Manage restaurant branches and locations</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Total</div>
                                <div className="text-xl font-bold text-white">{totalLocations}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Active</div>
                                <div className="text-xl font-bold text-green-400">{activeLocations}</div>
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Location
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
                            placeholder="Search locations..."
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
                        <option value="all" className="text-black">All Status</option>
                        <option value="active" className="text-black">Active</option>
                        <option value="inactive" className="text-black">Inactive</option>
                    </select>

                    <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    >
                        <option value="all" className="text-black">All Services</option>
                        <option value="online" className="text-black">Online Orders</option>
                        <option value="pickup" className="text-black">Pickup</option>
                        <option value="delivery" className="text-black">Delivery</option>
                    </select>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                            setServiceFilter('all');
                        }}
                        className="border-white/20 hover:bg-white/10"
                    >
                        Clear Filters
                    </Button>
                </motion.div>

                {/* Locations Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-md">
                                <CardContent className="p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                                        <div className="h-3 bg-white/10 rounded w-1/2"></div>
                                        <div className="h-8 bg-white/10 rounded"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        locations?.data?.map((location: Location, index: number) => (
                            <motion.div
                                key={location.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-white text-lg">{location.name}</h3>
                                                <p className="text-sm text-gray-400">{location.code}</p>
                                            </div>
                                            <Badge className={location.is_active
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                                            }>
                                                {location.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            {location.city && (
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                    {location.city}, {location.state}
                                                </div>
                                            )}
                                            {location.phone && (
                                                <div className="flex items-center text-sm text-gray-300">
                                                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                                    {location.phone}
                                                </div>
                                            )}
                                        </div>

                                        {/* Service Types */}
                                        <div className="flex gap-2 mb-4">
                                            {location.accepts_online_orders && (
                                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                                    <ShoppingBag className="w-3 h-3 mr-1" />
                                                    Online
                                                </Badge>
                                            )}
                                            {location.accepts_pickup && (
                                                <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                                    <Building2 className="w-3 h-3 mr-1" />
                                                    Pickup
                                                </Badge>
                                            )}
                                            {location.accepts_delivery && (
                                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                    <Truck className="w-3 h-3 mr-1" />
                                                    Delivery
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Status Toggle */}
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-sm text-gray-400">Status:</span>
                                            <button
                                                onClick={() => handleToggleStatus(location)}
                                                className="flex items-center gap-1 text-sm hover:opacity-80 transition-opacity"
                                            >
                                                {location.is_active ? (
                                                    <ToggleRight className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleView(location)}
                                                className="flex-1 border-white/20 hover:bg-white/10"
                                            >
                                                <Eye className="w-3 h-3 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleEdit(location)}
                                                className="flex-1 border-white/20 hover:bg-white/10"
                                            >
                                                <Edit className="w-3 h-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(location.id)}
                                                className="border-red-500/20 hover:bg-red-500/10 text-red-400"
                                            >
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
                <Modal
                    open={openCreate || openEdit}
                    onClose={() => {
                        setOpenCreate(false);
                        setOpenEdit(false);
                        resetForm();
                    }}
                    title={editingLocation ? 'Edit Location' : 'Create Location'}
                    size="lg"
                >
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Location Code *</label>
                                <Input
                                    required
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="e.g., LOC-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Location Name *</label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="e.g., Downtown Branch"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Address Line 1</label>
                                <Input
                                    value={formData.address_line1}
                                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="Street address"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">Address Line 2</label>
                                <Input
                                    value={formData.address_line2}
                                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder="Apartment, suite, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                                <Input
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">State/Province</label>
                                <Input
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Postal Code</label>
                                <Input
                                    value={formData.postal_code}
                                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <label className="block text-sm font-medium text-gray-300 mb-3">Service Types</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.accepts_online_orders}
                                        onChange={(e) => setFormData({ ...formData, accepts_online_orders: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-300">Online Orders</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.accepts_pickup}
                                        onChange={(e) => setFormData({ ...formData, accepts_pickup: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-300">Pickup</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.accepts_delivery}
                                        onChange={(e) => setFormData({ ...formData, accepts_delivery: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-300">Delivery</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-gray-300">Active</span>
                                </label>
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
                                {editingLocation ? 'Update' : 'Create'} Location
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal
                    open={openView}
                    onClose={() => {
                        setOpenView(false);
                        setSelectedLocation(null);
                    }}
                    title="Location Details"
                    size="lg"
                >
                    {selectedLocation && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Location Information</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Code:</span>
                                            <span className="text-white font-semibold">{selectedLocation.code}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Name:</span>
                                            <span className="text-white">{selectedLocation.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Phone:</span>
                                            <span className="text-white">{selectedLocation.phone || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Status:</span>
                                            <Badge className={selectedLocation.is_active
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                                            }>
                                                {selectedLocation.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-white">Address</h3>
                                    <div className="text-sm text-gray-300">
                                        {selectedLocation.address_line1 && <div>{selectedLocation.address_line1}</div>}
                                        {selectedLocation.address_line2 && <div>{selectedLocation.address_line2}</div>}
                                        {selectedLocation.city && (
                                            <div>{selectedLocation.city}, {selectedLocation.state} {selectedLocation.postal_code}</div>
                                        )}
                                        {selectedLocation.country && <div>{selectedLocation.country}</div>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Service Types</h3>
                                <div className="flex gap-2">
                                    {selectedLocation.accepts_online_orders && (
                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Online Orders</Badge>
                                    )}
                                    {selectedLocation.accepts_pickup && (
                                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Pickup</Badge>
                                    )}
                                    {selectedLocation.accepts_delivery && (
                                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Delivery</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="secondary"
                                    onClick={() => handleEdit(selectedLocation)}
                                    className="flex-1 border-white/20 hover:bg-white/10"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Location
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setOpenView(false);
                                        setSelectedLocation(null);
                                    }}
                                    className="border-white/20 hover:bg-white/10"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
