<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use Illuminate\Database\Seeder;

class FeaturedItemsSeeder extends Seeder
{
    /**
     * Seed featured items for homepage
     */
    public function run(): void
    {
        // Get some existing menu items to mark as featured
        $items = MenuItem::where('is_active', true)->limit(10)->get();

        if ($items->count() >= 3) {
            // Mark first 3 as featured
            $items[0]->update([
                'is_featured' => true,
                'featured_order' => 1,
                'badge' => 'Best Seller',
            ]);

            $items[1]->update([
                'is_featured' => true,
                'featured_order' => 2,
                'badge' => 'Chef\'s Choice',
            ]);

            $items[2]->update([
                'is_featured' => true,
                'featured_order' => 3,
                'badge' => 'Trending',
            ]);

            $this->command->info('✅ Featured 3 menu items for homepage');
        } else {
            $this->command->warn('⚠️  Not enough menu items to feature. Please seed menu items first.');
        }
    }
}
