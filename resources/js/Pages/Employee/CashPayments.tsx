import React from 'react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { CashPaymentQueue } from '@/app/components/payment';

export default function CashPayments() {
    return (
        <EmployeeLayout>
            <div className="max-w-6xl mx-auto space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Cash Payments</h1>
                        <p className="text-sm text-gray-400">
                            Confirm and manage cash payments from customers
                        </p>
                    </div>
                </div>

                {/* Cash Payment Queue Component */}
                <CashPaymentQueue />
            </div>
        </EmployeeLayout>
    );
}
