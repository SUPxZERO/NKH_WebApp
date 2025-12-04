import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/app/libs/apiClient';
import { ApiResponse, CustomerAddress, TimeSlot } from '@/app/types/domain';

export function useCustomerAddresses() {
  return useQuery({
    queryKey: ['customer.addresses'],
    queryFn: () => apiGet<ApiResponse<CustomerAddress[]>>('/customer/addresses').then(r => r.data),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTimeSlots(mode: 'delivery' | 'pickup', locationId?: number, date?: string) {
  return useQuery({
    queryKey: ['time-slots', mode, locationId, date],
    queryFn: () => apiGet<ApiResponse<TimeSlot[]>>('/time-slots', {
      params: {
        mode,
        location_id: locationId,
        date: date || undefined
      }
    }).then(r => r.data),
    staleTime: 1000 * 60,
    enabled: !!locationId, // Only run query if location is selected
  });
}
