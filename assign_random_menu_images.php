<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Models\MenuItem;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔁 Assigning random images to menu items...\n";

$imagesDir = __DIR__ . '/public/images/menu-items';
if (!is_dir($imagesDir)) {
    echo "❌ Images directory not found: {$imagesDir}\n";
    exit(1);
}

$files = array_values(array_filter(scandir($imagesDir), function ($f) use ($imagesDir) {
    $path = $imagesDir . DIRECTORY_SEPARATOR . $f;
    if (!is_file($path)) return false;
    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
    return in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']);
}));

if (empty($files)) {
    echo "❌ No image files found in public/images/menu-items\n";
    exit(1);
}

$items = MenuItem::whereNull('image_path')->orWhere('image_path', '')->get();
$total = $items->count();
if ($total === 0) {
    echo "✅ No menu items without image_path found. Nothing to do.\n";
    exit(0);
}

echo "Found {$total} menu items without image_path. Assigning images...\n";

$updated = 0;
foreach ($items as $item) {
    $file = $files[array_rand($files)];
    $relPath = '/images/menu-items/' . $file; // matches repo usage (leading slash)
    $item->image_path = $relPath;
    try {
        $item->save();
        $updated++;
        echo "- #{$item->id} => {$relPath}\n";
    } catch (Exception $e) {
        echo "! Failed to update item #{$item->id}: " . $e->getMessage() . "\n";
    }
}

echo "\n🎉 Done. Updated {$updated} / {$total} menu items.\n";

// Show a quick count of items with images now
$withImages = MenuItem::whereNotNull('image_path')->where('image_path', '!=', '')->count();
echo "Menu items with image_path now: {$withImages}\n";

return 0;
