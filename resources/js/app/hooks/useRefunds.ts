import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';

// ==================== TYPES ====================

export interface Refund {
    id: number;
    payment_id: number;
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    initiated_by: number;
    approved_by: number | null;
    approved_at: string | null;
    processed_at: string | null;
    gateway_reference: string | null;
    rejection_reason: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    payment?: {
        id: number;
        amount: number;
        currency: string;
        status: string;
        reference_number: string;
        payment_method?: {
            name: string;
            code: string;
        };
        invoice?: {
            order?: {
                order_number: string;
                customer?: {
                    user?: {
                        first_name: string;
                        last_name: string;
                    };
                };
            };
        };
    };
    initiator?: {
        id: number;
        first_name: string;
        last_name: string;
    };
    approver?: {
        id: number;
        first_name: string;
        last_name: string;
    };
}

export interface RefundStats {
    pending_count: number;
    approved_count: number;
    completed_count: number;
    rejected_count: number;
    pending_amount: number;
    completed_amount_today: number;
    completed_amount_month: number;
}

export interface RefundRequest {
    payment_id: number;
    amount: number;
    reason: string;
    notes?: string;
}

export interface RefundFilters {
    status?: string;
    from_date?: string;
    to_date?: string;
    per_page?: number;
    page?: number;
}

// ==================== HOOKS ====================

/**
 * Hook to fetch refunds list with filters
 */
export function useRefunds(filters: RefundFilters = {}) {
    return useQuery({
        queryKey: ['admin', 'refunds', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.from_date) params.append('from_date', filters.from_date);
            if (filters.to_date) params.append('to_date', filters.to_date);
            if (filters.per_page) params.append('per_page', filters.per_page.toString());
            if (filters.page) params.append('page', filters.page.toString());

            const response = await apiGet(`admin/refunds?${params.toString()}`);
            return response.data as {
                data: Refund[];
                meta: {
                    current_page: number;
                    last_page: number;
                    per_page: number;
                    total: number;
                };
            };
        },
    });
}

/**
 * Hook to fetch refund statistics
 */
export function useRefundStats() {
    return useQuery({
        queryKey: ['admin', 'refunds', 'stats'],
        queryFn: async () => {
            const response = await apiGet('admin/refunds/stats');
            return response.data as RefundStats;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });
}

/**
 * Hook to fetch refund details
 */
export function useRefund(refundId: number | null) {
    return useQuery({
        queryKey: ['admin', 'refund', refundId],
        queryFn: async () => {
            const response = await apiGet(`admin/refunds/${refundId}`);
            return response.data as Refund;
        },
        enabled: !!refundId,
    });
}

/**
 * Hook to fetch refunds for a specific payment
 */
export function usePaymentRefunds(paymentId: number | null) {
    return useQuery({
        queryKey: ['admin', 'payment', paymentId, 'refunds'],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/${paymentId}/refunds`);
            return response.data as {
                refunds: Refund[];
                summary: {
                    payment_amount: number;
                    total_refunded: number;
                    pending_refunds: number;
                    refundable_amount: number;
                };
            };
        },
        enabled: !!paymentId,
    });
}

/**
 * Hook to create a refund request
 */
export function useCreateRefund() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: RefundRequest) => {
            const response = await apiPost('admin/refunds', data);
            return response.data as Refund;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
        },
    });
}

/**
 * Hook to approve a refund
 */
export function useApproveRefund() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (refundId: number) => {
            const response = await apiPost(`admin/refunds/${refundId}/approve`, {});
            return response.data as Refund;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
        },
    });
}

/**
 * Hook to reject a refund
 */
export function useRejectRefund() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ refundId, reason }: { refundId: number; reason: string }) => {
            const response = await apiPost(`admin/refunds/${refundId}/reject`, { reason });
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
        },
    });
}

/**
 * Hook to process an approved refund
 */
export function useProcessRefund() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (refundId: number) => {
            const response = await apiPost(`admin/refunds/${refundId}/process`, {});
            return response.data as Refund;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'refunds'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
        },
    });
}
