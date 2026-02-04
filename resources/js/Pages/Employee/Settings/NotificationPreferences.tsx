import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Bell, Loader2, Clock, Mail, Smartphone, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/app/utils/cn';
import { useLanguage } from '@/app/context/LanguageContext';

interface NotificationState {
    [key: string]: boolean;
}

export default function NotificationPreferences() {
    const { t } = useLanguage();
    const queryClient = useQueryClient();

    // State to hold local boolean values for the UI switches
    const [toggles, setToggles] = useState<NotificationState>({
        orderAlerts: true,
        shiftReminders: true,
        announcements: true,
        emailNotifications: true,
        pushNotifications: false,
    });

    // Mappings from UI keys to API params
    const MAPPING: Record<string, { channel: string; type: string }> = {
        orderAlerts: { channel: 'in_app', type: 'order' },
        shiftReminders: { channel: 'in_app', type: 'reservation' },
        announcements: { channel: 'in_app', type: 'system' },
        emailNotifications: { channel: 'email', type: 'order' },
        pushNotifications: { channel: 'push', type: 'order' },
    };

    // Fetch settings
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['employeeSettings'],
        queryFn: async () => {
            try {
                const res = await apiGet('/api/employee/settings/notifications') as { data: { preferences: any } };
                return res.data;
            } catch (e) {
                return { preferences: null };
            }
        },
    });

    useEffect(() => {
        if (apiData?.preferences) {
            const prefs = apiData.preferences;
            setToggles(prev => ({
                ...prev,
                orderAlerts: prefs.in_app?.order ?? true,
                shiftReminders: prefs.in_app?.reservation ?? true,
                announcements: prefs.in_app?.system ?? true,
                emailNotifications: prefs.email?.order ?? true,
                pushNotifications: prefs.push?.order ?? false,
            }));
        }
    }, [apiData]);

    // Update notifications mutation
    const toggleMutation = useMutation({
        mutationFn: async ({ key, value }: { key: string; value: boolean }) => {
            const mapping = MAPPING[key];
            if (!mapping) return;

            await apiPost('/api/employee/settings/notifications/toggle', {
                channel: mapping.channel,
                type: mapping.type,
                enabled: value
            });

            return { key, value };
        },
        onSuccess: (data) => {
            if (data) {
                toastSuccess(t('employee.notification_preferences.messages.updated'));
                queryClient.invalidateQueries({ queryKey: ['employeeSettings'] });
            }
        },
        onError: () => {
            toastError(t('employee.notification_preferences.messages.update_failed'));
        },
    });

    const handleToggle = (key: string) => {
        const newValue = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newValue }));
        toggleMutation.mutate({ key, value: newValue });
    };

    const notificationGroups = [
        {
            title: t('employee.notification_preferences.groups.in_app.title'),
            description: t('employee.notification_preferences.groups.in_app.description'),
            items: [
                { key: 'orderAlerts', icon: Bell, label: t('employee.notification_preferences.items.order_alerts.label'), desc: t('employee.notification_preferences.items.order_alerts.desc') },
                { key: 'shiftReminders', icon: Clock, label: t('employee.notification_preferences.items.shift_reminders.label'), desc: t('employee.notification_preferences.items.shift_reminders.desc') },
                { key: 'announcements', icon: MessageSquare, label: t('employee.notification_preferences.items.announcements.label'), desc: t('employee.notification_preferences.items.announcements.desc') },
            ]
        },
        {
            title: t('employee.notification_preferences.groups.external.title'),
            description: t('employee.notification_preferences.groups.external.description'),
            items: [
                { key: 'emailNotifications', icon: Mail, label: t('employee.notification_preferences.items.email.label'), desc: t('employee.notification_preferences.items.email.desc') },
                { key: 'pushNotifications', icon: Smartphone, label: t('employee.notification_preferences.items.push.label'), desc: t('employee.notification_preferences.items.push.desc') },
            ]
        }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-500" />
                    {t('employee.notification_preferences.title')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('employee.notification_preferences.subtitle')}
                </p>
            </div>

            {notificationGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{group.title}</h4>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">{group.description}</p>

                    <div className="space-y-2">
                        {group.items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.key}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-xl border transition-all",
                                        toggles[item.key]
                                            ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            toggles[item.key]
                                                ? "bg-blue-100 dark:bg-blue-900/40"
                                                : "bg-gray-100 dark:bg-gray-700"
                                        )}>
                                            <Icon className={cn(
                                                "w-5 h-5",
                                                toggles[item.key]
                                                    ? "text-blue-600 dark:text-blue-400"
                                                    : "text-gray-500"
                                            )} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{item.label}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggle(item.key)}
                                        disabled={toggleMutation.isPending}
                                        className={cn(
                                            'w-12 h-6 rounded-full transition-colors relative flex-shrink-0',
                                            toggles[item.key] ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                                        )}
                                    >
                                        <div className={cn(
                                            'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                                            toggles[item.key] ? 'left-7' : 'left-1'
                                        )} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* Info Note */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">{t('employee.notification_preferences.note.title')}</p>
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                        {t('employee.notification_preferences.note.body')}
                    </p>
                </div>
            </div>
        </div>
    );
}
