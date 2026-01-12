import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AdminLayout from '@/app/layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/Card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Calendar, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import axios from 'axios';

interface DashboardProps {
  initialKPIs: {
    total_revenue: number;
    total_orders: number;
    avg_order_value: number;
  };
  initialRevenue: any[];
  initialOrderStatus: any[];
  initialTopItems: any[];
}

export default function Dashboard({ initialKPIs, initialRevenue, initialOrderStatus, initialTopItems }: DashboardProps) {
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  const [kpis, setKpis] = useState(initialKPIs);
  const [revenueData, setRevenueData] = useState(initialRevenue);
  const [orderStatusData, setOrderStatusData] = useState(initialOrderStatus);
  const [topItemsData, setTopItemsData] = useState(initialTopItems);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(route('admin.dashboard.data'), {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        }
      });
      setKpis(response.data.kpis);
      setRevenueData(response.data.revenue);
      setOrderStatusData(response.data.order_status);
      setTopItemsData(response.data.top_items);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Skip initial fetch as data is passed as props, only fetch on change
    if (dateRange.endDate !== format(new Date(), 'yyyy-MM-dd')) {
      fetchData();
    }
  }, [dateRange]);

  const handleRangeChange = (days: number) => {
    setDateRange({
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    });
    // Trigger fetch immediately or let effect handle it
    setTimeout(fetchData, 100);
  };

  // Format currency
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <AdminLayout>
      <Head title="Admin Dashboard" />
      <div className="p-6 space-y-6">

        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
            <button onClick={() => handleRangeChange(7)} className="px-3 py-1.5 text-sm font-medium rounded hover:bg-muted transition-colors">Last 7 Days</button>
            <button onClick={() => handleRangeChange(30)} className="px-3 py-1.5 text-sm font-medium rounded hover:bg-muted transition-colors">Last 30 Days</button>
            <button onClick={() => handleRangeChange(90)} className="px-3 py-1.5 text-sm font-medium rounded hover:bg-muted transition-colors">Last 3 Months</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.total_revenue)}</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.total_orders}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(kpis.avg_order_value)}</div>
              <p className="text-xs text-muted-foreground">+4% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Area */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

          {/* Revenue Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => format(new Date(val), 'MMM d')}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <YAxis
                      tickFormatter={(val) => `$${val}`}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <Tooltip
                      formatter={(val: number | undefined) => val !== undefined ? formatCurrency(val) : ''}
                      labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                    />
                    <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Order Status Pie Chart */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Items Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItemsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="quantity" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

      </div>
    </AdminLayout>
  );
}
