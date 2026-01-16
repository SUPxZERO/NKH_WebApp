<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\Customer;
use App\Models\Location;
use App\Models\MenuItem;
use App\Models\OrderItem;
use Illuminate\Support\Str;

// Create or find a test customer
$customer = Customer::first() ?? Customer::factory()->create();
$location = Location::first();
$menuItem = MenuItem::first();

if (!$location || !$menuItem) {
    die("Error: No location or menu item found. Check DB seeding.\n");
}

try {
    // Create a DELIVERY order that requires approval
    $orderNum = 'TEST-DEL-' . Str::random(5);
    $order = Order::create([
        'customer_id' => $customer->id,
        'location_id' => $location->id,
        'order_number' => $orderNum,
        'order_type' => 'delivery',
        'approval_status' => 'pending', // Key for test
        'payment_status' => 'unpaid',
        'total_amount' => 50.00,
        'currency' => 'USD',
        'ordered_at' => now(),
        'delivery_address' => '123 Test St, Test City',
    ]);
    
    $order->setStatus('pending');
    $order->save();

    // Add items
    OrderItem::create([
        'order_id' => $order->id,
        'menu_item_id' => $menuItem->id,
        'quantity' => 2,
        'unit_price' => 25.00,
        'total_price' => 50.00,
        'status' => 'pending'
    ]);

    echo "Created Test Order: {$orderNum} (ID: {$order->id})\n";
    echo "Type: Delivery | Approval: Pending\n";

} catch (\Exception $e) {
    echo "Error creating order: " . $e->getMessage() . "\n";
    if (method_exists($e, 'getPrevious') && $e->getPrevious()) {
        echo "Caused by: " . $e->getPrevious()->getMessage() . "\n";
    }
}
