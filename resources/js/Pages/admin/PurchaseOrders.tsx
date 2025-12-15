import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Clock,
    Package, Calendar, DollarSign, Truck, FileText, Send, ShoppingCart,
    AlertCircle, Building2, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Enhanced StatCard
const StatCard = ({ title, value, icon: Icon, color, index = 0, subtext }: any) => {
    const colorStyles: Record<string, any> = {
        purple: { gradient: 'from-purple-500/20 to-fuchsia-500/10', iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-600', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', shadow: 'shadow-purple-500/20' },
        amber: { gradient: 'from-amber-500/20 to-orange-500/10', iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', shadow: 'shadow-amber-500/20' },
        emerald: { gradient: 'from-emerald-500/20 to-green-500/10', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/20' },
        blue: { gradient: 'from-blue-500/20 to-cyan-500/10', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' },
        rose: { gradient: 'from-rose-500/20 to-red-500/10', iconBg: 'bg-gradient-to-br from-rose-500 to-red-600', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', shadow: 'shadow-rose-500/20' },
    };
    const styles = colorStyles[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
                `bg-gradient-to-br ${styles.gradient}`,
                styles.border,
                `shadow-lg ${styles.shadow}`
            )}
        >
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8">
                <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
            </div>
            <div className="relative p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">{title}</p>
                        <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
                        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                    </div>
                    <div className={cn("p-3 rounded-xl shadow-lg", styles.iconBg)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

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

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    draft: { color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', icon: FileText, label: 'Draft' },
    pending: { color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Clock, label: 'Pending' },
    approved: { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: CheckCircle, label: 'Approved' },
    ordered: { color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: Send, label: 'Ordered' },
    partially_received: { color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', icon: Package, label: 'Partial' },
    received: { color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle, label: 'Received' },
    cancelled: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: XCircle, label: 'Cancelled' }
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

    const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => apiGet('/api/suppliers') });
    const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => apiGet('/api/locations') });
    const { data: ingredients } = useQuery({ queryKey: ['ingredients'], queryFn: () => apiGet('/api/admin/ingredients') });
    const { data: statsData } = useQuery({ queryKey: ['purchase-orders-stats'], queryFn: () => apiGet('/api/admin/purchase-orders-stats') });

    const poList = useMemo(() => purchaseOrders?.data || [], [purchaseOrders]);
    const paginationMeta = useMemo(() => purchaseOrders?.meta || { current_page: 1, last_page: 1, total: 0 }, [purchaseOrders]);
    const supplierList = useMemo(() => suppliers?.data || [], [suppliers]);
    const locationList = useMemo(() => locations?.data || [], [locations]);
    const ingredientList = useMemo(() => ingredients?.data || [], [ingredients]);

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
        onSuccess: () => { toastSuccess('Purchase order created'); closeModal(); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to create PO')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => apiPut(`/api/admin/purchase-orders/${id}`, data),
        onSuccess: () => { toastSuccess('Purchase order updated'); closeModal(); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to update PO')
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/admin/purchase-orders/${id}/approve`, {}),
        onSuccess: () => { toastSuccess('Purchase order approved'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to approve')
    });

    const markOrderedMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/admin/purchase-orders/${id}/mark-ordered`, {}),
        onSuccess: () => { toastSuccess('Marked as ordered'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to mark ordered')
    });

    const receiveMutation = useMutation({
        mutationFn: ({ id, items }: { id: number; items: any[] }) => apiPost(`/api/admin/purchase-orders/${id}/receive`, { items }),
        onSuccess: () => { toastSuccess('Items received'); setOpenReceive(false); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); qc.invalidateQueries({ queryKey: ['inventory'] }); qc.invalidateQueries({ queryKey: ['ingredients'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to receive items')
    });

    const cancelMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/admin/purchase-orders/${id}/cancel`, {}),
        onSuccess: () => { toastSuccess('Purchase order cancelled'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to cancel')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/admin/purchase-orders/${id}`),
        onSuccess: () => { toastSuccess('Purchase order deleted'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to delete')
    });

    const closeModal = () => {
        setOpenCreate(false);
        setOpenEdit(false);
        setSelectedPO(null);
        setFormData({ supplier_id: '', location_id: '', order_date: new Date().toISOString().split('T')[0], expected_delivery_date: '', status: 'draft', notes: '', items: [] });
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
            items: po.items?.map(item => ({ id: item.id, ingredient_id: item.ingredient_id, quantity: item.quantity_ordered || item.quantity || 0, unit_price: parseFloat(String(item.unit_price || 0)) })) || []
        });
        setOpenEdit(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.supplier_id) return toastError('Select a supplier');
        if (formData.items.length === 0) return toastError('Add at least one item');
        const data = { ...formData, supplier_id: parseInt(formData.supplier_id), location_id: formData.location_id ? parseInt(formData.location_id) : null };
        if (openEdit && selectedPO) updateMutation.mutate({ id: selectedPO.id, data });
        else createMutation.mutate(data);
    };

    const addLineItem = () => setFormData({ ...formData, items: [...formData.items, { ingredient_id: 0, quantity: 1, unit_price: 0 }] });
    const removeLineItem = (index: number) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    const updateLineItem = (index: number, field: keyof POItem, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const getStatusDisplay = (status: string) => {
        const config = statusConfig[status] || statusConfig.draft;
        const Icon = config.icon;
        return (
            <span className={cn("px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1 w-fit", config.color)}>
                <Icon size={12} /> {config.label}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-6 transition-colors relative overflow-hidden">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3"
                            >
                                <ShoppingCart className="w-8 h-8 text-purple-600" />
                                Purchase Orders
                            </motion.h1>
                            <p className="text-muted-foreground mt-2">Manage supplier orders and receiving</p>
                        </div>
                        <Button
                            onClick={() => { closeModal(); setOpenCreate(true); }}
                            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Create PO
                        </Button>
                    </div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <StatCard title="Pending" value={stats.pendingApproval} icon={Clock} color="amber" index={0} />
                        <StatCard title="Awaiting" value={stats.awaitingReceipt} icon={Truck} color="purple" index={1} />
                        <StatCard title="This Month" value={stats.thisMonth} icon={Calendar} color="blue" index={2} />
                        <StatCard title="Total Value" value={`$${parseFloat(String(stats.totalValue)).toLocaleString()}`} icon={DollarSign} color="emerald" index={3} />
                        <StatCard title="Total POs" value={stats.total} icon={FileText} color="rose" index={4} />
                    </div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg"
                    >
                        <div className="flex flex-wrap gap-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input placeholder="Search PO number, supplier..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 bg-background/50 border-border/50 focus:border-purple-500 text-foreground" />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:border-purple-500 focus:ring-purple-500/20 outline-none transition-all">
                                <option value="all">All Status</option>
                                {Object.entries(statusConfig).map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}
                            </select>
                            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
                                className="bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:border-purple-500 focus:ring-purple-500/20 outline-none transition-all">
                                <option value="all">All Suppliers</option>
                                {supplierList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </motion.div>

                    {/* Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg"
                    >
                        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-border/50 bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-purple-500/10">
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">PO Number</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Supplier</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Location</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Date</div>
                            <div className="col-span-2 text-xs font-bold text-foreground uppercase tracking-wider">Status</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider">Total</div>
                            <div className="col-span-1 text-xs font-bold text-foreground uppercase tracking-wider text-right">Actions</div>
                        </div>

                        <div className="divide-y divide-border/30">
                            {isLoading ? (
                                <div className="p-12 text-center text-muted-foreground">Loading...</div>
                            ) : poList.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/50 flex items-center justify-center">
                                        <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">No purchase orders found</p>
                                </div>
                            ) : poList.map((po: PurchaseOrder, idx: number) => (
                                <motion.div
                                    key={po.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 items-center hover:bg-purple-500/5 transition-all group"
                                >
                                    {/* Mobile/Card View adjustments can be here, keeping grid for now as per design */}
                                    <div className="col-span-2 font-mono text-sm text-foreground/70 bg-secondary/50 px-2 py-1 rounded w-fit">{po.po_number}</div>
                                    <div className="col-span-2 text-sm text-foreground">{po.supplier?.name}</div>
                                    <div className="col-span-2 text-sm text-muted-foreground">{po.location?.name || '-'}</div>
                                    <div className="col-span-2 text-sm text-muted-foreground">{new Date(po.order_date).toLocaleDateString()}</div>
                                    <div className="col-span-2">{getStatusDisplay(po.status)}</div>
                                    <div className="col-span-1 font-bold text-emerald-600 dark:text-emerald-400">${parseFloat(String(po.total_amount)).toFixed(2)}</div>
                                    <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {po.status === 'pending' && <Button size="sm" onClick={() => approveMutation.mutate(po.id)} className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700 text-white"><CheckCircle size={14} /></Button>}
                                        {po.status === 'approved' && <Button size="sm" onClick={() => markOrderedMutation.mutate(po.id)} className="h-7 w-7 p-0 bg-purple-600 hover:bg-purple-700 text-white"><Send size={14} /></Button>}
                                        {(po.status === 'ordered' || po.status === 'partially_received') && (
                                            <Button size="sm" onClick={() => { setSelectedPO(po); setReceiveItems(po.items?.map(i => ({ item_id: i.id!, quantity_received: 0 })) || []); setOpenReceive(true); }} className="h-7 w-7 p-0 bg-blue-600 hover:bg-blue-700 text-white"><Package size={14} /></Button>
                                        )}
                                        <Button size="sm" variant="ghost" onClick={() => { setSelectedPO(po); setOpenView(true); }} className="h-7 w-7 p-0 hover:text-blue-500"><Eye size={14} /></Button>
                                        {['draft', 'pending'].includes(po.status) && (
                                            <>
                                                <Button size="sm" variant="ghost" onClick={() => handleEdit(po)} className="h-7 w-7 p-0 hover:text-amber-500"><Edit size={14} /></Button>
                                                <Button size="sm" variant="ghost" onClick={() => confirm('Delete?') && deleteMutation.mutate(po.id)} className="h-7 w-7 p-0 hover:text-red-500"><Trash2 size={14} /></Button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Create/Edit Modal */}
                <Modal open={openCreate || openEdit} onClose={closeModal} title={openEdit ? "Edit Purchase Order" : "Create Purchase Order"} size="xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Supplier</label>
                                <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })} required
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2">
                                    <option value="">Select Supplier</option>
                                    {supplierList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Location</label>
                                <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                    className="w-full bg-background border border-border rounded-xl px-3 py-2">
                                    <option value="">Select Location</option>
                                    {locationList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="border border-border rounded-xl p-4 bg-secondary/20">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold">Items</h3>
                                <Button type="button" size="sm" onClick={addLineItem} className="bg-purple-600 text-white"><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
                            </div>
                            {formData.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2 mb-2 items-end">
                                    <div className="flex-1">
                                        <select value={item.ingredient_id} onChange={(e) => updateLineItem(idx, 'ingredient_id', parseInt(e.target.value))}
                                            className="w-full bg-background border border-border rounded-lg px-2 py-1 text-sm">
                                            <option value={0}>Select Ingredient</option>
                                            {ingredientList.map((ing: any) => <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit?.code})</option>)}
                                        </select>
                                    </div>
                                    <div className="w-20">
                                        <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value))} className="h-8 text-sm" />
                                    </div>
                                    <div className="w-24">
                                        <Input type="number" placeholder="Price" value={item.unit_price} onChange={(e) => updateLineItem(idx, 'unit_price', parseFloat(e.target.value))} className="h-8 text-sm" />
                                    </div>
                                    <Button type="button" size="sm" variant="danger" onClick={() => removeLineItem(idx)} className="h-8 w-8 p-0"><Trash2 size={12} /></Button>
                                </div>
                            ))}
                            {formData.items.length === 0 && <p className="text-center text-muted-foreground text-sm italic">No items added</p>}
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Save Order</Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </AdminLayout>
    );
}
