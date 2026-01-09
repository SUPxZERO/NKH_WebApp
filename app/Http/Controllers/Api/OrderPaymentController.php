<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentAuditLog;
use App\Models\PaymentMethod;
use App\Models\TableSession;
use App\Services\InvoiceService;
use App\Services\LoyaltyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderPaymentController extends Controller
{
    protected InvoiceService $invoiceService;
    protected LoyaltyService $loyaltyService;
    protected \App\Services\PaymentService $paymentService;

    public function __construct(
        InvoiceService $invoiceService, 
        LoyaltyService $loyaltyService,
        \App\Services\PaymentService $paymentService
    ) {
        $this->invoiceService = $invoiceService;
        $this->loyaltyService = $loyaltyService;
        $this->paymentService = $paymentService;
    }

    /**
     * Get payment status for an order.
     * 
     * GET /api/orders/{order}/payment-status
     */
    public function paymentStatus(Order $order): JsonResponse
    {
        $order->load(['invoice.payments.paymentMethod']);
        
        $invoice = $order->invoice;
        $payments = $invoice?->payments ?? collect();

        return response()->json([
            'success' => true,
            'data' => [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'total_amount' => (float) $order->total_amount,
                'currency' => $order->currency,
                'payment_status' => $order->payment_status,
                'payment_mode' => $order->payment_mode,
                'is_paid' => $order->isPaid(),
                'needs_collection' => $order->needsPaymentCollection(),
                'invoice' => $invoice ? [
                    'id' => $invoice->id,
                    'status' => $invoice->status,
                    'amount_paid' => (float) $invoice->amount_paid,
                    'amount_due' => (float) $invoice->amount_due,
                ] : null,
                'payments' => $payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => (float) $payment->amount,
                        'status' => $payment->status,
                        'method' => $payment->paymentMethod?->name,
                        'completed_at' => $payment->processed_at?->toIso8601String(),
                    ];
                }),
            ],
        ]);
    }

    /**
     * Collect payment on delivery/pickup.
     * 
     * POST /api/orders/{order}/collect-payment
     */
    public function collectPayment(Order $order, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'cash_received' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|string|in:cash,card,qr',
            'notes' => 'nullable|string|max:500',
        ]);

        // Verify the order is in a valid state for payment collection
        if ($order->isPaid()) {
            return response()->json([
                'success' => false,
                'error' => 'Order is already paid',
            ], 400);
        }

        if (!in_array($order->payment_mode, [
            Order::PAYMENT_MODE_PAY_ON_DELIVERY,
            Order::PAYMENT_MODE_PAY_ON_PICKUP,
            Order::PAYMENT_MODE_PAY_AT_COUNTER,
        ])) {
            return response()->json([
                'success' => false,
                'error' => 'This order is not set for payment collection',
            ], 400);
        }

        try {
            DB::transaction(function () use ($order, $validated, $request) {
                $amount = $validated['amount'] ?? (float) $order->total_amount;
                $cashReceived = $validated['cash_received'] ?? $amount;
                $paymentMethodCode = $validated['payment_method'] ?? 'cash';
                $changeGiven = $paymentMethodCode === 'cash' ? max(0, $cashReceived - $amount) : 0;

                // Process Payment via Service
                $payment = $this->paymentService->processOrderPayment($order, [
                    'payment_method_code' => $paymentMethodCode,
                    'amount' => $amount,
                    'transaction_id' => 'COD-' . strtoupper(Str::random(8)),
                    'cash_received' => $paymentMethodCode === 'cash' ? $cashReceived : null,
                    'change_given' => $changeGiven,
                    'notes' => $validated['notes'] ?? null,
                    'mode' => 'collect_payment',
                ], $request->user()->id);

                // ==================== TABLE SESSION CLOSE (Sprint P17) ====================
                // If this was a QR table order, close the session and reset table
                if ($order->table_id) {
                    $tableSession = TableSession::where('order_id', $order->id)
                        ->orWhere(function ($query) use ($order) {
                            $query->where('table_id', $order->table_id)
                                  ->whereIn('status', ['ordering', 'payment_pending']);
                        })
                        ->first();

                    if ($tableSession) {
                        $tableSession->close();
                        $tableSession->table->resetStatus();

                        Log::info('Table session closed after payment', [
                            'order_id' => $order->id,
                            'session_id' => $tableSession->id,
                            'table_code' => $tableSession->table->code,
                        ]);
                    }
                }
                // ==================== END TABLE SESSION CLOSE ====================
            });

            $order->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Payment collected successfully',
                'data' => [
                    'order_id' => $order->id,
                    'payment_status' => $order->payment_status,
                    'is_paid' => $order->isPaid(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Payment collection failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to collect payment',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update order payment mode.
     * 
     * POST /api/orders/{order}/payment-mode
     */
    public function updatePaymentMode(Order $order, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_mode' => 'required|in:pay_now,pay_on_delivery,pay_on_pickup,pay_at_counter',
        ]);

        // Verify the order can change payment mode
        if ($order->isPaid()) {
            return response()->json([
                'success' => false,
                'error' => 'Cannot change payment mode for a paid order',
            ], 400);
        }

        // Validate payment mode is allowed for this order type
        $allowedModes = Order::getPaymentModesForOrderType($order->order_type);
        if (!in_array($validated['payment_mode'], $allowedModes)) {
            return response()->json([
                'success' => false,
                'error' => 'This payment mode is not available for ' . $order->order_type . ' orders',
                'allowed_modes' => $allowedModes,
            ], 400);
        }

        $order->update([
            'payment_mode' => $validated['payment_mode'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Payment mode updated',
            'data' => [
                'order_id' => $order->id,
                'payment_mode' => $order->payment_mode,
            ],
        ]);
    }

    /**
     * Get available payment modes for an order type.
     * 
     * GET /api/orders/payment-modes/{orderType}
     */
    public function availablePaymentModes(string $orderType): JsonResponse
    {
        $modes = Order::getPaymentModesForOrderType($orderType);

        $modeDetails = [
            Order::PAYMENT_MODE_PAY_NOW => [
                'code' => 'pay_now',
                'name' => 'Pay Now',
                'description' => 'Pay immediately using available payment methods',
            ],
            Order::PAYMENT_MODE_PAY_ON_DELIVERY => [
                'code' => 'pay_on_delivery',
                'name' => 'Cash on Delivery',
                'description' => 'Pay with cash when your order is delivered',
            ],
            Order::PAYMENT_MODE_PAY_ON_PICKUP => [
                'code' => 'pay_on_pickup',
                'name' => 'Pay on Pickup',
                'description' => 'Pay when you pick up your order',
            ],
            Order::PAYMENT_MODE_PAY_AT_COUNTER => [
                'code' => 'pay_at_counter',
                'name' => 'Pay at Counter',
                'description' => 'Pay at the counter when you finish dining',
            ],
        ];

        return response()->json([
            'success' => true,
            'data' => array_map(fn($mode) => $modeDetails[$mode], $modes),
        ]);
    }

    /**
     * POS Quick Pay - immediately mark an order as paid.
     * 
     * POST /api/pos/orders/{order}/quick-pay
     */
    public function quickPay(Order $order, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'payment_method' => 'required|string|in:cash,card,qr',
            'cash_received' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($order->isPaid()) {
            return response()->json([
                'success' => false,
                'error' => 'Order is already paid',
            ], 400);
        }

        try {
            DB::transaction(function () use ($order, $validated, $request) {
                $amount = (float) $order->total_amount;
                $paymentMethodCode = $validated['payment_method'];
                $cashReceived = $validated['cash_received'] ?? $amount;
                $changeGiven = $paymentMethodCode === 'cash' ? max(0, $cashReceived - $amount) : 0;

                // Process Payment via Service
                $this->paymentService->processOrderPayment($order, [
                    'payment_method_code' => $paymentMethodCode,
                    'amount' => $amount,
                    'transaction_id' => 'POS-' . strtoupper(Str::random(8)),
                    'cash_received' => $paymentMethodCode === 'cash' ? $cashReceived : null,
                    'change_given' => $changeGiven,
                    'notes' => $validated['notes'] ?? 'POS Quick Pay',
                    'mode' => 'pos_quick_pay',
                ], $request->user()->id);
            });

            $order->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Payment completed',
                'data' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'payment_status' => $order->payment_status,
                    'change_given' => ($validated['payment_method'] === 'cash' && isset($validated['cash_received'])) 
                        ? max(0, $validated['cash_received'] - $order->total_amount) 
                        : 0,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('POS Quick Pay failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Quick pay failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get orders pending payment collection (for delivery drivers).
     * 
     * GET /api/orders/pending-collection
     */
    public function pendingCollection(Request $request): JsonResponse
    {
        $orders = Order::with(['customer.user', 'customerAddress', 'location'])
            ->whereIn('payment_mode', [
                Order::PAYMENT_MODE_PAY_ON_DELIVERY,
                Order::PAYMENT_MODE_PAY_ON_PICKUP,
            ])
            ->where('payment_status', Order::PAYMENT_STATUS_UNPAID)
            ->whereIn('status', ['preparing', 'ready', 'out_for_delivery'])
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total_amount' => (float) $order->total_amount,
                    'currency' => $order->currency,
                    'order_type' => $order->order_type,
                    'payment_mode' => $order->payment_mode,
                    'status' => $order->status,
                    'customer_name' => $order->customer?->user?->name ?? 'Guest',
                    'customer_phone' => $order->customer?->user?->phone,
                    'delivery_address' => $order->customerAddress?->full_address,
                    'created_at' => $order->created_at->toIso8601String(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $orders,
            'count' => $orders->count(),
        ]);
    }
    /**
     * Get active unpaid orders for POS.
     * 
     * GET /api/orders/pos/active
     */
    public function activeOrders(Request $request): JsonResponse
    {
        $orders = Order::with(['customer.user'])
            ->withCount('items')
            ->whereIn('payment_status', [Order::PAYMENT_STATUS_UNPAID, Order::PAYMENT_STATUS_PARTIAL])
            ->whereNotIn('status', ['cancelled', 'completed', 'refunded'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total_amount' => (float) $order->total_amount,
                    'order_type' => $order->order_type,
                    'payment_status' => $order->payment_status,
                    'payment_mode' => $order->payment_mode,
                    'status' => $order->status,
                    'customer_name' => $order->customer?->user?->name ?? 'Guest',
                    'created_at' => $order->created_at->toIso8601String(),
                    'items_count' => $order->items_count,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $orders,
        ]);
    }
}
