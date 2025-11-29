import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock,
    Package,
    TrendingUp,
    Calendar,
    DollarSign,
    Truck,
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

interface Supplier {
    id: number;
    name: string;
    code: string;
}

interface Location {
    id: number;
    name: string;
}

interface Ingredient {
    id: number;
    name: string;
    unit: string;
    cost_per_unit?: number;
}

interface POItem {
    id?: number;
    ingredient_id: number;
    ingredient?: Ingredient;
    quantity: number;
    unit_price: number;
    notes?: string;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier_id: number;
    supplier?: Supplier;
    location_id?: number;
    location?: Location;
    order_date: string;
    expected_delivery_date?: string;
    received_date?: string;
    status: 'draft' | 'pending' | 'approved' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
    total_amount: number;
    notes?: string;
    items?: POItem[];
    created_at: string;
}

export default function PurchaseOrders() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [supplierFilter, setSupplierFilter] = React.useState('all');
    const [locationFilter, setLocationFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [openReceive, setOpenReceive] = React.useState(false);
    const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(null);
    const [error, setError] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    // Form state for creating PO
    const [formData, setFormData] = React.useState({
        supplier_id: '',
        location_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        status: 'draft',
        notes: '',
        items: [] as POItem[]
    });

    // Receiving state
    const [receiveItems, setReceiveItems] = React.useState<{ item_id: number; quantity_received: number }[]>([]);

    // Fetch purchase orders
    const { data: purchaseOrders, isLoading } = useQuery({
        queryKey: ['purchase-orders', page, search, statusFilter, supplierFilter, locationFilter],
        queryFn: () => {
            let url = `/api/purchase-orders?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (supplierFilter !== 'all') url += `&supplier_id=${supplierFilter}`;
            if (locationFilter !== 'all') url += `&location_id=${locationFilter}`;
            return apiGet(url);
        }
    });

    // Fetch suppliers
    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => apiGet('/api/suppliers')
    });

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations')
    });

    // Fetch ingredients
    const { data: ingredients } = useQuery({
        queryKey: ['ingredients'],
        queryFn: () => apiGet('/api/admin/ingredients')
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['purchase-orders-stats'],
        queryFn: () => apiGet('/api/admin/purchase-orders-stats')
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/purchase-orders', data),
        onSuccess: () => {
            toastSuccess('Purchase order created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to create PO')
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/purchase-orders/${id}/approve`, {}),
        onSuccess: () => {
            toastSuccess('Purchase order approved!');
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to approve')
    });

    const receiveMutation = useMutation({
        mutationFn: ({ id, items }: { id: number; items: any[] }) =>
            apiPost(`/api/purchase-orders/${id}/receive`, { items }),
        onSuccess: () => {
            toastSuccess('Items received successfully!');
            setOpenReceive(false);
            setSelectedPO(null);
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to receive items')
    });

    const cancelMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/purchase-orders/${id}/cancel`, {}),
        onSuccess: () => {
            toastSuccess('Purchase order cancelled');
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to cancel')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/purchase-orders/${id}`),
        onSuccess: () => {
            toastSuccess('Purchase order deleted');
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to delete')
    });

    const resetForm = () => {
        setFormData({
            supplier_id: '',
            location_id: '',
            order_date: new Date().toISOString().split('T')[0],
            expected_delivery_date: '',
            status: 'draft',
            notes: '',
            items: []
        });
        setError('');
    };

    const addLineItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { ingredient_id: 0, quantity: 1, unit_price: 0 }]
        });
    };

    const removeLineItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateLineItem = (index: number, field: keyof POItem, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.items.length === 0) {
            setError('Please add at least one item');
            return;
        }

        const data = {
            ...formData,
            supplier_id: parseInt(formData.supplier_id),
            location_id: formData.location_id ? parseInt(formData.location_id) : null
        };

        createMutation.mutate(data);
    };

    const handleReceive = () => {
        if (!selectedPO) return;
        receiveMutation.mutate({ id: selectedPO.id, items: receiveItems });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'approved': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'ordered': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'partially_received': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'received': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

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
                                Purchase Orders
                            </h1>
                            <p className="text-gray-400 mt-1">Manage supplier orders and inventory receiving</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Pending Approval</div>
                                <div className="text-xl font-bold text-yellow-400">{stats?.pending_approval || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Awaiting Receipt</div>
                                <div className="text-xl font-bold text-purple-400">{stats?.pending_receipt || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">This Month</div>
                                <div className="text-xl font-bold text-blue-400">{stats?.this_month || 0}</div>
                            </div>
                        </div>

                        <Button
                            onClick={() => { resetForm(); setOpenCreate(true); }}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create PO
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
                            placeholder="Search POs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-400"
                        />
                    </div>

                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Status</option>
                        <option value="draft" className="text-black">Draft</option>
                        <option value="pending" className="text-black">Pending</option>
                        <option value="approved" className="text-black">Approved</option>
                        <option value="ordered" className="text-black">Ordered</option>
                        <option value="partially_received" className="text-black">Partially Received</option>
                        <option value="received" className="text-black">Received</option>
                        <option value="cancelled" className="text-black">Cancelled</option>
                    </select>

                    <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Suppliers</option>
                        {suppliers?.data?.map((supplier: Supplier) => (
                            <option key={supplier.id} value={supplier.id} className="text-black">{supplier.name}</option>
                        ))}
                    </select>

                    <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Locations</option>
                        {locations?.data?.map((location: Location) => (
                            <option key={location.id} value={location.id} className="text-black">{location.name}</option>
                        ))}
                    </select>

                    <Button variant="secondary" onClick={() => { setSearch(''); setStatusFilter('all'); setSupplierFilter('all'); setLocationFilter('all'); }}
                        className="border-white/20 hover:bg-white/10">Clear</Button>
                </motion.div>

                {/* PO Grid */}
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
                        purchaseOrders?.data?.map((po: PurchaseOrder, index: number) => (
                            <motion.div key={po.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}>
                                <Card className="bg-white/5 border-white/10 backdrop-blur-md hover:bg-white/10 transition-all duration-300">
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-white text-lg">{po.po_number}</h3>
                                                <p className="text-sm text-gray-400">{po.supplier?.name}</p>
                                            </div>
                                            <Badge className={getStatusColor(po.status)}>
                                                {po.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Order Date:</span>
                                                <span className="text-white">{new Date(po.order_date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Total:</span>
                                                <span className="text-white font-semibold">${po.total_amount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-400">Items:</span>
                                                <span className="text-white">{po.items?.length || 0}</span>
                                            </div>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="flex gap-2 mb-2">
                                            {po.status === 'pending' && (
                                                <Button size="sm" variant="primary"
                                                    onClick={() => approveMutation.mutate(po.id)}
                                                    className="flex-1 bg-green-600 hover:bg-green-700">
                                                    <CheckCircle className="w-3 h-3 mr-1" />Approve
                                                </Button>
                                            )}
                                            {(po.status === 'ordered' || po.status === 'partially_received') && (
                                                <Button size="sm" variant="primary"
                                                    onClick={() => {
                                                        setSelectedPO(po);
                                                        setReceiveItems(po.items?.map(item => ({
                                                            item_id: item.id!,
                                                            quantity_received: 0
                                                        })) || []);
                                                        setOpenReceive(true);
                                                    }}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700">
                                                    <Package className="w-3 h-3 mr-1" />Receive
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <Button size="sm" variant="secondary" onClick={() => { setSelectedPO(po); setOpenView(true); }}
                                                className="flex-1 border-white/20 hover:bg-white/10">
                                                <Eye className="w-3 h-3 mr-1" />View
                                            </Button>
                                            {['draft', 'pending'].includes(po.status) && (
                                                <Button size="sm" variant="danger"
                                                    onClick={() => window.confirm('Cancel this PO?') && cancelMutation.mutate(po.id)}
                                                    className="border-red-500/20 hover:bg-red-500/10 text-red-400">
                                                    <XCircle className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                <Modal open={openCreate} onClose={() => { setOpenCreate(false); resetForm(); }}
                    title="Create Purchase Order" size="xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Supplier *</label>
                                <select required value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                                    <option value="">Select Supplier</option>
                                    {suppliers?.data?.map((supplier: Supplier) => (
                                        <option key={supplier.id} value={supplier.id} className="bg-gray-800">{supplier.name}</option>
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
                                <label className="block text-sm font-medium text-gray-300 mb-2">Order Date *</label>
                                <Input type="date" required value={formData.order_date} onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Expected Delivery</label>
                                <Input type="date" value={formData.expected_delivery_date} onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white" rows={2} />
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-medium text-gray-300">Line Items *</label>
                                <Button type="button" size="sm" onClick={addLineItem}
                                    className="bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-3 h-3 mr-1" />Add Item
                                </Button>
                            </div>

                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {formData.items.map((item, index) => (
                                    <div key={index} className="bg-white/5 p-3 rounded-lg border border-white/10 grid grid-cols-12 gap-2">
                                        <select required value={item.ingredient_id} onChange={(e) => updateLineItem(index, 'ingredient_id', parseInt(e.target.value))}
                                            className="col-span-5 bg-white/10 border border-white/10 rounded px-2 py-1 text-white text-sm">
                                            <option value={0}>Select Ingredient</option>
                                            {ingredients?.data?.map((ing: Ingredient) => (
                                                <option key={ing.id} value={ing.id} className="bg-gray-800">{ing.name}</option>
                                            ))}
                                        </select>
                                        <Input type="number" step="0.01" required min="0.01" placeholder="Qty" value={item.quantity}
                                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                                            className="col-span-2 bg-white/10 border-white/10 text-white text-sm" />
                                        <Input type="number" step="0.01" required min="0" placeholder="Price" value={item.unit_price}
                                            onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value))}
                                            className="col-span-2 bg-white/10 border-white/10 text-white text-sm" />
                                        <div className="col-span-2 text-sm text-white flex items-center">
                                            ${(item.quantity * item.unit_price).toFixed(2)}
                                        </div>
                                        <button type="button" onClick={() => removeLineItem(index)}
                                            className="col-span-1 text-red-400 hover:text-red-300">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {formData.items.length > 0 && (
                                <div className="mt-3 flex justify-end">
                                    <div className="bg-white/10 px-4 py-2 rounded-lg">
                                        <span className="text-sm text-gray-400 mr-2">Total:</span>
                                        <span className="text-lg font-bold text-white">${totalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); resetForm(); }}
                                className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={createMutation.isPending}
                                className="flex-1">Create Purchase Order</Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal open={openView} onClose={() => { setOpenView(false); setSelectedPO(null); }}
                    title="Purchase Order Details" size="lg">
                    {selectedPO && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm text-gray-400">PO Number</h3>
                                    <p className="text-white font-semibold">{selectedPO.po_number}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Status</h3>
                                    <Badge className={getStatusColor(selectedPO.status)}>
                                        {selectedPO.status.replace('_', ' ').toUpperCase()}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Supplier</h3>
                                    <p className="text-white">{selectedPO.supplier?.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm text-gray-400">Total Amount</h3>
                                    <p className="text-white font-semibold">${selectedPO.total_amount.toFixed(2)}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-white mb-3">Items</h3>
                                <div className="space-y-2">
                                    {selectedPO.items?.map((item, i) => (
                                        <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/10">
                                            <div className="flex justify-between">
                                                <span className="text-white">{item.ingredient?.name}</span>
                                                <span className="text-gray-400">{item.quantity} × ${item.unit_price} = ${(item.quantity * item.unit_price).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button variant="secondary" onClick={() => { setOpenView(false); setSelectedPO(null); }}
                                className="w-full border-white/20 hover:bg-white/10">Close</Button>
                        </div>
                    )}
                </Modal>

                {/* Receive Modal */}
                <Modal open={openReceive} onClose={() => { setOpenReceive(false); setSelectedPO(null); }}
                    title="Receive Items" size="lg">
                    {selectedPO && (
                        <div className="space-y-4">
                            <p className="text-gray-400">PO: {selectedPO.po_number}</p>

                            <div className="space-y-3">
                                {selectedPO.items?.map((item, index) => {
                                    const remaining = item.quantity - (item.quantity_received || 0);
                                    return (
                                        <div key={item.id} className="bg-white/5 p-4 rounded-lg border border-white/10">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-white font-medium">{item.ingredient?.name}</span>
                                                <span className="text-gray-400">Remaining: {remaining}</span>
                                            </div>
                                            <Input type="number" step="0.01" min="0" max={remaining}
                                                placeholder="Quantity to receive"
                                                value={receiveItems[index]?.quantity_received || 0}
                                                onChange={(e) => {
                                                    const newItems = [...receiveItems];
                                                    newItems[index] = { ...newItems[index], quantity_received: parseFloat(e.target.value) || 0 };
                                                    setReceiveItems(newItems);
                                                }}
                                                className="bg-white/10 border-white/10 text-white" />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="secondary" onClick={() => { setOpenReceive(false); setSelectedPO(null); }}
                                    className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                                <Button variant="primary" onClick={handleReceive} disabled={receiveMutation.isPending}
                                    className="flex-1">Confirm Receipt</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
