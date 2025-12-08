import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';

// ==================== TYPES ====================

export interface PaymentInitResponse {
    success: boolean;
    payment: {
        id: number;
        uuid: string;
        status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
        amount: number;
        currency: string;
        reference_number: string;
        transaction_id: string;
        expires_at: string;
        expires_in_seconds: number | null;
    };
    qr_code: {
        data: string;
        reference: string;
        image_svg: string;
        image_base64: string;
    };
    order: {
        id: number;
        order_number: string;
        total: number;
    };
}

export interface PaymentStatus {
    payment_id: number;
    uuid: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    amount: number;
    currency: string;
    reference_number: string;
    transaction_id: string;
    created_at: string;
    expires_at: string | null;
    is_expired: boolean;
    processed_at?: string;
    failure_reason?: string;
    can_retry?: boolean;
}

// ==================== HOOKS ====================

/**
 * Initiate a payment for an order.
 */
export function useInitiatePayment() {
    return useMutation({
        mutationFn: async ({ orderId, paymentMethod = 'qr' }: { orderId: number; paymentMethod?: string }) => {
            const response = await apiPost('/api/payments/initiate', {
                order_id: orderId,
                payment_method: paymentMethod,
            });
            return response as PaymentInitResponse;
        },
    });
}

/**
 * Get payment status by payment ID.
 */
export function usePaymentStatus(paymentId: number | null, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: ['payment-status', paymentId],
        queryFn: async () => {
            if (!paymentId) return null;
            const response = await apiGet(`/api/payments/${paymentId}/status`);
            return (response as { data: PaymentStatus }).data;
        },
        enabled: !!paymentId,
        refetchInterval: options?.refetchInterval ?? 3000, // Poll every 3 seconds by default
        refetchIntervalInBackground: true,
    });
}

/**
 * Get payment status by UUID.
 */
export function usePaymentStatusByUuid(uuid: string | null, options?: { refetchInterval?: number }) {
    return useQuery({
        queryKey: ['payment-status-uuid', uuid],
        queryFn: async () => {
            if (!uuid) return null;
            const response = await apiGet(`/api/payments/uuid/${uuid}`);
            return (response as { data: PaymentStatus }).data;
        },
        enabled: !!uuid,
        refetchInterval: options?.refetchInterval ?? 3000,
        refetchIntervalInBackground: true,
    });
}

/**
 * Cancel a payment.
 */
export function useCancelPayment() {
    return useMutation({
        mutationFn: async ({ paymentId, reason }: { paymentId: number; reason?: string }) => {
            const response = await apiPost(`/api/payments/${paymentId}/cancel`, { reason });
            return response;
        },
    });
}

/**
 * Retry a failed payment.
 */
export function useRetryPayment() {
    return useMutation({
        mutationFn: async (paymentId: number) => {
            const response = await apiPost(`/api/payments/${paymentId}/retry`, {});
            return response as PaymentInitResponse;
        },
    });
}

/**
 * Simulate payment success (development only).
 */
export function useSimulatePaymentSuccess() {
    return useMutation({
        mutationFn: async (paymentId: number) => {
            const response = await apiPost(`/api/payments/${paymentId}/simulate-success`, {});
            return response;
        },
    });
}

/**
 * Simulate payment failure (development only).
 */
export function useSimulatePaymentFailure() {
    return useMutation({
        mutationFn: async ({ paymentId, reason }: { paymentId: number; reason?: string }) => {
            const response = await apiPost(`/api/payments/${paymentId}/simulate-failure`, { reason });
            return response;
        },
    });
}
