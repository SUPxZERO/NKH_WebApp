import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search,
    Plus,
    Eye,
    CheckCircle,
    XCircle,
    TrendingUp,
    TrendingDown,
    FileText,
    User,
    AlertCircle,
    Clock
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { Badge } from '@/app/components/ui/Badge';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

interface Ingredient {
    id: number;
    name: string;
    code: string;
    unit?: { code: string };
}

interface Location {
    id: number;
    name: string;
}

interface Employee {
    id: number;
    name: string;
}

interface Adjustment {
    id: number;
    ingredient_id: number;
    ingredient?: Ingredient;
    location_id: number;
    location?: Location;
    quantity_before: number;
    quantity_after: number;
    quantity_change: number;
    reason: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    adjusted_by: number;
    adjusted_by_employee?: Employee;
    approved_by?: number;
    approved_by_employee?: Employee;
    approval_notes?: string;
    created_at: string;
}

// StatCard Component with vibrant gradients - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0 }: any) => {
    const colorStyles: Record<string, { gradient: string; iconBg: string; text: string; border: string; shadow: string }> = {
        yellow: {
            gradient: 'from-yellow-500/20 to-amber-500/10',
            iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-600',
            text: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-500/30',
            shadow: 'shadow-yellow-500/20'
        },
        emerald: {
            gradient: 'from-emerald-500/20 to-green-500/10',
            iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600',
            text: 'text-emerald-600 dark:text-emerald-400',
            border: 'border-emerald-500/30',
            shadow: 'shadow-emerald-500/20'
        },
        fuchsia: {
            gradient: 'from-fuchsia-500/20 to-purple-500/10',
            iconBg: 'bg-gradient-to-br from-fuchsia-500 to-purple-600',
            text: 'text-fuchsia-600 dark:text-fuchsia-400',
            border: 'border-fuchsia-500/30',
            shadow: 'shadow-fuchsia-500/20'
        }
    };
    const styles = colorStyles[color] || colorStyles.fuchsia;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[120px] sm:min-w-0",
                `bg-gradient-to-br ${styles.gradient}`,
                styles.border,
                `shadow-lg ${styles.shadow}`
            )}
        >
            <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 hidden sm:block">
                <div className={cn("w-full h-full rounded-full opacity-20 blur-2xl", styles.iconBg)} />
            </div>
            <div className="relative p-3 sm:p-4 md:p-5">
                <div className="flex items-center justify-between gap-2">
                    <div>
                        <p className="text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-semibold mb-0.5 sm:mb-1">{title}</p>
                        <p className={cn("text-lg sm:text-2xl md:text-3xl font-bold", styles.text)}>{value}</p>
                    </div>
                    <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default function InventoryAdjustments() {
    const [search, setSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [reasonFilter, setReasonFilter] = React.useState('all');
    const [openCreate, setOpenCreate] = React.useState(false);
    const [openView, setOpenView] = React.useState(false);
    const [openApprove, setOpenApprove] = React.useState(false);
    const [openReject, setOpenReject] = React.useState(false);
    const [selectedAdjustment, setSelectedAdjustment] = React.useState<Adjustment | null>(null);
    const [error, setError] = React.useState('');
    const [approvalNotes, setApprovalNotes] = React.useState('');

    const qc = useQueryClient();
    const [page, setPage] = React.useState(1);
    const [perPage] = React.useState(12);

    const [formData, setFormData] = React.useState({
        ingredient_id: '',
        location_id: '',
        quantity_before: '',
        quantity_after: '',
        reason: 'count_error',
        notes: ''
    });

    const reasons = {
        damaged: 'Damaged',
        expired: 'Expired',
        theft: 'Theft',
        count_error: 'Count Error',
        spillage: 'Spillage',
        returned: 'Returned to Supplier',
        correction: 'Correction',
        other: 'Other'
    };

    // Fetch adjustments
    const { data: adjustments, isLoading } = useQuery({
        queryKey: ['inventory-adjustments', page, search, statusFilter, reasonFilter],
        queryFn: () => {
            let url = `/api/admin/inventory-adjustments?page=${page}&per_page=${perPage}&search=${search}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (reasonFilter !== 'all') url += `&reason=${reasonFilter}`;
            return apiGet(url);
        }
    });

    // Fetch ingredients
    const { data: ingredients } = useQuery({
        queryKey: ['ingredients'],
        queryFn: () => apiGet('/api/admin/ingredients')
    });

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/admin/locations')
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['adjustment-stats'],
        queryFn: () => apiGet('/api/admin/inventory-adjustments/stats')
    });

    // Fetch specific inventory item for "Quantity Before"
    const { data: currentInventory } = useQuery({
        queryKey: ['inventory-item', formData.ingredient_id, formData.location_id],
        queryFn: () => apiGet(`/api/admin/inventory?ingredient_id=${formData.ingredient_id}&location_id=${formData.location_id}`),
        enabled: !!formData.ingredient_id && !!formData.location_id
    });

    // Auto-fill quantity_before when inventory data is fetched
    React.useEffect(() => {
        if (currentInventory && currentInventory.data && currentInventory.data.length > 0) {
            setFormData(prev => ({ ...prev, quantity_before: currentInventory.data[0].quantity }));
        } else if (formData.ingredient_id && formData.location_id) {
            // If no inventory record exists, quantity is 0
            setFormData(prev => ({ ...prev, quantity_before: '0' }));
        }
    }, [currentInventory, formData.ingredient_id, formData.location_id]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/inventory-adjustments', data),
        onSuccess: () => {
            toastSuccess('Adjustment created successfully!');
            setOpenCreate(false);
            resetForm();
            qc.invalidateQueries({ queryKey: ['inventory-adjustments'] });
            qc.invalidateQueries({ queryKey: ['adjustment-stats'] });
            qc.invalidateQueries({ queryKey: ['inventory'] });
            qc.invalidateQueries({ queryKey: ['ingredients'] });
        },
        onError: (error: any) => setError(error.response?.data?.message || 'Failed to create adjustment')
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            apiPost(`/api/admin/inventory-adjustments/${id}/approve`, data),
        onSuccess: () => {
            toastSuccess('Adjustment approved!');
            setOpenApprove(false);
            setApprovalNotes('');
            qc.invalidateQueries({ queryKey: ['inventory-adjustments'] });
            qc.invalidateQueries({ queryKey: ['inventory'] });
            qc.invalidateQueries({ queryKey: ['ingredients'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to approve')
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) =>
            apiPost(`/api/admin/inventory-adjustments/${id}/reject`, data),
        onSuccess: () => {
            toastSuccess('Adjustment rejected');
            setOpenReject(false);
            setApprovalNotes('');
            qc.invalidateQueries({ queryKey: ['inventory-adjustments'] });
        },
        onError: (error: any) => toastError(error.response?.data?.message || 'Failed to reject')
    });

    const resetForm = () => {
        setFormData({
            ingredient_id: '',
            location_id: '',
            quantity_before: '',
            quantity_after: '',
            reason: 'count_error',
            notes: ''
        });
        setError('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const qtyBefore = parseFloat(formData.quantity_before);
        const qtyAfter = parseFloat(formData.quantity_after);

        if (qtyBefore === qtyAfter) {
            setError('Quantity before and after must be different');
            return;
        }

        const data = {
            ingredient_id: parseInt(formData.ingredient_id),
            location_id: parseInt(formData.location_id),
            quantity_before: qtyBefore,
            quantity_after: qtyAfter,
            quantity_change: qtyAfter - qtyBefore,
            reason: formData.reason,
            notes: formData.notes,
            adjusted_by: 1 // Replace with actual user ID from auth
        };

        createMutation.mutate(data);
    };

    const handleApprove = () => {
        if (!selectedAdjustment) return;

        approveMutation.mutate({
            id: selectedAdjustment.id,
            data: {
                approved_by: 1, // Replace with actual user ID
                approval_notes: approvalNotes
            }
        });
    };

    const handleReject = () => {
        if (!selectedAdjustment || !approvalNotes.trim()) {
            setError('Rejection reason is required');
            return;
        }

        rejectMutation.mutate({
            id: selectedAdjustment.id,
            data: {
                approved_by: 1, // Replace with actual user ID
                rejection_reason: approvalNotes
            }
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30';
            case 'approved': return 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
        }
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-x-hidden">
                {/* Decorative Background Elements - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
                </div>

                {/* Header */}
                <div className="relative mb-4 sm:mb-6 md:mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between gap-3"
                    >
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-fuchsia-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent truncate">
                                Adjustments
                            </h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">Stock corrections and audit trail</p>
                        </div>

                        <Button
                            onClick={() => { resetForm(); setOpenCreate(true); }}
                            className="bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 h-9 sm:h-10 px-2 sm:px-4 text-xs sm:text-sm"
                        >
                            <Plus className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">New Adjustment</span>
                        </Button>
                    </motion.div>
                </div>

                {/* Stats Cards - Horizontal scroll on mobile */}
                <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide mb-4 sm:mb-6">
                    <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-4 min-w-max sm:min-w-0">
                        <StatCard title="Pending" value={stats?.pending || 0} icon={Clock} color="yellow" index={0} />
                        <StatCard title="Approved" value={stats?.approved || 0} icon={CheckCircle} color="emerald" index={1} />
                        <StatCard title="This Month" value={stats?.this_month || 0} icon={AlertCircle} color="fuchsia" index={2} />
                    </div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 backdrop-blur-sm shadow-lg"
                >
                    <div className="flex gap-2 sm:gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 sm:pl-10 h-10 text-sm"
                                variant="filled"
                            />
                        </div>

                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-card border border-border rounded-lg px-2 sm:px-3 py-2 h-10 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50">
                            <option value="all">Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                        </select>

                        <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}
                            className="hidden sm:block bg-card border border-border rounded-lg px-2 sm:px-3 py-2 h-10 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50">
                            <option value="all">Reason</option>
                            {Object.entries(reasons).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </motion.div>

                {/* Adjustments Grid */}
                <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="bg-card/50 border-border/50 backdrop-blur-sm">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="animate-pulse space-y-4">
                                        <div className="h-4 bg-muted rounded w-3/4"></div>
                                        <div className="h-3 bg-muted rounded w-1/2"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        adjustments?.data?.map((adjustment: Adjustment, index: number) => (
                            <motion.div key={adjustment.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}>
                                <Card className="bg-card/50 border-border/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300">
                                    <CardContent className="p-3 sm:p-4 md:p-6">
                                        <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                                            <div className="min-w-0">
                                                <h3 className="font-semibold text-foreground text-sm sm:text-base md:text-lg truncate">{adjustment.ingredient?.name}</h3>
                                                <p className="text-xs sm:text-sm text-muted-foreground">{adjustment.location?.name}</p>
                                            </div>
                                            <Badge className={cn(getStatusColor(adjustment.status), "text-[10px] sm:text-xs px-1.5 sm:px-2")}>
                                                {adjustment.status.toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                                            <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-2 sm:p-3">
                                                <div className="text-center">
                                                    <div className="text-[10px] sm:text-xs text-muted-foreground">Before</div>
                                                    <div className="text-foreground font-semibold text-sm sm:text-base">{adjustment.quantity_before}</div>
                                                </div>
                                                <div className="text-muted-foreground text-xs">→</div>
                                                <div className="text-center">
                                                    <div className="text-[10px] sm:text-xs text-muted-foreground">After</div>
                                                    <div className="text-foreground font-semibold text-sm sm:text-base">{adjustment.quantity_after}</div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {adjustment.quantity_change > 0 ? (
                                                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
                                                    ) : (
                                                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
                                                    )}
                                                    <span className={cn("text-xs sm:text-sm font-semibold", adjustment.quantity_change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                                                        {adjustment.quantity_change > 0 ? '+' : ''}{adjustment.quantity_change}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    <span className="truncate">{reasons[adjustment.reason as keyof typeof reasons]}</span>
                                                </div>
                                                <div className="text-[10px] sm:text-xs">
                                                    {new Date(adjustment.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {adjustment.status === 'pending' && (
                                            <div className="flex gap-2 mb-2">
                                                <Button size="sm" variant="primary"
                                                    onClick={() => { setSelectedAdjustment(adjustment); setOpenApprove(true); }}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 h-8 sm:h-9 text-xs sm:text-sm">
                                                    <CheckCircle className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Approve</span>
                                                </Button>
                                                <Button size="sm" variant="danger"
                                                    onClick={() => { setSelectedAdjustment(adjustment); setOpenReject(true); }}
                                                    className="flex-1 bg-red-600 hover:bg-red-700 h-8 sm:h-9 text-xs sm:text-sm">
                                                    <XCircle className="w-3 h-3 sm:mr-1" /><span className="hidden sm:inline">Reject</span>
                                                </Button>
                                            </div>
                                        )}

                                        <Button size="sm" variant="secondary" onClick={() => { setSelectedAdjustment(adjustment); setOpenView(true); }}
                                            className="w-full h-8 sm:h-9 text-xs sm:text-sm">
                                            <Eye className="w-3 h-3 mr-1" />Details
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Create Modal */}
                <Modal open={openCreate} onClose={() => { setOpenCreate(false); resetForm(); }}
                    title="New Adjustment" size="lg">
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-2 sm:p-3 text-red-600 dark:text-red-400 text-xs sm:text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Ingredient *</label>
                                <select required value={formData.ingredient_id} onChange={(e) => setFormData({ ...formData, ingredient_id: e.target.value })}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50">
                                    <option value="">Select</option>
                                    {ingredients?.data?.map((ing: Ingredient) => (
                                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Location *</label>
                                <select required value={formData.location_id} onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50">
                                    <option value="">Select</option>
                                    {locations?.data?.map((loc: Location) => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Qty Before *</label>
                                <Input type="number" step="0.01" required value={formData.quantity_before}
                                    onChange={(e) => setFormData({ ...formData, quantity_before: e.target.value })} className="h-10 text-sm" />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Qty After *</label>
                                <Input type="number" step="0.01" required value={formData.quantity_after}
                                    onChange={(e) => setFormData({ ...formData, quantity_after: e.target.value })} className="h-10 text-sm" />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Reason *</label>
                                <select required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 h-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50">
                                    {Object.entries(reasons).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50" rows={2}
                                    placeholder="Details..." />
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                            <Button type="button" variant="secondary" onClick={() => { setOpenCreate(false); resetForm(); }}
                                className="flex-1 h-9 sm:h-10 text-sm">Cancel</Button>
                            <Button type="submit" variant="primary" disabled={createMutation.isPending}
                                className="flex-1 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 h-9 sm:h-10 text-sm">
                                Create
                            </Button>
                        </div>
                    </form>
                </Modal>

                {/* View Modal */}
                <Modal open={openView} onClose={() => { setOpenView(false); setSelectedAdjustment(null); }}
                    title="Details" size="lg">
                    {selectedAdjustment && (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground">Ingredient</h3>
                                    <p className="text-foreground font-semibold text-sm sm:text-base">{selectedAdjustment.ingredient?.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground">Location</h3>
                                    <p className="text-foreground text-sm sm:text-base">{selectedAdjustment.location?.name}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground">Before</h3>
                                    <p className="text-foreground font-semibold text-sm sm:text-base">{selectedAdjustment.quantity_before}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground">After</h3>
                                    <p className="text-foreground font-semibold text-sm sm:text-base">{selectedAdjustment.quantity_after}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground">Change</h3>
                                    <p className={cn("font-semibold text-sm sm:text-base", selectedAdjustment.quantity_change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                                        {selectedAdjustment.quantity_change > 0 ? '+' : ''}{selectedAdjustment.quantity_change}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground">Status</h3>
                                    <Badge className={cn(getStatusColor(selectedAdjustment.status), "text-[10px] sm:text-xs")}>
                                        {selectedAdjustment.status.toUpperCase()}
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground">Reason</h3>
                                    <p className="text-foreground text-sm">{reasons[selectedAdjustment.reason as keyof typeof reasons]}</p>
                                </div>
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground">Adjusted By</h3>
                                    <p className="text-foreground text-sm">{selectedAdjustment.adjusted_by_employee?.name || 'Unknown'}</p>
                                </div>
                            </div>

                            {selectedAdjustment.notes && (
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Notes</h3>
                                    <p className="text-foreground text-xs sm:text-sm bg-secondary/50 p-2 sm:p-3 rounded-lg">{selectedAdjustment.notes}</p>
                                </div>
                            )}

                            {selectedAdjustment.approval_notes && (
                                <div>
                                    <h3 className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">Approval Notes</h3>
                                    <p className="text-foreground text-xs sm:text-sm bg-secondary/50 p-2 sm:p-3 rounded-lg">{selectedAdjustment.approval_notes}</p>
                                </div>
                            )}

                            <Button variant="secondary" onClick={() => { setOpenView(false); setSelectedAdjustment(null); }}
                                className="w-full h-9 sm:h-10 text-sm">Close</Button>
                        </div>
                    )}
                </Modal>

                {/* Approve Modal */}
                <Modal open={openApprove} onClose={() => { setOpenApprove(false); setApprovalNotes(''); }}
                    title="Approve Adjustment" size="md">
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            Approve adjustment for <span className="font-semibold text-foreground">{selectedAdjustment?.ingredient?.name}</span>?
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Approval Notes (optional)</label>
                            <textarea value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50" rows={3} />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => { setOpenApprove(false); setApprovalNotes(''); }}
                                className="flex-1">Cancel</Button>
                            <Button variant="primary" onClick={handleApprove} disabled={approveMutation.isPending}
                                className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
                        </div>
                    </div>
                </Modal>

                {/* Reject Modal */}
                <Modal open={openReject} onClose={() => { setOpenReject(false); setApprovalNotes(''); setError(''); }}
                    title="Reject Adjustment" size="md">
                    <div className="space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-3 text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}
                        <p className="text-muted-foreground">
                            Reject adjustment for <span className="font-semibold text-foreground">{selectedAdjustment?.ingredient?.name}</span>?
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rejection Reason *</label>
                            <textarea required value={approvalNotes} onChange={(e) => setApprovalNotes(e.target.value)}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50" rows={3}
                                placeholder="Please provide a reason..." />
                        </div>
                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => { setOpenReject(false); setApprovalNotes(''); setError(''); }}
                                className="flex-1">Cancel</Button>
                            <Button variant="danger" onClick={handleReject} disabled={rejectMutation.isPending}
                                className="flex-1 bg-red-600 hover:bg-red-700">Reject</Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </AdminLayout>
    );
}
