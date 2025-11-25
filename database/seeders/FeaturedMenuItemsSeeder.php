<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Category;
use Illuminate\Database\Seeder;

class FeaturedMenuItemsSeeder extends Seeder
{
    /**
     * Seed featured menu items for homepage display
     */
    public function run(): void
    {
        // Get first location ID (adjust as needed)
        $locationId = 1;

        // Get categories (we'll assign featured items to them)
        $burgerCategory = Category::where('slug', 'like', '%burger%')->first();
        $pastaCategory = Category::where('slug', 'like', '%pasta%')->first();
        $dessertCategory = Category::where('slug', 'like', '%dessert%')->first();

        $featuredItems = [
            [
                'location_id' => $locationId,
                'category_id' => $burgerCategory?->id ?? null,
                'sku' => 'FEAT-001',
                'slug' => 'signature-gourmet-burger',
                'description' => 'Premium beef patty, aged cheddar, crispy bacon, special sauce, fresh lettuce, tomato on a brioche bun',
                'price' => 14.99,
                'cost' => 6.50,
                'image_path' => 'images/menu-items/burger-featured.jpg',
                'is_popular' => true,
                'is_featured' => true,
                'featured_order' => 1,
                'badge' => 'Best Seller',
                'is_active' => true,
                'display_order' => 1,
                'prep_time' => 15,
                'rating' => 4.9,
                'reviews_count' => 342,
            ],
            [
                'location_id' => $locationId,
                'category_id' => $pastaCategory?->id ?? null,
                'sku' => 'FEAT-002',
                'slug' => 'truffle-pasta-carbonara',
                'description' => 'Authentic Italian pasta with black truffle oil, pancetta, parmesan, and organic egg yolk',
                'price' => 16.99,
                'cost' => 7.20,
                'image_path' => 'images/menu-items/pasta-featured.jpg',
                'is_popular' => true,
                'is_featured' => true,
                'featured_order' => 2,
                'badge' => 'Chef\'s Choice',
                'is_active' => true,
                'display_order' => 2,
                'prep_time' => 20,
                'rating' => 4.8,
                'reviews_count' => 289,
            ],
            [
                'location_id' => $locationId,
                'category_id' => $dessertCategory?->id ?? null,
                'sku' => 'FEAT-003',
                'slug' => 'chocolate-lava-cake',
                'description' => 'Warm molten chocolate center, premium vanilla ice cream, fresh berry compote',
                'price' => 8.99,
                'cost' => 3.20,
                'image_path' => 'images/menu-items/dessert-featured.jpg',
                'is_popular' => true,
                'is_featured' => true,
                'featured_order' => 3,
                'badge' => 'Trending',
                'is_active' => true,
                'display_order' => 3,
                'prep_time' => 10,
                'rating' => 5.0,
                'reviews_count' => 456,
            ],
        ];

        foreach ($featuredItems as $itemData) {
            // First, get translation data (since MenuItem uses translations)
            $translationData = [
                'en' => [
                    'name' => ucwords(str_replace('-', ' ', $itemData['slug'])),
                    'description' => $itemData['description'],
                ],
            ];

            unset($itemData['description']); // Remove description from main array

            // Create the menu item
            $menuItem = MenuItem::withoutGlobalScopes()->updateOrCreate(
                ['slug' => $itemData['slug'], 'location_id' => $locationId],
                $itemData
            );

            // Create translation
            foreach ($translationData as $locale => $trans) {
                $menuItem->translations()->updateOrCreate(
                    ['locale' => $locale],
                    $trans
                );
            }
        }

        $this->command->info('✅ Featured menu items seeded successfully!');
    }
}
