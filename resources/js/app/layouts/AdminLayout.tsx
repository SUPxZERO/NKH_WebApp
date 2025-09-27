import React from 'react';
import Header from '@/Components/Layout/Header';
import Sidebar from '@/Components/Layout/Sidebar';

type Props = { children: React.ReactNode };

export default function AdminLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar />
      <div className="ml-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
