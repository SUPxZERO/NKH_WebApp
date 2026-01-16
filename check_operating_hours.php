<?php
require 'vendor/autoload.php';

$capsule = new Illuminate\Database\Capsule\Manager;
$capsule->addConnection(include 'config/database.php')['connections']['mysql'];
$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "=== All Locations ===" . PHP_EOL;
$locations = $capsule->getConnection()->select('SELECT id, name, address FROM locations');
print_r($locations);

echo PHP_EOL . "=== Operating Hours for Location 5 (delivery) ===" . PHP_EOL;
$today = date('w');
echo "Today is day: $today (0=Sun, 1=Mon, ..., 5=Fri, 6=Sat)" . PHP_EOL . PHP_EOL;

$hours = $capsule->getConnection()->select(
    'SELECT day_of_week, opening_time, closing_time FROM operating_hours WHERE location_id = 5 AND service_type = ? ORDER BY day_of_week',
    ['delivery']
);

if (empty($hours)) {
    echo "❌ NO OPERATING HOURS FOUND for location 5, delivery!" . PHP_EOL;
    echo PHP_EOL;
    echo "Available records for ALL locations:" . PHP_EOL;
    $all = $capsule->getConnection()->select('SELECT location_id, service_type, day_of_week FROM operating_hours ORDER BY location_id, service_type');
    print_r($all);
} else {
    echo "✓ Found operating hours:" . PHP_EOL;
    print_r($hours);
}
