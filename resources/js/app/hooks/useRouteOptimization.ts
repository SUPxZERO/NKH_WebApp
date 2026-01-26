import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/app/libs/apiClient';
import { toastSuccess, toastError } from '@/app/utils/toast';

interface UseRouteOptimizationProps {
    driverLocation: { lat: number; lng: number } | null;
}

interface OptimizedRoute {
    order_sequence: number[];
    total_distance_km: number;
    total_duration_min: number;
    waypoints: Array<{
        id: number;
        order_number: string;
        lat: number;
        lng: number;
        address: string;
    }>;
    route_geometry: any;
}

export function useRouteOptimization({ driverLocation }: UseRouteOptimizationProps) {
    const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
    const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);

    const optimizeMutation = useMutation({
        mutationFn: (orderIds: number[]) => {
            if (!driverLocation) {
                throw new Error('Driver location not available');
            }

            return apiPost('/employee/driver/orders/optimize-route', {
                order_ids: orderIds,
                driver_location: driverLocation,
            }) as Promise<{ data: OptimizedRoute }>;
        },
        onSuccess: (response: { data: OptimizedRoute }) => {
            setOptimizedRoute(response.data);
            toastSuccess(`Route optimized! ${response.data.total_distance_km}km, ~${Math.round(response.data.total_duration_min)}min`);
        },
        onError: (error: any) => {
            toastError(error?.response?.data?.message || 'Failed to optimize route');
        },
    });

    const optimizeRoute = (orderIds: number[]) => {
        if (orderIds.length < 2) {
            toastError('Select at least 2 orders to optimize route');
            return;
        }

        if (orderIds.length > 25) {
            toastError('Maximum 25 orders can be optimized at once');
            return;
        }

        optimizeMutation.mutate(orderIds);
    };

    const clearOptimization = () => {
        setOptimizedRoute(null);
        setSelectedOrderIds([]);
    };

    const toggleOrderSelection = (orderId: number) => {
        setSelectedOrderIds(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const selectAllAvailable = (orderIds: number[]) => {
        setSelectedOrderIds(orderIds);
    };

    return {
        optimizedRoute,
        selectedOrderIds,
        isOptimizing: optimizeMutation.isPending,
        optimizeRoute,
        clearOptimization,
        toggleOrderSelection,
        selectAllAvailable,
        setSelectedOrderIds,
    };
}
