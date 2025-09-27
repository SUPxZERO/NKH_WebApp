import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { ApiResponse, Category, MenuItem } from '@/app/types/domain';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => apiGet<ApiResponse<Category[]>>('/categories').then((r) => r.data),
    staleTime: 1000 * 60,
  });
}

export function useMenuItems(params?: { category_id?: number; search?: string }) {
  return useQuery({
    queryKey: ['menu', params],
    queryFn: async () =>
      apiGet<ApiResponse<MenuItem[]>>('/menu', { params }).then((r) => r.data),
    staleTime: 1000 * 30,
  });
}
