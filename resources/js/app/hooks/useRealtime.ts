import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createEcho } from '@/app/libs/echo';
import { toastInfo } from '@/app/utils/toast';

export function useOrderUpdates() {
  const qc = useQueryClient();

  useEffect(() => {
    const echo = createEcho();
    if (!echo) return;

    // Listen to order status changes
    const channel = echo.channel('orders');

    channel.listen('OrderStatusUpdated', (e: any) => {
      // Invalidate relevant queries
      qc.invalidateQueries({ queryKey: ['admin.dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin.orders'] });
      qc.invalidateQueries({ queryKey: ['employee.orders'] });
      qc.invalidateQueries({ queryKey: ['kitchen.orders'] });
      qc.invalidateQueries({ queryKey: ['pos.active-orders'] });
      qc.invalidateQueries({ queryKey: ['pending-collection'] });

      toastInfo(`Order #${e.order.id} status: ${e.order.status}`);
    });

    channel.listen('NewOrderPlaced', (e: any) => {
      qc.invalidateQueries({ queryKey: ['admin.dashboard'] });
      qc.invalidateQueries({ queryKey: ['employee.orders'] });
      qc.invalidateQueries({ queryKey: ['kitchen.orders'] });
      qc.invalidateQueries({ queryKey: ['pos.active-orders'] });

      toastInfo(`New order #${e.order.id} received!`);
    });

    return () => {
      echo.leaveChannel('orders');
    };
  }, [qc]);
}

export function useAdminNotifications() {
  const qc = useQueryClient();

  useEffect(() => {
    const echo = createEcho();
    if (!echo) return;

    const channel = echo.private('admin-notifications');

    channel.listen('CustomerRequestReceived', (e: any) => {
      qc.invalidateQueries({ queryKey: ['admin.customer-requests'] });
      toastInfo(`New customer request: ${e.request.type}`);
    });

    channel.listen('LowStockAlert', (e: any) => {
      toastInfo(`Low stock alert: ${e.item.name}`);
    });

    return () => {
      echo.leaveChannel('admin-notifications');
    };
  }, [qc]);
}

// Re-export customer notification hooks
export {
  useCustomerNotifications,
  useAutoCustomerNotifications,
  useAuthUserId,
  type NotificationPayload
} from './useCustomerNotifications';
