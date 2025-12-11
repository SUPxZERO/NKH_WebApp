import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';

// ==================== TYPES ====================

export interface OrderPaymentStatus {
    order_id: number;
    order_number: string;
    total_amount: number;
    currency: string;
    payment_status: 'unpaid' | 'paid' | 'partial' | 'refunded';
    payment_mode: 'pay_now' | 'pay_on_delivery' | 'pay_on_pickup' | 'pay_at_counter';
    is_paid: boolean;
    needs_collection: boolean;
    invoice: {
        id: number;
        status: string;
        amount_paid: number;
        amount_due: number;
    } | null;
    payments: {
        id: number;
        amount: number;
        status: string;
        method: string;
        completed_at: string | null;
    }[];
}

export interface PaymentModeOption {
    code: string;
    name: string;
    description: string;
}

export interface PendingCollectionOrder {
    id: number;
    order_number: string;
    total_amount: number;
    currency: string;
    order_type: string;
    payment_mode: string;
    status: string;
    customer_name: string;
    customer_phone: string | null;
    delivery_address: string | null;
    created_at: string;
}

// ==================== HOOKS ====================

/**
 * Get order payment status.
 */
export function useOrderPaymentStatus(orderId: number | null) {
    return useQuery({
        queryKey: ['order-payment-status', orderId],
        queryFn: async () => {
            if (!orderId) return null;
            const response = await apiGet(`/api/orders/${orderId}/payment-status`);
            return response.data as OrderPaymentStatus;
        },
        enabled: !!orderId,
    });
}

/**
 * Get available payment modes for an order type.
 */
export function usePaymentModes(orderType: string) {
    return useQuery({
        queryKey: ['payment-modes', orderType],
        queryFn: async () => {
            const response = await apiGet(`/api/orders/payment-modes/${orderType}`);
            return response.data as PaymentModeOption[];
        },
        enabled: !!orderType,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Update order payment mode.
 */
export function useUpdatePaymentMode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, paymentMode }: { orderId: number; paymentMode: string }) => {
            const response = await apiPost(`/api/orders/${orderId}/payment-mode`, {
                payment_mode: paymentMode,
            });
            return response;
        },
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: ['order-payment-status', orderId] });
        },
    });
}

/**
 * Collect payment for an order (delivery/pickup).
 */
export function useCollectPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            orderId,
            amount,
            cashReceived,
            paymentMethod,
            notes,
        }: {
            orderId: number;
            amount?: number;
            cashReceived?: number;
            paymentMethod?: 'cash' | 'card' | 'qr';
            notes?: string;
        }) => {
            const response = await apiPost(`/api/orders/${orderId}/collect-payment`, {
                amount,
                cash_received: cashReceived,
                payment_method: paymentMethod,
                notes,
            });
            return response;
        },
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: ['order-payment-status', orderId] });
            queryClient.invalidateQueries({ queryKey: ['pending-collection'] });
        },
    });
}

/**
 * POS Quick Pay.
 */
export function useQuickPay() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            orderId,
            paymentMethod,
            cashReceived,
            notes,
        }: {
            orderId: number;
            paymentMethod: 'cash' | 'card' | 'qr';
            cashReceived?: number;
            notes?: string;
        }) => {
            const response = await apiPost(`/api/pos/orders/${orderId}/quick-pay`, {
                payment_method: paymentMethod,
                cash_received: cashReceived,
                notes,
            });
            return response;
        },
        onSuccess: (_, { orderId }) => {
            queryClient.invalidateQueries({ queryKey: ['order-payment-status', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}

/**
 * Get orders pending payment collection.
 */
export function usePendingCollection() {
    return useQuery({
        queryKey: ['pending-collection'],
        queryFn: async () => {
            const response = await apiGet('/api/orders/pending-collection');
            return response.data as PendingCollectionOrder[];
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

/**
 * Get active orders for POS.
 */
export function useActivePOSOrders() {
    return useQuery({
        queryKey: ['pos.active-orders'],
        queryFn: async () => {
            const response = await apiGet('/api/orders/pos/active');
            return response.data as any[];
        },
        refetchInterval: 15000, // Poll every 15s
    });
}
