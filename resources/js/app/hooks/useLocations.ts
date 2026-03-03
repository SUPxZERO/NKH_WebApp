import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/utils/api';
import { Location } from '@/types';

export function useLocations() {
    return useQuery<Location[]>({
        queryKey: ['locations'],
        queryFn: async () => {
            // Fetch public active locations
            // Ensure /api/locations endpoint is exposed in api.php
            return apiGet<{ data: Location[] }>('/locations').then((r) => r.data);
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
