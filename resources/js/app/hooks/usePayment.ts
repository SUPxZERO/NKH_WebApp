import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';

// ==================== TYPES ====================

export interface PaymentMethod {
    id: number;
    code: string;
    name: string;
    type: string;
    description: string;
    processing_fee: number;
    icon: string;
}

export interface PaymentInitResponse {
    success: boolean;
    type?: 'qr' | 'cash' | 'card';
    payment: {
        id: number;
        uuid: string;
        status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
        amount: number;
        currency: string;
        reference_number?: string;
        transaction_id?: string;
        expires_at?: string;
        expires_in_seconds?: number | null;
    };
    qr_code?: {
        data: string;
        reference: string;
        image_svg: string;
        image_base64: string;
    };
    instructions?: string;
    order?: {
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
 * Fetch available payment methods.
 */
export function usePaymentMethods() {
    return useQuery({
        queryKey: ['payment-methods'],
        queryFn: async () => {
            const response = await apiGet('/api/payment-methods');
            return (response as { data: PaymentMethod[] }).data;
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

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
        refetchInterval: options?.refetchInterval, // Use undefined to disable polling
        refetchIntervalInBackground: !!options?.refetchInterval,
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

// ==================== EMPLOYEE CASH PAYMENT HOOKS ====================

export interface PendingCashPayment {
    id: number;
    uuid: string;
    amount: number;
    currency: string;
    reference_number: string;
    created_at: string;
    waiting_time: string;
    order: {
        id: number;
        order_number: string;
        customer_name: string;
        items_count: number;
    };
}

export interface CashPaymentStats {
    total_confirmed: number;
    total_amount: number;
    total_cash_received: number;
    total_change_given: number;
    pending_count: number;
}

/**
 * Fetch pending cash payments for employee confirmation.
 */
export function usePendingCashPayments() {
    return useQuery({
        queryKey: ['pending-cash-payments'],
        queryFn: async () => {
            const response = await apiGet('/api/employee/payments/pending-cash');
            return (response as { data: PendingCashPayment[] }).data;
        },
        refetchInterval: 5000, // Poll every 5 seconds
    });
}

/**
 * Confirm a cash payment.
 */
export function useConfirmCashPayment() {
    return useMutation({
        mutationFn: async ({ paymentId, cashReceived, notes }: {
            paymentId: number;
            cashReceived: number;
            notes?: string;
        }) => {
            const response = await apiPost(`/api/employee/payments/${paymentId}/confirm-cash`, {
                cash_received: cashReceived,
                notes,
            });
            return response;
        },
    });
}

/**
 * Reject a cash payment.
 */
export function useRejectCashPayment() {
    return useMutation({
        mutationFn: async ({ paymentId, reason }: { paymentId: number; reason: string }) => {
            const response = await apiPost(`/api/employee/payments/${paymentId}/reject-cash`, {
                reason,
            });
            return response;
        },
    });
}

/**
 * Get cash payment statistics for the current employee.
 */
export function useCashPaymentStats() {
    return useQuery({
        queryKey: ['cash-payment-stats'],
        queryFn: async () => {
            const response = await apiGet('/api/employee/payments/cash-stats');
            return (response as { data: CashPaymentStats }).data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

