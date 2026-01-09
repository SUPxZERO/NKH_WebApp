import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { ApiResponse, Category, MenuItem } from '@/app/types/domain';

export function useCategories(subCategoriesOnly: boolean = false) {
  return useQuery({
    queryKey: ['categories', subCategoriesOnly],
    queryFn: async () => apiGet<ApiResponse<Category[]>>('/categories', {
      params: {
        // location_id: 1, // Let backend handle default
        sub_categories_only: subCategoriesOnly // Get only sub-categories for menu filter
      }
    }).then((r) => r.data),
    staleTime: 1000 * 60,
  });
}

export function useMenuItems(params?: { category_id?: number; search?: string }) {
  return useQuery({
    queryKey: ['menu', params],
    queryFn: async () =>
      apiGet<ApiResponse<MenuItem[]>>('/menu', {
        params: { ...params } // Let backend handle default location
      }).then((r) => r.data),
    staleTime: 1000 * 30,
  });
}
