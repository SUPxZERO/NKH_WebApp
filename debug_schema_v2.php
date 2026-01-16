<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

echo "Checking 'orders' table for 'status' column:\n";
if (Schema::hasColumn('orders', 'status')) {
    echo "✅ 'status' column EXISTS.\n";
} else {
    echo "❌ 'status' column MISSING.\n";
}

echo "\nChecking 'invoices' table columns:\n";
print_r(Schema::getColumnListing('invoices'));
