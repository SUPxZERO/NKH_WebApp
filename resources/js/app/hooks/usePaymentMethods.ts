import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut, apiPost } from '@/app/utils/api';

// ==================== TYPES ====================

export interface AdminPaymentMethod {
    id: number;
    code: string;
    name: string;
    type: string;
    description: string;
    processing_fee: number;
    display_order: number;
    is_active: boolean;
    configuration: Record<string, any> | null;
    can_be_disabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaymentMethodAuditLog {
    id: number;
    action: string;
    changes: Record<string, any>;
    user: {
        id: number;
        name: string;
        email: string;
    } | null;
    ip_address: string;
    created_at: string;
}

export interface UpdatePaymentMethodPayload {
    description?: string;
    processing_fee?: number;
    display_order?: number;
    configuration?: Record<string, any>;
}

// ==================== HOOKS ====================

/**
 * Fetch all payment methods directly from the admin endpoint.
 * This endpoint returns all methods (active/inactive) with admin details.
 */
export function useAdminPaymentMethods(filters?: { is_active?: boolean }) {
    return useQuery({
        queryKey: ['admin-payment-methods', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.is_active !== undefined) {
                params.append('is_active', String(filters.is_active));
            }
            const response = await apiGet(`/api/admin/payment-methods?${params.toString()}`);
            return (response as { data: AdminPaymentMethod[] }).data;
        },
    });
}

/**
 * Fetch a single payment method by ID.
 */
export function useAdminPaymentMethod(id: number | null) {
    return useQuery({
        queryKey: ['admin-payment-method', id],
        queryFn: async () => {
            if (!id) return null;
            const response = await apiGet(`/api/admin/payment-methods/${id}`);
            return (response as { data: AdminPaymentMethod }).data;
        },
        enabled: !!id,
    });
}

/**
 * Update a payment method's configuration.
 */
export function useUpdatePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: UpdatePaymentMethodPayload }) => {
            const response = await apiPut(`/api/admin/payment-methods/${id}`, data);
            return (response as { data: AdminPaymentMethod }).data;
        },
        onSuccess: (updatedMethod) => {
            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
            // Update individual item cache
            queryClient.setQueryData(['admin-payment-method', updatedMethod.id], updatedMethod);
            // Also invalidate public cache just in case
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
        },
    });
}

/**
 * Toggle a payment method's active status.
 */
export function useTogglePaymentMethod() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await apiPost(`/api/admin/payment-methods/${id}/toggle`, {});
            return (response as { data: AdminPaymentMethod }).data;
        },
        onSuccess: (updatedMethod) => {
            queryClient.invalidateQueries({ queryKey: ['admin-payment-methods'] });
            queryClient.setQueryData(['admin-payment-method', updatedMethod.id], updatedMethod);
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
        },
    });
}

/**
 * Fetch audit logs for a payment method.
 */
export function usePaymentMethodAuditLogs(id: number | null) {
    return useQuery({
        queryKey: ['payment-method-audit-logs', id],
        queryFn: async () => {
            if (!id) return [];
            const response = await apiGet(`/api/admin/payment-methods/${id}/audit-log`);
            return (response as { data: PaymentMethodAuditLog[] }).data;
        },
        enabled: !!id,
    });
}
