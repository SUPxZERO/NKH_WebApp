import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Bell,
    BellOff,
    Mail,
    Smartphone,
    Monitor,
    ShoppingBag,
    Ticket,
    Star,
    Megaphone,
    Calendar,
    Check,
    X,
    Loader2
} from 'lucide-react';
import { apiGet, apiPut, apiPost } from '@/app/utils/api';
import { toastSuccess, toastError } from '@/app/utils/toast';
import { cn } from '@/app/utils/cn';

interface NotificationPreferencesData {
    preferences: Record<string, Record<string, boolean>>;
    channels: Record<string, string>;
    types: Record<string, string>;
}

interface NotificationPreferencesSettingsProps {
    className?: string;
}

const channelIcons: Record<string, React.ElementType> = {
    in_app: Monitor,
    push: Smartphone,
    email: Mail,
};

const typeIcons: Record<string, React.ElementType> = {
    order: ShoppingBag,
    promotion: Ticket,
    reward: Star,
    system: Megaphone,
    reservation: Calendar,
};

const typeColors: Record<string, string> = {
    order: 'text-blue-500',
    promotion: 'text-orange-500',
    reward: 'text-yellow-500',
    system: 'text-purple-500',
    reservation: 'text-green-500',
};

export default function NotificationPreferencesSettings({ className }: NotificationPreferencesSettingsProps) {
    const queryClient = useQueryClient();
    const [localPreferences, setLocalPreferences] = useState<Record<string, Record<string, boolean>>>({});

    const { data, isLoading, error } = useQuery({
        queryKey: ['notification-preferences'],
        queryFn: async () => {
            const response = await apiGet('/api/customer/notification-preferences') as { data: NotificationPreferencesData };
            return response.data;
        },
    });

    useEffect(() => {
        if (data?.preferences) {
            setLocalPreferences(data.preferences);
        }
    }, [data?.preferences]);

    const updateMutation = useMutation({
        mutationFn: async (preferences: Record<string, Record<string, boolean>>) => {
            return apiPut('/api/customer/notification-preferences', { preferences });
        },
        onSuccess: () => {
            toastSuccess('Notification preferences saved!');
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
        },
        onError: () => {
            toastError('Failed to save preferences');
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async ({ channel, type, enabled }: { channel: string; type: string; enabled: boolean }) => {
            return apiPost('/api/customer/notification-preferences/toggle', { channel, type, enabled });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
        },
    });

    const enableAllMutation = useMutation({
        mutationFn: async () => {
            return apiPost('/api/customer/notification-preferences/enable-all', {});
        },
        onSuccess: () => {
            toastSuccess('All notifications enabled');
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
        },
    });

    const disableAllMutation = useMutation({
        mutationFn: async () => {
            return apiPost('/api/customer/notification-preferences/disable-all', {});
        },
        onSuccess: () => {
            toastSuccess('All notifications disabled');
            queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
        },
    });

    const handleToggle = (channel: string, type: string) => {
        const currentValue = localPreferences[channel]?.[type] ?? true;
        const newValue = !currentValue;

        setLocalPreferences(prev => ({
            ...prev,
            [channel]: {
                ...prev[channel],
                [type]: newValue,
            },
        }));

        toggleMutation.mutate({ channel, type, enabled: newValue });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-6 text-center text-gray-500">
                <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Failed to load notification preferences</p>
            </div>
        );
    }

    const { channels, types } = data;

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Notification Preferences</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Choose how and when you want to be notified
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => enableAllMutation.mutate()}
                        disabled={enableAllMutation.isPending}
                        className="px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    >
                        Enable All
                    </button>
                    <button
                        onClick={() => disableAllMutation.mutate()}
                        disabled={disableAllMutation.isPending}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        Disable All
                    </button>
                </div>
            </div>

            {/* Preferences Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                        Notification Type
                    </div>
                    {Object.entries(channels).map(([channelKey, channelLabel]) => {
                        const ChannelIcon = channelIcons[channelKey] || Bell;
                        return (
                            <div
                                key={channelKey}
                                className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400"
                            >
                                <ChannelIcon className="w-4 h-4" />
                                <span className="hidden sm:inline">{channelLabel}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Type Rows */}
                {Object.entries(types).map(([typeKey, typeLabel], index) => {
                    const TypeIcon = typeIcons[typeKey] || Bell;
                    const typeColor = typeColors[typeKey] || 'text-gray-500';

                    return (
                        <motion.div
                            key={typeKey}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                                "grid grid-cols-4 gap-4 p-4 items-center",
                                index !== Object.entries(types).length - 1 && "border-b border-gray-100 dark:border-gray-700"
                            )}
                        >
                            {/* Type Label */}
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg bg-gray-100 dark:bg-gray-700", typeColor)}>
                                    <TypeIcon className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                    {typeLabel}
                                </span>
                            </div>

                            {/* Channel Toggles */}
                            {Object.keys(channels).map(channelKey => {
                                const isEnabled = localPreferences[channelKey]?.[typeKey] ?? true;
                                const isPending = toggleMutation.isPending;

                                return (
                                    <div key={channelKey} className="flex justify-center">
                                        <button
                                            onClick={() => handleToggle(channelKey, typeKey)}
                                            disabled={isPending}
                                            className={cn(
                                                "relative w-12 h-6 rounded-full transition-colors duration-200",
                                                isEnabled
                                                    ? "bg-gradient-to-r from-fuchsia-500 to-pink-500"
                                                    : "bg-gray-300 dark:bg-gray-600"
                                            )}
                                        >
                                            <motion.div
                                                animate={{ x: isEnabled ? 24 : 0 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md flex items-center justify-center"
                                            >
                                                {isEnabled ? (
                                                    <Check className="w-3 h-3 text-fuchsia-500" />
                                                ) : (
                                                    <X className="w-3 h-3 text-gray-400" />
                                                )}
                                            </motion.div>
                                        </button>
                                    </div>
                                );
                            })}
                        </motion.div>
                    );
                })}
            </div>

            {/* Info Note */}
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                💡 In-app notifications appear in your notification bell. Push notifications require browser permission.
            </p>
        </div>
    );
}
