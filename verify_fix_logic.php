<?php

require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Services\InvoiceService;
use Illuminate\Support\Facades\DB;

// Use the exact ID from the created test order or find the latest one
$order = Order::latest()->first();

if (!$order) {
    die("No order found to test.\n");
}

echo "Testing with Order ID: {$order->id} (Status: {$order->approval_status})\n";
echo "Initial Payment Status: {$order->payment_status}\n";

// --- TEST 1: APPROVAL FIX ---
echo "\n--- TEST 1: Verifying Approval Logic (setStatus Fix) ---\n";
try {
    DB::beginTransaction();
    
    // Mimic Order::approve()
    echo "Attempting to approve order...\n";
    $result = $order->approve(1); // Assuming User ID 1 is admin
    
    if ($result) {
        $order->refresh();
        echo "✅ Order approved successfully.\n";
        echo "Current Check: approval_status = {$order->approval_status}\n";
        echo "Current Check: order_status_id = {$order->order_status_id}\n";
        
        if ($order->approval_status !== 'approved') {
            echo "❌ Approval Status Mismatch!\n";
        }
        if (!$order->order_status_id) {
            echo "❌ Order Status ID is NULL! (Fix failed)\n";
        }
    } else {
        echo "❌ Order approve() returned false.\n";
    }
    
    DB::commit();
} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ EXCEPTION during approval: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}

// --- TEST 2: INVOICE/PAYMENT FIX ---
echo "\n--- TEST 2: Verifying Invoice Creation (invoice_number Fix) ---\n";
try {
    DB::beginTransaction();
    
    echo "Attempting to create invoice and duplicate 'Mark Paid' logic...\n";
    
    $invoiceService = new InvoiceService();
    $invoice = $invoiceService->createOrUpdateForOrder($order);
    
    echo "Invoice created/updated. ID: {$invoice->id}\n";
    echo "Invoice Number: {$invoice->invoice_number}\n";
    
    if (empty($invoice->invoice_number)) {
        echo "❌ Invoice Number is EMPTY! (Fix failed)\n";
    } else {
        echo "✅ Invoice Number is set: {$invoice->invoice_number}\n";
    }
    
    // Mimic Payment marking
    // Usually PaymentService does this, but testing Invoice creation is the core of the previous error
    // "Field 'invoice_number' doesn't have a default value" happened during Invoice creation
    
    DB::commit();
} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ EXCEPTION during invoice creation: " . $e->getMessage() . "\n";
}
