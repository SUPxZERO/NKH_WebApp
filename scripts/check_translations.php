<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$menuItem = \App\Models\MenuItem::with('translations')->first();
$category = \App\Models\Category::with('translations')->first();

echo "--- MenuItem Translations ---\n";
echo json_encode($menuItem->translations ?? [], JSON_PRETTY_PRINT) . "\n";

echo "--- Category Translations ---\n";
echo json_encode($category->translations ?? [], JSON_PRETTY_PRINT) . "\n";

echo "--- Current Locale ---\n";
echo app()->getLocale() . "\n";
