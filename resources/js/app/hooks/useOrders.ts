import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@/app/libs/apiClient';
import { ApiResponse, Order } from '@/app/types/domain';

export interface OnlineOrderPayload {
  order_type: 'delivery' | 'pickup';  // Backend expects order_type, not mode
  location_id: number;                 // REQUIRED by backend
  customer_address_id?: number;        // Required if order_type is delivery
  // Support both old and new time slot approaches
  time_slot_id?: number;               // Legacy: pre-generated time slot ID
  slot_date?: string;                  // New: dynamic time slot date (Y-m-d)
  slot_time?: string;                  // New: dynamic time slot time (H:i)
  notes?: string;
  telegram_id?: number | string;       // Optional: for Telegram Mini App users
  payment_mode?: string;               // Optional: payment mode
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
