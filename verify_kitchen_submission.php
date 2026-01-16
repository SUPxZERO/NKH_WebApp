<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\MenuItem;
use App\Models\Location;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\DB;

// Setup Data
$location = Location::first();
$menuItem = MenuItem::first();

// Create Order in 'received' status
$order = Order::create([
    'location_id' => $location->id,
    'order_number' => 'TEST-KITCH-' . time(),
    'order_type' => 'dine-in', // Kitchen usually for dine-in/pickup
    'approval_status' => 'approved',
    // We manually set the relationship ID because we know 'received' exists now (ID 2 usually)
    // But safely we should look it up or rely on setStatus if we call it.
    'payment_status' => 'unpaid',
    'total_amount' => 50.00,
    'currency' => 'USD',
    'ordered_at' => now(),
]);
$order->setStatus('received'); 
$order->save();

// Add Item
OrderItem::create([
    'order_id' => $order->id,
    'menu_item_id' => $menuItem->id,
    'quantity' => 1,
    'unit_price' => 10.00,
    'total_price' => 10.00,
    'status' => 'pending' // Initial item status
]);

echo "Created Order {$order->order_number} (ID: {$order->id}) with Status: {$order->orderStatus->code}\n";

try {
    // Resolve Controller
    $controller = app(OrderController::class);
    
    echo "Submitting to kitchen...\n";
    $controller->submitToKitchen($order);
    
    // Refresh
    $order->refresh();
    
    echo "New Order Status: " . ($order->orderStatus->code ?? 'NULL') . "\n";
    echo "Kitchen Submitted At: " . ($order->kitchen_submitted_at ?? 'NULL') . "\n";
    
    $itemStatus = $order->items->first()->status;
    echo "Item Status: {$itemStatus}\n";
    
    if ($order->orderStatus->code === 'preparing' && $itemStatus === 'preparing' && $order->kitchen_submitted_at) {
        echo "✅ Kitchen Submission Verified!\n";
    } else {
        echo "❌ Verification Failed!\n";
    }

} catch (\Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
