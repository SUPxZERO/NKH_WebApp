import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/app/libs/apiClient';
import { ApiResponse, Order, OrderMode, OrderItem, CustomerAddress, TimeSlot } from '@/app/types/domain';

export interface OnlineOrderPayload {
  mode: OrderMode;
  items: OrderItem[];
  address_id?: number;
  time_slot_id?: string;
  notes?: string;
}

export function usePlaceOnlineOrder() {
  return useMutation({
    mutationFn: async (payload: OnlineOrderPayload) => {
      const res = await apiPost<ApiResponse<Order>>('/online-orders', payload);
      return res.data;
    },
  });
}
