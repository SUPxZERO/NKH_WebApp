<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$controller = app(\App\Http\Controllers\HomeController::class);
$reflection = new \ReflectionClass($controller);
$methodFeat = $reflection->getMethod('getFeaturedItems');
$methodFeat->setAccessible(true);
$featured = $methodFeat->invoke($controller);

$methodCat = $reflection->getMethod('getCategoriesWithCounts');
$methodCat->setAccessible(true);
$categories = $methodCat->invoke($controller);

echo "Featured Count: " . count($featured) . "\n";
echo "Categories Count: " . count($categories) . "\n";

if (count($featured) > 0) {
    echo "First Featured:\n";
    print_r(array_keys($featured[0]));
}
if (count($categories) > 0) {
    echo "First Category:\n";
    print_r(array_keys($categories[0]));
}
