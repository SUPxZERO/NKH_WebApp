<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Location;
use App\Models\Employee;
use App\Models\Customer;
use App\Models\User;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Invoice;
use App\Models\Ingredient;
use App\Models\Shift;
use App\Models\DiningTable;

/**
 * WorkflowDataSeeder — Story-Driven Relational Seeder
 * 
 * Every row is created FROM a parent entity, guaranteeing FK integrity.
 * Data chains:
 *   Employee → Shift → Attendance → Payroll
 *   Customer → Address/Prefs/Favorites → Reservation → Order → Invoice → Payment → Refund/Feedback
 *   Order Items → Stock Movements (ingredient consumption)
 *   Orders → Daily Sales Summaries (real aggregation)
 */
class WorkflowDataSeeder extends Seeder
{
    private Location $location;

    public function run(): void
    {
        $this->location = Location::first();
        if (!$this->location) {
            $this->command->warn('No location found. Skipping WorkflowDataSeeder.');
            return;
        }

        $this->command->info('   🔗 Building Relational Data Chains...');

        // ── Foundation ──
        $this->seedExpenseCategories();
        $this->seedOperatingHours();
        $this->seedOrderTimeSlots();

        // ── HR Chain: Shift → Attendance → Payroll ──
        $attendanceData = $this->seedAttendancesFromShifts();
        $this->seedPayrollsFromAttendance($attendanceData);

        // ── Customer Chain: Profile → Addresses → Preferences → Favorites → Cart ──
        $customers = $this->seedCustomerData();

        // ── Service Chain: Reservation → Table Session ──
        $this->seedTableSessions();

        // ── Finance Chain: Order → Feedback + Refund + Stock Movements ──
        $this->seedFeedbackFromOrders();
        $this->seedRefundsFromPayments();
        $this->seedStockMovementsFromOrders();

        // ── Analytics: Aggregate real data ──
        $this->seedDailySalesSummariesFromOrders();

        // ── User Settings ──
        $this->seedNotificationPreferences();
        $this->seedUserSettings();
        $this->seedCartItems();

        $this->command->info('   ✅ All relational data chains built.');
    }

    // ═══════════════════════════════════════════════════════════════
    // FOUNDATION
    // ═══════════════════════════════════════════════════════════════

    private function seedExpenseCategories(): void
    {
        $categories = [
            ['name' => 'Food & Ingredients', 'description' => 'Raw materials and food supplies'],
            ['name' => 'Utilities', 'description' => 'Electricity, water, gas, internet'],
            ['name' => 'Rent & Lease', 'description' => 'Monthly rent and lease payments'],
            ['name' => 'Staff Salary', 'description' => 'Employee wages and bonuses'],
            ['name' => 'Marketing', 'description' => 'Advertising, social media, promotions'],
            ['name' => 'Maintenance', 'description' => 'Repairs, cleaning, pest control'],
            ['name' => 'Equipment', 'description' => 'Kitchen equipment, POS hardware'],
            ['name' => 'Supplies', 'description' => 'Napkins, packaging, cleaning supplies'],
            ['name' => 'Insurance', 'description' => 'Fire, health, property insurance'],
            ['name' => 'Miscellaneous', 'description' => 'Other uncategorized expenses'],
        ];

        foreach ($categories as $cat) {
            DB::table('expense_categories')->updateOrInsert(
                ['location_id' => $this->location->id, 'name' => $cat['name']],
                array_merge($cat, [
                    'location_id' => $this->location->id,
                    'is_active' => true,
                    'created_at' => now(), 'updated_at' => now(),
                ])
            );
        }
        $this->command->info('      → expense_categories: 10');
    }

    private function seedOperatingHours(): void
    {
        $count = 0;
        foreach (['dine-in', 'pickup', 'delivery'] as $type) {
            for ($day = 0; $day <= 6; $day++) {
                $open = ($day === 0) ? '10:00:00' : '08:00:00';
                $close = ($day === 0 || $day === 6) ? '21:00:00' : '22:00:00';
                if ($type === 'delivery') $close = '20:30:00';

                DB::table('operating_hours')->updateOrInsert(
                    ['location_id' => $this->location->id, 'day_of_week' => $day, 'service_type' => $type],
                    ['opening_time' => $open, 'closing_time' => $close, 'created_at' => now(), 'updated_at' => now()]
                );
                $count++;
            }
        }
        $this->command->info("      → operating_hours: $count");
    }

    private function seedOrderTimeSlots(): void
    {
        $count = 0;
        for ($d = 0; $d <= 7; $d++) {
            $date = Carbon::today()->addDays($d);
            foreach (['pickup', 'delivery'] as $type) {
                for ($h = 10; $h <= 20; $h++) {
                    foreach (['00', '30'] as $m) {
                        if ($h === 20 && $m === '30' && $type === 'delivery') continue;
                        DB::table('order_time_slots')->insertOrIgnore([
                            'location_id' => $this->location->id,
                            'slot_date' => $date->toDateString(),
                            'slot_start_time' => sprintf('%02d:%s:00', $h, $m),
                            'slot_type' => $type,
                            'max_orders' => $type === 'pickup' ? 8 : 5,
                            'current_orders' => $d === 0 ? rand(0, 3) : 0,
                            'created_at' => now(), 'updated_at' => now(),
                        ]);
                        $count++;
                    }
                }
            }
        }
        $this->command->info("      → order_time_slots: $count");
    }

    // ═══════════════════════════════════════════════════════════════
    // HR CHAIN: Shift → Attendance → Payroll
    // ═══════════════════════════════════════════════════════════════

    /**
     * Create attendance records FROM actual shifts.
     * Each past shift generates a matching clock-in/clock-out.
     */
    private function seedAttendancesFromShifts(): array
    {
        $shifts = Shift::where('date', '<', Carbon::today()->toDateString())
            ->where('date', '>=', Carbon::today()->subDays(30)->toDateString())
            ->with('employee')
            ->get();

        if ($shifts->isEmpty()) {
            $this->command->info('      → attendances: 0 (no past shifts found)');
            return [];
        }

        $hoursByEmployee = []; // employee_id => total_hours
        $count = 0;

        foreach ($shifts as $shift) {
            if (!$shift->employee) continue;

            $shiftDate = Carbon::parse($shift->date);
            $startParts = explode(':', $shift->start_time);
            $endParts = explode(':', $shift->end_time);

            $clockIn = $shiftDate->copy()->setHour((int)$startParts[0])->setMinute((int)$startParts[1]);
            // Add slight variance: arrive 0-10 min early/late
            $clockIn->addMinutes(rand(-5, 10));

            $clockOut = $shiftDate->copy()->setHour((int)$endParts[0])->setMinute((int)$endParts[1]);
            // Handle overnight shifts
            if ($clockOut->lessThan($clockIn)) {
                $clockOut->addDay();
            }
            // Add slight variance: leave 0-15 min early/late
            $clockOut->addMinutes(rand(-5, 15));

            $hoursWorked = $clockIn->diffInMinutes($clockOut) / 60;

            // Skip ~10% of shifts (absent days)
            if (rand(1, 10) === 1) continue;

            DB::table('attendances')->insert([
                'employee_id' => $shift->employee_id,
                'location_id' => $shift->location_id ?? $this->location->id,
                'clock_in_at' => $clockIn,
                'clock_out_at' => $clockOut,
                'notes' => null,
                'created_at' => $clockIn,
                'updated_at' => $clockOut,
            ]);

            $empId = $shift->employee_id;
            $hoursByEmployee[$empId] = ($hoursByEmployee[$empId] ?? 0) + $hoursWorked;
            $count++;
        }

        $this->command->info("      → attendances: $count (derived from actual shifts)");
        return $hoursByEmployee;
    }

    /**
     * Calculate payroll FROM attendance hours.
     */
    private function seedPayrollsFromAttendance(array $hoursByEmployee): void
    {
        if (empty($hoursByEmployee)) {
            $this->command->info('      → payrolls: 0 (no attendance data)');
            return;
        }

        $count = 0;
        $periodStart = Carbon::now()->subMonth()->startOfMonth();
        $periodEnd = Carbon::now()->subMonth()->endOfMonth();

        foreach ($hoursByEmployee as $empId => $totalHours) {
            $employee = Employee::find($empId);
            if (!$employee) continue;

            $hourlyRate = ($employee->salary ?? 500) / 160; // Monthly / ~160 work hours
            $gross = round($totalHours * $hourlyRate, 2);
            $bonus = $totalHours > 180 ? round($gross * 0.05, 2) : 0; // 5% overtime bonus
            $deductions = round($gross * 0.05, 2); // 5% tax/benefits
            $net = $gross + $bonus - $deductions;

            DB::table('payrolls')->insert([
                'employee_id' => $empId,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'gross_pay' => $gross,
                'bonuses' => $bonus,
                'deductions' => $deductions,
                'net_pay' => $net,
                'status' => 'paid',
                'paid_at' => $periodEnd->copy()->addDays(5),
                'created_at' => $periodStart,
                'updated_at' => now(),
            ]);
            $count++;
        }

        // Current month draft
        $currentStart = Carbon::now()->startOfMonth();
        $currentEnd = Carbon::now()->endOfMonth();
        foreach (array_slice(array_keys($hoursByEmployee), 0, 10) as $empId) {
            $employee = Employee::find($empId);
            if (!$employee) continue;

            $estimatedGross = rand(300, 600);
            DB::table('payrolls')->insert([
                'employee_id' => $empId,
                'period_start' => $currentStart->toDateString(),
                'period_end' => $currentEnd->toDateString(),
                'gross_pay' => $estimatedGross,
                'bonuses' => 0,
                'deductions' => round($estimatedGross * 0.05, 2),
                'net_pay' => round($estimatedGross * 0.95, 2),
                'status' => 'draft',
                'paid_at' => null,
                'created_at' => $currentStart,
                'updated_at' => now(),
            ]);
            $count++;
        }

        $this->command->info("      → payrolls: $count (computed from attendance hours)");
    }

    // ═══════════════════════════════════════════════════════════════
    // CUSTOMER CHAIN: Profile → Addresses → Preferences → Favorites
    // ═══════════════════════════════════════════════════════════════

    private function seedCustomerData(): \Illuminate\Support\Collection
    {
        $customers = Customer::take(5)->get();
        if ($customers->isEmpty()) return collect();

        $menuItems = MenuItem::where('location_id', $this->location->id)->take(20)->get();

        foreach ($customers as $i => $customer) {
            // Addresses
            DB::table('customer_addresses')->updateOrInsert(
                ['customer_id' => $customer->id, 'label' => 'Home'],
                [
                    'address_line_1' => ($i + 1) . '23 Street ' . ($i * 10 + 100),
                    'city' => 'Phnom Penh', 'province' => 'Phnom Penh',
                    'postal_code' => '120' . str_pad($i + 1, 2, '0', STR_PAD_LEFT),
                    'latitude' => 11.5564 + ($i * 0.001),
                    'longitude' => 104.9282 + ($i * 0.001),
                    'delivery_instructions' => $i % 2 === 0 ? 'Ring doorbell twice' : null,
                    'is_default' => true, 'is_verified' => true,
                    'created_at' => now(), 'updated_at' => now(),
                ]
            );

            if ($i < 3) {
                DB::table('customer_addresses')->updateOrInsert(
                    ['customer_id' => $customer->id, 'label' => 'Office'],
                    [
                        'address_line_1' => 'Floor ' . ($i + 2) . ', BKK Tower',
                        'address_line_2' => 'Street 271',
                        'city' => 'Phnom Penh', 'province' => 'Phnom Penh',
                        'postal_code' => '12301',
                        'is_default' => false, 'is_verified' => true,
                        'created_at' => now(), 'updated_at' => now(),
                    ]
                );
            }

            // Preferences
            foreach ([
                ['category' => 'dietary', 'preference_key' => 'allergies', 'preference_value' => json_encode(['none'])],
                ['category' => 'notification', 'preference_key' => 'sms_updates', 'preference_value' => json_encode(true)],
                ['category' => 'notification', 'preference_key' => 'email_marketing', 'preference_value' => json_encode($i % 2 === 0)],
            ] as $pref) {
                DB::table('customer_preferences')->updateOrInsert(
                    ['customer_id' => $customer->id, 'category' => $pref['category'], 'preference_key' => $pref['preference_key']],
                    array_merge($pref, ['customer_id' => $customer->id, 'created_at' => now(), 'updated_at' => now()])
                );
            }

            // Favorites — real menu items
            if ($menuItems->isNotEmpty()) {
                foreach ($menuItems->random(min(3, $menuItems->count())) as $item) {
                    DB::table('customer_favorites')->updateOrInsert(
                        ['customer_id' => $customer->id, 'menu_item_id' => $item->id],
                        ['created_at' => now(), 'updated_at' => now()]
                    );
                }
            }
        }
        $this->command->info('      → customer_addresses, preferences, favorites: linked');
        return $customers;
    }

    // ═══════════════════════════════════════════════════════════════
    // SERVICE: Table Sessions FROM today's occupied tables
    // ═══════════════════════════════════════════════════════════════

    private function seedTableSessions(): void
    {
        // Find tables that have active orders (dine-in, today)
        $todayOrders = Order::whereDate('created_at', Carbon::today())
            ->whereNotNull('table_id')
            ->with('table')
            ->take(3)
            ->get();

        $count = 0;
        foreach ($todayOrders as $order) {
            if (!$order->table) continue;

            DB::table('table_sessions')->insert([
                'table_id' => $order->table_id,
                'customer_id' => $order->customer_id,
                'order_id' => $order->id,
                'session_token' => \Illuminate\Support\Str::random(64),
                'status' => ['active', 'ordering', 'payment_pending'][$count % 3],
                'started_at' => $order->created_at,
                'last_activity_at' => now()->subMinutes(rand(1, 10)),
                'created_at' => $order->created_at,
                'updated_at' => now(),
            ]);
            $count++;
        }

        // Fallback: create from available tables if no dine-in orders today
        if ($count === 0) {
            $tables = DiningTable::take(2)->get();
            foreach ($tables as $table) {
                DB::table('table_sessions')->insert([
                    'table_id' => $table->id,
                    'session_token' => \Illuminate\Support\Str::random(64),
                    'status' => 'active',
                    'started_at' => now()->subMinutes(rand(10, 60)),
                    'last_activity_at' => now()->subMinutes(rand(1, 10)),
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $count++;
            }
        }
        $this->command->info("      → table_sessions: $count (linked to today's orders)");
    }

    // ═══════════════════════════════════════════════════════════════
    // FINANCE: Feedback FROM actual customer orders
    // ═══════════════════════════════════════════════════════════════

    private function seedFeedbackFromOrders(): void
    {
        // Only create feedback for orders that HAVE a customer_id
        $orders = Order::whereNotNull('customer_id')
            ->where('payment_status', 'paid')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        if ($orders->isEmpty()) {
            $this->command->info('      → feedback: 0 (no customer orders found)');
            return;
        }

        $comments = [
            5 => ['Amazing food, will come back!', 'Best restaurant in Phnom Penh!', 'Staff was very friendly!'],
            4 => ['Great service overall.', 'Good value for money.', 'The new menu items are delicious!'],
            3 => ['Food was ok but could be warmer.', 'Portions could be larger for the price.', 'Average experience.'],
        ];

        $count = 0;
        foreach ($orders as $order) {
            $rating = [5, 5, 4, 4, 4, 3][rand(0, 5)]; // Weighted towards positive
            $commentList = $comments[$rating];

            DB::table('feedback')->insert([
                'location_id' => $order->location_id ?? $this->location->id,
                'order_id' => $order->id,
                'customer_id' => $order->customer_id, // ← Same customer who placed the order
                'rating' => $rating,
                'service_rating' => min(5, $rating + rand(-1, 1)),
                'food_rating' => min(5, $rating + rand(-1, 1)),
                'ambiance_rating' => min(5, $rating + rand(0, 1)),
                'comments' => $commentList[array_rand($commentList)],
                'response' => $count < 5 ? 'Thank you for your feedback!' : null,
                'responded_at' => $count < 5 ? now()->subDays(rand(1, 3)) : null,
                'visibility' => 'public',
                'tags' => json_encode($rating >= 4 ? ['positive'] : ['needs-improvement']),
                'created_at' => $order->created_at->copy()->addHours(rand(1, 24)),
                'updated_at' => now(),
            ]);
            $count++;
        }
        $this->command->info("      → feedback: $count (linked to customers' own orders)");
    }

    private function seedRefundsFromPayments(): void
    {
        // Pick payments that have a completed status and valid invoice
        $payments = Payment::whereHas('invoice')
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        if ($payments->isEmpty()) {
            $this->command->info('      → refunds: 0');
            return;
        }

        $admin = User::where('email', 'demo@admin.com')->first();
        $reasons = ['Customer complaint about food quality', 'Wrong order delivered', 'Double charge detected'];

        foreach ($payments->take(3) as $i => $payment) {
            $status = ['completed', 'pending', 'approved'][$i % 3];
            DB::table('refunds')->insert([
                'payment_id' => $payment->id,
                'amount' => round($payment->amount * 0.5, 2),
                'reason' => $reasons[$i % count($reasons)],
                'status' => $status,
                'initiated_by' => $admin?->id,
                'approved_by' => $status !== 'pending' ? $admin?->id : null,
                'approved_at' => $status !== 'pending' ? $payment->created_at->copy()->addDays(1) : null,
                'processed_at' => $status === 'completed' ? $payment->created_at->copy()->addDays(2) : null,
                'notes' => null,
                'created_at' => $payment->created_at->copy()->addHours(2),
                'updated_at' => now(),
            ]);
        }
        $this->command->info('      → refunds: 3 (linked to actual payments)');
    }

    // ═══════════════════════════════════════════════════════════════
    // INVENTORY: Stock Movements FROM order's recipe ingredients
    // ═══════════════════════════════════════════════════════════════

    private function seedStockMovementsFromOrders(): void
    {
        // Get completed orders with their items
        $orders = Order::where('payment_status', 'paid')
            ->with(['items.menuItem'])
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get();

        if ($orders->isEmpty()) {
            $this->command->info('      → stock_movements: 0');
            return;
        }

        // Load recipe ingredients for menu items
        $recipeIngredients = DB::table('recipe_ingredients')
            ->join('recipes', 'recipes.id', '=', 'recipe_ingredients.recipe_id')
            ->select('recipes.menu_item_id', 'recipe_ingredients.ingredient_id', 'recipe_ingredients.quantity')
            ->get()
            ->groupBy('menu_item_id');

        $count = 0;
        foreach ($orders as $order) {
            foreach ($order->items as $orderItem) {
                $menuItemId = $orderItem->menu_item_id;
                $ingredients = $recipeIngredients->get($menuItemId);
                if (!$ingredients) continue;

                foreach ($ingredients as $ri) {
                    $consumedQty = $ri->quantity * $orderItem->quantity;

                    DB::table('stock_movements')->insert([
                        'ingredient_id' => $ri->ingredient_id,
                        'location_id' => $this->location->id,
                        'movement_type' => 'order_out',
                        'quantity' => -abs(round($consumedQty, 3)),
                        'running_balance' => round(rand(10, 300) * 0.1, 3), // Approximate
                        'reference_type' => 'App\\Models\\Order',
                        'reference_id' => $order->id,
                        'created_by' => null,
                        'created_at' => $order->created_at,
                    ]);
                    $count++;
                }
            }
        }

        // Also add some purchase_in movements (ingredient restocking)
        $ingredients = Ingredient::take(10)->get();
        foreach ($ingredients as $ing) {
            for ($d = 0; $d < 4; $d++) {
                DB::table('stock_movements')->insert([
                    'ingredient_id' => $ing->id,
                    'location_id' => $this->location->id,
                    'movement_type' => 'purchase_in',
                    'quantity' => round(rand(20, 100) * 0.5, 3),
                    'running_balance' => round(rand(100, 500) * 0.1, 3),
                    'reference_type' => null,
                    'reference_id' => null,
                    'created_by' => null,
                    'created_at' => Carbon::today()->subDays($d * 7),
                ]);
                $count++;
            }
        }

        $this->command->info("      → stock_movements: $count (derived from orders + restocking)");
    }

    // ═══════════════════════════════════════════════════════════════
    // ANALYTICS: Daily Sales FROM actual orders
    // ═══════════════════════════════════════════════════════════════

    private function seedDailySalesSummariesFromOrders(): void
    {
        $count = 0;
        for ($d = 0; $d <= 30; $d++) {
            $date = Carbon::today()->subDays($d)->toDateString();

            $stats = DB::table('orders')
                ->where('location_id', $this->location->id)
                ->whereDate('created_at', $date)
                ->selectRaw('COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue, COALESCE(SUM(tax_amount), 0) as total_tax, COALESCE(SUM(discount_amount), 0) as total_discount')
                ->first();

            if (!$stats || $stats->total_orders == 0) continue;

            DB::table('daily_sales_summaries')->insertOrIgnore([
                'location_id' => $this->location->id,
                'date' => $date,
                'total_orders' => $stats->total_orders,
                'total_revenue' => $stats->total_revenue,
                'total_tax' => $stats->total_tax,
                'total_discount' => $stats->total_discount,
                'total_cogs' => round($stats->total_revenue * 0.35, 2), // ~35% COGS estimate
                'created_at' => $date,
                'updated_at' => now(),
            ]);
            $count++;
        }
        $this->command->info("      → daily_sales_summaries: $count (aggregated from real orders)");
    }

    // ═══════════════════════════════════════════════════════════════
    // USER SETTINGS
    // ═══════════════════════════════════════════════════════════════

    private function seedNotificationPreferences(): void
    {
        $users = User::take(16)->get();
        $types = ['order', 'promotion', 'system', 'reservation'];
        $channels = ['email', 'push', 'in_app'];
        $count = 0;

        foreach ($users as $user) {
            foreach ($types as $type) {
                foreach ($channels as $channel) {
                    DB::table('notification_preferences')->insertOrIgnore([
                        'user_id' => $user->id,
                        'type' => $type,
                        'channel' => $channel,
                        'enabled' => true,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                    $count++;
                }
            }
        }
        $this->command->info("      → notification_preferences: $count");
    }

    private function seedUserSettings(): void
    {
        $users = User::take(16)->get();
        foreach ($users as $user) {
            DB::table('user_settings')->updateOrInsert(
                ['user_id' => $user->id],
                [
                    'theme' => 'system', 'language' => 'en',
                    'notifications' => json_encode(['orders' => true, 'promotions' => true, 'system' => true]),
                    'privacy' => json_encode(['show_profile' => true, 'show_order_history' => false]),
                    'created_at' => now(), 'updated_at' => now(),
                ]
            );
        }
        $this->command->info('      → user_settings: ' . $users->count());
    }

    private function seedCartItems(): void
    {
        $customer = Customer::first();
        if (!$customer) return;

        // Add the customer's FAVORITED items to their cart
        $favorites = DB::table('customer_favorites')
            ->where('customer_id', $customer->id)
            ->take(3)
            ->get();

        foreach ($favorites as $fav) {
            DB::table('cart_items')->insertOrIgnore([
                'customer_id' => $customer->id,
                'menu_item_id' => $fav->menu_item_id,   // ← Same items they favorited
                'quantity' => rand(1, 2),
                'notes' => null,
                'customizations' => json_encode(['size' => 'regular']),
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $this->command->info('      → cart_items: ' . $favorites->count() . ' (from customer favorites)');
    }
}
