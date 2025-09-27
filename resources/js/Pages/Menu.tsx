import MainLayout from '@/Layouts/MainLayout';
import { Head } from '@inertiajs/react';

export default function Menu() {
  return (
    <MainLayout>
      <Head title="Menu" />
      <div>
        <h1 className="h1 mb-4">Menu</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">Menu management coming soon...</div>
      </div>
    </MainLayout>
  );
}
