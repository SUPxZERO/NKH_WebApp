<?php
require_once __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\MenuItem;

$items = MenuItem::whereNotNull('image_path')->take(5)->get();

echo "=== CHECKING MENU ITEM IMAGE PATHS ===" . PHP_EOL;
foreach($items as $item) {
    echo "ID: {$item->id} | Name: {$item->name} | DB Image Path: {$item->image_path}" . PHP_EOL;
}
