<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderApprovalService
{
    /**
     * Approve an order with business logic
     */
    public function approve(Order $order, User $approver): bool
    {
        return DB::transaction(function () use ($order, $approver) {
            // Update order status
            $success = $order->approve($approver->id);

            if (!$success) {
                return false;
            }

            // Send notification to customer
            app(\App\Services\NotificationService::class)->sendOrderNotification($order, 'approved');

            // Log audit trail
            Log::info('Order approved via service', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'approved_by' => $approver->id,
                'approved_by_name' => $approver->name,
                'approved_at' => $order->approved_at,
            ]);

            return true;
        });
    }

    /**
     * Reject an order with business logic
     */
    public function reject(Order $order, string $reason, ?User $rejector = null): bool
    {
        return DB::transaction(function () use ($order, $reason, $rejector) {
            // Update order status
            $success = $order->reject($reason);

            if (!$success) {
                return false;
            }

            // Send notification to customer
            app(\App\Services\NotificationService::class)->sendOrderNotification($order, 'rejected', "Your order was rejected: {$reason}");

            // Log audit trail
            Log::info('Order rejected via service', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'rejected_by' => $rejector?->id,
                'rejection_reason' => $reason,
            ]);

            return true;
        });
    }

    /**
     * Get all orders pending approval
     */
    public function getPendingOrders(?int $locationId = null)
    {
        $query = Order::with(['customer.user', 'items.menuItem', 'customerAddress'])
            ->where('approval_status', Order::APPROVAL_STATUS_PENDING)
            ->whereHas('orderType', function ($q) {
                $q->whereIn('code', ['delivery', 'pickup']);
            });

        if ($locationId) {
            $query->where('location_id', $locationId);
        }

        return $query->orderBy('ordered_at', 'desc')->get();
    }
}
