import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';

interface PollState {
    [key: string]: any;
}

/**
 * Smart polling hook that checks for updates on the server using lightweight timestamps
 * before triggering expensive full data refetches.
 * 
 * @param modules List of modules to poll for (e.g., ['orders', 'kitchen'])
 * @param interval Polling interval in ms (default 10000)
 */
export function useSmartPolling(modules: string[], interval = 10000) {
    const queryClient = useQueryClient();
    const lastKnownRef = useRef<PollState>({});

    // Flatten modules for query key to ensure stability
    const modulesKey = [...modules].sort().join(',');

    const { data } = useQuery({
        queryKey: ['poll-sync', modulesKey],
        queryFn: async () => {
            const response = await apiGet(`/poll-helper/sync-state?modules=${modulesKey}`);
            return response.data;
        },
        refetchInterval: interval,
        refetchOnWindowFocus: true,
        staleTime: 0,
        // React Query automatically pauses polling when tab is hidden/inactive
    });

    useEffect(() => {
        if (!data) return;

        const moduleList = modulesKey.split(',');

        moduleList.forEach(module => {
            const currentVal = data[module];
            const lastVal = lastKnownRef.current[module];

            // Initial load or undefined check - just sync state, don't invalidate yet
            // (Unless we want to force refresh on mount, but usually initial page load handles that)
            if (lastVal === undefined) {
                lastKnownRef.current[module] = currentVal;
                return;
            }

            // Check if changed
            const hasChanged = JSON.stringify(currentVal) !== JSON.stringify(lastVal);

            if (hasChanged) {
                // Determine if we should log (dev mode only ideally)
                const isDev = import.meta.env.DEV;
                if (isDev) {
                    console.log(`[SmartPolling] Change in ${module}. Invalidating queries...`, {
                        prev: lastVal,
                        curr: currentVal
                    });
                }

                // --- Invalidation Logic ---

                // 1. Global Orders (Admin & Employee)
                if (module === 'orders') {
                    // Admin Orders page (fuzzy match for ['admin/orders', filters...])
                    queryClient.invalidateQueries({ queryKey: ['admin/orders'] });
                    // POS Active Orders
                    queryClient.invalidateQueries({ queryKey: ['pos.active-orders'] });
                    // Dashboard stats might benefit too
                    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
                    // Customer Orders
                    queryClient.invalidateQueries({ queryKey: ['customer-orders'] });
                    queryClient.invalidateQueries({ queryKey: ['customer-order'] });
                }

                // 2. Kitchen Display
                if (module === 'kitchen') {
                    queryClient.invalidateQueries({ queryKey: ['kitchen.orders'] });
                }

                // 3. Tables (POS & Dining)
                if (module === 'tables') {
                    queryClient.invalidateQueries({ queryKey: ['pos-tables'] });
                    queryClient.invalidateQueries({ queryKey: ['tables'] });
                }

                // 4. Notifications
                if (module === 'admin-notifications') {
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                }

                // Update ref
                lastKnownRef.current[module] = currentVal;
            }
        });
    }, [data, modulesKey, queryClient]);
}
