import React from 'react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { RequireAuth } from '@/app/providers/AuthProvider';

export default function OrderDetail() {
  return (
    <RequireAuth roles={['customer']}>
      <CustomerLayout>
        <h1 className="text-2xl font-semibold">Order Details</h1>
      </CustomerLayout>
    </RequireAuth>
  );
}
