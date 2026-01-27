<?php

declare(strict_types=1);

namespace App\Services\Customer;

use App\Models\Customer;
use App\Models\Order;
use App\Models\TableSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\CartItem;

class CustomerOrderService
{
    /**
     * Get customer orders with filtering and pagination
     */
    public function getOrders(Customer $customer, Request $request, ?TableSession $tableSession = null)
    {
        // Build query
        $query = Order::query();

        if ($customer) {
            $query->where('customer_id', $customer->id);
        } elseif ($tableSession) {
            $query->where('table_id', $tableSession->table_id)
                ->where('created_at', '>=', $tableSession->started_at);

            // If session is closed, cap the query
            if ($tableSession->closed_at) {
                $query->where('created_at', '<=', $tableSession->closed_at);
            }
        }

        return $this->processOrdersQuery($query, $request);
    }

    /**
     * Process order query filters
     */
    private function processOrdersQuery($query, Request $request)
    {
        // Build query with eager loading to prevent N+1
        $query->where(function ($q) {
            $q->where('payment_mode', '!=', 'pay_now')
                ->orWhereIn('payment_status', [
                    Order::PAYMENT_STATUS_PAID,
                    Order::PAYMENT_STATUS_PARTIAL,
                    Order::PAYMENT_STATUS_REFUNDED,
                ]);
        })
            ->with([
                'items.menuItem.translations',
                'location',
                'timeSlot',
                'customerAddress',
                'invoice'
            ]);

        // Filter by status
        if ($request->filled('status')) {
            $status = $request->input('status');
            $query->whereHas('orderStatus', function ($q) use ($status) {
                $q->where('code', $status);
            });
        }

        // Filter by order type
        if ($request->filled('order_type')) {
            $type = $request->input('order_type');
            $query->whereHas('orderType', function ($q) use ($type) {
                $q->where('code', $type);
            });
        }

        // Filter by date range
        if ($request->filled('from_date')) {
            $query->whereDate('ordered_at', '>=', $request->input('from_date'));
        }
        if ($request->filled('to_date')) {
            $query->whereDate('ordered_at', '<=', $request->input('to_date'));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'ordered_at');
        $sortOrder = $request->input('sort_order', 'desc');

        $allowedSorts = ['ordered_at', 'total_amount']; // removed 'status' from direct sorts
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder);
        } elseif ($sortBy === 'status') {
            $query->join('order_statuses', 'orders.order_status_id', '=', 'order_statuses.id')
                ->orderBy('order_statuses.code', $sortOrder)
                ->select('orders.*'); // ensure we don't pick up order_statuses.id as primary
        } else {
            $query->orderBy('ordered_at', 'desc');
        }

        // Pagination
        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        return $query->paginate($perPage);
    }

    /**
     * Get single order details
     */
    public function getOrderDetails(string $orderId, ?Customer $customer, ?TableSession $tableSession)
    {
        $query = Order::where('id', $orderId)
            ->with([
                'items.menuItem.translations',
                'location',
                'timeSlot',
                'customerAddress',
                'invoice',
                'paymentCollector'
            ]);

        if ($customer) {
            $query->where('customer_id', $customer->id);
        } elseif ($tableSession) {
            $query->where('table_id', $tableSession->table_id)
                ->where('created_at', '>=', $tableSession->started_at);
        }

        return $query->firstOrFail();
    }

    /**
     * Reorder items from a past order
     */
    public function reorder(Order $order, Customer $customer): array
    {
        $addedCount = 0;

        DB::beginTransaction();
        try {
            foreach ($order->items as $item) {
                // Check if menu item still exists
                $menuItemExists = \App\Models\MenuItem::where('id', $item->menu_item_id)->exists();
                if (!$menuItemExists) {
                    continue;
                }

                $cartItem = CartItem::where('customer_id', $customer->id)
                    ->where('menu_item_id', $item->menu_item_id)
                    ->first();

                if ($cartItem) {
                    $cartItem->increment('quantity', $item->quantity);
                } else {
                    CartItem::create([
                        'customer_id' => $customer->id,
                        'menu_item_id' => $item->menu_item_id,
                        'quantity' => $item->quantity,
                        'notes' => $item->special_instructions,
                        'customizations' => [],
                    ]);
                }
                $addedCount++;
            }

            DB::commit();
            return ['added_count' => $addedCount];

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Cancel an order
     */
    public function cancelOrder(Order $order, string $reason = 'Cancelled by customer'): Order
    {
        // Check cancelability
        $nonCancellableStatuses = ['preparing', 'ready', 'completed', 'delivered', 'cancelled'];

        if (in_array($order->status_code, $nonCancellableStatuses)) {
            throw new \Exception('This order cannot be cancelled.');
        }

        $order->setStatus('cancelled');
        $order->update([
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);

        return $order;
    }
}
