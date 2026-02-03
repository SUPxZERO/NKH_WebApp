import React from 'react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { CashPaymentQueue } from '@/app/components/payment';
import { useLanguage } from '@/app/context/LanguageContext';

export default function CashPayments() {
    const { t } = useLanguage();
    return (
        <EmployeeLayout>
            <div className="max-w-6xl mx-auto space-y-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t('employee.cash.title')}</h1>
                        <p className="text-sm text-gray-400">
                            {t('employee.cash.register')}
                        </p>
                    </div>
                </div>

                {/* Cash Payment Queue Component */}
                <CashPaymentQueue />
            </div>
        </EmployeeLayout>
    );
}
