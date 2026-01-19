<?php
require __DIR__ . '/vendor/autoload.php';

$classes = [
    'Database\Seeders\Prod\FloorSeeder',
    'Database\Seeders\Prod\TableSeeder',
    'Database\Seeders\Prod\LocationSeeder'
];

foreach ($classes as $class) {
    try {
        if (class_exists($class)) {
            echo "✅ Class exists: $class\n";
            $r = new ReflectionClass($class);
            echo "   File: " . $r->getFileName() . "\n";
        } else {
            echo "❌ Class NOT found: $class\n";
        }
    } catch (Throwable $e) {
        echo "💥 Exception checking $class: " . $e->getMessage() . "\n";
    }
}
