import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';

// ==================== TYPES ====================

export interface SplitPaymentStatus {
    order: {
        id: number;
        order_number: string;
        total: number;
    };
    invoice: {
        id: number;
        invoice_number: string;
        total_amount: number;
        amount_paid: number;
        remaining_balance: number;
        payment_progress: number;
        is_fully_paid: boolean;
        status: string;
    };
    payments: {
        id: number;
        uuid: string;
        amount: number;
        currency: string;
        status: string;
        method: string | null;
        method_code: string | null;
        created_at: string;
    }[];
    can_add_payment: boolean;
}

export interface PaymentSuggestion {
    label: string;
    amount: number;
}

export interface SplitPaymentSuggestions {
    total_amount: number;
    remaining_balance: number;
    suggestions: PaymentSuggestion[];
}

// ==================== HOOKS ====================

/**
 * Hook to get split payment session status
 */
export function useSplitPaymentStatus(orderId: number | null) {
    return useQuery({
        queryKey: ['split-payment', 'status', orderId],
        queryFn: async () => {
            const response = await apiGet(`payments/split/${orderId}/status`);
            return response.data as SplitPaymentStatus;
        },
        enabled: !!orderId,
        refetchInterval: 5000, // Poll every 5 seconds
    });
}

/**
 * Hook to get payment amount suggestions
 */
export function useSplitPaymentSuggestions(orderId: number | null) {
    return useQuery({
        queryKey: ['split-payment', 'suggestions', orderId],
        queryFn: async () => {
            const response = await apiGet(`payments/split/${orderId}/suggestions`);
            return response.data as SplitPaymentSuggestions;
        },
        enabled: !!orderId,
    });
}

/**
 * Hook to add a split payment
 */
export function useAddSplitPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, paymentMethod, amount }: {
            orderId: number;
            paymentMethod: string;
            amount: number;
        }) => {
            return await apiPost(`payments/split/${orderId}/add`, {
                payment_method: paymentMethod,
                amount,
            });
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['split-payment', 'status', variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ['split-payment', 'suggestions', variables.orderId] });
        },
    });
}

/**
 * Hook to cancel a pending split payment
 */
export function useCancelSplitPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, paymentId }: { orderId: number; paymentId: number }) => {
            return await apiPost(`payments/split/${orderId}/cancel/${paymentId}`, {});
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['split-payment', 'status', variables.orderId] });
            queryClient.invalidateQueries({ queryKey: ['split-payment', 'suggestions', variables.orderId] });
        },
    });
}

/**
 * Hook to complete a split payment session
 */
export function useCompleteSplitPayment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (orderId: number) => {
            return await apiPost(`payments/split/${orderId}/complete`, {});
        },
        onSuccess: (_, orderId) => {
            queryClient.invalidateQueries({ queryKey: ['split-payment', 'status', orderId] });
        },
    });
}
