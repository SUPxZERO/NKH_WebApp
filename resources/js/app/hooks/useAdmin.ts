import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { ApiResponse } from '@/app/types/domain';

export interface RevenuePoint { label: string; value: number }
export interface OrderStats { pending: number; preparing: number; ready: number; delivered: number; cancelled: number }
export interface EmployeeMetric { id: number; name: string; ordersHandled: number; rating: number }

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['admin.dashboard.analytics'],
    queryFn: () => apiGet<ApiResponse<{ revenue: RevenuePoint[]; orderStats: OrderStats; employees: EmployeeMetric[] }>>('/admin/dashboard/analytics').then(r => r.data),
    staleTime: 1000 * 60,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ['admin.dashboard.orderStats'],
    queryFn: () => apiGet<ApiResponse<OrderStats>>('/admin/dashboard/orders/stats').then(r => r.data),
    staleTime: 1000 * 30,
  });
}

export function useRevenue(period: 'daily' | 'weekly' | 'monthly') {
  return useQuery({
    queryKey: ['admin.dashboard.revenue', period],
    queryFn: () => apiGet<ApiResponse<RevenuePoint[]>>(`/admin/dashboard/revenue/${period}`).then(r => r.data),
    staleTime: 1000 * 60,
  });
}
