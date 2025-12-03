import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, Plus, Eye, Edit, Trash2, CheckCircle, XCircle, Clock,
    Package, TrendingUp, Calendar, DollarSign, Truck, FileText
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Stats Ribbon
const POStatsRibbon = ({ stats }: { stats: any }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Pending Approval</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pendingApproval}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Awaiting Receipt</p>
                    <p className="text-2xl font-bold text-purple-400 mt-1">{stats.awaitingReceipt}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">This Month</p>
                    <p className="text-2xl font-bold text-blue-400 mt-1">{stats.thisMonth}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
            </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Total POs</p>
                    <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-white" />
            </div>
        </div>
    </div>
);

interface POItem { id?: number; ingredient_id: number; ingredient?: { name: string }; quantity: number; unit_price: number; quantity_received?: number; }
interface PurchaseOrder {
    id: number; po_number: string; supplier_id: number; supplier?: { name: string }; location_id?: number; location?: { name: string };
    order_date: string; expected_delivery_date?: string; status: string; total_amount: number; notes?: string; items?: POItem[];
}

export default function PurchaseOrders() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [supplierFilter, setSupplierFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');
    const [openCreate, setOpenCreate] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openReceive, setOpenReceive] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [receiveItems, setReceiveItems] = useState<{ item_id: number; quantity_received: number }[]>([]);

    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [perPage] = useState(20);

    const [formData, setFormData] = useState({
        supplier_id: '', location_id: '', order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '', status: 'draft', notes: '', items: [] as POItem[]
    });

    // Fetch Data
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

    const { data: suppliers } = useQuery({ queryKey: ['suppliers'], queryFn: () => apiGet('/api/suppliers') });
    const { data: locations } = useQuery({ queryKey: ['locations'], queryFn: () => apiGet('/api/locations') });
    const { data: ingredients } = useQuery({ queryKey: ['ingredients'], queryFn: () => apiGet('/api/admin/ingredients') });
    const { data: statsData } = useQuery({ queryKey: ['purchase-orders-stats'], queryFn: () => apiGet('/api/admin/purchase-orders-stats') });

    const poList = useMemo(() => purchaseOrders?.data || [], [purchaseOrders]);

    const stats = useMemo(() => ({
        pendingApproval: statsData?.pending_approval || 0,
        awaitingReceipt: statsData?.pending_receipt || 0,
        thisMonth: statsData?.this_month || 0,
        total: purchaseOrders?.meta?.total || 0
    }), [statsData, purchaseOrders]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/purchase-orders', data),
        onSuccess: () => { toastSuccess('PO created'); closeModal(); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed')
    });

    const approveMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/purchase-orders/${id}/approve`, {}),
        onSuccess: () => { toastSuccess('PO approved'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); }
    });

    const receiveMutation = useMutation({
        mutationFn: ({ id, items }: { id: number; items: any[] }) => apiPost(`/api/purchase-orders/${id}/receive`, { items }),
        onSuccess: () => { toastSuccess('Items received'); setOpenReceive(false); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); qc.invalidateQueries({ queryKey: ['purchase-orders-stats'] }); }
    });

    const cancelMutation = useMutation({
        mutationFn: (id: number) => apiPost(`/api/purchase-orders/${id}/cancel`, {}),
        onSuccess: () => { toastSuccess('PO cancelled'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => apiDelete(`/api/purchase-orders/${id}`),
        onSuccess: () => { toastSuccess('PO deleted'); qc.invalidateQueries({ queryKey: ['purchase-orders'] }); }
    });

    const closeModal = () => {
        setOpenCreate(false);
        setFormData({
            supplier_id: '', location_id: '', order_date: new Date().toISOString().split('T')[0],
            expected_delivery_date: '', status: 'draft', notes: '', items: []
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.items.length === 0) return toastError('Add at least one item');
        const data = {
            ...formData,
            supplier_id: parseInt(formData.supplier_id),
            location_id: formData.location_id ? parseInt(formData.location_id) : null
        };
        createMutation.mutate(data);
    };

    const addLineItem = () => setFormData({ ...formData, items: [...formData.items, { ingredient_id: 0, quantity: 1, unit_price: 0 }] });
    const removeLineItem = (index: number) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    const updateLineItem = (index: number, field: keyof POItem, value: any) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
            pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            ordered: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            partially_received: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
            received: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
        return colors[status] || colors.draft;
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-slate-900 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Purchase Orders</h1>
                        <p className="text-slate-400 mt-1">Supplier orders and receiving</p>
                    </div>
                    <Button onClick={() => { closeModal(); setOpenCreate(true); }} className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" /> Create PO
                    </Button>
                </div>

                <POStatsRibbon stats={stats} />

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input placeholder="Search POs..." value={search} onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-gray-500" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Status</option>
                            {['draft', 'pending', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'].map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>
                        <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
                            className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="all">All Suppliers</option>
                            {suppliers?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-semibold text-gray-400 uppercase">
                        <div className="col-span-2">PO Number</div>
                        <div className="col-span-2">Supplier</div>
                        <div className="col-span-2">Location</div>
                        <div className="col-span-2">Date</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1">Total</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : poList.map((po: PurchaseOrder) => (
                            <motion.div key={po.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                <div className="col-span-2 font-mono text-sm text-white">{po.po_number}</div>
                                <div className="col-span-2 text-sm text-gray-300">{po.supplier?.name}</div>
                                <div className="col-span-2 text-sm text-gray-300">{po.location?.name || '-'}</div>
                                <div className="col-span-2 text-sm text-gray-300">{new Date(po.order_date).toLocaleDateString()}</div>
                                <div className="col-span-2">
                                    <span className={cn("px-2 py-1 rounded-md text-xs font-medium border", getStatusColor(po.status))}>
                                        {po.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="col-span-1 text-sm font-bold text-emerald-400">${po.total_amount.toFixed(2)}</div>
                                <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {po.status === 'pending' && <Button size="sm" variant="primary" onClick={() => approveMutation.mutate(po.id)} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700" title="Approve"><CheckCircle size={14} /></Button>}
                                    {(po.status === 'ordered' || po.status === 'partially_received') && (
                                        <Button size="sm" variant="primary" onClick={() => { setSelectedPO(po); setReceiveItems(po.items?.map(i => ({ item_id: i.id!, quantity_received: 0 })) || []); setOpenReceive(true); }} className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700" title="Receive"><Package size={14} /></Button>
                                    )}
                                    <Button size="sm" variant="secondary" onClick={() => { setSelectedPO(po); setOpenView(true); }} className="h-8 w-8 p-0 border-white/10"><Eye size={14} /></Button>
                                    {['draft', 'pending'].includes(po.status) && <Button size="sm" variant="danger" onClick={() => confirm('Cancel?') && cancelMutation.mutate(po.id)} className="h-8 w-8 p-0 border-red-500/20 hover:bg-red-500/20 text-red-400"><XCircle size={14} /></Button>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal open={openCreate} onClose={closeModal} title="Create Purchase Order" size="xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
                            <select value={formData.supplier_id} onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })} required
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                                <option value="">Select Supplier</option>
                                {suppliers?.data?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                            <select value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white">
                                <option value="">None</option>
                                {locations?.data?.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Order Date" type="date" value={formData.order_date} onChange={(e) => setFormData({ ...formData, order_date: e.target.value })} required className="bg-slate-950 border-white/10" />
                        <Input label="Expected Delivery" type="date" value={formData.expected_delivery_date} onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })} className="bg-slate-950 border-white/10" />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">Items</label>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {formData.items.map((item, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <select value={item.ingredient_id} onChange={(e) => updateLineItem(i, 'ingredient_id', parseInt(e.target.value))}
                                        className="flex-1 bg-slate-950 border border-white/10 rounded px-2 py-1 text-white text-sm">
                                        <option value={0}>Select Ingredient</option>
                                        {ingredients?.data?.map((ing: any) => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                                    </select>
                                    <Input type="number" step="0.01" value={item.quantity} onChange={(e) => updateLineItem(i, 'quantity', parseFloat(e.target.value))} className="w-20 bg-slate-950 border-white/10 text-sm" placeholder="Qty" />
                                    <Input type="number" step="0.01" value={item.unit_price} onChange={(e) => updateLineItem(i, 'unit_price', parseFloat(e.target.value))} className="w-20 bg-slate-950 border-white/10 text-sm" placeholder="Price" />
                                    <Button type="button" size="sm" variant="danger" onClick={() => removeLineItem(i)} className="h-8 w-8 p-0"><Trash2 size={14} /></Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" size="sm" onClick={addLineItem} className="w-full border-dashed border-white/20 hover:bg-white/5 mt-2">+ Add Item</Button>
                        <div className="text-right text-white font-bold pt-2">Total: ${formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2)}</div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={closeModal} className="flex-1">Cancel</Button>
                        <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">Create PO</Button>
                    </div>
                </form>
            </Modal>

            <Modal open={openView} onClose={() => setOpenView(false)} title="PO Details" size="lg">
                {selectedPO && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-gray-400">PO #:</span> <span className="text-white">{selectedPO.po_number}</span></div>
                            <div><span className="text-gray-400">Supplier:</span> <span className="text-white">{selectedPO.supplier?.name}</span></div>
                            <div><span className="text-gray-400">Status:</span> <span className="text-white capitalize">{selectedPO.status.replace('_', ' ')}</span></div>
                            <div><span className="text-gray-400">Total:</span> <span className="text-emerald-400 font-bold">${selectedPO.total_amount.toFixed(2)}</span></div>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-white font-medium mb-2">Items</h3>
                            <div className="space-y-2">
                                {selectedPO.items?.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm bg-white/5 p-2 rounded">
                                        <span className="text-white">{item.ingredient?.name}</span>
                                        <span className="text-gray-400">{item.quantity} × ${item.unit_price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button onClick={() => setOpenView(false)} className="w-full mt-4">Close</Button>
                    </div>
                )}
            </Modal>

            <Modal open={openReceive} onClose={() => setOpenReceive(false)} title="Receive Items" size="lg">
                {selectedPO && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {selectedPO.items?.map((item, i) => {
                                const remaining = item.quantity - (item.quantity_received || 0);
                                return (
                                    <div key={i} className="bg-white/5 p-3 rounded border border-white/10">
                                        <div className="flex justify-between mb-2 text-sm">
                                            <span className="text-white">{item.ingredient?.name}</span>
                                            <span className="text-gray-400">Remaining: {remaining}</span>
                                        </div>
                                        <Input type="number" max={remaining} value={receiveItems[i]?.quantity_received || 0}
                                            onChange={(e) => {
                                                const newItems = [...receiveItems];
                                                newItems[i] = { ...newItems[i], quantity_received: parseFloat(e.target.value) };
                                                setReceiveItems(newItems);
                                            }} className="bg-slate-950 border-white/10" />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setOpenReceive(false)} className="flex-1">Cancel</Button>
                            <Button onClick={() => receiveMutation.mutate({ id: selectedPO.id, items: receiveItems })} className="flex-1 bg-blue-600 hover:bg-blue-700">Confirm Receipt</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
