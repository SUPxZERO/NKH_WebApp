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

class DriverOrderTestSeeder extends Seeder
{
    public function run()
    {
        // 1. Ensure Defaults Exist
        $location = Location::first() ?? Location::factory()->create();
        
        // Order Types
        $deliveryType = OrderType::where('code', 'delivery')->firstOrFail();
        $pickupType = OrderType::firstOrCreate(['code' => 'pickup'], ['name' => 'Pickup', 'is_active' => true]);
        
        // Order Statuses (create if missing)
        $statusPreparing = OrderStatus::firstOrCreate(['code' => 'preparing'], ['name' => 'Preparing', 'color' => 'yellow']);
        $statusReady = OrderStatus::firstOrCreate(['code' => 'ready'], ['name' => 'Ready', 'color' => 'blue']);
        $statusOut = OrderStatus::firstOrCreate(['code' => 'out_for_delivery'], ['name' => 'Out for Delivery', 'color' => 'orange']);
        $statusDelivered = OrderStatus::firstOrCreate(['code' => 'delivered'], ['name' => 'Delivered', 'color' => 'green']);
        
        // Customer with User
        $customer = Customer::whereHas('user')->first();
        if (!$customer) {
            $customerUser = User::create([
                'name' => 'Test Customer',
                'email' => 'testcustomer@nkh.com',
                'password' => bcrypt('password'),
            ]);
            $customer = Customer::create(['user_id' => $customerUser->id]);
        }
        
        // Ensure customer has address with full details
        $address = CustomerAddress::where('customer_id', $customer->id)->first();
        if (!$address) {
            $address = CustomerAddress::create([
                'customer_id' => $customer->id,
                'label' => 'Home',
                'address_line_1' => '123 Main Street, Apt 4B',
                'city' => 'Bangkok',
                'province' => 'Bangkok',
                'postal_code' => '10110',
                'is_default' => true
            ]);
        }
        
        $menuItem = MenuItem::first() ?? MenuItem::factory()->create();

        // 2. Get the Demo Employee user (commonly used for testing)
        $driverEmail = 'demo@employee.com';
        $driver = User::where('email', $driverEmail)->first();
        
        // Fallback: create driver user if demo employee doesn't exist
        if (!$driver) {
            $driver = User::create([
                'name' => 'Test Driver',
                'email' => 'driver@nkh.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]);
            $driverEmail = 'driver@nkh.com';
        }
        
        // Ensure Employee record exists for driver
        if (!$driver->employee) {
            Employee::create([
                'user_id' => $driver->id,
                'location_id' => $location->id,
                'employee_code' => 'DRV001',
                'hire_date' => now(),
            ]);
        }

        // ==============================================================
        // DRIVER MODE DATA
        // ==============================================================
        
        // 3. AVAILABLE Orders (Unassigned, Status: Ready, Delivery Type)
        for ($i = 0; $i < 3; $i++) {
            $this->createOrder([
                'location_id' => $location->id,
                'customer_id' => $customer->id,
                'customer_address_id' => $address->id,
                'order_type_id' => $deliveryType->id,
                'order_status_id' => $statusReady->id,
                'order_number' => 'DEL-AVAIL-' . rand(1000, 9999),
                'total_amount' => rand(30, 80) + 0.99,
                'driver_id' => null, // UNASSIGNED - Available for claim
                'payment_mode' => Order::PAYMENT_MODE_PAY_ON_DELIVERY,
            ], $menuItem);
        }
        
        // 4. MY ACTIVE Orders - Ready (Assigned to driver, waiting to start delivery)
        $this->createOrder([
            'location_id' => $location->id,
            'customer_id' => $customer->id,
            'customer_address_id' => $address->id,
            'order_type_id' => $deliveryType->id,
            'order_status_id' => $statusReady->id,
            'order_number' => 'DEL-MY-READY-' . rand(1000, 9999),
            'total_amount' => 45.50,
            'driver_id' => $driver->id, // ASSIGNED TO ME
            'payment_mode' => Order::PAYMENT_MODE_PAY_ON_DELIVERY,
        ], $menuItem);
        
        // 5. MY ACTIVE Orders - Out for Delivery (Assigned, in transit)
        for ($i = 0; $i < 2; $i++) {
            $this->createOrder([
                'location_id' => $location->id,
                'customer_id' => $customer->id,
                'customer_address_id' => $address->id,
                'order_type_id' => $deliveryType->id,
                'order_status_id' => $statusOut->id,
                'order_number' => 'DEL-MY-OUT-' . rand(1000, 9999),
                'total_amount' => rand(50, 100) + 0.99,
                'driver_id' => $driver->id, // ASSIGNED TO ME
                'payment_mode' => Order::PAYMENT_MODE_PAY_ON_DELIVERY,
            ], $menuItem);
        }
        
        // ==============================================================
        // PAYMENT COLLECTION DATA (for "Payments" tab)
        // ==============================================================
        
        // 6. Pending Collection - Pay on Delivery orders (Preparing)
        $this->createOrder([
            'location_id' => $location->id,
            'customer_id' => $customer->id,
            'customer_address_id' => $address->id,
            'order_type_id' => $deliveryType->id,
            'order_status_id' => $statusPreparing->id,
            'order_number' => 'PAY-DEL-PREP-' . rand(1000, 9999),
            'total_amount' => 55.00,
            'driver_id' => null,
            'payment_mode' => Order::PAYMENT_MODE_PAY_ON_DELIVERY,
        ], $menuItem, true); // Create draft invoice
        
        // 7. Pending Collection - Pay on Delivery orders (Ready)
        $this->createOrder([
            'location_id' => $location->id,
            'customer_id' => $customer->id,
            'customer_address_id' => $address->id,
            'order_type_id' => $deliveryType->id,
            'order_status_id' => $statusReady->id,
            'order_number' => 'PAY-DEL-READY-' . rand(1000, 9999),
            'total_amount' => 72.50,
            'driver_id' => null,
            'payment_mode' => Order::PAYMENT_MODE_PAY_ON_DELIVERY,
        ], $menuItem, true);
        
        // 8. Pending Collection - Pay on Delivery orders (Out for Delivery)
        $this->createOrder([
            'location_id' => $location->id,
            'customer_id' => $customer->id,
            'customer_address_id' => $address->id,
            'order_type_id' => $deliveryType->id,
            'order_status_id' => $statusOut->id,
            'order_number' => 'PAY-DEL-OUT-' . rand(1000, 9999),
            'total_amount' => 88.99,
            'driver_id' => $driver->id,
            'payment_mode' => Order::PAYMENT_MODE_PAY_ON_DELIVERY,
        ], $menuItem, true);
        
        // 9. Pending Collection - Pay on Pickup orders
        for ($i = 0; $i < 2; $i++) {
            $this->createOrder([
                'location_id' => $location->id,
                'customer_id' => $customer->id,
                'customer_address_id' => null,
                'order_type_id' => $pickupType->id,
                'order_status_id' => $statusReady->id,
                'order_number' => 'PAY-PICKUP-' . rand(1000, 9999),
                'total_amount' => rand(20, 60) + 0.99,
                'driver_id' => null,
                'payment_mode' => Order::PAYMENT_MODE_PAY_ON_PICKUP,
            ], $menuItem, true);
        }

        $this->command->info("===========================================");
        $this->command->info("Seeded comprehensive delivery test data!");
        $this->command->info("===========================================");
        $this->command->info("Driver: driver@nkh.com (password: password)");
        $this->command->info("");
        $this->command->info("DRIVER MODE:");
        $this->command->info("  - 3 Available orders (ready, unassigned)");
        $this->command->info("  - 1 My order (ready, assigned)");
        $this->command->info("  - 2 My orders (out_for_delivery, assigned)");
        $this->command->info("");
        $this->command->info("PAYMENTS MODE:");
        $this->command->info("  - 3 Pay on Delivery orders (various statuses)");
        $this->command->info("  - 2 Pay on Pickup orders");
        $this->command->info("===========================================");
    }
    
    private function createOrder(array $data, MenuItem $menuItem, bool $createInvoice = false): Order
    {
        $data = array_merge([
            'subtotal' => ($data['total_amount'] ?? 50) * 0.9,
            'tax_amount' => ($data['total_amount'] ?? 50) * 0.1,
            'ordered_at' => now()->subMinutes(rand(10, 120)),
            'payment_status' => Order::PAYMENT_STATUS_UNPAID,
        ], $data);
        
        $order = Order::create($data);
        
        // Add order items
        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $menuItem->id,
            'quantity' => rand(1, 3),
            'unit_price' => $menuItem->price,
            'total_price' => $menuItem->price * rand(1, 3),
        ]);
        
        // Create invoice if requested (for pending collection)
        if ($createInvoice) {
            Invoice::create([
                'order_id' => $order->id,
                'location_id' => $order->location_id,
                'invoice_number' => 'INV-' . str_pad($order->id, 6, '0', STR_PAD_LEFT),
                'subtotal' => $order->subtotal,
                'tax_amount' => $order->tax_amount,
                'total_amount' => $order->total_amount,
                'amount_paid' => 0,
                'amount_due' => $order->total_amount,
                'status' => 'issued',
                'issued_at' => now(),
            ]);
        }
        
        return $order;
    }
}
