try {
$p = App\Models\Payment::where('status', 'pending')
->whereHas('invoice.order') // Ensure it has an order
->latest()
->first();

if ($p) {
echo "Found Pending Payment ID: " . $p->id . "\n";
echo "Order ID: " . $p->invoice->order->id . "\n";
echo "Current Payment Status: " . $p->status . "\n";
echo "Current Order Status: " . $p->invoice->order->payment_status . "\n";

$service = app(App\Services\PaymentService::class);

// Simulate payload similar to what PaymentController would send
$payload = [
'transaction_id' => $p->transaction_id,
'reference_number' => $p->reference_number ?? $p->transaction_id,
'status' => 'success',
'gateway_reference' => 'MANUAL-TEST-' . time()
];

echo "Simulating Webhook...\n";
$res = $service->processWebhook($payload);

$p->refresh();
$order = $p->invoice->order->fresh();

echo "New Payment Status: " . $p->status . "\n";
echo "New Order Status: " . $order->payment_status . "\n";

if ($p->isCompleted() && $order->payment_status === 'paid') {
echo "SUCCESS: Payment and Order updated correctly.\n";
} else {
echo "FAILURE: Statuses did not update as expected.\n";
}

} else {
echo "No pending payment found to test.\n";
}
} catch (\Exception $e) {
echo "Error: " . $e->getMessage() . "\n";
echo $e->getTraceAsString();
}