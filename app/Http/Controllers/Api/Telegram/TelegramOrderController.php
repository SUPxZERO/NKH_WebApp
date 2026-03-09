<?php

namespace App\Http\Controllers\Api\Telegram;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse;
use App\Models\CustomerAddress;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderTimeSlot;
use App\Models\TelegramUser;
use App\Services\Telegram\TelegramCartSessionManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TelegramOrderController extends Controller
{
    use ApiResponse;
    /**
     * Get available time slots
     */
    public function timeSlots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => 'required|exists:locations,id',
            'mode' => 'nullable|in:pickup,delivery',
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $locationId = $validated['location_id'];
        $mode = $validated['mode'] ?? 'pickup';
        $date = $validated['date'] ?? now()->format('Y-m-d');

        // Use TimeSlotService
        $timeSlotService = app(\App\Services\TimeSlotService::class);
        $slots = $timeSlotService->getAvailableTimeSlots(
            $locationId,
            $mode,
            $date,
            30
        );

        $formattedSlots = collect($slots)->map(function ($slot) {
            return [
                'id' => md5($slot['slot_date'] . $slot['slot_time'] . $slot['location_id'] . $slot['slot_type']),
                'label' => $slot['full_label'],
                'start' => $slot['slot_date'] . 'T' . $slot['slot_time'],
                'available' => $slot['is_available'],
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'slots' => $formattedSlots,
                'location_id' => $locationId,
                'mode' => $mode,
                'date' => $date,
            ],
        ]);
    }

    /**
     * Get payment modes for order type
     */
    public function paymentModes(string $orderType): JsonResponse
    {
        $modes = Order::getPaymentModesForOrderType($orderType);

        $labels = [
            'pay_now' => 'Pay Now (Online)',
            'pay_on_delivery' => 'Pay on Delivery',
            'pay_on_pickup' => 'Pay on Pickup',
            'pay_at_counter' => 'Pay at Counter',
        ];

        $formattedModes = collect($modes)->map(function ($mode) use ($labels) {
            return [
                'code' => $mode,
                'label' => $labels[$mode] ?? ucfirst(str_replace('_', ' ', $mode)),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $formattedModes,
            'order_type' => $orderType,
        ]);
    }

    /**
     * List customer orders (supports both linked accounts and guest orders)
     */
    public function list(Request $request): JsonResponse
    {
        $user = $request->user('telegram');

        // Query orders by telegram_user_id OR customer_id (supports guest orders)
        $orders = Order::where(function ($query) use ($user) {
            $query->where('telegram_user_id', $user->id);
            if ($user->customer_id) {
                $query->orWhere('customer_id', $user->customer_id);
            }
        })
            ->with(['location', 'items'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function (Order $order) {
                return $this->formatOrder($order);
            });

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }

    /**
     * Get order details (supports guest orders)
     */
    public function detail(Request $request, int $orderId): JsonResponse
    {
        $user = $request->user('telegram');

        $order = Order::where('id', $orderId)
            ->where(function ($query) use ($user) {
                $query->where('telegram_user_id', $user->id);
                if ($user->customer_id) {
                    $query->orWhere('customer_id', $user->customer_id);
                }
            })
            ->with(['items.menuItem', 'location', 'timeSlot', 'customerAddress'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'error' => 'Order not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatOrder($order, true),
        ]);
    }

    /**
     * Cancel order (supports guest orders)
     */
    public function cancel(Request $request, int $orderId): JsonResponse
    {
        $user = $request->user('telegram');

        $order = Order::where('id', $orderId)
            ->where(function ($query) use ($user) {
                $query->where('telegram_user_id', $user->id);
                if ($user->customer_id) {
                    $query->orWhere('customer_id', $user->customer_id);
                }
            })
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'error' => 'Order not found',
            ], 404);
        }

        if (!$order->can_cancel) {
            return response()->json([
                'success' => false,
                'error' => 'Order cannot be cancelled',
            ], 400);
        }

        try {
            DB::transaction(function () use ($order, $user) {
                // NOTE: status and payment_status are guarded - must use direct assignment
                $order->status = 'cancelled';
                $order->cancelled_at = now();
                $order->cancellation_reason = 'Cancelled by customer via Telegram';
                $order->save();

                // Refund if paid
                if ($order->payment_status === 'paid') {
                    // Trigger refund process
                    $order->payment_status = 'refunded';
                    $order->save();
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully',
                'data' => [
                    'order_id' => $order->id,
                    'status' => $order->status,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Could not cancel order',
            ], 500);
        }
    }

    /**
     * Format order for Telegram response
     */
    private function formatOrder(Order $order, bool $includeItems = false): array
    {
        $data = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'order_type' => $order->order_type,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_mode' => $order->payment_mode,
            'total_amount' => (float) $order->total_amount,
            'ordered_at' => $order->ordered_at?->toISOString(),
            'location' => $order->location ? [
                'id' => $order->location->id,
                'name' => $order->location->name,
            ] : null,
        ];

        if ($includeItems) {
            $data['items'] = $order->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'menu_item_id' => $item->menu_item_id,
                    'name' => $item->menuItem?->name ?? 'Unknown',
                    'quantity' => $item->quantity,
                    'unit_price' => (float) $item->unit_price,
                    'total_price' => (float) $item->total_price,
                ];
            });

            $data['delivery_address'] = $order->customerAddress ? [
                'address' => $order->customerAddress->address_line_1,
            ] : ($order->delivery_instructions ? ['address' => $order->delivery_instructions] : null);

            $data['time_slot'] = $order->timeSlot ? [
                'date' => \Carbon\Carbon::parse($order->timeSlot->slot_date)->format('Y-m-d'),
                'time' => $order->timeSlot->slot_start_time,
            ] : null;
        }

        return $data;
    }
}
