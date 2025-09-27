<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Customer\StoreAddressRequest;
use App\Http\Requests\Api\OnlineOrder\StoreOnlineOrderRequest;
use App\Http\Resources\CustomerAddressResource;
use App\Http\Resources\OrderResource;
use App\Http\Resources\OrderTimeSlotResource;
use App\Models\CustomerAddress;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderTimeSlot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OnlineOrderController extends Controller
{
    // GET /api/time-slots?date=YYYY-MM-DD&type=delivery
    public function timeSlots(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required','date_format:Y-m-d'],
            'type' => ['required','in:pickup,delivery'],
        ]);

        $query = OrderTimeSlot::query()
            ->where('slot_date', $validated['date'])
            ->where('slot_type', $validated['type'])
            ->whereColumn('current_orders', '<', 'max_orders')
            ->orderBy('slot_start_time');

        return OrderTimeSlotResource::collection($query->paginate());
    }

    // GET /api/customer/addresses (auth:sanctum, role:customer)
    public function addressesIndex(Request $request)
    {
        $customer = $request->user()->customer;
        abort_unless($customer, 404);

        return CustomerAddressResource::collection($customer->addresses()->latest()->paginate());
    }

    // POST /api/customer/addresses (auth:sanctum, role:customer)
    public function addressesStore(StoreAddressRequest $request)
    {
        $customer = $request->user()->customer;
        abort_unless($customer, 404);

        $payload = $request->validated();
        // Support 'notes' alias per API contract -> map to delivery_instructions
        if ($request->filled('notes')) {
            $payload['delivery_instructions'] = $request->string('notes');
        }

        $address = $customer->addresses()->create($payload);
        return new CustomerAddressResource($address);
    }

    // POST /api/online-orders (auth:sanctum, role:customer)
    public function store(StoreOnlineOrderRequest $request)
    {
        $user = $request->user();
        $customer = $user->customer;
        abort_unless($customer, 422, 'Customer profile not found.');

        $data = $request->validated();

        $order = DB::transaction(function () use ($data, $customer) {
            // Lock slot row to prevent race conditions
            $slot = OrderTimeSlot::where('id', $data['time_slot_id'])->lockForUpdate()->firstOrFail();

            if ($slot->slot_type !== $data['order_type']) {
                abort(422, 'Selected time slot does not match order type.');
            }
            if ((int) $slot->location_id !== (int) $data['location_id']) {
                abort(422, 'Selected time slot and location mismatch.');
            }
            if ($slot->current_orders >= $slot->max_orders) {
                abort(409, 'Selected time slot is full.');
            }

            if ($data['order_type'] === 'delivery') {
                $address = CustomerAddress::where('id', $data['customer_address_id'] ?? 0)
                    ->where('customer_id', $customer->id)
                    ->first();
                if (!$address) {
                    abort(422, 'Invalid delivery address.');
                }
            }

            $orderNumber = $this->generateOrderNumber($data['location_id'], 'ONL');

            $scheduledAt = $slot->slot_date.' '.$slot->slot_start_time;
            $type = $data['order_type'] === 'pickup' ? 'takeaway' : 'delivery';

            $order = Order::create([
                'location_id' => $data['location_id'],
                'customer_id' => $customer->id,
                'order_number' => $orderNumber,
                'type' => $type,
                'order_type' => $data['order_type'],
                'status' => 'received',
                'payment_status' => 'unpaid',
                'currency' => 'USD',
                'placed_at' => now(),
                'scheduled_at' => $scheduledAt,
                'notes' => $data['notes'] ?? null,
                'customer_address_id' => $data['customer_address_id'] ?? null,
            ]);

            $subtotal = 0;
            foreach ($data['order_items'] as $item) {
                $menuItem = MenuItem::findOrFail($item['menu_item_id']);
                $qty = $item['quantity'];
                $lineTotal = (float) $menuItem->price * $qty;
                $order->items()->create([
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $qty,
                    'unit_price' => $menuItem->price,
                    'discount_amount' => 0,
                    'tax_amount' => 0,
                    'total' => $lineTotal,
                    'kitchen_status' => 'pending',
                ]);
                $subtotal += $lineTotal;
            }

            // Taxes/discounts/service can be extended later
            $tax = 0.0; $discount = 0.0; $service = 0.0;
            $total = $subtotal + $tax + $service - $discount;

            $order->update([
                'subtotal' => $subtotal,
                'tax_total' => $tax,
                'discount_total' => $discount,
                'service_charge' => $service,
                'total' => $total,
            ]);

            // Increment slot usage
            $slot->increment('current_orders');

            return $order;
        });

        return new OrderResource($order->load(['items.menuItem']));
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
}
