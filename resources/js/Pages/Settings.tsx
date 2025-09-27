import MainLayout from '@/Layouts/MainLayout';
import { Head } from '@inertiajs/react';

export default function Settings() {
  return (
    <MainLayout>
      <Head title="Settings" />
      <div>
        <h1 className="h1 mb-4">Settings</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">Settings coming soon...</div>
      </div>
    </MainLayout>
  );
}
