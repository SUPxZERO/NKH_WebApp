<?php

use App\Models\Order;
use App\Models\Payment;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

Model::unguard();

try {
    echo "1. Getting User...\n";
    $user = User::first();
    if (!$user) {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password')
        ]);
    }
    echo "User ID: {$user->id}\n";

    echo "2. Getting Customer...\n";
    $customer = Customer::firstOrCreate(['user_id' => $user->id], ['name' => 'Test Customer']);
    echo "Customer ID: {$customer->id}\n";

    echo "3. Getting Location...\n";
    $locationId = DB::table('locations')->value('id');
    if (!$locationId) {
        $locationId = DB::table('locations')->insertGetId([
            'name' => 'Main Branch',
            'slug' => 'main-branch',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
    echo "Location ID: $locationId\n";

    echo "4. Payment Method...\n";
    $pmId = DB::table('payment_methods')->value('id');
    if (!$pmId) {
        $pmId = DB::table('payment_methods')->insertGetId([
            'name' => 'Cash',
            'slug' => 'cash',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
    echo "Payment Method ID: $pmId\n";

    echo "5. Payment Status...\n";
    $psId = DB::table('payment_statuses')->where('code', 'completed')->value('id');
    if (!$psId) {
        $psId = DB::table('payment_statuses')->insertGetId([
            'code' => 'completed',
            'name' => 'Completed',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }
    echo "Payment Status ID: $psId\n";

    echo "6. Order Status...\n";
    $osId = DB::table('order_statuses')->where('code', 'completed')->value('id');
    if (!$osId) {
        $osId = DB::table('order_statuses')->insertGetId([
            'code' => 'completed',
            'name' => 'Completed',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    echo "7. Creating Order...\n";
    $order = Order::create([
        'order_number' => 'ORD-' . strtoupper(uniqid()),
        'customer_id' => $customer->id,
        'location_id' => $locationId,
        'total_amount' => 125.50,
        'status' => 'completed',
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);
    echo "Created Order #{$order->order_number}\n";

    echo "8. Creating Invoice...\n";
    $invoice = Invoice::create([
        'order_id' => $order->id,
        'location_id' => $locationId,
        'invoice_number' => 'INV-' . strtoupper(uniqid()),
        'total_amount' => 125.50,
        'amount_paid' => 125.50,
        'amount_due' => 0,
        'subtotal' => 125.50,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'service_charge' => 0,
        'status' => 'paid',
        'issued_at' => Carbon::now(),
        'due_at' => Carbon::now(),
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);
    echo "Created Invoice #{$invoice->invoice_number}\n";

    echo "9. Creating Payment...\n";
    $payment = Payment::create([
        'invoice_id' => $invoice->id,
        'transaction_id' => 'TXN-' . strtoupper(uniqid()),
        'reference_number' => 'REF-' . strtoupper(uniqid()), // Added reference_number
        'amount' => 125.50,
        'payment_status_id' => $psId,
        'uuid' => (string) Str::uuid(),
        'payment_method_id' => $pmId,
        'initiated_at' => Carbon::now(),
        'processed_at' => Carbon::now(),
        'created_at' => Carbon::now(),
        'updated_at' => Carbon::now(),
    ]);

    echo "SUCCESS! Created Payment ID: {$payment->id}\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
