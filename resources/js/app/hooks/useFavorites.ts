import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/app/libs/apiClient';

export function useFavorites() {
    const queryClient = useQueryClient();

    const { data: favoriteIds = [], isLoading } = useQuery({
        queryKey: ['favorites-ids'],
        queryFn: async () => apiGet<{ data: number[] }>('/customer/favorites/ids').then((r) => r.data),
        staleTime: 1000 * 60,
    });

    const toggleFavoriteMutation = useMutation({
        mutationFn: async (menuItemId: number) => {
            return apiPost('/customer/favorites/toggle', { menu_item_id: menuItemId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites-ids'] });
            queryClient.invalidateQueries({ queryKey: ['customer.profile'] }); // Update "Top Favorites" if needed
        },
    });

    return {
        favoriteIds,
        isLoading,
        toggleFavorite: toggleFavoriteMutation.mutateAsync,
        isToggling: toggleFavoriteMutation.isPending,
    };
}
