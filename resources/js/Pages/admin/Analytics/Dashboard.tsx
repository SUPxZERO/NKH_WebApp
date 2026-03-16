import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";
import AdminLayout from "@/app/layouts/AdminLayout";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/Card";
import { SalesChart } from "@/app/components/analytics/SalesChart";
import { TopItemsChart } from "@/app/components/analytics/TopItemsChart";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { cn } from "@/app/utils/cn";
import { apiClient } from "@/app/libs/apiClient";

export default function AnalyticsDashboard() {
    const [dateRange, setDateRange] = useState<{
        from: Date;
        to: Date | undefined;
    }>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const startDateStr = dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : "";
    const endDateStr = dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : startDateStr;

    const { data: salesData, isLoading: isLoadingSales } = useQuery({
        queryKey: ["analytics", "sales", startDateStr, endDateStr],
        queryFn: async () => {
            const res = await apiClient.get("/admin/advanced-analytics/sales-trends", {
                params: { start_date: startDateStr, end_date: endDateStr },
            });
            return res.data;
        },
        enabled: !!startDateStr && !!endDateStr,
    });

    const { data: topProducts, isLoading: isLoadingProducts } = useQuery({
        queryKey: ["analytics", "products", startDateStr, endDateStr],
        queryFn: async () => {
            const res = await apiClient.get("/admin/advanced-analytics/top-products", {
                params: { start_date: startDateStr, end_date: endDateStr, limit: 10 },
            });
            return res.data;
        },
        enabled: !!startDateStr && !!endDateStr,
    });

    const { data: customerInsights, isLoading: isLoadingCustomers } = useQuery({
        queryKey: ["analytics", "customers", startDateStr, endDateStr],
        queryFn: async () => {
            const res = await apiClient.get("/admin/advanced-analytics/customer-insights", {
                params: { start_date: startDateStr, end_date: endDateStr },
            });
            return res.data;
        },
        enabled: !!startDateStr && !!endDateStr,
    });

    const summary = salesData?.data?.summary || { total_revenue: 0, total_orders: 0, average_order_value: 0 };
    const totalActiveCustomers = customerInsights?.data?.total_active_customers || 0;

    return (
        <AdminLayout>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Analytics Overview</h2>
                        <p className="text-muted-foreground">Detailed financial and operational insights.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">From:</span>
                            <Input
                                type="date"
                                value={startDateStr}
                                onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                                className="w-[150px] h-9"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">To:</span>
                            <Input
                                type="date"
                                value={endDateStr}
                                onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                                className="w-[150px] h-9"
                            />
                        </div>
                    </div>
                </div>

                {/* High-Level Metric Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${Number(summary.total_revenue).toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Orders</CardTitle>
                            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_orders}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${Number(summary.average_order_value).toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalActiveCustomers}</div>
                            <p className="text-xs text-muted-foreground tracking-tight mt-1">
                                Ordered in the last 60 days
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Grid */}
                <div className="grid gap-6 md:grid-cols-7 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Sales Trend</CardTitle>
                            <p className="text-sm text-muted-foreground">Daily revenue performance over the period.</p>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSales ? (
                                <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md bg-slate-50">
                                    Loading chart...
                                </div>
                            ) : (
                                <SalesChart data={salesData?.data?.chart_data || []} />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Top Selling Items</CardTitle>
                            <p className="text-sm text-muted-foreground">Highest grossing menu items.</p>
                        </CardHeader>
                        <CardContent>
                            {isLoadingProducts ? (
                                <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md bg-slate-50">
                                    Loading chart...
                                </div>
                            ) : (
                                <TopItemsChart data={topProducts?.data || []} />
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Customer Insights Block */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Customers by Spend</CardTitle>
                            <p className="text-sm text-muted-foreground">Your most valuable historical customers.</p>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCustomers ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : (
                                <div className="space-y-4">
                                    {customerInsights?.data?.top_customers?.map((customer: any) => (
                                        <div key={customer.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-xs">
                                                    {customer.user?.name?.[0] || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{customer.user?.name}</p>
                                                    <p className="text-xs text-muted-foreground">{customer.orders_count} lifetime orders</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-sm text-emerald-600">
                                                ${Number(customer.total_spent).toFixed(2)}
                                            </div>
                                        </div>
                                    ))}
                                    {!customerInsights?.data?.top_customers?.length && (
                                        <div className="text-sm text-muted-foreground text-center py-4">No customer data.</div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>At Risk Customers (Churn Risk)</CardTitle>
                            <p className="text-sm text-muted-foreground">Historically high spenders who haven't ordered recently.</p>
                        </CardHeader>
                        <CardContent>
                            {isLoadingCustomers ? (
                                <div className="text-sm text-muted-foreground">Loading...</div>
                            ) : (
                                <div className="space-y-4">
                                    {customerInsights?.data?.at_risk_customers?.map((customer: any) => (
                                        <div key={customer.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center font-bold text-rose-600 text-xs">
                                                    {customer.user?.name?.[0] || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium leading-none">{customer.user?.name}</p>
                                                    <p className="text-xs text-muted-foreground">${Number(customer.total_spent).toFixed(2)} lifetime spend</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="h-7 text-xs">Send Offer</Button>
                                        </div>
                                    ))}
                                    {!customerInsights?.data?.at_risk_customers?.length && (
                                        <div className="text-sm text-muted-foreground text-center py-4">No customers currently at risk!</div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
