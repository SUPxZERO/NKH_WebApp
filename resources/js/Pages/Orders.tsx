import MainLayout from '@/Layouts/MainLayout';
import { Head } from '@inertiajs/react';

export default function Orders() {
  return (
    <MainLayout>
      <Head title="Orders" />
      <div>
        <h1 className="h1 mb-4">Orders</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">Orders list coming soon...</div>
      </div>
    </MainLayout>
  );
}
