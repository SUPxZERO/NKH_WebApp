<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Responses\ApiResponse; // FIX: Phase 4 - Standardized responses
use App\Http\Requests\Api\Order\StoreOrderItemRequest;
use App\Http\Requests\Api\Order\StoreOrderRequest;
use App\Http\Requests\Api\Order\UpdateOrderItemRequest;
use App\Http\Requests\Api\Order\GenerateInvoiceRequest;
use App\Http\Resources\OrderItemResource;
use App\Http\Resources\OrderResource;
use App\Models\DiningTable;
use App\Models\Employee;
use App\Models\Invoice;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Services\InvoiceService;
use App\Services\LoyaltyService;
use App\Services\NotificationService;
use App\Services\OrderCalculationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    use ApiResponse; // FIX: Phase 4 - Standardized responses
    protected $loyaltyService;
    protected $calculationService;

    public function __construct(
        LoyaltyService $loyaltyService,
        OrderCalculationService $calculationService
    ) {
        $this->loyaltyService = $loyaltyService;
        $this->calculationService = $calculationService;
    }
    // POST /api/orders (role:admin,manager,waiter)
    public function store(StoreOrderRequest $request): OrderResource|JsonResponse
    {
        $data = $request->validated();

        // Ensure request is authenticated before accessing user()->id
        if (!$request->user()) {
            abort(401, 'Unauthenticated.');
        }

        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();
        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();
        
        // FIX Issue #14: Race Condition - Lock the table row to prevent double booking
        // Must happen inside the transaction, so we move table retrieval inside
        
        $order = DB::transaction(function () use ($employee, $data) {
            // Lock table for update to prevent concurrent bookings
            $table = DiningTable::where('id', $data['table_id'])->lockForUpdate()->find($data['table_id']);
            
            if (!$table) {
                abort(404, 'Table not found.');
            }

            if ($table->status !== 'available') {
                abort(409, 'Table is currently occupied.');
            }
            $isEmployeeOrder = !empty($employee->id);

            $order = Order::create([
                'location_id' => $employee->location_id,
                'table_id' => $table->id,
                'employee_id' => $employee->id,
                'order_number' => $this->generateOrderNumber($employee->location_id, 'DIN'),
                'order_type' => 'dine-in',
                'order_type' => 'dine-in',
                // 'status' => $isEmployeeOrder ? 'received' : 'pending', // REMOVED
                'approval_status' => $isEmployeeOrder ? 'approved' : 'pending',
                'is_auto_approved' => $isEmployeeOrder,
                'payment_status' => 'unpaid',
                'currency' => 'USD',
                'ordered_at' => now(),
                'approved_at' => $isEmployeeOrder ? now() : null,
                'special_instructions' => $data['notes'] ?? null,
            ]);
            
            // Set status using helper
            $order->setStatus($isEmployeeOrder ? 'received' : 'pending');
            $order->save();

            // Mark table as occupied
            $table->update(['status' => 'occupied']);

            return $order;
        });

        return new OrderResource($order->load(['items.menuItem', 'table']));
    }

    // GET /api/orders/{order} (role:admin,manager,waiter)
    public function show(Order $order): OrderResource
    {
        // FIX Issue #13: IDOR Prevention - Ensure user has permission to view this order
        $this->authorize('view', $order);
        
        // PHASE 2: Comprehensive eager loading for order details
        return new OrderResource($order->load([
            'items.menuItem.category',
            'items.menuItem.ingredientUsage.ingredient',
            'invoice.payments',
            'customer.user',
            'customer.telegramUser',
            'customer.addresses',
            'table.floor',
            'location',
            'employee.user',
            'timeSlot',
            'promotion',
        ]));
    }

    // POST /api/orders/{order}/items (role:admin,manager,waiter)
    public function addItem(StoreOrderItemRequest $request, Order $order): OrderItemResource
    {
        if ($order->status !== 'received') {
            abort(409, 'Order is not pending.');
        }

        $data = $request->validated();
        $menuItem = MenuItem::findOrFail($data['menu_item_id']);

        $line = DB::transaction(function () use ($order, $menuItem, $data) {
            $existing = $order->items()->where('menu_item_id', $menuItem->id)->first();
            if ($existing) {
                $newQty = $existing->quantity + $data['quantity'];
                $existing->update([
                    'quantity' => $newQty,
                    'total_price' => $existing->unit_price * $newQty - $existing->discount_amount + $existing->tax_amount,
                    'special_instructions' => $data['notes'] ?? $existing->special_instructions,
                ]);
                $line = $existing;
            } else {
                $line = $order->items()->create([
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $data['quantity'],
                    'unit_price' => $menuItem->price,
                    'discount_amount' => 0,
                    'tax_amount' => 0,
                    'total_price' => $menuItem->price * $data['quantity'],
                    'status' => 'pending',
                    'special_instructions' => $data['notes'] ?? null,
                ]);
            }

            $this->recalculateTotals($order->fresh(['items']));

            return $line;
        });

        return new OrderItemResource($line->load('menuItem'));
    }

    // PUT /api/order-items/{item} (role:admin,manager,waiter)
    public function updateItem(UpdateOrderItemRequest $request, OrderItem $orderItem): OrderItemResource
    {
        if ($orderItem->order->status !== 'received') {
            abort(409, 'Order is not pending.');
        }
        $data = $request->validated();

        DB::transaction(function () use ($orderItem, $data) {
            $orderItem->update([
                'quantity' => $data['quantity'],
                'special_instructions' => $data['notes'] ?? $orderItem->special_instructions,
                'total_price' => $orderItem->unit_price * $data['quantity'] - $orderItem->discount_amount + $orderItem->tax_amount,
            ]);

            $this->recalculateTotals($orderItem->order->fresh(['items']));
        });

        return new OrderItemResource($orderItem->fresh('menuItem'));
    }

    // DELETE /api/order-items/{item} (role:admin,manager,waiter)
    public function removeItem(OrderItem $orderItem): JsonResponse
    {
        if ($orderItem->order->status !== 'received') {
            abort(409, 'Order is not pending.');
        }
        DB::transaction(function () use ($orderItem) {
            $order = $orderItem->order;
            $orderItem->delete();
            $this->recalculateTotals($order->fresh(['items']));
        });

        return response()->json(['message' => 'Order item removed.']);
    }

    // POST /api/orders/{order}/invoice (role:admin,manager,waiter)
    public function generateInvoice(GenerateInvoiceRequest $request, Order $order, \App\Services\PaymentService $paymentService): OrderResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($order, $data, $request, $paymentService) {
            if ($order->status !== 'received') {
                abort(409, 'Order is not pending.');
            }

            $order->loadMissing('items');
            $this->recalculateTotals($order);

            // Process Payment using Service
            $paymentService->processOrderPayment($order, [
                'payment_method_id' => $data['payment_method_id'],
                'amount' => $data['amount_paid'],
                'notes' => null, // Optional
            ], $request->user()->id);

            // Close order & free table only when fully paid (Controller specific logic)
            // Re-fetch invoice status
            if ($order->invoice->amount_due <= 0) {
                // NOTE: status is guarded - must use direct assignment
                //$order->status = 'completed';
                $order->setStatus('completed');
                $order->completed_at = now();
                $order->save();

                if ($order->table) {
                    $order->table->update(['status' => 'available']);
                }
            }
        });

        return new OrderResource($order->fresh()->load(['items.menuItem', 'invoice']));
    }

    private function generateOrderNumber(int $locationId, string $prefix = 'ORD'): string
    {
        for ($i = 0; $i < 5; $i++) {
            $number = sprintf('%s-%s-%s', $prefix, now()->format('Ymd'), Str::upper(Str::random(5)));
            $exists = Order::where('location_id', $locationId)->where('order_number', $number)->exists();
            if (!$exists) return $number;
        }
        return sprintf('%s-%s-%s', $prefix, now()->format('YmdHis'), random_int(100, 999));
    }

    // GET /api/admin/orders (Admin oversight)
    public function index(Request $request)
    {
        // PHASE 2: Enhanced eager loading to prevent N+1 queries
        $query = Order::with([
            'items.menuItem.category',  // Load menu items with categories
            'table.floor',               // Load table with floor info
            'customer.user',             // Customer with user account
            'customer.telegramUser',     // Support Telegram guests
            'employee.user',             // Employee details
            'timeSlot',                  // Scheduled time slot
            'location',                  // Location info
            'promotion',                 // Applied promotion
        ]);
        
        // ✅ FIX: Show ALL orders by default (removed hardcoded exclusion of pending approval orders)
        // Admin can filter by approval_status if needed via query parameter
        
        // Filter by approval status (optional filter - defaults to showing all)
        if ($request->filled('approval_status') && $request->approval_status !== 'all') {
            $query->where('approval_status', $request->approval_status);
        }
        
        // Filter by location
        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }
        
        // Filter by status (ignore 'all')
        if ($request->filled('status')) {
            $status = (string) $request->string('status');
            if ($status !== 'all') {
                // FIX: Use relationship to filter by status code (column 'status' removed)
                $query->whereHas('orderStatus', function ($q) use ($status) {
                    $q->where('code', $status);
                });
            }
        }
        
        // Filter by order type (frontend sends ?type=)
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('order_type', $request->type);
        }
        
        // Search by order number or customer name/email
        if ($request->filled('search')) {
            $s = $request->string('search');
            $query->where(function ($q) use ($s) {
                $q->where('order_number', 'like', "%{$s}%")
                  ->orWhereHas('customer.user', function ($uq) use ($s) {
                      $uq->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%");
                  });
            });
        }
        
        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('ordered_at', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('ordered_at', '<=', $request->end_date);
        }
        
        // ✅ Add diagnostic logging
        \Log::info('📊 Admin Orders Query', [
            'filters' => $request->only(['status', 'type', 'approval_status', 'location_id', 'search', 'start_date', 'end_date']),
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings()
        ]);
        
        $orders = $query->orderBy('ordered_at', 'desc')
                       ->paginate($request->get('per_page', 15));
        
        // ✅ Log result count for debugging
        \Log::info('✅ Admin Orders Result', [
            'total' => $orders->total(),
            'current_page' => $orders->currentPage(),
            'per_page' => $orders->perPage(),
            'showing' => $orders->count()
        ]);

        // Calculate global stats (showing all orders regardless of pagination/search)
        // Respect location filter if present
        $statsQuery = Order::query();
        if ($request->filled('location_id')) {
            $statsQuery->where('location_id', $request->location_id);
        }
        
        // Helper to get count by status code
        $getCountByStatus = function($code) use ($statsQuery) {
            return (clone $statsQuery)->whereHas('orderStatus', function($q) use ($code) {
                $q->where('code', $code);
            })->count();
        };

        $stats = [
            'total' => (clone $statsQuery)->count(),
            'pending' => $getCountByStatus('pending'),
            'preparing' => $getCountByStatus('preparing'),
            'ready' => $getCountByStatus('ready'),
        ];

        return OrderResource::collection($orders)->additional(['stats' => $stats]);
    }

    // GET /api/admin/orders/pending-approval
    // List all orders pending approval (replaces CustomerRequestController::index)
    public function pendingApproval(Request $request)
    {
        $query = Order::with(['customer.user', 'items.menuItem', 'customerAddress', 'timeSlot'])
            ->where('approval_status', Order::APPROVAL_STATUS_PENDING)
            ->whereIn('order_type', ['delivery', 'pickup']);

        // Optional filters
        if ($request->filled('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('customer.user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $orders = $query->orderBy('ordered_at', 'desc')
                       ->paginate($request->get('per_page', 15));

        return OrderResource::collection($orders);
    }

    // POST /api/orders/{order}/submit (Submit to kitchen)
    public function submitToKitchen(Order $order): OrderResource
    {
        if ($order->status !== 'received') {
            abort(409, 'Order is not in received status.');
        }
        
        if ($order->items->isEmpty()) {
            abort(422, 'Cannot submit order with no items.');
        }
        
        // NOTE: status is guarded - must use direct assignment
        // $order->status = 'preparing'; 
        $order->setStatus('preparing');
        $order->kitchen_submitted_at = now();
        $order->save();
        
        // Update all order items to preparing status
        $order->items()->update(['status' => 'preparing']);
        
        return new OrderResource($order->fresh(['items.menuItem', 'table']));
    }

    // PATCH /api/admin/orders/{order}/approve (Admin approval for online orders)
    public function approve(Request $request, Order $order): JsonResponse|OrderResource
    {
        // Validation
        if ($order->approval_status !== Order::APPROVAL_STATUS_PENDING) {
            return response()->json([
                'message' => 'Order is not pending approval.',
                'current_status' => $order->approval_status
            ], 409);
        }

        // Get user ID if authenticated, otherwise use null (system approval)
        $userId = $request->user() ? $request->user()->id : null;

        // Use the model method for approval
        $success = $order->approve($userId);

        if (!$success) {
            return response()->json([
                'message' => 'Failed to approve order.',
            ], 500);
        }

        // Log the approval action
        \Log::info('Order approved', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'approved_by' => $userId,
            'approved_by_name' => $request->user() ? $request->user()->name : 'System',
        ]);

        // Send notification to customer
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->sendOrderNotification($order, 'approved');
        } catch (\Exception $e) {
            \Log::warning('Failed to send order approval notification: ' . $e->getMessage());
        }

        return new OrderResource($order->fresh(['items.menuItem', 'customerAddress', 'approvedBy']));
    }

    // PATCH /api/admin/orders/{order}/reject (Admin rejection for online orders)
    public function reject(Request $request, Order $order): JsonResponse|OrderResource
    {
        // Validation
        if ($order->approval_status !== Order::APPROVAL_STATUS_PENDING) {
            return response()->json([
                'message' => 'Order is not pending approval.',
                'current_status' => $order->approval_status
            ], 409);
        }

        $validated = $request->validate([
            'rejection_reason' => 'required|string|min:10|max:500'
        ]);

        // Use the model method for rejection
        $success = $order->reject($validated['rejection_reason']);

        if (!$success) {
            return response()->json([
                'message' => 'Failed to reject order.',
            ], 500);
        }

        // Log the rejection action
        \Log::info('Order rejected', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'rejected_by' => $request->user()?->id,
            'rejection_reason' => $validated['rejection_reason'],
        ]);

        // Send notification to customer with rejection reason
        try {
            $notificationService = app(NotificationService::class);
            $notificationService->sendOrderNotification(
                $order, 
                'rejected', 
                "Your order was declined: {$validated['rejection_reason']}"
            );
        } catch (\Exception $e) {
            \Log::warning('Failed to send order rejection notification: ' . $e->getMessage());
        }

        return new OrderResource($order->fresh(['items.menuItem', 'customerAddress']));
    }

    private function recalculateTotals(Order $order): void
    {
        // Delegate to calculation service
        $this->calculationService->recalculateOrder($order);
    }

    // PUT /api/admin/orders/{order}/status
    public function updateStatus(Request $request, Order $order): JsonResponse|OrderResource
    {
        $request->validate([
            'status' => 'required|in:pending,received,preparing,ready,completed,cancelled',
        ]);
        $newStatus = $request->status;

        // Auto-approve online orders when transitioning from pending to received
        if ($order->approval_status === Order::APPROVAL_STATUS_PENDING 
            && in_array($order->order_type, ['delivery', 'pickup'])
            && $newStatus === 'received') {
            // Auto-approve the order
            $userId = $request->user() ? $request->user()->id : null;
            $order->update([
                'approval_status' => Order::APPROVAL_STATUS_APPROVED,
                'approved_by' => $userId,
                'approved_at' => now(),
            ]);
            
            // Send approval notification
            try {
                $notificationService = app(NotificationService::class);
                $notificationService->sendOrderNotification($order, 'approved');
            } catch (\Exception $e) {
                \Log::warning('Failed to send order approval notification: ' . $e->getMessage());
            }
            
            \Log::info('Order auto-approved via status update', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'approved_by' => $userId,
            ]);
        }

        // Automatically serve all items if completing the order
        if ($newStatus === 'completed') {
            DB::transaction(function () use ($order) {
                $order->loadMissing('items');
                $openItems = $order->items->whereNotIn('status', ['served', 'cancelled']);

                foreach ($openItems as $item) {
                    $item->update(['status' => 'served']);
                }
            });
        }

        // NOTE: status is guarded - must use direct assignment
        //$order->status = $newStatus;
        $order->setStatus($newStatus);
        $order->save();

        // Send status update notification to customer
        try {
            $statusMap = [
                'preparing' => 'preparing',
                'ready' => 'ready',
                'completed' => 'completed',
                'cancelled' => 'cancelled',
            ];
            
            if (isset($statusMap[$newStatus])) {
                $notificationService = app(NotificationService::class);
                $notificationService->sendOrderNotification($order, $statusMap[$newStatus]);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to send order status notification: ' . $e->getMessage());
        }

        return new OrderResource($order->fresh(['items.menuItem', 'table']));
    }

    // DELETE /api/admin/orders/{order}
    public function destroy(Order $order): JsonResponse
    {
        // FIX Issue #15: Missing Authorization
        $this->authorize('delete', $order);

        // Prevent deleting completed or paid orders (Data Integrity)
        if ($order->status === 'completed' || $order->payment_status === 'paid') {
            return response()->json(['message' => 'Cannot delete a completed or paid order.'], 409);
        }

        $order->delete();
        return response()->json(['message' => 'Order deleted successfully.']);
    }

    // PATCH /api/admin/orders/{order}/payment-status
    public function updatePaymentStatus(Request $request, Order $order, \App\Services\PaymentService $paymentService): OrderResource
    {
        $request->validate([
            'payment_status' => 'required|in:paid,unpaid',
        ]);

        $newStatus = $request->payment_status;

        if ($newStatus === 'paid') {
            if ($order->isPaid()) {
                abort(409, 'Order is already paid.');
            }
            
            $paymentService->markAsPaid($order, $request->user()->id);

        } elseif ($newStatus === 'unpaid') {
            if ($order->isUnpaid()) {
                abort(409, 'Order is already unpaid.');
            }
            
            $paymentService->markAsUnpaid($order, $request->user()->id);
        }

        return new OrderResource($order->fresh(['items.menuItem', 'invoice', 'customer', 'table']));
    }
}
