import React from 'react';
import { useLanguage } from '@/app/context/LanguageContext';
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

// Enhanced StatCard - Mobile optimized
const StatCard = ({ title, value, icon: Icon, color, index = 0, subtext }: any) => {
    const { t } = useLanguage();
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
                "relative overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-sm min-w-[130px] sm:min-w-0",
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
                        {subtext && <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 hidden sm:block">{subtext}</p>}
                    </div>
                    <div className={cn("p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0", styles.iconBg)}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
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
    const { t } = useLanguage();
    const [typeFilter, setTypeFilter] = React.useState('all');
    const [severityFilter, setSeverityFilter] = React.useState('all');
    const [showAcknowledged, setShowAcknowledged] = React.useState(false);
    const [openReorder, setOpenReorder] = React.useState(false);
    const [openSettings, setOpenSettings] = React.useState(false);
    const [selectedIngredient, setSelectedIngredient] = React.useState<Ingredient | null>(null);
    const [reorderQuantity, setReorderQuantity] = React.useState('');
    const [locationId, setLocationId] = React.useState('');

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

    // Fetch locations
    const { data: locations } = useQuery({
        queryKey: ['locations'],
        queryFn: () => apiGet('/api/admin/locations')
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
            toastSuccess(t('admin.inventory.alerts.reorder.acknowledged') as string);
            qc.invalidateQueries({ queryKey: ['stock-alerts'] });
        },
        onError: () => toastError(t('admin.inventory.alerts.reorder.acknowledge_failed') as string)
    });

    const createPOMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/purchase-orders', data),
        onSuccess: () => {
            toastSuccess(t('admin.inventory.alerts.reorder.po_created') as string);
            setOpenReorder(false);
            setReorderQuantity('');
        },
        onError: (err: any) => toastError(err.response?.data?.message || t('admin.inventory.alerts.reorder.po_failed') as string)
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (data: any) => apiPost('/api/admin/settings', { ...data, _method: 'PUT' }),
        onSuccess: () => {
            toastSuccess(t('admin.inventory.alerts.reorder.settings_updated') as string);
            qc.invalidateQueries({ queryKey: ['settings'] });
        },
        onError: () => toastError(t('admin.inventory.alerts.reorder.settings_failed') as string)
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
            toastError(t('admin.inventory.alerts.reorder.supplier_missing') as string);
            return;
        }

        const data = {
            supplier_id: selectedIngredient.supplier_id,
            order_date: new Date().toISOString().split('T')[0],
            items: [{
                ingredient_id: selectedIngredient.id,
                quantity: parseFloat(reorderQuantity),
                unit_price: selectedIngredient.cost_per_unit || 0
            }],
            location_id: locationId ? parseInt(locationId) : null
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
            critical_stock: t('admin.inventory.alerts.types.critical_stock') as string,
            low_stock: t('admin.inventory.alerts.types.low_stock') as string,
            expiring_soon: t('admin.inventory.alerts.types.expiring_soon') as string,
            overstock: t('admin.inventory.alerts.types.overstock') as string
        };
        return labels[type] || type;
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 transition-colors relative overflow-x-hidden">
                {/* Decorative Background - Hidden on mobile */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
                    <div className="absolute top-20 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10 w-full mx-auto space-y-4 sm:space-y-6">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3"
                    >
                        <ShieldAlert className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0" />
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-red-600 bg-clip-text text-transparent truncate">
                                {t('admin.inventory.alerts.title')}
                            </h1>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 hidden sm:block">{t('admin.inventory.alerts.subtitle')}</p>
                        </div>
                    </motion.div>

                    {/* Stats Ribbon - Horizontal scroll on mobile */}
                    <div className="-mx-3 sm:mx-0 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
                        <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-4 min-w-max sm:min-w-0">
                            <StatCard title={t('admin.inventory.alerts.stats.active')} value={stats?.active_alerts || 0} icon={AlertTriangle} color="red" index={0} />
                            <StatCard title={t('admin.inventory.alerts.stats.critical')} value={stats?.critical || 0} icon={AlertCircle} color="orange" index={1} subtext={t('admin.inventory.alerts.stats.immediate_action')} />
                            <StatCard title={t('admin.inventory.alerts.stats.expiring')} value={stats?.expiring || 0} icon={Clock} color="yellow" index={2} subtext={t('admin.inventory.alerts.stats.within_7_days')} />
                        </div>
                    </div>

                    {/* Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 backdrop-blur-sm shadow-lg flex gap-2 sm:gap-4"
                    >
                        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
                            className="bg-background/50 border border-border/50 rounded-lg px-2 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-red-500 outline-none transition-all flex-1 sm:flex-none">
                            <option value="all">{t('admin.inventory.alerts.filters.type')}</option>
                            <option value="critical_stock">{t('admin.inventory.alerts.types.critical_stock')}</option>
                            <option value="low_stock">{t('admin.inventory.alerts.types.low_stock')}</option>
                            <option value="expiring_soon">{t('admin.inventory.alerts.types.expiring_soon')}</option>
                            <option value="overstock">{t('admin.inventory.alerts.types.overstock')}</option>
                        </select>

                        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}
                            className="bg-background/50 border border-border/50 rounded-lg px-2 sm:px-4 py-2 h-10 text-xs sm:text-sm text-foreground focus:border-red-500 outline-none transition-all flex-1 sm:flex-none">
                            <option value="all">{t('admin.inventory.alerts.filters.severity')}</option>
                            <option value="high">{t('admin.inventory.alerts.severity.high')}</option>
                            <option value="medium">{t('admin.inventory.alerts.severity.medium')}</option>
                            <option value="low">{t('admin.inventory.alerts.severity.low')}</option>
                        </select>

                        <label className="hidden sm:flex items-center gap-2 bg-background/50 border border-border/50 rounded-lg px-4 py-2 h-10 cursor-pointer hover:bg-secondary/50 transition-colors">
                            <input type="checkbox" checked={showAcknowledged} onChange={(e) => setShowAcknowledged(e.target.checked)}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                            <span className="text-sm font-medium text-foreground">{t('admin.inventory.alerts.filters.acknowledged')}</span>
                        </label>
                    </motion.div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Active Alerts List */}
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-card/50 border border-border/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg backdrop-blur-sm"
                            >
                                <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                                    Active Alerts
                                </h2>

                                {isLoading ? (
                                    <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">{t('admin.common.loading')}</div>
                                ) : (Array.isArray(alerts) ? alerts : (alerts?.data || []))?.length === 0 ? (
                                    <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm bg-secondary/20 rounded-xl border border-border/50 border-dashed">
                                        <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                                        {t('admin.inventory.alerts.no_active')}
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3">
                                        {(Array.isArray(alerts) ? alerts : (alerts?.data || [])).map((alert: Alert, idx: number) => (
                                            <motion.div
                                                key={alert.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="bg-card border border-border/50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all relative overflow-hidden"
                                            >
                                                <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                                                    alert.severity === 'high' ? 'bg-red-500' :
                                                        alert.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                                                )} />
                                                <div className="pl-2 sm:pl-3">
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                                                            <div className="p-1.5 sm:p-2 rounded-lg bg-secondary flex-shrink-0">
                                                                {getSeverityIcon(alert.severity)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h3 className="text-foreground font-semibold text-sm sm:text-base truncate">{alert.ingredient?.name}</h3>
                                                                    <Badge className={cn("text-[8px] sm:text-[10px] uppercase font-bold border-none px-1.5", getAlertTypeColor(alert.type))}>
                                                                        {getAlertTypeLabel(alert.type)}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">{alert.message}</p>
                                                            </div>
                                                        </div>
                                                        {!alert.acknowledged && (
                                                            <Button size="sm" variant="ghost"
                                                                onClick={() => acknowledgeMutation.mutate(alert.id)}
                                                                className="hover:bg-green-500/10 hover:text-green-600 h-8 sm:h-9 px-2 sm:px-3 text-xs flex-shrink-0">
                                                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                <span className="hidden sm:inline ml-1">{t('admin.inventory.alerts.actions.done')}</span>
                                                            </Button>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                                                        {alert.location && (
                                                            <span className="bg-secondary/50 px-1.5 sm:px-2 py-0.5 rounded truncate">
                                                                📍 {alert.location.name}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(alert.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Sidebar: Reorder & Settings */}
                        <div className="space-y-4 sm:space-y-6">
                            {/* Reorder Recommendations */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-[#0f111a] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl hidden sm:block" />

                                <h2 className="text-sm sm:text-base md:text-lg font-bold text-white mb-3 sm:mb-4 md:mb-5 flex items-center gap-2 relative z-10">
                                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                                    {t('admin.inventory.alerts.reorder.title')}
                                </h2>

                                {lowStock?.length === 0 ? (
                                    <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm flex flex-col items-center">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-2 sm:mb-3">
                                            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                                        </div>
                                        <p>{t('admin.inventory.alerts.reorder.all_healthy')}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                        {lowStock?.slice(0, 3).map((ingredient: Ingredient) => (
                                            <div key={ingredient.id} className="bg-[#181824] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/5 hover:border-purple-500/20 transition-colors">
                                                <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm sm:text-base font-bold text-white mb-0.5 truncate">{ingredient.name}</h4>
                                                        <p className="text-[10px] sm:text-xs text-zinc-400 truncate">{ingredient.supplier?.name || t('admin.inventory.alerts.reorder.no_supplier')}</p>
                                                    </div>
                                                    <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
                                                        {Number(ingredient.current_stock || 0).toFixed(1)}
                                                    </span>
                                                </div>
                                                <Button
                                                    onClick={() => { setSelectedIngredient(ingredient); setOpenReorder(true); }}
                                                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white rounded-full h-8 sm:h-9 md:h-10 text-xs sm:text-sm shadow-lg"
                                                >
                                                    <span className="font-semibold">{t('admin.inventory.alerts.actions.create_po')}</span>
                                                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
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
                                className="bg-[#0f111a] border border-white/5 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-xl"
                            >
                                <h2 className="text-sm sm:text-base md:text-lg font-bold text-white mb-3 sm:mb-4 md:mb-5 flex items-center gap-2">
                                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
                                    {t('admin.inventory.alerts.settings.title')}
                                </h2>
                                <div className="space-y-3 sm:space-y-4 md:space-y-5">
                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="text-zinc-400 font-medium">{t('admin.inventory.alerts.settings.email_alerts')}</span>
                                        <span className={cn(
                                            "border rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold",
                                            settingsData?.stock_notifications_email
                                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                : "bg-zinc-800 text-zinc-500 border-white/5"
                                        )}>
                                            {settingsData?.stock_notifications_email ? t('admin.inventory.alerts.settings.on') : t('admin.inventory.alerts.settings.off')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs sm:text-sm">
                                        <span className="text-zinc-400 font-medium">{t('admin.inventory.alerts.settings.auto_reorder')}</span>
                                        <span className={cn(
                                            "border rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold",
                                            settingsData?.stock_auto_reorder
                                                ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                                : "bg-zinc-800 text-zinc-500 border-white/5"
                                        )}>
                                            {settingsData?.stock_auto_reorder ? t('admin.inventory.alerts.settings.on') : t('admin.inventory.alerts.settings.off')}
                                        </span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => setOpenSettings(true)}
                                        className="w-full mt-1 sm:mt-2 h-9 sm:h-10 md:h-11 rounded-lg sm:rounded-xl border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 font-medium text-xs sm:text-sm"
                                    >
                                        {t('admin.inventory.alerts.actions.manage_settings')}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create PO Modal */}
            <Modal open={openReorder} onClose={() => { setOpenReorder(false); setSelectedIngredient(null); setReorderQuantity(''); }}
                title={t('admin.inventory.alerts.reorder.modal_title')} size="md">
                {selectedIngredient && (
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-secondary/30 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-border/50">
                            <h3 className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1 sm:mb-2">{t('admin.inventory.alerts.reorder.item_label')}</h3>
                            <div className="flex justify-between items-center mb-1 gap-2">
                                <p className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">{selectedIngredient.name}</p>
                                <Badge variant="outline" className="bg-background text-[10px] sm:text-xs flex-shrink-0">{selectedIngredient.code}</Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-purple-400 font-medium">{selectedIngredient.supplier?.name}</p>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">
                                {t('admin.inventory.alerts.reorder.quantity')} <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <Input type="number" step="0.01" required value={reorderQuantity}
                                    onChange={(e) => setReorderQuantity(e.target.value)}
                                    className="pl-4 sm:pl-5 pr-14 sm:pr-16 text-base sm:text-lg h-11 sm:h-12 md:h-14 font-bold bg-background shadow-inner"
                                    placeholder="0.00" />
                                <span className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium bg-secondary/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">
                                    {selectedIngredient.unit?.code || 'Units'}
                                </span>
                            </div>

                            {/* Location Selector */}
                            <div className="mt-3">
                                <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                                    {t('admin.inventory.alerts.reorder.destination')}
                                </label>
                                <select
                                    className="w-full bg-background border border-border rounded-lg px-3 py-2 h-10 text-sm"
                                    value={locationId}
                                    onChange={(e) => setLocationId(e.target.value)}
                                >
                                    <option value="">{t('admin.inventory.alerts.reorder.select_location', { default: locations?.data?.[0]?.name || 'Main' })}</option>
                                    {locations?.data?.map((loc: any) => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-muted-foreground mt-1">{t('admin.inventory.alerts.reorder.unspecified_location', { default: locations?.data?.[0]?.name || 'Main Kitchen' })}</p>
                            </div>

                            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3 text-[10px] sm:text-xs">
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-blue-500/10 text-blue-500 font-medium">
                                    {t('admin.inventory.alerts.reorder.now')}: {selectedIngredient.current_stock}
                                </span>
                                <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-purple-500/10 text-purple-500 font-medium">
                                    {t('admin.inventory.alerts.reorder.max')}: {selectedIngredient.max_stock_level}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                            <Button variant="ghost" onClick={() => { setOpenReorder(false); setReorderQuantity(''); }}
                                className="flex-1 h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl text-sm">
                                {t('admin.inventory.alerts.actions.cancel')}
                            </Button>
                            <Button onClick={handleCreatePO} disabled={createPOMutation.isPending}
                                className="flex-[2] h-10 sm:h-11 md:h-12 rounded-lg sm:rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-xl font-bold text-xs sm:text-sm">
                                {createPOMutation.isPending ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span className="hidden sm:inline">{t('admin.inventory.alerts.actions.processing')}</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 sm:gap-2">
                                        {t('admin.inventory.alerts.actions.confirm')} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Settings Modal */}
            <Modal open={openSettings} onClose={() => setOpenSettings(false)} title={t('admin.inventory.alerts.settings.title')} size="md">
                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-secondary/30 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-border/50">
                        <p className="text-xs sm:text-sm text-muted-foreground">
                            {t('admin.inventory.alerts.settings.subtitle')}
                        </p>
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                        {/* Notification Email Toggle */}
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-card border border-border rounded-lg sm:rounded-xl gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-foreground text-sm sm:text-base">{t('admin.inventory.alerts.settings.email_alerts')}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">{t('admin.inventory.alerts.settings.email_desc')}</p>
                                </div>
                            </div>
                            <div
                                onClick={() => handleToggleSetting('stock_notifications_email', settingsData?.stock_notifications_email)}
                                className={cn(
                                    "w-10 h-5 sm:w-12 sm:h-6 rounded-full p-0.5 sm:p-1 cursor-pointer transition-colors duration-300 flex-shrink-0",
                                    settingsData?.stock_notifications_email ? "bg-blue-600" : "bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                                    settingsData?.stock_notifications_email ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                                )} />
                            </div>
                        </div>

                        {/* Auto-Reorder Toggle */}
                        <div className="flex items-center justify-between p-3 sm:p-4 bg-card border border-border rounded-lg sm:rounded-xl gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-foreground text-sm sm:text-base">{t('admin.inventory.alerts.settings.auto_reorder')}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">{t('admin.inventory.alerts.settings.auto_reorder_desc')}</p>
                                </div>
                            </div>
                            <div
                                onClick={() => handleToggleSetting('stock_auto_reorder', settingsData?.stock_auto_reorder)}
                                className={cn(
                                    "w-10 h-5 sm:w-12 sm:h-6 rounded-full p-0.5 sm:p-1 cursor-pointer transition-colors duration-300 flex-shrink-0",
                                    settingsData?.stock_auto_reorder ? "bg-purple-600" : "bg-muted"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300",
                                    settingsData?.stock_auto_reorder ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                                )} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-1 sm:pt-2">
                        <Button onClick={() => setOpenSettings(false)} className="h-9 sm:h-10 text-sm">
                            {t('admin.inventory.alerts.actions.close')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </AdminLayout >
    );
}
