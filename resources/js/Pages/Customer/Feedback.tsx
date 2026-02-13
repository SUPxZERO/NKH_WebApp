import React from 'react';
import { MessageSquare } from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent } from '@/app/components/ui/Card';
import { useTranslation } from '@/app/hooks/useTranslation';

export default function Feedback() {
    const translationContext = useTranslation();
    const t = translationContext?.t || ((key: string) => key);

    return (
        <CustomerLayout>
            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-purple-600" />
                        {t('customer.feedback.title')}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {t('customer.feedback.subtitle')}
                    </p>
                </div>

                <Card>
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                        <MessageSquare className="w-10 h-10 text-gray-400" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {t('customer.feedback.alternative')}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
