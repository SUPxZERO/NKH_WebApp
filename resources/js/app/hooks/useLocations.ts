import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { Location } from '@/app/types/domain';

export function useLocations() {
    return useQuery({
        queryKey: ['locations'],
        queryFn: async () => {
            // Fetch public active locations
            // Ensure /api/locations endpoint is exposed in api.php
            return apiGet<{ data: Location[] }>('/locations').then((r) => r.data.data);
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });
}
