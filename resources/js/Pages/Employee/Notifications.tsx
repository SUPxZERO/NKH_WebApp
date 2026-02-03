import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePage } from '@inertiajs/react';
import { Bell, Calendar, AlertTriangle, Info, CheckCircle, Clock } from 'lucide-react';
import EmployeeLayout from '@/app/layouts/EmployeeLayout';
import { apiGet, apiPut } from '@/app/utils/api';
import { cn } from '@/app/utils/cn';
import { toastSuccess } from '@/app/utils/toast';
import { Card, CardContent } from '@/app/components/ui/Card';
import { useLanguage } from '@/app/context/LanguageContext';

interface Notification {
    id: string;
    type: 'order' | 'shift' | 'system' | 'announcement';
    title: string;
    message: string;
    created_at: string;
    read_at: string | null;
    data?: any;
}

export default function Notifications() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    // Fetch Notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['employeeNotifications'],
        queryFn: async () => {
            const response = await apiGet('/api/employee/notifications') as { data: Notification[] };
            return response.data;
        },
    });

    // Mark as read mutation
    const markAsReadMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiPut(`/api/employee/notifications/${id}/read`, {});
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeNotifications'] });
            toastSuccess(t('employee.notifications.mark_read'));
        },
    });

    // Mark all as read mutation
    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            await apiPut('/api/employee/notifications/read-all', {});
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employeeNotifications'] });
            toastSuccess(t('employee.notifications.clear'));
        },
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <Bell className="w-5 h-5 text-blue-500" />;
            case 'shift': return <Calendar className="w-5 h-5 text-purple-500" />;
            case 'announcement': return <Info className="w-5 h-5 text-amber-500" />;
            case 'system': return <AlertTriangle className="w-5 h-5 text-slate-500" />;
            case 'reservation': return <Calendar className="w-5 h-5 text-emerald-500" />;
            default: return <Bell className="w-5 h-5 text-slate-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <EmployeeLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <Bell className="w-8 h-8 text-fuchsia-500" />
                                {t('employee.notifications.title')}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">{t('employee.notifications.all')}</p>
                        </div>
                        <button
                            className="text-sm text-fuchsia-600 dark:text-fuchsia-400 hover:underline font-medium disabled:opacity-50"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                        >
                            {markAllAsReadMutation.isPending ? t('employee.common.loading') : t('employee.notifications.clear')}
                        </button>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-12 text-slate-500">{t('employee.common.loading')}</div>
                        ) : notificationsData?.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white">All caught up!</h3>
                                <p className="text-slate-500">You have no new notifications.</p>
                            </div>
                        ) : (
                            notificationsData?.map((notification) => (
                                <Card
                                    key={notification.id}
                                    className={cn(
                                        "transition-all duration-200 hover:shadow-md border-l-4",
                                        notification.read_at
                                            ? "bg-white dark:bg-slate-800 border-l-slate-300 dark:border-l-slate-700 opacity-75"
                                            : "bg-white dark:bg-slate-800 border-l-fuchsia-500 shadow-sm"
                                    )}
                                >
                                    <div className="p-4 sm:p-5 flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-full flex-shrink-0",
                                            notification.read_at ? "bg-slate-100 dark:bg-slate-700" : "bg-fuchsia-50 dark:bg-fuchsia-900/20"
                                        )}>
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className={cn(
                                                        "text-base font-semibold",
                                                        notification.read_at ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white"
                                                    )}>
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(notification.created_at)}
                                                </span>
                                            </div>
                                            {!notification.read_at && (
                                                <div className="mt-3 flex justify-end">
                                                    <button
                                                        onClick={() => markAsReadMutation.mutate(notification.id)}
                                                        className="text-xs font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:text-fuchsia-500"
                                                    >
                                                        {t('employee.notifications.mark_read')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </EmployeeLayout>
    );
}
