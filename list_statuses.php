<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$statuses = \App\Models\OrderStatus::all(['id', 'name', 'code']);
echo $statuses->toJson(JSON_PRETTY_PRINT);
