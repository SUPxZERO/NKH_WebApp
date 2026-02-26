import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Map from '@/app/components/ui/Map';
import { useDriverLocation } from '@/app/hooks/useDriverLocation';
import { useRouteOptimization } from '@/app/hooks/useRouteOptimization';
import { apiGet, apiPost, apiPut } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import {
    MapPin,
    Phone,
    DollarSign,
    Navigation,
    Locate,
    RefreshCw,
    X,
    CheckCircle,
    TruckIcon,
    Route,
    XCircle,
    ExternalLink,
} from 'lucide-react';
import Button from '@/app/components/ui/Button';
import { Card, CardContent } from '@/app/components/ui/Card';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';

interface DriverMapViewProps {
    onCollectPayment: (order: any) => void;
}

interface DriverOrdersData {
    my_deliveries: any[];
    available_deliveries: any[];
}

// Color mapping for order statuses
const STATUS_COLORS: Record<string, string> = {
    'ready': '#10B981', // Green
    'preparing': '#F59E0B', // Amber
    'out_for_delivery': '#3B82F6', // Blue
    'pending': '#6B7280', // Gray
};

export default function DriverMapView({ onCollectPayment }: DriverMapViewProps) {
    const qc = useQueryClient();
    const { t } = useLanguage();
    const { location: driverLocation, loading: locationLoading, requestPermission } = useDriverLocation();
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [viewFilter, setViewFilter] = useState<'all' | 'my_deliveries' | 'available'>('all');

    // Route optimization
    const {
        optimizedRoute,
        selectedOrderIds,
        isOptimizing,
        optimizeRoute,
        clearOptimization,
        toggleOrderSelection,
        selectAllAvailable,
    } = useRouteOptimization({ driverLocation });

    // Fetch driver orders with driver location for proximity sorting
    const { data, isLoading, error, refetch } = useQuery<DriverOrdersData>({
        queryKey: ['driver.orders', driverLocation?.lat, driverLocation?.lng],
        queryFn: () => {
            const params = driverLocation
                ? `?driver_lat=${driverLocation.lat}&driver_lng=${driverLocation.lng}`
                : '';
            return apiGet(`/employee/driver/orders${params}`);
        },
        refetchInterval: 15000, // Poll every 15 seconds
    });

    // Claim order mutation
    const claimMutation = useMutation({
        mutationFn: (orderId: number) => apiPost(`/employee/driver/orders/${orderId}/claim`, {}),
        onSuccess: () => {
            toastSuccess(t('employee.delivery.messages.claimed') as string);
            qc.invalidateQueries({ queryKey: ['driver.orders'] });
            setSelectedOrder(null);
        },
        onError: (err: any) => toastError(err?.response?.data?.message || t('employee.delivery.claim_failed') as string),
    });

    // Update status mutation  
    const statusMutation = useMutation({
        mutationFn: (vars: { id: number; status: string }) =>
            apiPut(`/employee/driver/orders/${vars.id}/status`, { status: vars.status }),
        onSuccess: () => {
            toastSuccess(t('employee.delivery.messages.status_updated') as string);
            qc.invalidateQueries({ queryKey: ['driver.orders'] });
        },
        onError: (err: any) => toastError(err?.response?.data?.message || t('employee.delivery.messages.status_update_failed') as string),
    });

    // Filter orders based on view
    const filteredOrders = useMemo(() => {
        if (!data) return [];

        switch (viewFilter) {
            case 'my_deliveries':
                return data.my_deliveries || [];
            case 'available':
                return data.available_deliveries || [];
            case 'all':
            default:
                return [
                    ...(data.my_deliveries || []),
                    ...(data.available_deliveries || []),
                ];
        }
    }, [data, viewFilter]);

    // Convert orders to map markers
    const markers = useMemo(() => {
        return filteredOrders
            .filter((order: any) => order.has_coordinates)
            .map((order: any) => ({
                id: order.id,
                lat: order.delivery_latitude,
                lng: order.delivery_longitude,
                title: t('employee.delivery.order_number', { number: order.order_number }),
                color: STATUS_COLORS[order.status] || '#6B7280',
            }));
    }, [filteredOrders, t]);

    // Calculate map center (driver location or average of orders)
    const mapCenter: [number, number] = useMemo(() => {
        if (driverLocation) {
            return [driverLocation.lat, driverLocation.lng];
        }

        if (markers.length > 0) {
            const avgLat = markers.reduce((sum: number, m: { lat: number }) => sum + m.lat, 0) / markers.length;
            const avgLng = markers.reduce((sum: number, m: { lng: number }) => sum + m.lng, 0) / markers.length;
            return [avgLat, avgLng];
        }

        return [11.5564, 104.9282]; // Default: Phnom Penh
    }, [driverLocation, markers]);

    // Handle marker click
    const handleMarkerClick = useCallback((marker: any) => {
        const order = filteredOrders.find((o: any) => o.id === marker.id);
        if (order) {
            setSelectedOrder(order);
        }
    }, [filteredOrders]);

    // Navigate to address
    const navigateTo = useCallback((address: string, lat?: number, lng?: number) => {
        if (lat && lng) {
            // Use Google Maps with coordinates
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
        } else if (address) {
            // Fallback to search
            const encoded = encodeURIComponent(address);
            window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
        }
    }, []);

    // Handle claim order
    const handleClaim = useCallback((order: any) => {
        if (confirm(t('employee.delivery.confirm_claim_number', { number: order.order_number }) as string)) {
            claimMutation.mutate(order.id);
        }
    }, [claimMutation, t]);

    // Handle start delivery
    const handleStartDelivery = useCallback((order: any) => {
        if (confirm(t('employee.delivery.confirm_out_for_delivery') as string)) {
            statusMutation.mutate({ id: order.id, status: 'out_for_delivery' });
        }
    }, [statusMutation, t]);

    // Handle complete delivery
    const handleComplete = useCallback((order: any) => {
        const needsPayment = order.payment_status === 'unpaid' &&
            ['pay_on_delivery', 'pay_on_pickup', 'cod'].includes(order.payment_mode);

        if (needsPayment) {
            onCollectPayment(order);
        } else {
            if (confirm(t('employee.delivery.confirm_delivered') as string)) {
                statusMutation.mutate({ id: order.id, status: 'delivered' });
            }
        }
    }, [statusMutation, onCollectPayment, t]);

    const [showUnmapped, setShowUnmapped] = useState(false);

    // Filter unmapped orders
    const unmappedOrders = useMemo(() =>
        filteredOrders.filter((o: any) => !o.has_coordinates),
        [filteredOrders]);

    return (
        <div className="flex flex-col h-full">
            {/* Top Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
                    <button
                        onClick={() => setViewFilter('all')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm transition-all duration-200",
                            viewFilter === 'all' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "text-gray-400 hover:text-white"
                        )}
                    >
                        {t('employee.delivery.view_all')}
                    </button>
                    <button
                        onClick={() => setViewFilter('my_deliveries')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm transition-all duration-200",
                            viewFilter === 'my_deliveries' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "text-gray-400 hover:text-white"
                        )}
                    >
                        {t('employee.delivery.my_deliveries')}
                    </button>
                    <button
                        onClick={() => setViewFilter('available')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm transition-all duration-200",
                            viewFilter === 'available' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "text-gray-400 hover:text-white"
                        )}
                    >
                        {t('employee.delivery.available')}
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="text-gray-400 hover:text-white"
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        {t('employee.common.refresh')}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={requestPermission}
                        className="text-gray-400 hover:text-white"
                    >
                        <Locate className="w-4 h-4 mr-2" />
                        {t('employee.delivery.map.my_location')}
                    </Button>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10 bg-black/20">
                <Map
                    markers={markers}
                    center={mapCenter}
                    zoom={13}
                    showUserLocation={true}
                    userLocation={driverLocation ? [driverLocation.lat, driverLocation.lng] : undefined}
                    onMarkerClick={handleMarkerClick}
                    className="w-full h-full"
                />

                {/* Orders without coordinates notification */}
                {unmappedOrders.length > 0 && (
                    <div className="absolute top-4 left-4 bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-sm text-blue-400 max-w-xs z-20 backdrop-blur-md">
                        <p className="font-medium">{t('employee.delivery.map.missing_coords_title')}</p>
                        <p className="text-xs mt-1 mb-2">
                            {unmappedOrders.length === 1
                                ? t('employee.delivery.map.not_shown_one', { count: unmappedOrders.length.toString() })
                                : t('employee.delivery.map.not_shown_other', { count: unmappedOrders.length.toString() })}
                        </p>
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-8 border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                            onClick={() => setShowUnmapped(true)}
                        >
                            {t('employee.delivery.map.view_unmapped_list') || 'View List'}
                        </Button>
                    </div>
                )}

                {/* Unmapped Orders Modal/Overlay */}
                {showUnmapped && (
                    <div className="absolute inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex flex-col p-4 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white text-lg">
                                {t('employee.delivery.map.unmapped_orders') || 'Orders without Location'}
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowUnmapped(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {unmappedOrders.map((order: any) => (
                                <Card
                                    key={order.id}
                                    className="bg-white/10 border-white/10 hover:bg-white/15 cursor-pointer transition-colors"
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setShowUnmapped(false);
                                    }}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-white mb-1">
                                                    {t('employee.delivery.order_number', { number: order.order_number })}
                                                </div>
                                                <div className="text-sm text-gray-300 mb-1">
                                                    {order.delivery_address || t('employee.common.na')}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full border",
                                                        order.payment_status === 'paid'
                                                            ? "bg-green-500/20 border-green-500/50 text-green-400"
                                                            : "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                                    )}>
                                                        {t(`employee.delivery.payment_status.${order.payment_status}`)}
                                                    </span>
                                                    <span className="text-gray-400">
                                                        {t('employee.common.currency_symbol')}{order.total_amount}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[order.status] || '#6B7280' }} />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-gray-900/80 border border-white/10 rounded-lg p-2 text-[10px] space-y-1 z-10 backdrop-blur-sm">
                    {Object.entries(STATUS_COLORS).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-gray-300 uppercase leading-none">{t(`employee.delivery.status.${status}`)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selected Order Detail Panel (Bottom Sheet) */}
            {selectedOrder && (
                <div className="mt-4 animate-in slide-in-from-bottom duration-300">
                    <Card className="bg-white/5 border-white/10 overflow-hidden">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">
                                        {t('employee.delivery.order_number', { number: selectedOrder.order_number })}
                                    </h3>
                                    <p className="text-blue-400 text-sm font-medium">
                                        {t(`employee.delivery.status.${selectedOrder.status}`)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-400"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">{t('employee.delivery.address')}</p>
                                            <button
                                                onClick={() => navigateTo(selectedOrder.delivery_address, selectedOrder.delivery_latitude, selectedOrder.delivery_longitude)}
                                                className="text-white text-sm hover:text-blue-400 transition-colors text-left flex items-center gap-1 group"
                                            >
                                                {selectedOrder.delivery_address}
                                                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">{t('employee.delivery.customer_phone')}</p>
                                            <a href={`tel:${selectedOrder.customer_phone}`} className="text-white text-sm hover:text-blue-400 transition-colors">
                                                {selectedOrder.customer_phone || t('employee.common.na')}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <DollarSign className="w-5 h-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold">{t('employee.delivery.payment')}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-bold">{t('employee.common.currency_symbol')}{selectedOrder.total_amount}</span>
                                                <span className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full border uppercase",
                                                    selectedOrder.payment_status === 'paid'
                                                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                                                        : "bg-orange-500/10 border-orange-500/30 text-orange-400"
                                                )}>
                                                    {t(`employee.delivery.payment_status.${selectedOrder.payment_status}`)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedOrder.special_instructions && (
                                        <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                            <p className="text-[10px] text-amber-500 uppercase font-vold mb-1">{t('employee.common.notes')}</p>
                                            <p className="text-xs text-amber-200">{selectedOrder.special_instructions}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="primary"
                                    onClick={() => navigateTo(selectedOrder.delivery_address, selectedOrder.delivery_latitude, selectedOrder.delivery_longitude)}
                                    className="flex-1"
                                >
                                    <Navigation className="w-4 h-4 mr-2" />
                                    {t('employee.delivery.map.navigate')}
                                </Button>

                                {(selectedOrder.status === 'ready' || selectedOrder.status === 'preparing') && !selectedOrder.driver_id && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleClaim(selectedOrder)}
                                        className="flex-1"
                                        disabled={claimMutation.isPending}
                                    >
                                        <TruckIcon className="w-4 h-4 mr-2" />
                                        {t('employee.delivery.claim')}
                                    </Button>
                                )}

                                {(selectedOrder.status === 'ready' || selectedOrder.status === 'preparing') && selectedOrder.driver_id && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleStartDelivery(selectedOrder)}
                                        className="flex-1"
                                        disabled={statusMutation.isPending}
                                    >
                                        <Navigation className="w-4 h-4 mr-2" />
                                        {t('employee.delivery.start_delivery')}
                                    </Button>
                                )}

                                {selectedOrder.status === 'out_for_delivery' && (
                                    <Button
                                        variant="outline"
                                        onClick={() => handleComplete(selectedOrder)}
                                        className="flex-1 border-green-500/50 text-green-400 hover:bg-green-500/10"
                                        disabled={statusMutation.isPending}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {t('employee.delivery.delivered')}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
