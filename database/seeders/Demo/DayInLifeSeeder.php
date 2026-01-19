<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Location;
use App\Models\Order;
use App\Models\MenuItem;
use App\Models\OrderItem;
use App\Models\OrderStatus;
use App\Models\OrderType;
use App\Models\DiningTable;
use App\Models\Floor;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DayInLifeSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('   Simulating Realistic Shop Activity...');
        
        $location = Location::first();
        if (!$location) {
            $this->command->warn('   No location found. Skipping scenarios.');
            return;
        }

        // 1. Ensure minimal table setup exists if Prod seeder didn't run
        $this->ensureTablesExist($location);

        // 2. Simulate Reservations (Past, Present, Future)
        $this->command->info('   📅 Creating Reservations...');
        $this->simulateReservations($location);

        // 3. Simulate Orders (Breakfast, Lunch, Dinner - DineIn/Takeaway/Delivery)
        $this->command->info('   🍳 Creating Orders for Today...');
        $this->simulateOrders($location);

        // 4. Simulate Historical Data for Analytics (Last 30 Days)
        $this->simulateHistoricalData($location);
    }

    private function ensureTablesExist($location)
    {
        if (DiningTable::where('location_id', $location->id)->count() === 0) {
            $floor = Floor::firstOrCreate(
                ['location_id' => $location->id], 
                ['name' => 'Main Floor', 'map_width' => 800, 'map_height' => 600]
            );
            DiningTable::create(['location_id' => $location->id, 'floor_id' => $floor->id, 'code' => 'T1', 'status' => 'available', 'capacity' => 4]);
            DiningTable::create(['location_id' => $location->id, 'floor_id' => $floor->id, 'code' => 'T2', 'status' => 'available', 'capacity' => 2]);
        }
    }

    private function simulateReservations(Location $location)
    {
        $customers = User::whereHas('roles', fn($q) => $q->where('slug', 'customer'))->get();
        if ($customers->isEmpty()) {
            // Create a dummy customer if none exist
            $customerUser = User::firstOrCreate(
                ['email' => 'guest@example.com'],
                ['name' => 'Walk-in Guest', 'password' => bcrypt('password')]
            );
            
            $customerRole = \App\Models\Role::where('slug', 'customer')->first();
            if ($customerRole) {
                // Manually attach if custom method or relation
                if (method_exists($customerUser, 'roles')) {
                    $customerUser->roles()->syncWithoutDetaching([$customerRole->id]);
                }
            }
            
            $customers = collect([$customerUser]);
        }
        
        $tables = DiningTable::where('location_id', $location->id)->get();
        if ($tables->isEmpty()) return;

        // Scenarios
        $scenarios = [
            ['offset_hours' => -24, 'status' => 'completed', 'desc' => 'Yesterday Dinner'],
            ['offset_hours' => -2,  'status' => 'seated',    'desc' => 'Currently Seated'],
            ['offset_hours' => 4,   'status' => 'confirmed', 'desc' => 'Tonight Dinner'],
            ['offset_hours' => 24,  'status' => 'confirmed', 'desc' => 'Tomorrow Lunch'],
            ['offset_hours' => 48,  'status' => 'cancelled', 'desc' => 'Cancelled Booking'],
        ];

        foreach ($scenarios as $scenario) {
            $time = Carbon::now()->addHours($scenario['offset_hours']);
            // Round to nearest 30 mins
            $time->minute = $time->minute < 30 ? 0 : 30;
            $time->second = 0;

            // Use direct DB insert or unguarded model if needed, but Relation implies Customer model exists.
            // Assuming Reservation model exists and has these fields based on schema dump.
            // Using DB::table for safety against model guards if needed, or Model if well defined.
            // Let's use Model but be ready to unguard.
            
            // Find or create customer entry
            $user = $customers->random();
            $customerProfile = $user->customer ?? \App\Models\Customer::firstOrCreate(['user_id' => $user->id]);

            \App\Models\Reservation::create([
                'location_id' => $location->id,
                'customer_id' => $customerProfile->id,
                'table_id' => $tables->random()->id,
                'code' => strtoupper(\Illuminate\Support\Str::random(8)),
                'reservation_number' => 'RES-' . strtoupper(uniqid()),
                'party_size' => rand(2, 6),
                'reservation_date' => $time->toDateString(),
                'reservation_time' => $time->toTimeString(),
                'duration_minutes' => 90,
                'status' => $scenario['status'],
                'notes' => $scenario['desc'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function simulateOrders(Location $location)
    {
        $admin = User::where('email', 'demo@admin.com')->first();
        $waiterUser = User::whereHas('roles', function($q) { $q->where('slug', 'employee'); })->first() ?? $admin;
        
        $serverPosition = \App\Models\Position::firstOrCreate(['title' => 'Server'], ['description' => 'Staff']);

        // Ensure Employee record exists for FK constraint
        $waiter = \App\Models\Employee::firstOrCreate(
            ['user_id' => $waiterUser->id],
            [
                'location_id' => $location->id,
                'hire_date' => now(), 
                'position_id' => $serverPosition->id,
                'employee_code' => 'EMP-' . strtoupper(\Illuminate\Support\Str::random(6)),
                'salary' => 3000.00
            ]
        );
        
        // Cache lookups
        $statusCompleted = OrderStatus::where('code', 'completed')->first();
        $statusPreparing = OrderStatus::where('code', 'preparing')->first();
        $statusPending   = OrderStatus::where('code', 'pending')->first();
        $statusReady     = OrderStatus::where('code', 'ready')->first();

        $typeDineIn   = OrderType::where('code', 'dine_in')->first();
        $typeTakeaway = OrderType::where('code', 'takeaway')->first();
        $typeDelivery = OrderType::where('code', 'delivery')->first();

        $menuItems = MenuItem::where('location_id', $location->id)->take(50)->get();
        if ($menuItems->isEmpty()) return;

        // Generate ~25 orders
        for ($i = 0; $i < 25; $i++) {
            // Time distribution: 8-10 (Breakfast), 12-14 (Lunch), 18-21 (Dinner)
            $rand = rand(1, 100);
            if ($rand <= 20) $hour = rand(8, 10);      // 20% Breakfast
            elseif ($rand <= 60) $hour = rand(12, 14); // 40% Lunch
            else $hour = rand(18, 20);                 // 40% Dinner

            // Force all simulated orders to be TODAY for the demo dashboard to look good.
            // Even if the time is technically in the future (e.g. creating Dinner orders at 10am), 
            // we want them to appear in "Today's" stats.
            $orderTime = Carbon::today()->setHour($hour)->setMinute(rand(0, 59));

            // Determine Status deterministically to ensure variety
            $statusCodes = ['pending', 'received', 'preparing', 'ready', 'completed'];
            $targetStatus = $statusCodes[$i % count($statusCodes)];
            
            $status = match($targetStatus) {
                'pending' => $statusPending,
                'received' => OrderStatus::where('code', 'received')->first(),
                'preparing' => $statusPreparing,
                'ready' => $statusReady,
                'completed' => $statusCompleted,
                default => $statusPending
            };

            // Payment & timestamps logic matches status
            if (in_array($targetStatus, ['ready', 'completed'])) {
                $paymentStatus = 'paid';
            } else {
                $paymentStatus = 'unpaid';
            }

            // Determine Type
            $rType = rand(1, 100);
            if ($rType <= 60) {
                $type = $typeDineIn;
                $table = DiningTable::where('location_id', $location->id)->inRandomOrder()->first();
            } elseif ($rType <= 90) {
                $type = $typeTakeaway;
                $table = null;
            } else {
                $type = $typeDelivery;
                $table = null;
            }

            // Transaction
            DB::transaction(function () use ($location, $waiter, $table, $type, $status, $paymentStatus, $menuItems, $orderTime) {
                $order = Order::unguarded(function () use ($location, $waiter, $table, $type, $status, $paymentStatus, $orderTime) {
                    return Order::create([
                        'location_id' => $location->id,
                        'customer_id' => null, // Walk-in / Guest
                        'employee_id' => $waiter->id,
                        'table_id' => $table?->id,
                        'order_number' => 'ORD-' . strtoupper(uniqid()),
                        'order_type_id' => $type?->id,
                        'order_status_id' => $status?->id,
                        'subtotal' => 0,
                        'tax_amount' => 0,
                        'discount_amount' => 0,
                        'total_amount' => 0,
                        'created_at' => $orderTime,
                        'updated_at' => $orderTime,
                        'payment_status' => $paymentStatus,
                    ]);
                });

                $subtotal = 0;
                $itemCount = rand(1, 6);
                
                for ($j = 0; $j < $itemCount; $j++) {
                    $item = $menuItems->random();
                    $qty = rand(1, 3);
                    $price = $item->price * $qty;
                    
                    OrderItem::create([
                        'order_id' => $order->id,
                        'menu_item_id' => $item->id,
                        'quantity' => $qty,
                        'unit_price' => $item->price,
                        'total_price' => $price,
                        'notes' => rand(0, 5) === 0 ? 'Extra sauce' : null,
                    ]);
                    
                    $subtotal += $price;
                }

                $tax = $subtotal * 0.10; // 10% tax
                $total = $subtotal + $tax;

                $order->update([
                    'subtotal' => $subtotal,
                    'tax_amount' => $tax,
                    'total_amount' => $total,
                ]);

                // --- Generate Invoice ---
                $invoiceStatus = ($paymentStatus === 'paid') ? 'paid' : 'issued';
                $amountPaid = ($paymentStatus === 'paid') ? $total : 0;
                $amountDue = $total - $amountPaid;

                $invoice = \App\Models\Invoice::unguarded(function() use ($order, $location, $subtotal, $tax, $total, $amountPaid, $amountDue, $invoiceStatus, $orderTime) {
                    return \App\Models\Invoice::create([
                        'order_id' => $order->id,
                        'location_id' => $location->id,
                        'invoice_number' => 'INV-' . strtoupper(uniqid()),
                        'subtotal' => $subtotal,
                        'tax_amount' => $tax,
                        'discount_amount' => 0,
                        'service_charge' => 0,
                        'total_amount' => $total,
                        'amount_paid' => $amountPaid,
                        'amount_due' => $amountDue,
                        'status' => $invoiceStatus,
                        'issued_at' => $orderTime,
                        'paid_at' => ($invoiceStatus === 'paid') ? $orderTime : null,
                        'created_at' => $orderTime,
                        'updated_at' => $orderTime,
                    ]);
                });

                // --- Generate Payment if Paid ---
                if ($paymentStatus === 'paid') {
                    // Turn off guarding for Payment as well
                    \App\Models\Payment::unguarded(function() use ($invoice, $location, $total, $orderTime, $waiter) {
                        // Fetch valid Payment Method
                        $paymentMethod = \App\Models\PaymentMethod::inRandomOrder()->first();
                        $pmId = $paymentMethod?->id ?? 1;

                        $payStatusCompleted = \App\Models\PaymentStatus::where('code', 'completed')->first();
                        $paymentStatusId = $payStatusCompleted?->id;
                        
                        if (!$paymentStatusId) {
                             $paymentStatusId = \App\Models\PaymentStatus::first()?->id ?? 1;
                        }

                        \App\Models\Payment::create([
                            'uuid' => (string) \Illuminate\Support\Str::uuid(),
                            'invoice_id' => $invoice->id,
                            'payment_method_id' => $pmId,
                            'payment_status_id' => $paymentStatusId,
                            'amount' => $total,
                            'amount_in_base_currency' => $total,
                            'exchange_rate' => 1,
                            'transaction_id' => 'TXN-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(12)),
                            'reference_number' => 'REF-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(12)),
                            'processed_at' => $orderTime,
                            'confirmed_at' => $orderTime,
                            'created_at' => $orderTime,
                            'updated_at' => $orderTime,
                            'confirmed_by' => $waiter->user_id,
                        ]);
                    });
                }
            });
        }
    }

    private function simulateHistoricalData(Location $location)
    {
        $this->command->info('   📜 Creating Historical Orders (Last 30 Days)...');

        $admin = User::where('email', 'demo@admin.com')->first();
        $waiterUser = User::whereHas('roles', function($q) { $q->where('slug', 'employee'); })->first() ?? $admin;
        
        $waiter = \App\Models\Employee::where('user_id', $waiterUser->id)->first();
        $menuItems = MenuItem::where('location_id', $location->id)->take(50)->get();
        if ($menuItems->isEmpty()) return;

        $typeDineIn = OrderType::where('code', 'dine_in')->first();
        $statusCompleted = OrderStatus::where('code', 'completed')->first();
        $payStatusCompleted = \App\Models\PaymentStatus::where('code', 'completed')->first();
        $paymentStatusId = $payStatusCompleted?->id ?? 1;

        // Generate orders for last 30 days
        for ($d = 1; $d <= 30; $d++) {
            $date = Carbon::today()->subDays($d);
            $dailyCount = rand(3, 8); // 3-8 orders/day

            for ($i = 0; $i < $dailyCount; $i++) {
                $orderTime = $date->copy()->setHour(rand(11, 21))->setMinute(rand(0, 59));
                
                DB::transaction(function () use ($location, $waiter, $typeDineIn, $statusCompleted, $menuItems, $orderTime, $paymentStatusId) {
                    $order = Order::unguarded(function () use ($location, $waiter, $typeDineIn, $statusCompleted, $orderTime) {
                        return Order::create([
                            'location_id' => $location->id,
                            'customer_id' => null,
                            'employee_id' => $waiter->id,
                            'table_id' => null,
                            // 'order_number' => 'ORD-HIST-' . strtoupper(uniqid()), // Removed due to potential unique constraint if re-seeded? UUID better but format matters.
                            'order_number' => 'ORD-HIST-' . strtoupper(\Illuminate\Support\Str::random(10)),
                            'order_type_id' => $typeDineIn?->id,
                            'order_status_id' => $statusCompleted?->id,
                            'subtotal' => 0,
                            'tax_amount' => 0,
                            'discount_amount' => 0,
                            'total_amount' => 0,
                            'created_at' => $orderTime,
                            'updated_at' => $orderTime,
                            'payment_status' => 'paid',
                            'completed_at' => $orderTime,
                        ]);
                    });

                    $subtotal = 0;
                    $itemCount = rand(1, 4);
                    
                    for ($j = 0; $j < $itemCount; $j++) {
                        $item = $menuItems->random();
                        $qty = rand(1, 2);
                        $price = $item->price * $qty;
                        
                        OrderItem::create([
                            'order_id' => $order->id,
                            'menu_item_id' => $item->id,
                            'quantity' => $qty,
                            'unit_price' => $item->price,
                            'total_price' => $price,
                        ]);
                        $subtotal += $price;
                    }

                    $tax = $subtotal * 0.10;
                    $total = $subtotal + $tax;

                    $order->update([
                        'subtotal' => $subtotal,
                        'tax_amount' => $tax,
                        'total_amount' => $total,
                    ]);

                    // Invoice
                    $invoice = \App\Models\Invoice::unguarded(function() use ($order, $location, $subtotal, $tax, $total, $orderTime) {
                        return \App\Models\Invoice::create([
                            'order_id' => $order->id,
                            'location_id' => $location->id,
                            'invoice_number' => 'INV-HIST-' . strtoupper(uniqid()),
                            'subtotal' => $subtotal,
                            'tax_amount' => $tax,
                            'discount_amount' => 0,
                            'service_charge' => 0,
                            'total_amount' => $total,
                            'amount_paid' => $total,
                            'amount_due' => 0,
                            'status' => 'paid',
                            'issued_at' => $orderTime,
                            'paid_at' => $orderTime,
                            'created_at' => $orderTime,
                            'updated_at' => $orderTime,
                        ]);
                    });

                    // Payment
                    \App\Models\Payment::unguarded(function() use ($invoice, $total, $orderTime, $waiter, $paymentStatusId) {
                        $pmId = \App\Models\PaymentMethod::inRandomOrder()->first()?->id ?? 1;

                        \App\Models\Payment::create([
                            'uuid' => (string) \Illuminate\Support\Str::uuid(),
                            'invoice_id' => $invoice->id,
                            'payment_method_id' => $pmId,
                            'payment_status_id' => $paymentStatusId,
                            'amount' => $total,
                            'amount_in_base_currency' => $total,
                            'exchange_rate' => 1,
                            'transaction_id' => 'TXN-HIST-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(10)),
                            'reference_number' => 'REF-HIST-' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(10)),
                            'processed_at' => $orderTime,
                            'confirmed_at' => $orderTime,
                            'created_at' => $orderTime,
                            'updated_at' => $orderTime,
                            'confirmed_by' => $waiter->user_id,
                        ]);
                    });
                });
            }
        }
    }
}
