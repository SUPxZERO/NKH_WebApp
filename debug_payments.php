<?php

use App\Models\Payment;
use App\Models\PaymentStatus;
use App\Models\Order;
use Carbon\Carbon;

echo "--- DEBUG START ---\n";

// 1. Check Payment Statuses
echo "Checking Payment Statuses:\n";
$statuses = PaymentStatus::all();
foreach ($statuses as $s) {
    echo " - Code: {$s->code}, ID: {$s->id}, IsSuccessful: " . ($s->is_successful ? 'YES' : 'NO') . "\n";
}

// 2. Check Payment Counts
$count = Payment::count();
echo "\nTotal Payments in DB: {$count}\n";

if ($count > 0) {
    $p = Payment::first();
    echo "Sample Payment: ID {$p->id}, Amount: {$p->amount}, StatusID: {$p->payment_status_id}, Created: {$p->created_at}\n";
    
    // Check relation
    if ($p->paymentStatus) {
        echo " - Linked Status: {$p->paymentStatus->code} (Successful: " . ($p->paymentStatus->is_successful ? 'YES' : 'NO') . ")\n";
    } else {
        echo " - Linked Status: NULL\n";
    }
} else {
    echo "No payments found.\n";
}

// 3. Check Orders
$orderCount = Order::count();
echo "\nTotal Orders: {$orderCount}\n";
$completedOrders = Order::whereHas('orderStatus', fn($q) => $q->where('code', 'completed'))->count();
echo "Completed Orders: {$completedOrders}\n";

// 4. Test Dashboard Query Logic
echo "\nTesting Dashboard Query for Today (" . Carbon::today()->toDateString() . "):\n";
$today = Carbon::today();
$revenue = Payment::whereDate('created_at', $today)
    ->whereHas('paymentStatus', fn($q) => $q->where('is_successful', true))
    ->sum('amount');
echo "Calculated Today Revenue: {$revenue}\n";

echo "--- DEBUG END ---\n";
