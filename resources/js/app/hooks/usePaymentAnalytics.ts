import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';

// ==================== TYPES ====================

export interface AnalyticsSummary {
    total_payments: number;
    completed: number;
    failed: number;
    revenue: number;
    avg_order: number;
    success_rate: number;
}

export interface AnalyticsGrowth {
    revenue: number;
    transactions: number;
    avg_order: number;
}

export interface AnalyticsOverview {
    period: {
        start: string;
        end: string;
        days: number;
    };
    summary: AnalyticsSummary;
    growth: AnalyticsGrowth;
    previous_period: AnalyticsSummary;
}

export interface RevenueDataPoint {
    period: string;
    date: string;
    total: number;
    count: number;
    cumulative?: number;
}

export interface MethodBreakdown {
    method: string;
    code: string;
    transaction_count: number;
    total_amount: number;
    avg_amount: number;
    percentage_amount: number;
    percentage_count: number;
}

export interface SuccessRateData {
    period: string;
    total: number;
    completed: number;
    failed: number;
    cancelled: number;
    success_rate: number;
    failure_rate: number;
}

export interface PeakData {
    hourly: { hour: number; label: string; count: number; amount: number }[];
    daily: { day: number; label: string; count: number; amount: number }[];
    peaks: {
        hour: { hour: number; label: string; count: number; amount: number };
        day: { day: number; label: string; count: number; amount: number };
    };
}

export interface TopCustomer {
    customer_id: number;
    name: string;
    email: string;
    transaction_count: number;
    total_spent: number;
    avg_order: number;
}

export type AnalyticsPeriod = '7d' | '30d' | '90d' | '12m' | 'ytd' | 'all';
export type GroupBy = 'day' | 'week' | 'month';

// ==================== HOOKS ====================

/**
 * Get overall payment analytics.
 */
export function usePaymentAnalytics(period: AnalyticsPeriod = '30d') {
    return useQuery({
        queryKey: ['payment-analytics', 'overview', period],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/analytics?period=${period}`);
            return response.data as AnalyticsOverview;
        },
    });
}

/**
 * Get revenue analytics with time series data.
 */
export function useRevenueAnalytics(period: AnalyticsPeriod = '30d', groupBy: GroupBy = 'day') {
    return useQuery({
        queryKey: ['payment-analytics', 'revenue', period, groupBy],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/analytics/revenue?period=${period}&group_by=${groupBy}`);
            return {
                total_revenue: response.data.total_revenue as number,
                data: response.data.data as RevenueDataPoint[],
            };
        },
    });
}

/**
 * Get payment method breakdown.
 */
export function useMethodAnalytics(period: AnalyticsPeriod = '30d') {
    return useQuery({
        queryKey: ['payment-analytics', 'methods', period],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/analytics/methods?period=${period}`);
            return {
                total_amount: response.data.total_amount as number,
                total_transactions: response.data.total_transactions as number,
                breakdown: response.data.breakdown as MethodBreakdown[],
            };
        },
    });
}

/**
 * Get success rate trends.
 */
export function useSuccessRateAnalytics(period: AnalyticsPeriod = '30d', groupBy: GroupBy = 'day') {
    return useQuery({
        queryKey: ['payment-analytics', 'success-rate', period, groupBy],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/analytics/success-rate?period=${period}&group_by=${groupBy}`);
            return {
                summary: response.data.summary as {
                    total: number;
                    completed: number;
                    failed: number;
                    cancelled: number;
                    success_rate: number;
                },
                data: response.data.data as SuccessRateData[],
            };
        },
    });
}

/**
 * Get peak hours/days analysis.
 */
export function usePeakAnalytics(period: AnalyticsPeriod = '30d') {
    return useQuery({
        queryKey: ['payment-analytics', 'peaks', period],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/analytics/peaks?period=${period}`);
            return response.data as PeakData;
        },
    });
}

/**
 * Get refund analytics.
 */
export function useRefundAnalytics(period: AnalyticsPeriod = '30d') {
    return useQuery({
        queryKey: ['payment-analytics', 'refunds', period],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/analytics/refunds?period=${period}`);
            return response.data.summary as {
                total_refunds: number;
                completed: number;
                pending: number;
                rejected: number;
                total_amount: number;
                completed_amount: number;
                refund_rate: number;
            };
        },
    });
}

/**
 * Get top customers.
 */
export function useTopCustomersAnalytics(period: AnalyticsPeriod = '30d', limit: number = 10) {
    return useQuery({
        queryKey: ['payment-analytics', 'top-customers', period, limit],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/analytics/top-customers?period=${period}&limit=${limit}`);
            return response.data.customers as TopCustomer[];
        },
    });
}

/**
 * Get comprehensive report data.
 */
export function usePaymentReport(period: AnalyticsPeriod = '30d') {
    return useQuery({
        queryKey: ['payment-analytics', 'report', period],
        queryFn: async () => {
            const response = await apiGet(`admin/payments/analytics/report?period=${period}`);
            return response.data;
        },
    });
}
