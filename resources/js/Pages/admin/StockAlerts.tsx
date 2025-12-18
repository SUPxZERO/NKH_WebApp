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
    const [openSettings, setOpenSettings] = React.useState(false);
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
            url += `acknowledged=${showAcknowledged}&`;
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

    // Fetch Settings
    const { data: settingsData } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await apiGet('/api/admin/settings');
            // Flatten the response if needed, assumed structure is { data: { key: value } } based on Controller
            return res.data || {};
        }
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

    const updateSettingsMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/settings', { ...data, _method: 'PUT' }),
        onSuccess: () => {
            toastSuccess('Settings updated');
            qc.invalidateQueries({ queryKey: ['settings'] });
        },
        onError: () => toastError('Failed to update settings')
    });

    const handleToggleSetting = (key: string, currentValue: boolean) => {
        const newValue = !currentValue;
        updateSettingsMutation.mutate({
            settings: {
                [key]: newValue
            }
        });
    };

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
                                className="bg-[#0f111a] border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />

                                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2 relative z-10">
                                    <Package className="w-5 h-5 text-blue-500" />
                                    Reorder Suggested
                                </h2>

                                {lowStock?.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center">
                                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                                            <CheckCircle className="w-6 h-6 text-green-500" />
                                        </div>
                                        <p>All stock levels healthy</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {lowStock?.slice(0, 5).map((ingredient: Ingredient) => (
                                            <div key={ingredient.id} className="bg-[#181824] rounded-xl p-4 border border-white/5 hover:border-purple-500/20 transition-colors group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="text-base font-bold text-white mb-0.5">{ingredient.name}</h4>
                                                        <p className="text-xs text-zinc-400">{ingredient.supplier?.name || 'No Supplier'}</p>
                                                    </div>
                                                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] uppercase font-bold px-2 py-1 rounded-full">
                                                        Low: {Number(ingredient.current_stock || 0).toFixed(3)}
                                                    </span>
                                                </div>
                                                <Button
                                                    onClick={() => { setSelectedIngredient(ingredient); setOpenReorder(true); }}
                                                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-full h-10 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-all"
                                                >
                                                    <span className="font-semibold">Create PO</span>
                                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
                                className="bg-[#0f111a] border border-white/5 rounded-2xl p-5 shadow-xl"
                            >
                                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                    <Settings className="w-5 h-5 text-zinc-400" />
                                    Quick Settings
                                </h2>
                                <div className="space-y-5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400 font-medium">Notification Email</span>
                                        <span className={cn(
                                            "border rounded-full px-3 py-1 text-xs font-bold",
                                            settingsData?.stock_notifications_email
                                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                : "bg-zinc-800 text-zinc-500 border-white/5"
                                        )}>
                                            {settingsData?.stock_notifications_email ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-zinc-400 font-medium">Auto-Reorder</span>
                                        <span className={cn(
                                            "border rounded-full px-3 py-1 text-xs font-bold",
                                            settingsData?.stock_auto_reorder
                                                ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                                : "bg-zinc-800 text-zinc-500 border-white/5"
                                        )}>
                                            {settingsData?.stock_auto_reorder ? 'Active' : 'Disabled'}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setOpenSettings(true)}
                                        className="w-full mt-2 h-11 rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 font-medium"
                                    >
                                        Manage All Settings
                                    </Button>
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
                    <div className="space-y-6 p-1">
                        <div className="bg-secondary/30 p-5 rounded-2xl border border-border/50">
                            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">Item Details</h3>
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-xl font-bold text-foreground">{selectedIngredient.name}</p>
                                <Badge variant="outline" className="bg-background text-xs">{selectedIngredient.code}</Badge>
                            </div>
                            <p className="text-sm text-purple-400 font-medium">{selectedIngredient.supplier?.name}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-3">
                                Reorder Quantity <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Input type="number" step="0.01" required value={reorderQuantity}
                                    onChange={(e) => setReorderQuantity(e.target.value)}
                                    className="pl-5 pr-16 text-lg h-14 font-bold bg-background shadow-inner"
                                    placeholder="0.00" />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium bg-secondary/50 px-2 py-1 rounded">
                                    {selectedIngredient.unit?.code || 'Units'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-3 text-xs">
                                <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 font-medium">
                                    Current: {selectedIngredient.current_stock}
                                </span>
                                <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-500 font-medium">
                                    Target: {selectedIngredient.max_stock_level}
                                </span>
                                <span className="ml-auto text-muted-foreground">
                                    Gap: <span className="text-foreground font-bold">{Math.max(0, (selectedIngredient.max_stock_level || 0) - (selectedIngredient.current_stock || 0)).toFixed(2)}</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" onClick={() => { setOpenReorder(false); setReorderQuantity(''); }}
                                className="flex-1 h-12 rounded-xl">
                                Cancel
                            </Button>
                            <Button onClick={handleCreatePO} disabled={createPOMutation.isPending}
                                className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-xl shadow-purple-500/20 font-bold tracking-wide">
                                {createPOMutation.isPending ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Confirm Reorder <ArrowRight className="w-5 h-5" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Settings Modal */}
            <Modal open={openSettings} onClose={() => setOpenSettings(false)} title="Stock Alert Settings" size="md">
                <div className="space-y-6">
                    <div className="bg-secondary/30 p-4 rounded-xl border border-border/50">
                        <p className="text-sm text-muted-foreground">
                            Configure how you want to be notified about stock levels and automated actions.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Notification Email Toggle */}
                        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Bell className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Email Notifications</p>
                                    <p className="text-xs text-muted-foreground">Receive alerts when stock is critical</p>
                                </div>
                            </div>
                            <div
                                onClick={() => handleToggleSetting('stock_notifications_email', settingsData?.stock_notifications_email)}
                                className={cn(
                                    "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out",
                                    settingsData?.stock_notifications_email ? "bg-blue-600" : "bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out",
                                    settingsData?.stock_notifications_email ? "translate-x-6" : "translate-x-0"
                                )} />
                            </div>
                        </div>

                        {/* Auto-Reorder Toggle */}
                        <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Package className="w-5 h-5 text-purple-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Auto-Reorder</p>
                                    <p className="text-xs text-muted-foreground">Automatically create draft POs</p>
                                </div>
                            </div>
                            <div
                                onClick={() => handleToggleSetting('stock_auto_reorder', settingsData?.stock_auto_reorder)}
                                className={cn(
                                    "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out",
                                    settingsData?.stock_auto_reorder ? "bg-purple-600" : "bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out",
                                    settingsData?.stock_auto_reorder ? "translate-x-6" : "translate-x-0"
                                )} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={() => setOpenSettings(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout>
    );
}
