import React from 'react';
import { MessageSquare } from 'lucide-react';
import CustomerLayout from '@/app/layouts/CustomerLayout';
import { Card, CardContent } from '@/app/components/ui/Card';

export default function Feedback() {
    return (
        <CustomerLayout>
            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-purple-600" />
                        Feedback & Reviews
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Customer feedback submission is currently disabled in this version of the app.
                    </p>
                </div>

                <Card>
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                        <MessageSquare className="w-10 h-10 text-gray-400" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            You can still share any comments or issues directly with the restaurant staff.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </CustomerLayout>
    );
}
