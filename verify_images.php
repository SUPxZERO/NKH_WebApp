<?php

use App\Models\Category;
use App\Models\MenuItem;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Verifying Categories...\n";
$categories = Category::whereNotNull('image')->get();
foreach ($categories as $category) {
    echo "Category: {$category->translations->first()->name} (Slug: {$category->slug}) - Image: {$category->image}\n";
}

echo "\nVerifying Menu Items (Sample)...\n";
$menuItems = MenuItem::whereNotNull('image_path')->take(10)->get();
foreach ($menuItems as $item) {
    echo "Item: {$item->translations->first()->name} (Slug: {$item->slug}) - Image: {$item->image_path}\n";
}

echo "\nTotal Categories with Images: " . Category::whereNotNull('image')->count() . "\n";
echo "Total Menu Items with Images: " . MenuItem::whereNotNull('image_path')->count() . "\n";
