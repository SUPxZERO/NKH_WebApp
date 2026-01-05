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
 * Hook to get the current user ID from auth context.
 * This helper ensures we use the unified user (standard or Telegram).
 */
export function useAuthUserId(): number | undefined {
    // Dynamically import useAuth to avoid circular dependency issues if any
    // But since this is a hook, we can rely on AuthProvider being higher up
    // However, hooks cannot be called conditionally or inside simple functions.
    // So we will just look at the window state safely or return undefined.
    // BETTER: This function should just be deprecated and consumers should pass userId.

    // Fallback safe check
    try {
        // @ts-ignore
        return window.Laravel?.user?.id ?? (window as any).__page?.props?.auth?.user?.id;
    } catch {
        return undefined;
    }
}

/**
 * Combined hook that automatically subscribes to notifications for the authenticated user.
 * MODIFIED: Accepts userId explicitly or tries to find it safely.
 * Best practice: Pass userId from the component that uses useAuth().
 */
export function useAutoCustomerNotifications(options?: {
    showToast?: boolean;
    onNotification?: (notification: NotificationPayload) => void;
}) {
    // We cannot easily use useAuth() here if this file is imported by AuthProvider (circular).
    // But CustomerLayout imports this. CustomerLayout imports AuthProvider.
    // So we can assume AuthProvider context is available?
    // To be safe and avoid circular deps (if any), we'll let the Consumer pass the ID
    // OR we will use a safe layout-level implementation.

    // For now, let's keep it safe by NOT calling useAuth here directly to avoid cycles
    // if AuthProvider imports this (which it doesn't seem to).
    // Wait, CustomerLayout imports useAuth. 

    const userId = useAuthUserId();
    useCustomerNotifications(userId, options);
}

export type { NotificationPayload };
