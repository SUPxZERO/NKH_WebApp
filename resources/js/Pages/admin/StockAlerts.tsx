import React from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    AlertTriangle,
    AlertCircle,
    Package,
    TrendingDown,
    Clock,
    CheckCircle,
    Bell,
    Settings,
    ShieldAlert,
    ArrowRight
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

// Enhanced StatCard
const StatCard = ({ title, value, icon: Icon, color, index = 0, subtext }: any) => {
    const colorStyles: Record<string, any> = {
        red: { gradient: 'from-red-500/20 to-rose-500/10', iconBg: 'bg-gradient-to-br from-red-500 to-rose-600', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/30', shadow: 'shadow-red-500/20' },
        orange: { gradient: 'from-orange-500/20 to-amber-500/10', iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', shadow: 'shadow-orange-500/20' },
        yellow: { gradient: 'from-yellow-500/20 to-amber-500/10', iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-600', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500/30', shadow: 'shadow-yellow-500/20' },
        blue: { gradient: 'from-blue-500/20 to-cyan-500/10', iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/20' },
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

interface Ingredient {
    id: number;
    name: string;
    code: string;
    current_stock?: number;
    min_stock_level?: number;
    max_stock_level?: number;
    reorder_point?: number;
    unit?: { code: string; name: string };
    supplier?: { name: string };
    supplier_id?: number;
    cost_per_unit?: number;
}

interface Alert {
    id: number;
    type: 'low_stock' | 'critical_stock' | 'expiring_soon' | 'overstock';
    ingredient_id: number;
    ingredient?: Ingredient;
    location_id?: number;
    location?: { name: string };
    severity: 'high' | 'medium' | 'low';
    message: string;
    acknowledged: boolean;
    created_at: string;
}

export default function StockAlerts() {
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [severityFilter, setSeverityFilter] = React.useState('all');
    const [showAcknowledged, setShowAcknowledged] = React.useState(false);
    const [openReorder, setOpenReorder] = React.useState(false);
    const [selectedIngredient, setSelectedIngredient] = React.useState<Ingredient | null>(null);
    const [reorderQuantity, setReorderQuantity] = React.useState('');

    const qc = useQueryClient();

    // Fetch alerts
    const { data: alerts, isLoading } = useQuery({
        queryKey: ['stock-alerts', typeFilter, severityFilter, showAcknowledged],
        queryFn: () => {
            let url = `/api/admin/stock-alerts?`;
            if (typeFilter !== 'all') url += `type=${typeFilter}&`;
            if (severityFilter !== 'all') url += `severity=${severityFilter}&`;
            if (!showAcknowledged) url += `acknowledged=false&`;
            return apiGet(url);
        }
    });

    // Fetch low stock ingredients
    const { data: lowStock } = useQuery({
        queryKey: ['low-stock-ingredients'],
        queryFn: () => apiGet('/api/admin/ingredients/low-stock')
    });

    // Fetch stats
    const { data: stats } = useQuery({
        queryKey: ['alert-stats'],
        queryFn: () => apiGet('/api/admin/stock-alerts/stats')
    });

    // Mutations
    const acknowledgeMutation = useMutation({
        mutationFn: (alertId: number) => apiPost(`/api/admin/stock-alerts/${alertId}/acknowledge`, {}),
        onSuccess: () => {
            toastSuccess('Alert acknowledged');
            qc.invalidateQueries({ queryKey: ['stock-alerts'] });
        },
        onError: () => toastError('Failed to acknowledge alert')
    });

    const createPOMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/purchase-orders', data),
        onSuccess: () => {
            toastSuccess('Purchase Order created successfully');
            setOpenReorder(false);
            setReorderQuantity('');
        },
        onError: (err: any) => toastError(err.response?.data?.message || 'Failed to create PO')
    });

    const handleCreatePO = () => {
        if (!selectedIngredient || !reorderQuantity) return;

        if (!selectedIngredient.supplier_id) {
            toastError('Ingredient has no supplier assigned');
            return;
        }

        const data = {
            supplier_id: selectedIngredient.supplier_id,
            order_date: new Date().toISOString().split('T')[0],
            items: [{
                ingredient_id: selectedIngredient.id,
                quantity: parseFloat(reorderQuantity),
                unit_price: selectedIngredient.cost_per_unit || 0
            }]
        };
        createPOMutation.mutate(data);
    };

    const getAlertTypeColor = (type: string) => {
        switch (type) {
            case 'critical_stock': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            case 'low_stock': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
            case 'expiring_soon': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
            case 'overstock': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high': return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
            case 'medium': return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
            case 'low': return <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
            default: return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
        }
    };

    const getAlertTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            critical_stock: 'Critical Stock',
            low_stock: 'Low Stock',
            expiring_soon: 'Expiring Soon',
            overstock: 'Overstock'
        };
        return labels[type] || type;
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-6 transition-colors relative overflow-hidden">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent flex items-center gap-3">
                                <ShieldAlert className="w-8 h-8 text-red-600" />
                                Stock Alerts
                            </h1>
                            <p className="text-muted-foreground mt-2">Monitor critical inventory levels and actions</p>
                        </div>
                    </motion.div>

                    {/* Stats Ribbon */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard title="Active Alerts" value={stats?.active_alerts || 0} icon={AlertTriangle} color="red" index={0} />
                        <StatCard title="Critical Impact" value={stats?.critical || 0} icon={AlertCircle} color="orange" index={1} subtext="Immediate action required" />
                        <StatCard title="Expiring Soon" value={stats?.expiring || 0} icon={Clock} color="yellow" index={2} subtext="Within 7 days" />
                    </div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg flex flex-wrap gap-4"
                    >
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:border-red-500 focus:ring-red-500/20 outline-none transition-all">
                            <option value="all">All Types</option>
                            <option value="critical_stock">Critical Stock</option>
                            <option value="low_stock">Low Stock</option>
                            <option value="expiring_soon">Expiring Soon</option>
                            <option value="overstock">Overstock</option>
                        </select>

                        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                            className="bg-background/50 border border-border/50 rounded-xl px-4 py-2 text-foreground focus:border-red-500 focus:ring-red-500/20 outline-none transition-all">
                            <option value="all">All Severity</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                        </select>

                        <label className="flex items-center gap-2 bg-background/50 border border-border/50 rounded-xl px-4 py-2 cursor-pointer hover:bg-secondary/50 transition-colors">
                            <input type="checkbox" checked={showAcknowledged} onChange={(e) => setShowAcknowledged(e.target.checked)}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                            <span className="text-sm font-medium text-foreground">Show Acknowledged</span>
                        </label>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Active Alerts List */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-card/50 border border-border/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm"
                            >
                                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    Active Alerts
                                </h2>

                                {isLoading ? (
                                    <div className="text-center py-8 text-muted-foreground">Loading alerts...</div>
                                ) : (Array.isArray(alerts) ? alerts : (alerts?.data || []))?.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-border/50 border-dashed">
                                        <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        No active alerts requiring attention
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(Array.isArray(alerts) ? alerts : (alerts?.data || [])).map((alert: Alert, idx: number) => (
                                            <motion.div
                                                key={alert.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-card border border-border/50 rounded-xl p-4 hover:shadow-md transition-all group relative overflow-hidden"
                                            >
                                                <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                                                    alert.severity === 'high' ? 'bg-red-500' :
                                                        alert.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                                                )} />
                                                <div className="flex items-start justify-between gap-4 pl-3">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="p-2 rounded-lg bg-secondary">
                                                            {getSeverityIcon(alert.severity)}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <h3 className="text-foreground font-semibold">{alert.ingredient?.name}</h3>
                                                                <Badge className={cn("text-[10px] uppercase font-bold border-none", getAlertTypeColor(alert.type))}>
                                                                    {getAlertTypeLabel(alert.type)}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-muted-foreground text-sm mb-2">{alert.message}</p>
                                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                {alert.location && (
                                                                    <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded">
                                                                        <span>📍 {alert.location.name}</span>
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(alert.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        {!alert.acknowledged && (
                                                            <Button size="sm" variant="ghost"
                                                                onClick={() => acknowledgeMutation.mutate(alert.id)}
                                                                className="hover:bg-green-500/10 hover:text-green-600 transition-colors">
                                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                                Done
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Sidebar: Reorder & Settings */}
                        <div className="space-y-6">
                            {/* Reorder Recommendations */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-border/50 rounded-2xl p-6 shadow-lg backdrop-blur-sm"
                            >
                                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    Reorder Suggested
                                </h2>

                                {lowStock?.length === 0 ? (
                                    <div className="text-center py-6 text-muted-foreground text-sm">
                                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-green-500" />
                                        Stock levels healthy
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {lowStock?.slice(0, 5).map((ingredient: Ingredient) => (
                                            <div key={ingredient.id} className="bg-card/80 rounded-xl p-3 border border-border/50 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-foreground">{ingredient.name}</h4>
                                                        <p className="text-xs text-muted-foreground">{ingredient.supplier?.name || 'No Supplier'}</p>
                                                    </div>
                                                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] px-1.5">
                                                        Low: {ingredient.current_stock}
                                                    </Badge>
                                                </div>
                                                <Button size="sm"
                                                    onClick={() => { setSelectedIngredient(ingredient); setOpenReorder(true); }}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                                                    Create PO <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* Settings Preview */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-card/50 border border-border/50 rounded-2xl p-6 shadow-sm backdrop-blur-sm"
                            >
                                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-muted-foreground" />
                                    Quick Settings
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Notification Email</span>
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Auto-Reorder</span>
                                        <Badge variant="outline" className="bg-secondary text-muted-foreground">Disabled</Badge>
                                    </div>
                                    <Button variant="outline" className="w-full mt-2 text-xs">Manage All Settings</Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create PO Modal */}
            <Modal open={openReorder} onClose={() => { setOpenReorder(false); setSelectedIngredient(null); setReorderQuantity(''); }}
                title="Create Purchase Order" size="md">
                {selectedIngredient && (
                    <div className="space-y-4 p-1">
                        <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                            <h3 className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">Item Details</h3>
                            <div className="flex justify-between items-center">
                                <p className="text-lg font-bold text-foreground">{selectedIngredient.name}</p>
                                <Badge variant="outline">{selectedIngredient.code}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Supplier: {selectedIngredient.supplier?.name}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Order Quantity <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Input type="number" step="0.01" required value={reorderQuantity}
                                    onChange={(e) => setReorderQuantity(e.target.value)}
                                    className="pl-4 pr-12 text-lg font-semibold"
                                    placeholder="0.00" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                                    {selectedIngredient.unit?.code || 'Units'}
                                </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                Suggested Refill: {Math.max(0, (selectedIngredient.max_stock_level || 0) - (selectedIngredient.current_stock || 0))} {selectedIngredient.unit?.code}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button variant="secondary" onClick={() => { setOpenReorder(false); setReorderQuantity(''); }}
                                className="flex-1 hover:bg-secondary/80">Cancel</Button>
                            <Button onClick={handleCreatePO} disabled={createPOMutation.isPending}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                                {createPOMutation.isPending ? 'Propcessing...' : 'Confirm Order'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
