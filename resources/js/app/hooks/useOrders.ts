import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/app/libs/apiClient';
import { ApiResponse, Order } from '@/app/types/domain';

export interface OnlineOrderPayload {
  order_type: 'delivery' | 'pickup';  // Backend expects order_type, not mode
  location_id: number;                 // REQUIRED by backend
  customer_address_id?: number;        // Required if order_type is delivery
  time_slot_id: number;                // Backend expects number, not string
  notes?: string;
  order_items: Array<{                 // Backend expects order_items array
    menu_item_id: number;
    quantity: number;
    special_instructions?: string;
  }>;
}

export function usePlaceOnlineOrder() {
  return useMutation({
    mutationFn: async (payload: OnlineOrderPayload) => {
      const res = await apiPost<ApiResponse<Order>>('/customer/online-orders', payload);
      return res.data;
    },
  });
}
