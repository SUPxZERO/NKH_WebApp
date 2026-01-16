<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

echo "Columns in 'orders' table:\n";
print_r(Schema::getColumnListing('orders'));

echo "\nColumns in 'invoices' table:\n";
print_r(Schema::getColumnListing('invoices'));
