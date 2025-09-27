import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import StatsCard from '@/Components/Common/Card/StatsCard';
import DataCard from '@/Components/Common/Card/DataCard';
import DataTable, { Column } from '@/Components/Common/Table/DataTable';

type Row = { order: string; customer: string; total: string; status: string };

export default function Dashboard() {
  const columns: Column<Row>[] = [
    { key: 'order', header: 'Order #' },
    { key: 'customer', header: 'Customer' },
    { key: 'total', header: 'Total' },
    { key: 'status', header: 'Status' },
  ];
  const data: Row[] = [
    { order: 'INV-1001', customer: 'John Doe', total: '$45.00', status: 'Completed' },
    { order: 'INV-1002', customer: 'Jane Smith', total: '$23.50', status: 'Completed' },
  ];

  return (
    <MainLayout>
      <Head title="Dashboard" />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <button className="px-3 py-2 border rounded-sm">Date Range</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Sales" value="$1,234" icon={<span>💵</span>} trend="+8% this week" />
          <StatsCard title="Orders" value="128" icon={<span>🧾</span>} trend="+2%" />
          <StatsCard title="Customers" value="64" icon={<span>👥</span>} trend="+4%" />
          <StatsCard title="Avg. Ticket" value="$19.28" icon={<span>📈</span>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataCard>Chart Placeholder</DataCard>
          <DataCard>Chart Placeholder</DataCard>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="h2 mb-4">Recent Orders</h2>
          <DataTable columns={columns} data={data} />
        </div>
      </div>
    </MainLayout>
  );
}
