import { useState, useEffect } from 'react';
import { toastError, toastSuccess } from '@/app/utils/toast';

/**
 * Hook to detect online/offline status
 * FIX: Phase 3 - UX Hardening - Offline Detection
 */
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toastSuccess('Connection restored');
        };

        const handleOffline = () => {
            setIsOnline(false);
            toastError('You are offline. Some features may not work.');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}
