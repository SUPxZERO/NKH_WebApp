import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/app/store/cart';
import { apiGet } from '@/app/utils/api';
import { toastError } from '@/app/utils/toast';

interface TableSessionData {
    id: number;
    table_id: number;
    status: string;
    table: {
        id: number;
        code: string;
        floor_id: number;
        floor?: {
            name: string;
        };
    };
}

export function useTableSession() {
    const {
        setTableSession,
        clearTableSession,
        tableSessionToken,
        isTableOrder
    } = useCartStore();

    // Check for current session
    const { data: sessionData, isLoading, error } = useQuery({
        queryKey: ['table-session', 'current'],
        queryFn: async () => {
            try {
                const response = await apiGet('/api/table-session/current');
                return response.data as TableSessionData;
            } catch (err: any) {
                // If 401/404, session is invalid/expired
                if (err.response?.status === 401 || err.response?.status === 404) {
                    return null;
                }
                throw err;
            }
        },
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: true
    });

    // Sync session with store
    useEffect(() => {
        if (sessionData) {
            setTableSession(
                // We don't get the raw token back from current endpoint usually, 
                // effectively relying on the cookie. But if we need the token, 
                // we might need to assume it's in the cookie or store.
                // For now, if we have session data, we assume the token in store (if any) is valid
                // or the cookie is doing its job.
                tableSessionToken || 'cookie-session',
                sessionData.table.id,
                sessionData.table.code,
                sessionData.table.floor?.name
            );
        } else if (error || sessionData === null) {
            // Only clear if we were previously in a table session but now it's gone
            if (isTableOrder) {
                clearTableSession();
                if (error) {
                    console.error('Table session validation failed', error);
                }
            }
        }
    }, [sessionData, error, setTableSession, clearTableSession, isTableOrder, tableSessionToken]);

    return {
        session: sessionData,
        isLoading,
        isTableOrder,
        hasActiveSession: !!sessionData
    };
}
