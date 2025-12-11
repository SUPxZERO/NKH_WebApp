import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { Bell, Loader2 } from 'lucide-react';
import { cn } from '@/app/utils/cn';

interface NotificationState {
    [key: string]: boolean;
}

export default function NotificationPreferences() {
    // State to hold local boolean values for the UI switches
    const [toggles, setToggles] = useState<NotificationState>({
        orderAlerts: true,
        shiftReminders: true,
        announcements: true,
        emailNotifications: true,
        smsNotifications: false,
    });

    // Mappings from UI keys to API params
    const MAPPING: Record<string, { channel: string; type: string }> = {
        orderAlerts: { channel: 'in_app', type: 'order' },
        shiftReminders: { channel: 'in_app', type: 'reservation' }, // Using reservation as proxy for now
        announcements: { channel: 'in_app', type: 'system' },
        emailNotifications: { channel: 'email', type: 'order' }, // Primary email setting
        smsNotifications: { channel: 'push', type: 'order' },   // Primary push setting
    };

    // Fetch settings
    const { data: apiData, isLoading } = useQuery({
        queryKey: ['employeeSettings'],
        queryFn: async () => {
            const res = await apiGet('/api/employee/settings/notifications') as { data: { preferences: any } };
            return res.data; // { preferences: { channel: { type: bool } } }
        },
    });

    useEffect(() => {
        if (apiData?.preferences) {
            // Update local state based on backend data
            const prefs = apiData.preferences;

            setToggles(prev => ({
                ...prev,
                orderAlerts: prefs.in_app?.order ?? true,
                shiftReminders: prefs.in_app?.reservation ?? true,
                announcements: prefs.in_app?.system ?? true,
                emailNotifications: prefs.email?.order ?? true,
                smsNotifications: prefs.push?.order ?? false,
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
                toastSuccess('Preference updated');
            }
        },
        onError: () => {
            toastError('Failed to update preference');
        },
    });

    const handleToggle = (key: string) => {
        const newValue = !toggles[key];
        setToggles(prev => ({ ...prev, [key]: newValue }));
        toggleMutation.mutate({ key, value: newValue });
    };

    const items = [
        { key: 'orderAlerts', label: 'Order Alerts', desc: 'Get notified for new orders and status changes' },
        { key: 'shiftReminders', label: 'Shift Reminders', desc: 'Receive reminders 1 hour before your shift starts' },
        { key: 'announcements', label: 'System Announcements', desc: 'Important updates from management' },
        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive major alerts via email' },
        { key: 'smsNotifications', label: 'Push Notifications', desc: 'Receive critical alerts on your device' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notification Preferences</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose what notifications you'd like to receive
            </p>

            <div className="space-y-3 mt-6">
                {items.map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
                        </div>
                        <button
                            onClick={() => handleToggle(item.key)}
                            disabled={toggleMutation.isPending}
                            className={cn(
                                'w-12 h-6 rounded-full transition-colors relative',
                                toggles[item.key] ? 'bg-fuchsia-500' : 'bg-slate-300 dark:bg-slate-600'
                            )}
                        >
                            <div className={cn(
                                'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all',
                                toggles[item.key] ? 'left-7' : 'left-1'
                            )} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
