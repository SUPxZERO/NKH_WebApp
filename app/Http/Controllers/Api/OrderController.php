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
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    // POST /api/orders (role:admin,manager,waiter)
    public function store(StoreOrderRequest $request): OrderResource|JsonResponse
    {
        $data = $request->validated();

        $employee = Employee::where('user_id', $request->user()->id)->firstOrFail();
        $table = DiningTable::findOrFail($data['table_id']);

        if ($table->status !== 'available') {
            return response()->json(['message' => 'Table is currently occupied.'], 409);
        }

        $order = DB::transaction(function () use ($employee, $table, $data) {
            $order = Order::create([
                'location_id' => $employee->location_id,
                'table_id' => $table->id,
                'employee_id' => $employee->id,
                'order_number' => $this->generateOrderNumber($employee->location_id, 'DIN'),
                'type' => 'dine_in',
                'order_type' => 'dine-in',
                // Use 'received' to align with orders.status enum
                'status' => 'received',
                'payment_status' => 'unpaid',
                'currency' => 'USD',
                'placed_at' => now(),
                'notes' => $data['notes'] ?? null,
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
                    'total' => $existing->unit_price * $newQty - $existing->discount_amount + $existing->tax_amount,
                    'notes' => $data['notes'] ?? $existing->notes,
                ]);
                $line = $existing;
            } else {
                $line = $order->items()->create([
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $data['quantity'],
                    'unit_price' => $menuItem->price,
                    'discount_amount' => 0,
                    'tax_amount' => 0,
                    'total' => $menuItem->price * $data['quantity'],
                    'kitchen_status' => 'pending',
                    'notes' => $data['notes'] ?? null,
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
                'notes' => $data['notes'] ?? $orderItem->notes,
                'total' => $orderItem->unit_price * $data['quantity'] - $orderItem->discount_amount + $orderItem->tax_amount,
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
    public function generateInvoice(GenerateInvoiceRequest $request, Order $order): OrderResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($order, $data, $request) {
            if ($order->status !== 'received') {
                abort(409, 'Order is not pending.');
            }

            $order->loadMissing('items');
            $this->recalculateTotals($order);

            // Create invoice
            $invoiceNumber = $this->generateOrderNumber($order->location_id, 'INV');
            $invoice = $order->invoice;
            if (!$invoice) {
                $invoice = new Invoice([
                    'order_id' => $order->id,
                    'location_id' => $order->location_id,
                    'invoice_number' => $invoiceNumber,
                    'subtotal' => $order->subtotal,
                    'tax_total' => $order->tax_total,
                    'discount_total' => $order->discount_total,
                    'service_charge' => $order->service_charge,
                    'total' => $order->total,
                    'amount_paid' => 0,
                    'amount_due' => $order->total,
                    'currency' => $order->currency,
                    'issued_at' => now(),
                ]);
                $order->invoice()->save($invoice);
            }

            // Record payment
            $payment = new Payment([
                'invoice_id' => $invoice->id,
                'payment_method_id' => $data['payment_method_id'],
                'location_id' => $order->location_id,
                'created_by' => optional($request->user())->id,
                'amount' => $data['amount_paid'],
                'currency' => $order->currency,
                'reference' => null,
                'transaction_id' => null,
                'status' => 'completed',
                'paid_at' => now(),
            ]);
            $invoice->payments()->save($payment);

            // Update invoice paid/due
            $newPaid = (float) $invoice->amount_paid + (float) $data['amount_paid'];
            $newDue = max(0, (float) $invoice->total - $newPaid);
            $invoice->update(['amount_paid' => $newPaid, 'amount_due' => $newDue]);

            // Close order & free table if dine-in
            $order->update([
                'status' => 'completed',
                // Keep payment_status within enum: unpaid | paid | refunded
                'payment_status' => $newDue <= 0 ? 'paid' : 'unpaid',
                'closed_at' => now(),
            ]);

            if ($order->table) {
                $order->table->update(['status' => 'available']);
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
        $query = Order::with(['items.menuItem', 'table', 'customer.user', 'employee.user']);
        
        // Filter by location
        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }
        
        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('placed_at', '>=', $request->start_date);
        }
        
        if ($request->has('end_date')) {
            $query->whereDate('placed_at', '<=', $request->end_date);
        }
        
        $orders = $query->orderBy('placed_at', 'desc')
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
        $order->items()->update(['kitchen_status' => 'preparing']);
        
        return new OrderResource($order->fresh(['items.menuItem', 'table']));
    }

    // PATCH /api/admin/orders/{order}/approve (Admin approval for online orders)
    public function approve(Order $order): OrderResource
    {
        if (!in_array($order->type, ['takeaway', 'delivery'])) {
            abort(422, 'Only online orders require approval.');
        }
        
        if ($order->status !== 'pending') {
            abort(409, 'Order is not pending approval.');
        }
        
        $order->update([
            'status' => 'received',
            'approved_at' => now(),
        ]);
        
        return new OrderResource($order->fresh(['items.menuItem', 'customerAddress']));
    }

    // PATCH /api/admin/orders/{order}/reject (Admin rejection for online orders)
    public function reject(Order $order): OrderResource
    {
        if (!in_array($order->type, ['takeaway', 'delivery'])) {
            abort(422, 'Only online orders can be rejected.');
        }
        
        if ($order->status !== 'pending') {
            abort(409, 'Order is not pending approval.');
        }
        
        $order->update([
            'status' => 'cancelled',
            'rejected_at' => now(),
        ]);
        
        return new OrderResource($order->fresh(['items.menuItem', 'customerAddress']));
    }

    private function recalculateTotals(Order $order): void
    {
        $subtotal = $order->items->sum(function ($i) {
            return (float) $i->total;
        });

        // TODO: read tax rate from settings; default 0
        $taxRate = 0.0; // e.g., 0.1 for 10%
        $tax = round($subtotal * $taxRate, 2);

        $service = 0.0;
        $discount = 0.0;
        $total = $subtotal + $tax + $service - $discount;

        $order->update([
            'subtotal' => $subtotal,
            'tax_total' => $tax,
            'discount_total' => $discount,
            'service_charge' => $service,
            'total' => $total,
        ]);
    }
}
