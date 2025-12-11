import { useQuery, useMutation } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';

// ==================== TYPES ====================

export interface ReceiptItem {
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    notes?: string;
}

export interface ReceiptData {
    // Business Info
    business_name: string;
    business_address: string;
    business_phone: string;
    location_name: string | null;

    // Receipt Info
    receipt_number: string;
    receipt_date: string;

    // Order Info
    order_number: string | null;
    order_type: string | null;
    table_number: string | null;

    // Customer Info
    customer_name: string | null;
    customer_phone: string | null;

    // Items
    items: ReceiptItem[];

    // Totals
    subtotal: number;
    tax_amount: number;
    tax_rate: number;
    discount_amount: number;
    service_charge: number;
    total_amount: number;

    // Payment Info
    payment_method: string;
    payment_method_code: string | null;
    amount_paid: number;
    currency: string;
    transaction_id: string | null;
    payment_status: string;

    // Cash specific
    cash_received: number | null;
    change_given: number | null;

    // Footer
    thank_you_message: string;
    footer_text: string;
}

// ==================== HOOKS ====================

/**
 * Hook to get receipt data as JSON.
 */
export function useReceipt(paymentId: number | null) {
    return useQuery({
        queryKey: ['receipt', paymentId],
        queryFn: async () => {
            const response = await apiGet(`receipts/${paymentId}`);
            return response.data as ReceiptData;
        },
        enabled: !!paymentId,
    });
}

/**
 * Hook to get receipt by UUID.
 */
export function useReceiptByUuid(uuid: string | null) {
    return useQuery({
        queryKey: ['receipt', 'uuid', uuid],
        queryFn: async () => {
            const response = await apiGet(`receipts/uuid/${uuid}`);
            return response.data as ReceiptData;
        },
        enabled: !!uuid,
    });
}

/**
 * Hook to send receipt email.
 */
export function useSendReceiptEmail() {
    return useMutation({
        mutationFn: async ({ paymentId, email, attachPdf = true }: {
            paymentId: number;
            email: string;
            attachPdf?: boolean;
        }) => {
            return await apiPost(`receipts/${paymentId}/email`, {
                email,
                attach_pdf: attachPdf,
            });
        },
    });
}

// ==================== URL HELPERS ====================

/**
 * Get PDF download URL.
 */
export function getReceiptPdfUrl(paymentId: number): string {
    return `/api/receipts/${paymentId}/pdf`;
}

/**
 * Get HTML view URL.
 */
export function getReceiptHtmlUrl(paymentId: number): string {
    return `/api/receipts/${paymentId}/html`;
}

/**
 * Get thermal receipt URL.
 */
export function getReceiptThermalUrl(paymentId: number): string {
    return `/api/receipts/${paymentId}/thermal`;
}

/**
 * Get print URL.
 */
export function getReceiptPrintUrl(paymentId: number, format: 'standard' | 'thermal' = 'standard'): string {
    return `/api/receipts/${paymentId}/print?format=${format}`;
}
