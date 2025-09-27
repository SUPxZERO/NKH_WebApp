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

export function useTimeSlots(mode: 'delivery' | 'pickup') {
  return useQuery({
    queryKey: ['time-slots', mode],
    queryFn: () => apiGet<ApiResponse<TimeSlot[]>>('/time-slots', { params: { mode } }).then(r => r.data),
    staleTime: 1000 * 60,
  });
}
