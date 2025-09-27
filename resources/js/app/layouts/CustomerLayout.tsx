import React from 'react';

type Props = { children: React.ReactNode };

export default function CustomerLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* A customer-specific header could go here */}
      <main>
        {children}
      </main>
      {/* A customer-specific footer could go here */}
    </div>
  );
}
