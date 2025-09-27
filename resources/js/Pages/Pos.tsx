import MainLayout from '@/Layouts/MainLayout';
import CategoryTabs from '@/Components/Modules/pos/CategoryTabs';
import SearchInput from '@/Components/Common/Input/SearchInput';
import OrderSummary from '@/Components/pos/OrderSummary';
import { Head } from '@inertiajs/react';

export default function Pos() {
  const items = Array.from({ length: 12 }).map((_, i) => ({ id: i + 1, name: `Item ${i + 1}`, price: (Math.random() * 10 + 5).toFixed(2) }));

  return (
    <MainLayout>
      <Head title="POS" />
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-2/3 p-6 bg-gray-100 dark:bg-gray-900">
          <div className="flex justify-between mb-6">
            <CategoryTabs />
            <div className="w-64"><SearchInput /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((it) => (
              <div key={it.id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow p-4">
                <div className="h-28 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-primary">${it.price}</div>
                  </div>
                  <button className="px-3 py-1 border rounded-sm">Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/3 border-l dark:border-gray-700">
          <OrderSummary />
        </div>
      </div>
    </MainLayout>
  );
}
