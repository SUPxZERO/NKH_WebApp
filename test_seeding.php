<?php

require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "🧪 Testing Database Connection and Seeding...\n\n";

try {
    // Test database connection
    $pdo = new PDO('mysql:host=127.0.0.1;dbname=nkh_restaurant', 'root', 'root');
    echo "✅ Database connection successful\n";
    
    // Test Location model
    $locationCount = \App\Models\Location::count();
    echo "📍 Current locations: {$locationCount}\n";
    
    // Try to create a test location
    $location = \App\Models\Location::create([
        'code' => 'TEST-01',
        'name' => 'Test Location',
        'address' => '123 Test Street',
        'city' => 'Test City',
        'state' => 'Test State',
        'postal_code' => '12345',
        'country' => 'Test Country',
        'phone' => '+1-234-567-8900',
        'email' => 'test@test.com',
        'manager_name' => 'Test Manager',
        'operating_hours' => json_encode(['monday' => ['open' => '09:00', 'close' => '17:00']]),
        'is_active' => true,
    ]);
    
    echo "✅ Test location created with ID: {$location->id}\n";
    
    // Clean up test data
    $location->delete();
    echo "🧹 Test location cleaned up\n";
    
    echo "\n🎯 Database is working correctly!\n";
    echo "Now running individual seeders...\n\n";
    
    // Run LocationSeeder
    echo "📍 Running LocationSeeder...\n";
    (new \Database\Seeders\LocationSeeder())->run();
    echo "✅ LocationSeeder completed\n";
    
    // Check results
    $locationCount = \App\Models\Location::count();
    echo "📊 Total locations after seeding: {$locationCount}\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

?>
