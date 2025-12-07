import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Clock,
    Package, TrendingUp, Calendar, DollarSign, Truck, FileText,
    ChevronLeft, ChevronRight, Send, ShoppingCart, AlertCircle,
    Building2, MapPin, User
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon Component
const POStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider font-semibold">Pending Approval</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.pendingApproval}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-500/30 rounded-2xl p-5 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-purple-600 dark:text-purple-400 text-xs uppercase tracking-wider font-semibold">Awaiting Receipt</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.awaitingReceipt}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-5 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-blue-600 dark:text-blue-400 text-xs uppercase tracking-wider font-semibold">This Month</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.thisMonth}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider font-semibold">Total Value</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">${parseFloat(String(stats.totalValue || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>
        </motion.div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl p-5 shadow-sm"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">Total POs</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-slate-700/50 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-600 dark:text-slate-400" />
                </div>
            </div>
        </motion.div>
    </div>
);

interface POItem {
    id?: number;
    ingredient_id: number;
    ingredient?: { name: string };
    quantity: number;
    unit_price: number;
    quantity_received?: number;
    quantity_ordered?: number;
}

interface PurchaseOrder {
    id: number;
    po_number: string;
    supplier_id: number;
    supplier?: { name: string };
    location_id?: number;
    location?: { name: string };
    order_date: string;
    expected_delivery_date?: string;
    status: string;
    total_amount: number;
    notes?: string;
    items?: POItem[];
}

// Status configuration with colors and icons
const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    draft: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: FileText, label: 'Draft' },
    pending: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Clock, label: 'Pending' },
    approved: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle, label: 'Approved' },
    ordered: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Send, label: 'Ordered' },
    partially_received: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Package, label: 'Partial' },
    received: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: CheckCircle, label: 'Received' },
    cancelled: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle, label: 'Cancelled' }
};

export default function PurchaseOrders() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [supplierFilter, setSupplierFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openReceive, setOpenReceive] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [receiveItems, setReceiveItems] = useState<{ item_id: number; quantity_received: number }[]>([]);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(15);

    const [formData, setFormData] = useState({
        supplier_id: '',
        location_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        status: 'draft',
        notes: '',
        items: [] as POItem[]
    });

    // Fetch Data
    const { data: purchaseOrders, isLoading } = useQuery({
        queryKey: ['purchase-orders', page, search, statusFilter, supplierFilter],
        queryFn: () => {
            let url = `/api/admin/purchase-orders?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (supplierFilter !== 'all') url += `&supplier_id=${supplierFilter}`;
            return apiGet(url);
        }
    });

    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => apiGet('/api/suppliers')
    });

    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/locations')
    });

    const { data: ingredients } = useQuery({
        queryKey: ['ingredients'],
        queryFn: () => apiGet('/api/admin/ingredients')
    });

    const { data: statsData } = useQuery({
        queryKey: ['purchase-orders-stats'],
        queryFn: () => apiGet('/api/admin/purchase-orders-stats')
    });

    // Process the response data correctly
    const poList = useMemo(() => {
        if (!purchaseOrders) return [];
        // Handle both array and paginated response formats
        if (Array.isArray(purchaseOrders)) return purchaseOrders;
        if (purchaseOrders.data) return purchaseOrders.data;
        return [];
    }, [purchaseOrders]);

    const paginationMeta = useMemo(() => {
        if (!purchaseOrders) return { current_page: 1, last_page: 1, total: 0 };
        return purchaseOrders.meta || purchaseOrders;
    }, [purchaseOrders]);

    // Process suppliers/locations/ingredients correctly
    const supplierList = useMemo(() => {
        if (!suppliers) return [];
        if (Array.isArray(suppliers)) return suppliers;
        if (suppliers.data) return suppliers.data;
        return [];
    }, [suppliers]);

    const locationList = useMemo(() => {
        if (!locations) return [];
        if (Array.isArray(locations)) return locations;
        if (locations.data) return locations.data;
        return [];
    }, [locations]);

    const ingredientList = useMemo(() => {
        if (!ingredients) return [];
        if (Array.isArray(ingredients)) return ingredients;
        if (ingredients.data) return ingredients.data;
        return [];
    }, [ingredients]);

    const stats = useMemo(() => ({
        pendingApproval: statsData?.pending_approval || 0,
        awaitingReceipt: statsData?.pending_receipt || 0,
        thisMonth: statsData?.this_month || 0,
        totalValue: statsData?.total_value || 0,
        total: statsData?.total || paginationMeta?.total || poList.length
    }), [statsData, paginationMeta, poList]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/purchase-orders', data),
        onSuccess: () => {
            toastSuccess('Purchase order created successfully');
            closeModal();
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to create purchase order')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/api/admin/purchase-orders/${id}`, data),
        onSuccess: () => {
            toastSuccess('Purchase order updated successfully');
            closeModal();
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to update purchase order')
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/admin/purchase-orders/${id}/approve`, {}),
        onSuccess: () => {
            toastSuccess('Purchase order approved');
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to approve')
    });

    const markOrderedMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/admin/purchase-orders/${id}/mark-ordered`, {}),
        onSuccess: () => {
            toastSuccess('Marked as ordered');
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to mark as ordered')
    });

    const receiveMutation = useMutation({
        mutationFn: ({ id, items }: { id: number; items: any[] }) => apiPost(`/api/admin/purchase-orders/${id}/receive`, { items }),
        onSuccess: () => {
            toastSuccess('Items received successfully');
            setOpenReceive(false);
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
            qc.invalidateQueries({ queryKey: ['inventory'] });
            qc.invalidateQueries({ queryKey: ['ingredients'] });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to receive items')
    });

    const cancelMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/admin/purchase-orders/${id}/cancel`, {}),
        onSuccess: () => {
            toastSuccess('Purchase order cancelled');
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to cancel')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/purchase-orders/${id}`),
        onSuccess: () => {
            toastSuccess('Purchase order deleted');
            qc.invalidateQueries({ queryKey: ['purchase-orders'] });
            qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] });
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to delete')
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setSelectedPO(null);
        setFormData({
            supplier_id: '',
            location_id: '',
            order_date: new Date().toISOString().split('T')[0],
            expected_delivery_date: '',
            status: 'draft',
            notes: '',
            items: []
        });
    };

    const handleCreate = () => {
        closeModal();
        setOpenCreate(true);
    };

    const handleEdit = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setFormData({
            supplier_id: String(po.supplier_id),
            location_id: po.location_id ? String(po.location_id) : '',
            order_date: po.order_date.split('T')[0],
            expected_delivery_date: po.expected_delivery_date?.split('T')[0] || '',
            status: po.status,
            notes: po.notes || '',
            items: po.items?.map(item => ({
                id: item.id,
                ingredient_id: item.ingredient_id,
                quantity: item.quantity_ordered || item.quantity || 0,
                unit_price: parseFloat(String(item.unit_price || 0))
            })) || []
        });
        setOpenEdit(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.supplier_id) {
            return toastError('Please select a supplier');
        }

        if (formData.items.length === 0) {
            return toastError('Please add at least one item');
        }

        // Validate items
        for (const item of formData.items) {
            if (!item.ingredient_id || item.ingredient_id === 0) {
                return toastError('Please select an ingredient for all items');
            }
            if (!item.quantity || item.quantity <= 0) {
                return toastError('Please enter a valid quantity for all items');
            }
        }

        const data = {
            ...formData,
            supplier_id: parseInt(formData.supplier_id),
            location_id: formData.location_id ? parseInt(formData.location_id) : null
        };

        if (openEdit && selectedPO) {
            updateMutation.mutate({ id: selectedPO.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    const addLineItem = () => setFormData({
        ...formData,
        items: [...formData.items, { ingredient_id: 0, quantity: 1, unit_price: 0 }]
    });

    const removeLineItem = (index: number) => setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
    });

    const updateLineItem = (index: number, field: keyof POItem, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const orderTotal = useMemo(() =>
        formData.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0),
        [formData.items]
    );

    const getStatusDisplay = (status: string) => {
        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;
        return (
            <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                config.color
            )}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
            </span>
        );
    };

    // PO Card Component for mobile/grid view
    const POCard = ({ po }: { po: PurchaseOrder }) => (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all shadow-sm"
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{po.po_number}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(po.order_date).toLocaleDateString()}</p>
                </div>
                {getStatusDisplay(po.status)}
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-300">{po.supplier?.name || 'Unknown Supplier'}</span>
                </div>
                {po.location && (
                    <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-300">{po.location.name}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <p className="text-lg font-bold text-emerald-400">
                    ${parseFloat(String(po.total_amount || 0)).toFixed(2)}
                </p>
                <div className="flex items-center gap-1">
                    {po.status === 'pending' && (
                        <Button
                            size="sm"
                            onClick={() => approveMutation.mutate(po.id)}
                            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                            title="Approve"
                        >
                            <CheckCircle size={14} />
                        </Button>
                    )}
                    {po.status === 'approved' && (
                        <Button
                            size="sm"
                            onClick={() => markOrderedMutation.mutate(po.id)}
                            className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700"
                            title="Mark as Ordered"
                        >
                            <Send size={14} />
                        </Button>
                    )}
                    {(po.status === 'ordered' || po.status === 'partially_received') && (
                        <Button
                            size="sm"
                            onClick={() => {
                                setSelectedPO(po);
                                setReceiveItems(po.items?.map(i => ({
                                    item_id: i.id!,
                                    quantity_received: 0
                                })) || []);
                                setOpenReceive(true);
                            }}
                            className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                            title="Receive Items"
                        >
                            <Package size={14} />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => { setSelectedPO(po); setOpenView(true); }}
                        className="h-8 w-8 p-0 border-white/10"
                    >
                        <Eye size={14} />
                    </Button>
                    {['draft', 'pending'].includes(po.status) && (
                        <>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEdit(po)}
                                className="h-8 w-8 p-0 border-white/10"
                            >
                                <Edit size={14} />
                            </Button>
                            <Button
                                size="sm"
                                variant="danger"
                                onClick={() => confirm('Cancel this purchase order?') && cancelMutation.mutate(po.id)}
                                className="h-8 w-8 p-0 border-red-500/30 hover:bg-red-500/20 text-red-400"
                            >
                                <XCircle size={14} />
                            </Button>
                        </>
                    )}
                    {po.status === 'draft' && (
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={() => confirm('Delete this purchase order?') && deleteMutation.mutate(po.id)}
                            className="h-8 w-8 p-0 border-red-500/30 hover:bg-red-500/20 text-red-400"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );

    return (
        <AdminLayout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                                <ShoppingCart className="w-5 h-5 text-white" />
                            </div>
                            Purchase Orders
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 mt-1 ml-13">Manage supplier orders and receiving</p>
                    </div>
                    <Button
                        onClick={handleCreate}
                        className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/25"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Create PO
                    </Button>
                </motion.div>

                {/* Stats Ribbon */}
                <POStatsRibbon stats={stats} />

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-sm"
                >
                    <div className="flex flex-wrap gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search PO number, supplier..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-slate-900/50 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-500 focus:border-purple-500/50"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:border-purple-500/50 outline-none min-w-[140px]"
                        >
                            <option value="all">All Status</option>
                            {Object.entries(statusConfig).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
                        </select>
                        <select
                            value={supplierFilter}
                            onChange={(e) => setSupplierFilter(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:border-purple-500/50 outline-none min-w-[160px]"
                        >
                            <option value="all">All Suppliers</option>
                            {supplierList.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                </motion.div>

                {/* Purchase Orders Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                        </div>
                    ) : poList.length === 0 ? (
                        <div className="bg-slate-800/30 border border-white/10 rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">No purchase orders found</h3>
                            <p className="text-gray-400 mb-6">Create your first purchase order to get started</p>
                            <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
                                <Plus className="w-4 h-4 mr-2" /> Create PO
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden lg:block bg-white dark:bg-slate-800/30 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm">
                                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-slate-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    <div className="col-span-2">PO Number</div>
                                    <div className="col-span-2">Supplier</div>
                                    <div className="col-span-2">Location</div>
                                    <div className="col-span-2">Date</div>
                                    <div className="col-span-2">Status</div>
                                    <div className="col-span-1">Total</div>
                                    <div className="col-span-1 text-right">Actions</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    <AnimatePresence>
                                        {poList.map((po: PurchaseOrder) => (
                                            <motion.div
                                                key={po.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 dark:hover:bg-white/5 transition-all group border-b border-gray-100 dark:border-white/5 last:border-0"
                                            >
                                                <div className="col-span-2 font-mono text-sm text-gray-900 dark:text-white font-medium">{po.po_number}</div>
                                                <div className="col-span-2 text-sm text-gray-600 dark:text-gray-300">{po.supplier?.name || '-'}</div>
                                                <div className="col-span-2 text-sm text-gray-500 dark:text-gray-400">{po.location?.name || '-'}</div>
                                                <div className="col-span-2 text-sm text-gray-500 dark:text-gray-300">{new Date(po.order_date).toLocaleDateString()}</div>
                                                <div className="col-span-2">{getStatusDisplay(po.status)}</div>
                                                <div className="col-span-1 text-sm font-bold text-emerald-400">
                                                    ${parseFloat(String(po.total_amount || 0)).toFixed(2)}
                                                </div>
                                                <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {po.status === 'pending' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => approveMutation.mutate(po.id)}
                                                            className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle size={12} />
                                                        </Button>
                                                    )}
                                                    {po.status === 'approved' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => markOrderedMutation.mutate(po.id)}
                                                            className="h-7 w-7 p-0 bg-purple-600 hover:bg-purple-700"
                                                            title="Mark Ordered"
                                                        >
                                                            <Send size={12} />
                                                        </Button>
                                                    )}
                                                    {(po.status === 'ordered' || po.status === 'partially_received') && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPO(po);
                                                                setReceiveItems(po.items?.map(i => ({ item_id: i.id!, quantity_received: 0 })) || []);
                                                                setOpenReceive(true);
                                                            }}
                                                            className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700"
                                                            title="Receive"
                                                        >
                                                            <Package size={12} />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => { setSelectedPO(po); setOpenView(true); }}
                                                        className="h-7 w-7 p-0 border-white/10"
                                                    >
                                                        <Eye size={12} />
                                                    </Button>
                                                    {['draft', 'pending'].includes(po.status) && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => handleEdit(po)}
                                                                className="h-7 w-7 p-0 border-white/10"
                                                            >
                                                                <Edit size={12} />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                onClick={() => confirm('Cancel this PO?') && cancelMutation.mutate(po.id)}
                                                                className="h-7 w-7 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"
                                                            >
                                                                <XCircle size={12} />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Mobile/Tablet Card View */}
                            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                                {poList.map((po: PurchaseOrder) => (
                                    <POCard key={po.id} po={po} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {paginationMeta.last_page > 1 && (
                                <div className="flex items-center justify-between mt-6 px-4 py-3 bg-slate-800/30 border border-white/10 rounded-xl">
                                    <p className="text-sm text-gray-400">
                                        Showing page {paginationMeta.current_page} of {paginationMeta.last_page}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="border-white/10"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setPage(p => Math.min(paginationMeta.last_page, p + 1))}
                                            disabled={page >= paginationMeta.last_page}
                                            className="border-white/10"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>

            {/* Create/Edit Modal */}
            <Modal open={openCreate || openEdit} onClose={closeModal} title={openEdit ? "Edit Purchase Order" : "Create Purchase Order"} size="xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Supplier <span className="text-red-400">*</span>
                            </label>
                            <select
                                value={formData.supplier_id}
                                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                required
                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500/50 outline-none"
                            >
                                <option value="">Select Supplier</option>
                                {supplierList.map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {supplierList.length === 0 && (
                                <p className="text-amber-400 text-xs mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> No suppliers available. Add suppliers first.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                            <select
                                value={formData.location_id}
                                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500/50 outline-none"
                            >
                                <option value="">None</option>
                                {locationList.map((l: any) => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Order Date <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.order_date}
                                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                                required
                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500/50 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expected Delivery</label>
                            <input
                                type="date"
                                value={formData.expected_delivery_date}
                                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:border-purple-500/50 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            placeholder="Optional notes for this purchase order..."
                            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500/50 outline-none resize-none"
                        />
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Order Items <span className="text-red-400">*</span>
                            </label>
                            {ingredientList.length === 0 && (
                                <span className="text-amber-400 text-xs flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> No ingredients available
                                </span>
                            )}
                        </div>

                        {formData.items.length > 0 && (
                            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-2 font-semibold uppercase">
                                <div className="col-span-5">Ingredient</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-center">Unit Price</div>
                                <div className="col-span-2 text-right">Total</div>
                                <div className="col-span-1"></div>
                            </div>
                        )}

                        <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                            <AnimatePresence>
                                {formData.items.map((item, i) => {
                                    const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-200 dark:border-white/10"
                                        >
                                            <select
                                                value={item.ingredient_id}
                                                onChange={(e) => updateLineItem(i, 'ingredient_id', parseInt(e.target.value))}
                                                className="col-span-5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white text-sm focus:border-purple-500/50 outline-none"
                                            >
                                                <option value={0}>Select Ingredient</option>
                                                {ingredientList.map((ing: any) => (
                                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                                ))}
                                            </select>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={item.quantity || ''}
                                                    onChange={(e) => updateLineItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-center focus:border-purple-500/50 outline-none"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.unit_price || ''}
                                                        onChange={(e) => updateLineItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        className="w-full bg-slate-900 border border-white/10 rounded-lg pl-6 pr-2 py-2 text-white text-sm text-center focus:border-purple-500/50 outline-none"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <span className="text-emerald-400 font-semibold text-sm">${lineTotal.toFixed(2)}</span>
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="danger"
                                                    onClick={() => removeLineItem(i)}
                                                    className="h-8 w-8 p-0 border-red-500/30 hover:bg-red-500/20"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        <button
                            type="button"
                            onClick={addLineItem}
                            disabled={ingredientList.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4" /> Add Item
                        </button>

                        {/* Order Total */}
                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <span className="text-gray-400 font-medium">Order Total:</span>
                            <span className="text-white font-bold text-2xl">${orderTotal.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1 border-white/10">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                openEdit ? 'Update PO' : 'Create PO'
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Details Modal */}
            <Modal open={openView} onClose={() => setOpenView(false)} title="Purchase Order Details" size="lg">
                {selectedPO && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">PO Number</p>
                                <p className="text-white font-mono font-medium">{selectedPO.po_number}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Status</p>
                                <div className="mt-1">{getStatusDisplay(selectedPO.status)}</div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Supplier</p>
                                <p className="text-white font-medium">{selectedPO.supplier?.name || '-'}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Location</p>
                                <p className="text-white font-medium">{selectedPO.location?.name || 'Not specified'}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Order Date</p>
                                <p className="text-white font-medium">{new Date(selectedPO.order_date).toLocaleDateString()}</p>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4">
                                <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Total Amount</p>
                                <p className="text-emerald-400 font-bold text-xl">${parseFloat(String(selectedPO.total_amount || 0)).toFixed(2)}</p>
                            </div>
                        </div>

                        {selectedPO.notes && (
                            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Notes</p>
                                <p className="text-gray-700 dark:text-gray-300">{selectedPO.notes}</p>
                            </div>
                        )}

                        <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                            <h3 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" /> Order Items
                            </h3>
                            <div className="space-y-2">
                                {selectedPO.items?.map((item, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                        <div>
                                            <span className="text-gray-900 dark:text-white font-medium">{item.ingredient?.name || 'Unknown Item'}</span>
                                            <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                                                Qty: {item.quantity_ordered || item.quantity} × ${parseFloat(String(item.unit_price || 0)).toFixed(2)}
                                            </p>
                                        </div>
                                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                            ${((item.quantity_ordered || item.quantity || 0) * parseFloat(String(item.unit_price || 0))).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Button onClick={() => setOpenView(false)} className="w-full bg-slate-700 hover:bg-slate-600">
                            Close
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Receive Items Modal */}
            <Modal open={openReceive} onClose={() => setOpenReceive(false)} title="Receive Items" size="lg">
                {selectedPO && (
                    <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Receiving items for <span className="text-gray-900 dark:text-white font-mono font-medium">{selectedPO.po_number}</span></p>
                        </div>

                        <div className="space-y-3">
                            {selectedPO.items?.map((item, i) => {
                                const ordered = item.quantity_ordered || item.quantity || 0;
                                const received = item.quantity_received || 0;
                                const remaining = ordered - received;

                                return (
                                    <div key={i} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                                        <div className="flex justify-between mb-3">
                                            <span className="text-gray-900 dark:text-white font-medium">{item.ingredient?.name || 'Unknown Item'}</span>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Ordered: {ordered}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Already Received: {received}</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Remaining: {remaining}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-gray-500 dark:text-gray-400 text-xs font-medium mb-1 block">Quantity to Receive</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={remaining}
                                                value={receiveItems[i]?.quantity_received || 0}
                                                onChange={(e) => {
                                                    const newItems = [...receiveItems];
                                                    newItems[i] = { ...newItems[i], quantity_received: parseFloat(e.target.value) || 0 };
                                                    setReceiveItems(newItems);
                                                }}
                                                className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white focus:border-purple-500/50 outline-none"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setOpenReceive(false)} className="flex-1 border-white/10">
                                Cancel
                            </Button>
                            <Button
                                onClick={() => receiveMutation.mutate({ id: selectedPO.id, items: receiveItems })}
                                disabled={receiveMutation.isPending}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                            >
                                {receiveMutation.isPending ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Package className="w-4 h-4 mr-2" /> Confirm Receipt
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
