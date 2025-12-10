import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createEcho } from '@/app/libs/echo';
import { toastInfo, toastSuccess } from '@/app/utils/toast';

interface NotificationPayload {
    id: number;
    type: 'order' | 'promotion' | 'reward' | 'system';
    title: string;
    message: string;
    action_url?: string;
    read: boolean;
    created_at: string;
}

/**
 * Hook to listen for real-time customer notifications via websocket.
 * Automatically invalidates notification queries and shows toast notifications.
 * 
 * @param userId - The authenticated user's ID
 * @param options - Optional configuration
 */
export function useCustomerNotifications(
    userId: number | undefined,
    options: {
        showToast?: boolean;
        onNotification?: (notification: NotificationPayload) => void;
    } = {}
) {
    const { showToast = true, onNotification } = options;
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId) return;

        const echo = createEcho();
        if (!echo) {
            console.warn('[useCustomerNotifications] Echo not available');
            return;
        }

        const channelName = `customer.${userId}`;

        try {
            const channel = echo.private(channelName);

            channel.listen('.notification.received', (payload: NotificationPayload) => {
                console.log('[useCustomerNotifications] Received notification:', payload);

                // Invalidate notification queries to refresh the list
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                queryClient.invalidateQueries({ queryKey: ['notifications', 'customer'] });
                queryClient.invalidateQueries({ queryKey: ['customer', 'notifications'] });

                // Show toast notification
                if (showToast) {
                    const toastFn = payload.type === 'order' ? toastSuccess : toastInfo;
                    toastFn(`${payload.title}: ${payload.message}`);
                }

                // Call custom handler if provided
                if (onNotification) {
                    onNotification(payload);
                }
            });

            console.log(`[useCustomerNotifications] Subscribed to ${channelName}`);

            return () => {
                echo.leaveChannel(channelName);
                console.log(`[useCustomerNotifications] Left channel ${channelName}`);
            };
        } catch (error) {
            console.error('[useCustomerNotifications] Failed to subscribe:', error);
        }
    }, [userId, queryClient, showToast, onNotification]);
}

/**
 * Hook to get the current user ID from auth context or page props.
 * This is a helper to extract user ID for notification subscription.
 */
export function useAuthUserId(): number | undefined {
    // Try to get from Inertia page props
    try {
        const pageProps = (window as any).__page?.props;
        return pageProps?.auth?.user?.id;
    } catch {
        return undefined;
    }
}

/**
 * Combined hook that automatically subscribes to notifications for the authenticated user.
 */
export function useAutoCustomerNotifications(options?: {
    showToast?: boolean;
    onNotification?: (notification: NotificationPayload) => void;
}) {
    const userId = useAuthUserId();
    useCustomerNotifications(userId, options);
}

export type { NotificationPayload };
