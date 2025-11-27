<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    // POST /api/orders (role:admin,manager,waiter)
    public function store(StoreOrderRequest $request): OrderResource|JsonResponse
    {
        $data = $request->validated();

        // Ensure request is authenticated before accessing user()->id
        if (!$request->user()) {
            abort(401, 'Unauthenticated.');
        }

        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();
        $table = DiningTable::findOrFail($data['table_id']);

        if ($table->status !== 'available') {
            return response()->json(['message' => 'Table is currently occupied.'], 409);
        }

        $order = DB::transaction(function () use ($employee, $table, $data) {
            $isEmployeeOrder = !empty($employee->id);

            $order = Order::create([
                'location_id' => $employee->location_id,
                'table_id' => $table->id,
                'employee_id' => $employee->id,
                'order_number' => $this->generateOrderNumber($employee->location_id, 'DIN'),
                'order_type' => 'dine-in',
                'status' => $isEmployeeOrder ? 'received' : 'pending',
                'approval_status' => $isEmployeeOrder ? 'approved' : 'pending',
                'is_auto_approved' => $isEmployeeOrder,
                'payment_status' => 'unpaid',
                'currency' => 'USD',
                'ordered_at' => now(),
                'approved_at' => $isEmployeeOrder ? now() : null,
                'special_instructions' => $data['notes'] ?? null,
            ]);

            // Mark table as occupied
            $table->update(['status' => 'occupied']);

            return $order;
        });

        return new OrderResource($order->load(['items.menuItem', 'table']));
    }

    // GET /api/orders/{order} (role:admin,manager,waiter)
    public function show(Order $order): OrderResource
    {
        return new OrderResource($order->load(['items.menuItem', 'invoice']));
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
    public function generateInvoice(GenerateInvoiceRequest $request, Order $order, InvoiceService $invoiceService): OrderResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($order, $data, $request, $invoiceService) {
            if ($order->status !== 'received') {
                abort(409, 'Order is not pending.');
            }

            $order->loadMissing('items');
            $this->recalculateTotals($order);

            // Create invoice with unique invoice number
            $invoiceNumber = $this->generateInvoiceNumber($order->location_id, 'INV');
            $invoice = $order->invoice;
            if (!$invoice) {
                $invoice = new Invoice([
                    'order_id' => $order->id,
                    'location_id' => $order->location_id,
                    'invoice_number' => $invoiceNumber,
                    'subtotal' => $order->subtotal,
                    'tax_amount' => $order->tax_amount,
                    'discount_amount' => $order->discount_amount,
                    'service_charge' => $order->service_charge,
                    'total_amount' => $order->total_amount,
                    'amount_paid' => 0,
                    'amount_due' => $order->total_amount,
                    'currency' => $order->currency,
                    'issued_at' => now(),
                ]);
                $order->invoice()->save($invoice);
            }

            // Record payment
            $payment = new Payment([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $data['payment_method_id'],
                'amount' => $data['amount_paid'],
                'transaction_id' => 'TXN-'.Str::upper(Str::random(12)),
                'reference_number' => null,
                'status' => 'completed',
                'processed_at' => now(),
                'notes' => null,
            ]);
            $invoice->payments()->save($payment);

            // Recalculate invoice + order financial status from completed payments
            $invoice->refresh();
            $invoice->loadMissing('payments', 'order');
            $invoiceService->reconcileStatus($invoice);

            $invoice->refresh();

            // Close order & free table only when fully paid
            if ($invoice->amount_due <= 0) {
                $order->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);

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

    private function generateInvoiceNumber(int $locationId, string $prefix = 'INV'): string
    {
        for ($i = 0; $i < 5; $i++) {
            $number = sprintf('%s-%s-%s', $prefix, now()->format('Ymd'), Str::upper(Str::random(5)));
            $exists = Invoice::where('location_id', $locationId)->where('invoice_number', $number)->exists();
            if (!$exists) return $number;
        }
        return sprintf('%s-%s-%s', $prefix, now()->format('YmdHis'), random_int(100, 999));
    }

    // GET /api/admin/orders (Admin oversight)
    public function index(Request $request)
    {
        $query = Order::with(['items.menuItem', 'table', 'customer.user', 'employee.user']);
        
        // Filter by location
        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }
        
        // Filter by status (ignore 'all')
        if ($request->filled('status')) {
            $status = (string) $request->string('status');
            if ($status !== 'all') {
                $query->where('status', $status);
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
        
        $orders = $query->orderBy('ordered_at', 'desc')
                       ->paginate($request->get('per_page', 15));
    
        return OrderResource::collection($orders);
    }

    // GET /api/admin/orders/pending-approval
    // List all orders pending approval (replaces CustomerRequestController::index)
    public function pendingApproval(Request $request)
    {
        $query = Order::with(['customer.user', 'items.menuItem', 'customerAddress'])
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
        
        $order->update([
            'status' => 'preparing',
            'kitchen_submitted_at' => now(),
        ]);
        
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

        return new OrderResource($order->fresh(['items.menuItem', 'customerAddress']));
    }

    private function recalculateTotals(Order $order): void
    {
        $subtotal = $order->items->sum(function ($i) {
            return (float) $i->total_price;
        });

        // TODO: read tax rate from settings; default 0
        $taxRate = 0.0; // e.g., 0.1 for 10%
        $tax = round($subtotal * $taxRate, 2);

        $service = 0.0;
        $discount = 0.0;
        $total = $subtotal + $tax + $service - $discount;

        $order->update([
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'discount_amount' => $discount,
            'service_charge' => $service,
            'total_amount' => $total,
        ]);
    }

    // PUT /api/admin/orders/{order}/status
    public function updateStatus(Request $request, Order $order): OrderResource
    {
        $request->validate([
            'status' => 'required|in:pending,received,preparing,ready,completed,cancelled',
        ]);
        $newStatus = $request->status;

        // Prevent marking order as completed while items are not in a terminal state
        if ($newStatus === 'completed') {
            $order->loadMissing('items');
            $hasOpenItems = $order->items
                ->whereNotIn('status', ['served', 'cancelled'])
                ->isNotEmpty();

            if ($hasOpenItems) {
                abort(409, 'Cannot complete order while some items are not served or cancelled.');
            }
        }

        $order->update(['status' => $newStatus]);
        return new OrderResource($order->fresh(['items.menuItem', 'table']));
    }

    // DELETE /api/admin/orders/{order}
    public function destroy(Order $order): JsonResponse
    {
        $order->delete();
        return response()->json(['message' => 'Order deleted successfully.']);
    }
}
