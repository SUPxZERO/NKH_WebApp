import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent, CardHeader } from '@/app/components/ui/Card';
import { Skeleton } from '@/app/components/ui/Loading';
import { TrendingUp, Users, Timer, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';
import RevenueLine from '@/app/components/charts/RevenueLine';

interface Employee {
  id: number;
  name: string;
  ordersHandled: number;
  rating: number;
}

interface Analytics {
  employees: Employee[];
}

interface OrderStats {
  pending: number;
  preparing: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

interface RevenuePoint {
  label: string;
  value: number;
}

// Custom hooks for data fetching
const useDashboardAnalytics = () => {
  return useQuery<Analytics>({
    queryKey: ['admin.dashboard.analytics'],
    queryFn: async () => {
      const data = await apiGet('/api/admin/dashboard/analytics');
      return data;
    },
  });
};

const useOrderStats = () => {
  return useQuery<OrderStats>({
    queryKey: ['admin.dashboard.orderStats'],
    queryFn: async () => {
      const data = await apiGet('/api/admin/dashboard/orders/stats');
      return data;
    },
  });
};

const useRevenue = (period: 'daily' | 'weekly' | 'monthly') => {
  return useQuery<RevenuePoint[]>({
    queryKey: ['admin.dashboard.revenue', period],
    queryFn: async () => {
      const data = await apiGet(`/api/admin/dashboard/revenue/${period}`);
      return data;
    },
  });
};

export default function Dashboard() {
  const { data: analytics, isLoading } = useDashboardAnalytics();
  const { data: orderStats, isLoading: statsLoading } = useOrderStats();
  const { data: revenue, isLoading: revenueLoading } = useRevenue('daily');

  // Real-time updates
  // Real-time updates can be added later using WebSocket or polling

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">Overview</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 font-semibold"><TrendingUp className="w-4 h-4" /> Revenue (Today)</div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-3xl font-extrabold">
                  ${Number(revenue?.reduce((sum: number, point: RevenuePoint) => sum + point.value, 0) || 0).toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 font-semibold"><Users className="w-4 h-4" /> Active Orders</div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-extrabold">{(orderStats?.pending || 0) + (orderStats?.preparing || 0)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 font-semibold"><Timer className="w-4 h-4" /> Preparing</div>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-extrabold">{orderStats?.preparing || 0}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 font-semibold"><CheckCircle className="w-4 h-4" /> Delivered</div>
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-3xl font-extrabold">{orderStats?.delivered || 0}</div>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div className="font-semibold">Revenue (Daily)</div>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <RevenueLine data={revenue || []} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="font-semibold">Top Employees</div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {(analytics?.employees || []).slice(0, 5).map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-white/10 bg-white/5">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-sm text-gray-500">{e.ordersHandled} orders</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
