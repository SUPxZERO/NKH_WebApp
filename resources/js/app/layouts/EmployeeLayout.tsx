import React from 'react';
import Header from '@/Components/Layout/Header';

type Props = { children: React.ReactNode };

export default function EmployeeLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <main className="flex-1">
        {children} 

      </main>
    </div>
  );
}
