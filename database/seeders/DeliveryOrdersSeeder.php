<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Employee;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Location;
use App\Models\MenuItem;
use App\Models\OrderStatus;
use App\Models\OrderType;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\PaymentStatus;
use Carbon\Carbon;
use Illuminate\Support\Str;

/**
 * Production-Grade Delivery Orders Seeder
 * 
 * Creates realistic delivery/pickup order data that represents actual restaurant operations:
 * - Proper order lifecycle (pending → preparing → ready → out_for_delivery → delivered)
 * - Realistic customer behavior and order patterns
 * - Correct invoice/payment relationships
 * - Temporal consistency (timestamps follow logical sequence)
 * 
 * Designed for the Delivery Orders page (/employee/delivery-orders)
 */
class DeliveryOrdersSeeder extends Seeder
{
    private Location $location;
    private OrderType $deliveryType;
    private OrderType $pickupType;
    private array $orderStatuses = [];
    private array $paymentMethods = [];
    private PaymentStatus $paymentCompleted;
    private PaymentStatus $paymentPending;
    private array $customers = [];
    private array $drivers = [];
    private array $popularMenuItems = [];
    
    // Realistic Cambodian customer data
    private array $customerData = [
        ['name' => 'Sophea Chea', 'phone' => '+855 12 345 678', 'addresses' => [
            ['label' => 'Home', 'line1' => '123 Sisowath Quay', 'city' => 'Phnom Penh', 'province' => 'Phnom Penh'],
            ['label' => 'Office', 'line1' => '456 Monivong Blvd, Diamond Island', 'city' => 'Phnom Penh', 'province' => 'Phnom Penh'],
        ]],
        ['name' => 'Dara Sok', 'phone' => '+855 77 234 567', 'addresses' => [
            ['label' => 'Home', 'line1' => '789 Street 2004, Toul Kork', 'city' => 'Phnom Penh', 'province' => 'Phnom Penh'],
        ]],
        ['name' => 'Maly Keo', 'phone' => '+855 96 345 890', 'addresses' => [
            ['label' => 'Home', 'line1' => '321 Mao Tse Toung Blvd', 'city' => 'Phnom Penh', 'province' => 'Phnom Penh'],
            ['label' => 'Parents', 'line1' => '567 National Road 6'
            , 'city' => 'Siem Reap', 'province' => 'Siem Reap'],
        ]],
        ['name' => 'Veasna Pich', 'phone' => '+855 15 456 789', 'addresses' => [
            ['label' => 'Apartment', 'line1' => '88 Street 51, BKK1', 'city' => 'Phnom Penh', 'province' => 'Phnom Penh'],
        ]],
        ['name' => 'Bopha Ros', 'phone' => '+855 89 567 234', 'addresses' => [
            ['label' => 'Home', 'line1' => '142 Street 63, BKK3', 'city' => 'Phnom Penh', 'province' => 'Phnom Penh'],
        ]],
    ];

    public function run(): void
    {
        $this->loadReferenceData();
        $this->createCustomersWithAddresses();
        $this->seedTodayDeliveryPipeline();
        $this->seedTodayPickupPipeline();
        $this->seedHistoricalOrders();
        
        $this->printSummary();
    }

    private function loadReferenceData(): void
    {
        // Location (use primary)
        $this->location = Location::firstOrFail();
        
        // Order Types
        $this->deliveryType = OrderType::where('code', 'delivery')->firstOrFail();
        $this->pickupType = OrderType::where('code', 'pickup')->firstOrFail();
        
        // Order Statuses (keyed by code for easy access)
        foreach (OrderStatus::all() as $status) {
            $this->orderStatuses[$status->code] = $status;
        }
        
        // Payment Methods (keyed by code)
        foreach (PaymentMethod::all() as $method) {
            $this->paymentMethods[$method->code] = $method;
        }
        
        // Payment Statuses
        $this->paymentCompleted = PaymentStatus::where('code', 'completed')->firstOrFail();
        $this->paymentPending = PaymentStatus::where('code', 'pending')->firstOrFail();
        
        // Get employees to use as drivers (those with user accounts)
        $this->drivers = Employee::whereHas('user')->with('user')->get()->toArray();
        
        // Get popular menu items (reasonable prices, top items)
        $this->popularMenuItems = MenuItem::where('price', '>', 0)
            ->orderBy('price', 'desc')
            ->limit(50)
            ->get()
            ->toArray();
    }

    private function createCustomersWithAddresses(): void
    {
        foreach ($this->customerData as $data) {
            // Check if user exists
            $email = Str::slug($data['name']) . '@customer.nkh.com';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'password' => bcrypt('password'),
                    'email_verified_at' => now()->subDays(rand(30, 180)),
                ]
            );
            
            // Create customer record
            $customer = Customer::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'preferred_location_id' => $this->location->id,
                    'total_spent' => rand(50, 500),
                    'visit_count' => rand(3, 25),
                ]
            );
            
            // Create addresses
            foreach ($data['addresses'] as $addr) {
                CustomerAddress::firstOrCreate(
                    ['customer_id' => $customer->id, 'label' => $addr['label']],
                    [
                        'address_line_1' => $addr['line1'],
                        'city' => $addr['city'],
                        'province' => $addr['province'],
                        'postal_code' => '12000',
                        'is_default' => $addr['label'] === 'Home',
                    ]
                );
            }
            
            $this->customers[] = $customer->load('addresses');
        }
    }

    private function seedTodayDeliveryPipeline(): void
    {
        $now = Carbon::now();
        $dayStart = $now->copy()->startOfDay();
        
        // PENDING orders (just placed, kitchen hasn't started)
        // Business context: Orders placed in the last 5-15 minutes
        for ($i = 0; $i < 2; $i++) {
            $this->createDeliveryOrder(
                status: 'pending',
                paymentMode: Order::PAYMENT_MODE_PAY_ON_DELIVERY,
                orderedAt: $now->copy()->subMinutes(rand(5, 15)),
                driverId: null,
                invoiceStatus: 'draft'
            );
        }
        
        // PREPARING orders (kitchen is working on them)
        // Business context: Orders placed 15-40 minutes ago
        for ($i = 0; $i < 3; $i++) {
            $this->createDeliveryOrder(
                status: 'preparing',
                paymentMode: Order::PAYMENT_MODE_PAY_ON_DELIVERY,
                orderedAt: $now->copy()->subMinutes(rand(15, 40)),
                driverId: null,
                invoiceStatus: 'issued'
            );
        }
        
        // READY orders (waiting for driver pickup)
        // Business context: Kitchen finished, waiting for driver assignment
        // Some paid online, some pay on delivery
        for ($i = 0; $i < 3; $i++) {
            $this->createDeliveryOrder(
                status: 'ready',
                paymentMode: Order::PAYMENT_MODE_PAY_ON_DELIVERY,
                orderedAt: $now->copy()->subMinutes(rand(25, 50)),
                driverId: null,
                invoiceStatus: 'issued'
            );
        }
        // 2 ready orders that were paid online
        for ($i = 0; $i < 2; $i++) {
            $this->createDeliveryOrder(
                status: 'ready',
                paymentMode: Order::PAYMENT_MODE_PAY_NOW,
                orderedAt: $now->copy()->subMinutes(rand(20, 45)),
                driverId: null,
                invoiceStatus: 'paid',
                createPayment: true
            );
        }
        
        // OUT_FOR_DELIVERY orders (driver has picked up, en route)
        // Business context: Driver claimed order 10-30 minutes ago
        for ($i = 0; $i < 4; $i++) {
            $driver = $this->getRandomDriver();
            $this->createDeliveryOrder(
                status: 'out_for_delivery',
                paymentMode: Order::PAYMENT_MODE_PAY_ON_DELIVERY,
                orderedAt: $now->copy()->subMinutes(rand(35, 70)),
                driverId: $driver['user_id'],
                invoiceStatus: 'issued'
            );
        }
        
        // DELIVERED orders (completed today, payment collected)
        // Business context: Successfully delivered earlier today
        for ($i = 0; $i < 3; $i++) {
            $driver = $this->getRandomDriver();
            $orderedAt = $now->copy()->subHours(rand(1, 4));
            $this->createDeliveryOrder(
                status: 'delivered',
                paymentMode: Order::PAYMENT_MODE_PAY_ON_DELIVERY,
                orderedAt: $orderedAt,
                driverId: $driver['user_id'],
                invoiceStatus: 'paid',
                createPayment: true,
                paymentCollectedBy: $driver['user_id'],
                completedAt: $orderedAt->copy()->addMinutes(rand(30, 60))
            );
        }
    }

    private function seedTodayPickupPipeline(): void
    {
        $now = Carbon::now();
        
        // PREPARING pickup orders
        for ($i = 0; $i < 2; $i++) {
            $this->createPickupOrder(
                status: 'preparing',
                paymentMode: Order::PAYMENT_MODE_PAY_ON_PICKUP,
                orderedAt: $now->copy()->subMinutes(rand(10, 25)),
                invoiceStatus: 'issued'
            );
        }
        
        // READY pickup orders (waiting for customer)
        for ($i = 0; $i < 3; $i++) {
            $this->createPickupOrder(
                status: 'ready',
                paymentMode: Order::PAYMENT_MODE_PAY_ON_PICKUP,
                orderedAt: $now->copy()->subMinutes(rand(20, 45)),
                invoiceStatus: 'issued'
            );
        }
        
        // COMPLETED pickup orders (customer picked up and paid)
        for ($i = 0; $i < 2; $i++) {
            $orderedAt = $now->copy()->subHours(rand(1, 3));
            $this->createPickupOrder(
                status: 'completed',
                paymentMode: Order::PAYMENT_MODE_PAY_ON_PICKUP,
                orderedAt: $orderedAt,
                invoiceStatus: 'paid',
                createPayment: true,
                completedAt: $orderedAt->copy()->addMinutes(rand(20, 40))
            );
        }
    }

    private function seedHistoricalOrders(): void
    {
        // Past 7 days - completed delivery orders
        for ($day = 1; $day <= 7; $day++) {
            $ordersPerDay = rand(8, 15);
            for ($i = 0; $i < $ordersPerDay; $i++) {
                $driver = $this->getRandomDriver();
                $orderedAt = Carbon::now()->subDays($day)->setHour(rand(10, 21))->setMinute(rand(0, 59));
                
                $this->createDeliveryOrder(
                    status: rand(1, 10) <= 9 ? 'delivered' : 'cancelled', // 90% success rate
                    paymentMode: rand(1, 10) <= 7 ? Order::PAYMENT_MODE_PAY_ON_DELIVERY : Order::PAYMENT_MODE_PAY_NOW,
                    orderedAt: $orderedAt,
                    driverId: $driver['user_id'],
                    invoiceStatus: 'paid',
                    createPayment: true,
                    paymentCollectedBy: $driver['user_id'],
                    completedAt: $orderedAt->copy()->addMinutes(rand(35, 75))
                );
            }
        }
    }

    private function createDeliveryOrder(
        string $status,
        string $paymentMode,
        Carbon $orderedAt,
        ?int $driverId,
        string $invoiceStatus,
        bool $createPayment = false,
        ?int $paymentCollectedBy = null,
        ?Carbon $completedAt = null
    ): Order {
        $customer = $this->getRandomCustomer();
        $address = $customer->addresses->first();
        
        return $this->createOrder(
            orderType: $this->deliveryType,
            customer: $customer,
            address: $address,
            status: $status,
            paymentMode: $paymentMode,
            orderedAt: $orderedAt,
            driverId: $driverId,
            invoiceStatus: $invoiceStatus,
            createPayment: $createPayment,
            paymentCollectedBy: $paymentCollectedBy,
            completedAt: $completedAt,
            deliveryFee: rand(2, 5) + 0.00
        );
    }

    private function createPickupOrder(
        string $status,
        string $paymentMode,
        Carbon $orderedAt,
        string $invoiceStatus,
        bool $createPayment = false,
        ?Carbon $completedAt = null
    ): Order {
        $customer = $this->getRandomCustomer();
        
        return $this->createOrder(
            orderType: $this->pickupType,
            customer: $customer,
            address: null,
            status: $status,
            paymentMode: $paymentMode,
            orderedAt: $orderedAt,
            driverId: null,
            invoiceStatus: $invoiceStatus,
            createPayment: $createPayment,
            paymentCollectedBy: null,
            completedAt: $completedAt,
            deliveryFee: 0
        );
    }

    private function createOrder(
        OrderType $orderType,
        Customer $customer,
        ?CustomerAddress $address,
        string $status,
        string $paymentMode,
        Carbon $orderedAt,
        ?int $driverId,
        string $invoiceStatus,
        bool $createPayment,
        ?int $paymentCollectedBy,
        ?Carbon $completedAt,
        float $deliveryFee
    ): Order {
        // Generate order items first to calculate totals
        $items = $this->generateOrderItems();
        $subtotal = array_sum(array_column($items, 'total'));
        $taxAmount = round($subtotal * 0.10, 2); // 10% tax
        $totalAmount = $subtotal + $taxAmount + $deliveryFee;
        
        // Determine payment status based on invoice status
        $paymentStatus = match($invoiceStatus) {
            'paid' => Order::PAYMENT_STATUS_PAID,
            'partial' => Order::PAYMENT_STATUS_PARTIAL,
            default => Order::PAYMENT_STATUS_UNPAID,
        };
        
        // Create order
        $order = Order::create([
            'location_id' => $this->location->id,
            'customer_id' => $customer->id,
            'customer_address_id' => $address?->id,
            'order_type_id' => $orderType->id,
            'order_status_id' => $this->orderStatuses[$status]->id,
            'order_number' => $this->generateOrderNumber($orderType->code),
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'delivery_fee' => $deliveryFee,
            'total_amount' => $totalAmount,
            'payment_mode' => $paymentMode,
            'payment_status' => $paymentStatus,
            'driver_id' => $driverId,
            'ordered_at' => $orderedAt,
            'completed_at' => $completedAt,
            'payment_collected_by' => $paymentCollectedBy,
            'payment_collected_at' => $paymentCollectedBy ? $completedAt : null,
            'special_instructions' => rand(1, 10) <= 3 ? $this->getRandomInstruction() : null,
        ]);
        
        // Create order items
        foreach ($items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'menu_item_id' => $item['menu_item_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['total'],
                'status' => $status === 'pending' ? 'pending' : 'served',
            ]);
        }
        
        // Create invoice
        $invoice = Invoice::create([
            'order_id' => $order->id,
            'location_id' => $this->location->id,
            'invoice_number' => 'INV-' . str_pad($order->id, 8, '0', STR_PAD_LEFT),
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
            'amount_paid' => $invoiceStatus === 'paid' ? $totalAmount : 0,
            'amount_due' => $invoiceStatus === 'paid' ? 0 : $totalAmount,
            'status' => $invoiceStatus,
            'issued_at' => $orderedAt,
            'paid_at' => $invoiceStatus === 'paid' ? ($completedAt ?? $orderedAt->copy()->addMinutes(rand(20, 45))) : null,
        ]);
        
        // Create payment if needed
        if ($createPayment && $invoiceStatus === 'paid') {
            $paymentMethod = $paymentMode === Order::PAYMENT_MODE_PAY_NOW 
                ? ($this->paymentMethods['qr'] ?? $this->paymentMethods['card'])
                : ($this->paymentMethods['cash'] ?? array_values($this->paymentMethods)[0]);
            
            Payment::create([
                'uuid' => Str::uuid(),
                'invoice_id' => $invoice->id,
                'payment_method_id' => $paymentMethod->id,
                'amount' => $totalAmount,
                'transaction_id' => 'TXN-' . strtoupper(Str::random(12)),
                'reference_number' => 'REF-' . strtoupper(Str::random(8)),
                'payment_status_id' => $this->paymentCompleted->id,
                'confirmed_by' => $paymentCollectedBy,
                'confirmed_at' => $completedAt ?? $orderedAt->copy()->addMinutes(rand(25, 50)),
                'processed_at' => $completedAt ?? $orderedAt->copy()->addMinutes(rand(25, 50)),
            ]);
        }
        
        return $order;
    }

    private function generateOrderItems(): array
    {
        $itemCount = rand(2, 4);
        $items = [];
        $usedIds = [];
        
        for ($i = 0; $i < $itemCount; $i++) {
            // Get random menu item (avoid duplicates)
            do {
                $menuItem = $this->popularMenuItems[array_rand($this->popularMenuItems)];
            } while (in_array($menuItem['id'], $usedIds));
            
            $usedIds[] = $menuItem['id'];
            $quantity = rand(1, 3);
            
            $items[] = [
                'menu_item_id' => $menuItem['id'],
                'unit_price' => $menuItem['price'],
                'quantity' => $quantity,
                'total' => $menuItem['price'] * $quantity,
            ];
        }
        
        return $items;
    }

    private static int $orderCounter = 0;
    
    private function generateOrderNumber(string $prefix): string
    {
        self::$orderCounter++;
        $prefix = strtoupper(substr($prefix, 0, 3));
        $date = Carbon::now()->format('ymd');
        $unique = str_pad(self::$orderCounter, 4, '0', STR_PAD_LEFT) . substr(md5(microtime()), 0, 4);
        return "{$prefix}-{$date}-{$unique}";
    }

    private function getRandomCustomer(): Customer
    {
        return $this->customers[array_rand($this->customers)];
    }

    private function getRandomDriver(): array
    {
        return $this->drivers[array_rand($this->drivers)];
    }

    private function getRandomInstruction(): string
    {
        $instructions = [
            'Please ring the doorbell twice',
            'Leave at the door, do not knock',
            'Call when you arrive',
            'Extra napkins please',
            'Allergic to peanuts - please double check',
            'Gate code: 1234',
            'Building entrance on the side',
            'No spicy food please',
        ];
        return $instructions[array_rand($instructions)];
    }

    private function printSummary(): void
    {
        $this->command->info('');
        $this->command->info('╔════════════════════════════════════════════════════════════╗');
        $this->command->info('║     PRODUCTION-GRADE DELIVERY ORDERS SEEDED SUCCESSFULLY   ║');
        $this->command->info('╠════════════════════════════════════════════════════════════╣');
        
        $deliveryCount = Order::whereHas('orderType', fn($q) => $q->where('code', 'delivery'))->count();
        $pickupCount = Order::whereHas('orderType', fn($q) => $q->where('code', 'pickup'))->count();
        $pendingCollection = Order::whereIn('payment_mode', [Order::PAYMENT_MODE_PAY_ON_DELIVERY, Order::PAYMENT_MODE_PAY_ON_PICKUP])
            ->where('payment_status', Order::PAYMENT_STATUS_UNPAID)
            ->count();
        
        $this->command->info("║  Delivery Orders:        {$deliveryCount}                              ");
        $this->command->info("║  Pickup Orders:          {$pickupCount}                              ");
        $this->command->info("║  Pending Payment Collection: {$pendingCollection}                    ");
        $this->command->info('╠════════════════════════════════════════════════════════════╣');
        $this->command->info('║  Login: demo@employee.com / password                       ║');
        $this->command->info('║  Page:  /employee/delivery-orders                          ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
    }
}
