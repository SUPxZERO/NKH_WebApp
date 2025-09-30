<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Database\Seeders\LocationSeeder;
use Database\Seeders\PositionSeeder;
use Database\Seeders\UserSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\CategoryTranslationSeeder;
use Database\Seeders\MenuItemSeeder;

class SeedDatabase extends Command
{
    protected $signature = 'nkh:seed';
    protected $description = 'Seed the NKH Restaurant database with comprehensive data';

    public function handle()
    {
        $this->info('🚀 Starting NKH Restaurant Database Seeding...');

        try {
            $this->info('📍 Seeding Locations...');
            (new LocationSeeder())->run();
            $this->info('✅ Locations seeded successfully!');

            $this->info('👔 Seeding Positions...');
            (new PositionSeeder())->run();
            $this->info('✅ Positions seeded successfully!');

            $this->info('👥 Seeding Users...');
            (new UserSeeder())->run();
            $this->info('✅ Users seeded successfully!');

            $this->info('📂 Seeding Categories...');
            (new CategorySeeder())->run();
            $this->info('✅ Categories seeded successfully!');

            $this->info('🌐 Seeding Category Translations...');
            (new CategoryTranslationSeeder())->run();
            $this->info('✅ Category Translations seeded successfully!');

            $this->info('🍽️ Seeding Menu Items...');
            (new MenuItemSeeder())->run();
            $this->info('✅ Menu Items seeded successfully!');

            $this->info('');
            $this->info('🎉 Database seeding completed successfully!');
            $this->info('📊 Your NKH Restaurant Management System is now populated with realistic data.');
            
            // Show counts
            $this->info('');
            $this->info('📈 Data Summary:');
            $this->info('- Locations: ' . \App\Models\Location::count());
            $this->info('- Users: ' . \App\Models\User::count());
            $this->info('- Positions: ' . \App\Models\Position::count());
            $this->info('- Categories: ' . \App\Models\Category::count());
            $this->info('- Menu Items: ' . \App\Models\MenuItem::count());
            
        } catch (\Exception $e) {
            $this->error('❌ Error during seeding: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
