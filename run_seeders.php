<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Database\Seeders\LocationSeeder;
use Database\Seeders\PositionSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\CategoryTranslationSeeder;
use Database\Seeders\MenuItemSeeder;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🚀 Starting NKH Restaurant Database Seeding...\n";

try {
    // Run seeders in order
    echo "📍 Seeding Locations...\n";
    (new LocationSeeder())->run();
    echo "✅ Locations seeded successfully!\n";

    echo "👔 Seeding Positions...\n";
    (new PositionSeeder())->run();
    echo "✅ Positions seeded successfully!\n";

    echo "👥 Seeding Users...\n";
    (new UserSeeder())->run();
    echo "✅ Users seeded successfully!\n";

    echo "📂 Seeding Categories...\n";
    (new CategorySeeder())->run();
    echo "✅ Categories seeded successfully!\n";

    echo "🌐 Seeding Category Translations...\n";
    (new CategoryTranslationSeeder())->run();
    echo "✅ Category Translations seeded successfully!\n";

    echo "🍽️ Seeding Menu Items...\n";
    (new MenuItemSeeder())->run();
    echo "✅ Menu Items seeded successfully!\n";

    echo "\n🎉 Database seeding completed successfully!\n";
    echo "📊 Your NKH Restaurant Management System is now populated with realistic data.\n";
    
    // Show counts
    echo "\n📈 Data Summary:\n";
    echo "- Locations: " . \App\Models\Location::count() . "\n";
    echo "- Users: " . \App\Models\User::count() . "\n";
    echo "- Positions: " . \App\Models\Position::count() . "\n";
    echo "- Categories: " . \App\Models\Category::count() . "\n";
    echo "- Menu Items: " . \App\Models\MenuItem::count() . "\n";
    
} catch (Exception $e) {
    echo "❌ Error during seeding: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
