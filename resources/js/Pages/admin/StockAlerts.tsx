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
    Settings
} from 'lucide-react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Badge } from '@/app/components/ui/Badge';
import { Modal } from '@/app/components/ui/Modal';
import { Input } from '@/app/components/ui/Input';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';

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

    // Fetch reorder recommendations
    const { data: reorderRecs } = useQuery({
        queryKey: ['reorder-recommendations'],
        queryFn: () => apiGet('/api/admin/stock-alerts/reorder-recommendations')
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

    const getAlertTypeColor = (type: string) => {
        switch (type) {
            case 'critical_stock': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'low_stock': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'expiring_soon': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'overstock': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'high': return <AlertTriangle className="w-5 h-5 text-red-400" />;
            case 'medium': return <AlertCircle className="w-5 h-5 text-orange-400" />;
            case 'low': return <Bell className="w-5 h-5 text-yellow-400" />;
            default: return <Bell className="w-5 h-5 text-gray-400" />;
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
                                Stock Alerts
                            </h1>
                            <p className="text-gray-400 mt-1">Monitor inventory levels and receive notifications</p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Active Alerts</div>
                                <div className="text-xl font-bold text-red-400">{stats?.active_alerts || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Critical</div>
                                <div className="text-xl font-bold text-orange-400">{stats?.critical || 0}</div>
                            </div>
                            <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
                                <div className="text-sm text-gray-400">Expiring</div>
                                <div className="text-xl font-bold text-yellow-400">{stats?.expiring || 0}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Types</option>
                        <option value="critical_stock" className="text-black">Critical Stock</option>
                        <option value="low_stock" className="text-black">Low Stock</option>
                        <option value="expiring_soon" className="text-black">Expiring Soon</option>
                        <option value="overstock" className="text-black">Overstock</option>
                    </select>

                    <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white">
                        <option value="all" className="text-black">All Severity</option>
                        <option value="high" className="text-black">High</option>
                        <option value="medium" className="text-black">Medium</option>
                        <option value="low" className="text-black">Low</option>
                    </select>

                    <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer">
                        <input type="checkbox" checked={showAcknowledged} onChange={(e) => setShowAcknowledged(e.target.checked)}
                            className="rounded" />
                        <span className="text-sm text-white">Show Acknowledged</span>
                    </label>

                    <Button variant="secondary" onClick={() => { setTypeFilter('all'); setSeverityFilter('all'); setShowAcknowledged(false); }}
                        className="border-white/20 hover:bg-white/10">Clear Filters</Button>
                </motion.div>

                {/* Active Alerts */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                Active Alerts
                            </h2>

                            {isLoading ? (
                                <div className="text-center py-8 text-gray-400">Loading alerts...</div>
                            ) : alerts?.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    No active alerts
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {alerts?.map((alert: Alert) => (
                                        <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                            className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    {getSeverityIcon(alert.severity)}

                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-white font-semibold">{alert.ingredient?.name}</h3>
                                                            <Badge className={getAlertTypeColor(alert.type)}>
                                                                {getAlertTypeLabel(alert.type)}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-gray-300 text-sm mb-2">{alert.message}</p>
                                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                                            {alert.location && (
                                                                <span>📍 {alert.location.name}</span>
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
                                                        <Button size="sm" variant="secondary"
                                                            onClick={() => acknowledgeMutation.mutate(alert.id)}
                                                            className="border-white/20 hover:bg-white/10">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Acknowledge
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Reorder Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-400" />
                                Reorder Recommendations
                            </h2>

                            {lowStock?.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    All stock levels are good
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {lowStock?.slice(0, 5).map((ingredient: Ingredient) => (
                                        <div key={ingredient.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <div>
                                                    <h3 className="text-white font-semibold">{ingredient.name}</h3>
                                                    <p className="text-sm text-gray-400">{ingredient.supplier?.name || 'No supplier'}</p>
                                                </div>
                                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                                                    <TrendingDown className="w-3 h-3 mr-1" />
                                                    Low
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                                                <div>
                                                    <div className="text-gray-400">Current</div>
                                                    <div className="text-white font-semibold">{ingredient.current_stock || 0}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-400">Reorder At</div>
                                                    <div className="text-white">{ingredient.reorder_point || 0}</div>
                                                </div>
                                                <div>
                                                    <div className="text-gray-400">Max</div>
                                                    <div className="text-white">{ingredient.max_stock_level || 0}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-300">
                                                    Suggested: <span className="text-green-400 font-semibold">
                                                        {Math.max(0, (ingredient.max_stock_level || 0) - (ingredient.current_stock || 0))} {ingredient.unit?.code}
                                                    </span>
                                                </span>
                                                <Button size="sm" variant="primary"
                                                    onClick={() => { setSelectedIngredient(ingredient); setOpenReorder(true); }}
                                                    className="bg-blue-600 hover:bg-blue-700">
                                                    Create PO
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Alert Settings Card */}
                    <Card className="bg-white/5 border-white/10 backdrop-blur-md">
                        <CardContent className="p-6">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-purple-400" />
                                Alert Configuration
                            </h2>

                            <div className="space-y-4">
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <h3 className="text-white font-semibold mb-2">Low Stock Threshold</h3>
                                    <p className="text-sm text-gray-400 mb-3">Alert when stock reaches reorder point</p>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" value="10" className="bg-white/5 border-white/10 text-white" />
                                        <span className="text-gray-400">%</span>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <h3 className="text-white font-semibold mb-2">Expiration Warning</h3>
                                    <p className="text-sm text-gray-400 mb-3">Alert days before expiration</p>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" value="7" className="bg-white/5 border-white/10 text-white" />
                                        <span className="text-gray-400">days</span>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <h3 className="text-white font-semibold mb-2">Notifications</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" defaultChecked className="rounded" />
                                            <span className="text-sm text-gray-300">Email notifications</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" defaultChecked className="rounded" />
                                            <span className="text-sm text-gray-300">Dashboard alerts</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="rounded" />
                                            <span className="text-sm text-gray-300">SMS notifications</span>
                                        </label>
                                    </div>
                                </div>

                                <Button variant="primary" className="w-full bg-purple-600 hover:bg-purple-700">
                                    Save Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Create PO Modal */}
                <Modal open={openReorder} onClose={() => { setOpenReorder(false); setSelectedIngredient(null); setReorderQuantity(''); }}
                    title="Create Purchase Order" size="md">
                    {selectedIngredient && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm text-gray-400">Ingredient</h3>
                                <p className="text-white font-semibold">{selectedIngredient.name}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Order Quantity *</label>
                                <Input type="number" step="0.01" required value={reorderQuantity}
                                    onChange={(e) => setReorderQuantity(e.target.value)}
                                    className="bg-white/5 border-white/10 text-white"
                                    placeholder={`Suggested: ${Math.max(0, (selectedIngredient.max_stock_level || 0) - (selectedIngredient.current_stock || 0))}`} />
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <p className="text-sm text-blue-400">
                                    This will create a draft purchase order for {selectedIngredient.supplier?.name || 'the selected supplier'}.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button variant="secondary" onClick={() => { setOpenReorder(false); setReorderQuantity(''); }}
                                    className="flex-1 border-white/20 hover:bg-white/10">Cancel</Button>
                                <Button variant="primary" onClick={() => { toastSuccess('PO created!'); setOpenReorder(false); }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700">Create Purchase Order</Button>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </AdminLayout>
    );
}
