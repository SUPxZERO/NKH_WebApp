import React from 'react';
import CustomerLayout from '@/app/layouts/CustomerLayout';

export default function Home() {
  return (
    <CustomerLayout>
      <h1 className="text-2xl font-semibold">Welcome to our Restaurant!</h1>
      {/* This will contain the pickup/delivery options */}
    </CustomerLayout>
  );
}
