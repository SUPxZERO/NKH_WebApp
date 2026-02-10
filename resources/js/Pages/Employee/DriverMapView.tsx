import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Map from '@/app/components/ui/Map';
import { useDriverLocation } from '@/app/hooks/useDriverLocation';
import { useRouteOptimization } from '@/app/hooks/useRouteOptimization';
import { apiGet, apiPost, apiPut } from '@/app/libs/apiClient';
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
        } else {
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

    const missingCoordinatesCount = filteredOrders.length - markers.length;
    const missingCoordinatesText = missingCoordinatesCount === 1
        ? t('employee.delivery.map.not_shown_one', { count: missingCoordinatesCount.toString() })
        : t('employee.delivery.map.not_shown_other', { count: missingCoordinatesCount.toString() });

    return (
        <div className="flex flex-col h-full">
            {/* Top Controls */}
            <div className="flex flex-wrap items-center gap-2 mb-4 p-4 bg-white/5 rounded-xl border border-white/10">
                {/* View Filter */}
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                        onClick={() => setViewFilter('all')}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                            viewFilter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        )}
                    >
                        {t('employee.delivery.map.filters.all')}
                    </button>
                    <button
                        onClick={() => setViewFilter('my_deliveries')}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                            viewFilter === 'my_deliveries' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        )}
                    >
                        {t('employee.delivery.map.filters.my_deliveries')}
                    </button>
                    <button
                        onClick={() => setViewFilter('available')}
                        className={cn(
                            'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                            viewFilter === 'available' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        )}
                    >
                        {t('employee.delivery.map.filters.available')}
                    </button>
                </div>

                {/* Location Status */}
                <div className="flex items-center gap-2 text-sm ml-auto">
                    {locationLoading ? (
                        <span className="text-gray-400">
                            <RefreshCw className="w-4 h-4 inline animate-spin mr-1" />
                            {t('employee.delivery.map.location.loading')}
                        </span>
                    ) : driverLocation ? (
                        <span className="text-green-400">
                            <Navigation className="w-4 h-4 inline mr-1" />
                            {t('employee.delivery.map.location.active')}
                        </span>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={requestPermission}
                            className="text-xs"
                        >
                            <Locate className="w-4 h-4 mr-1" />
                            {t('employee.delivery.map.location.enable')}
                        </Button>
                    )}
                </div>

                {/* Refresh */}
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => refetch()}
                    className="text-xs"
                >
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative rounded-xl overflow-hidden border border-white/10">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                        <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                        <p className="text-red-400">{t('employee.delivery.map.load_failed')}</p>
                    </div>
                ) : (
                    <Map
                        markers={markers}
                        center={mapCenter}
                        zoom={13}
                        className="h-full"
                        onMarkerClick={handleMarkerClick}
                        showUserLocation={!!driverLocation}
                        userLocation={driverLocation ? [driverLocation.lat, driverLocation.lng] : undefined}
                        clusterMarkers={true}
                    />
                )}

                {/* Orders without coordinates notification */}
                {missingCoordinatesCount > 0 && (
                    <div className="absolute top-4 left-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-sm text-yellow-400 max-w-xs">
                        <p className="font-medium">{t('employee.delivery.map.missing_coords_title')}</p>
                        <p className="text-xs mt-1">
                            {missingCoordinatesText}
                        </p>
                    </div>
                )}

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-gray-900/90 border border-white/20 rounded-lg p-3 text-xs">
                    <p className="font-medium text-white mb-2">{t('employee.delivery.map.legend_title')}</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.ready }}></div>
                            <span className="text-gray-300">{t('employee.delivery.status.ready')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.out_for_delivery }}></div>
                            <span className="text-gray-300">{t('employee.delivery.status.out_for_delivery')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selected Order Detail Panel (Bottom Sheet) */}
            {selectedOrder && (
                <div className="mt-4 animate-in slide-in-from-bottom duration-300">
                    <Card className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-bold text-lg text-white">
                                        {t('employee.delivery.order_number', { number: selectedOrder.order_number })}
                                    </h3>
                                    <p className="text-sm text-gray-400">{selectedOrder.customer?.user?.name}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div>
                                        <div className="text-gray-400 text-xs">{t('employee.delivery.map.delivery_address')}</div>
                                        <div className="text-white">{selectedOrder.delivery_address || t('employee.common.na')}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div>
                                        <div className="text-gray-400 text-xs">{t('employee.delivery.customer.phone')}</div>
                                        <div className="text-white">{selectedOrder.customer_phone || t('employee.common.na')}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <DollarSign className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div>
                                        <div className="text-gray-400 text-xs">{t('employee.delivery.map.total')}</div>
                                        <div className="text-white font-bold">{t('employee.common.currency_symbol')}{selectedOrder.total_amount}</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <TruckIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                                    <div>
                                        <div className="text-gray-400 text-xs">{t('employee.delivery.map.payment')}</div>
                                        <div className={cn(
                                            'font-medium',
                                            selectedOrder.payment_status === 'paid' ? 'text-green-400' : 'text-orange-400'
                                        )}>
                                            {selectedOrder.payment_status
                                                ? t(`employee.delivery.payment_status.${selectedOrder.payment_status}`)
                                                : t('employee.common.na')}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigateTo(
                                        selectedOrder.delivery_address,
                                        selectedOrder.delivery_latitude,
                                        selectedOrder.delivery_longitude
                                    )}
                                    className="flex-1"
                                >
                                    <Navigation className="w-4 h-4 mr-1" />
                                    {t('employee.delivery.map.navigate')}
                                </Button>

                                {!selectedOrder.driver_id ? (
                                    <Button
                                        size="sm"
                                        onClick={() => handleClaim(selectedOrder)}
                                        disabled={claimMutation.isPending}
                                        className="flex-1 bg-blue-600 hover:bg-blue-500"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        {t('employee.delivery.map.actions.claim')}
                                    </Button>
                                ) : selectedOrder.status === 'ready' || selectedOrder.status === 'preparing' ? (
                                    <Button
                                        size="sm"
                                        onClick={() => handleStartDelivery(selectedOrder)}
                                        disabled={statusMutation.isPending}
                                        className="flex-1 bg-yellow-600 hover:bg-yellow-500"
                                    >
                                        <TruckIcon className="w-4 h-4 mr-1" />
                                        {t('employee.delivery.map.actions.start_delivery')}
                                    </Button>
                                ) : selectedOrder.status === 'out_for_delivery' ? (
                                    <Button
                                        size="sm"
                                        onClick={() => handleComplete(selectedOrder)}
                                        disabled={statusMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-500"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-1" />
                                        {t('employee.delivery.map.actions.complete')}
                                    </Button>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
