<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Location;

class MenuItemSeederLocal extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        
        foreach ($locations as $location) {
            $categories = Category::where('location_id', $location->id)->get();
            
            foreach ($categories as $category) {
                $this->createMenuItemsForCategory($location, $category);
            }
        }
    }
    
    private function createMenuItemsForCategory($location, $category)
    {
        $menuItems = $this->getMenuItemsForSlug($category->slug);
        
        foreach ($menuItems as $index => $item) {
            MenuItem::create([
                'location_id' => $location->id,
                'category_id' => $category->id,
                'sku' => $item['sku'],
                'slug' => $item['slug'],
                'price' => (float) $item['price'], // Ensure it's a float
                'cost' => (float) ($item['price'] * 0.6), // Ensure it's a float
                'image_path' => $item['image_path'],
                'is_popular' => $item['is_popular'] ?? false,
                'is_active' => true,
                'display_order' => $index + 1,
            ]);
        }
    }
    
    private function getMenuItemsForSlug($slug)
    {
        $data = [
            'appetizers' => [
                ['sku' => 'APP-001', 'slug' => 'spring-rolls', 'price' => 8.50, 'image_path' => '/images/menu-items/spring-rolls.jpg', 'is_popular' => true],
                ['sku' => 'APP-002', 'slug' => 'chicken-wings', 'price' => 12.00, 'image_path' => '/images/menu-items/chicken-wings.jpg', 'is_popular' => true],
                ['sku' => 'APP-003', 'slug' => 'fried-calamari', 'price' => 14.50, 'image_path' => '/images/menu-items/fried-calamari.jpg'],
                ['sku' => 'APP-004', 'slug' => 'stuffed-mushrooms', 'price' => 10.00, 'image_path' => '/images/menu-items/spring-rolls.jpg'],
                ['sku' => 'APP-005', 'slug' => 'bruschetta', 'price' => 9.50, 'image_path' => '/images/menu-items/chicken-wings.jpg'],
            ],
            'main-dishes' => [
                ['sku' => 'MAIN-001', 'slug' => 'grilled-salmon', 'price' => 28.00, 'image_path' => '/images/menu-items/grilled-salmon.jpg', 'is_popular' => true],
                ['sku' => 'MAIN-002', 'slug' => 'beef-steak', 'price' => 32.00, 'image_path' => '/images/menu-items/beef-steak.jpg', 'is_popular' => true],
                ['sku' => 'MAIN-003', 'slug' => 'chicken-curry', 'price' => 18.50, 'image_path' => '/images/menu-items/chicken-curry.jpg'],
                ['sku' => 'MAIN-004', 'slug' => 'lobster-thermidor', 'price' => 45.00, 'image_path' => '/images/menu-items/grilled-salmon.jpg', 'is_popular' => true],
                ['sku' => 'MAIN-005', 'slug' => 'lamb-chops', 'price' => 30.00, 'image_path' => '/images/menu-items/beef-steak.jpg'],
            ],
            'soups-salads' => [
                ['sku' => 'SOUP-001', 'slug' => 'tom-yum-soup', 'price' => 12.00, 'image_path' => '/images/menu-items/tom-yum-soup.jpg', 'is_popular' => true],
                ['sku' => 'SOUP-002', 'slug' => 'caesar-salad', 'price' => 14.00, 'image_path' => '/images/menu-items/caesar-salad.jpg'],
                ['sku' => 'SOUP-003', 'slug' => 'mushroom-soup', 'price' => 10.50, 'image_path' => '/images/menu-items/tom-yum-soup.jpg'],
                ['sku' => 'SOUP-004', 'slug' => 'greek-salad', 'price' => 13.50, 'image_path' => '/images/menu-items/caesar-salad.jpg'],
            ],
            'desserts' => [
                ['sku' => 'DES-001', 'slug' => 'chocolate-cake', 'price' => 8.00, 'image_path' => '/images/menu-items/chocolate-cake.jpg', 'is_popular' => true],
                ['sku' => 'DES-002', 'slug' => 'tiramisu', 'price' => 9.00, 'image_path' => '/images/menu-items/tiramisu.jpg', 'is_popular' => true],
                ['sku' => 'DES-003', 'slug' => 'cheesecake', 'price' => 8.50, 'image_path' => '/images/menu-items/chocolate-cake.jpg'],
                ['sku' => 'DES-004', 'slug' => 'creme-brulee', 'price' => 10.00, 'image_path' => '/images/menu-items/tiramisu.jpg'],
            ],
            'beverages' => [
                ['sku' => 'BEV-001', 'slug' => 'espresso', 'price' => 4.00, 'image_path' => '/images/menu-items/espresso.jpg'],
                ['sku' => 'BEV-002', 'slug' => 'cappuccino', 'price' => 4.50, 'image_path' => '/images/menu-items/espresso.jpg'],
                ['sku' => 'BEV-003', 'slug' => 'fresh-orange-juice', 'price' => 5.50, 'image_path' => '/images/menu-items/espresso.jpg'],
                ['sku' => 'BEV-004', 'slug' => 'craft-beer', 'price' => 6.00, 'image_path' => '/images/menu-items/espresso.jpg'],
                ['sku' => 'BEV-005', 'slug' => 'red-wine', 'price' => 8.00, 'image_path' => '/images/menu-items/espresso.jpg'],
            ],
            'seafood' => [
                ['sku' => 'SEA-001', 'slug' => 'grilled-prawns', 'price' => 24.00, 'image_path' => '/images/menu-items/grilled-salmon.jpg', 'is_popular' => true],
                ['sku' => 'SEA-002', 'slug' => 'fish-tacos', 'price' => 16.50, 'image_path' => '/images/menu-items/grilled-salmon.jpg'],
                ['sku' => 'SEA-003', 'slug' => 'seafood-paella', 'price' => 32.00, 'image_path' => '/images/menu-items/grilled-salmon.jpg', 'is_popular' => true],
            ],
            'vegetarian' => [
                ['sku' => 'VEG-001', 'slug' => 'veggie-burger', 'price' => 15.00, 'image_path' => '/images/menu-items/caesar-salad.jpg'],
                ['sku' => 'VEG-002', 'slug' => 'quinoa-salad', 'price' => 13.50, 'image_path' => '/images/menu-items/caesar-salad.jpg'],
                ['sku' => 'VEG-003', 'slug' => 'veggie-pasta', 'price' => 16.00, 'image_path' => '/images/menu-items/caesar-salad.jpg'],
            ],
        ];
        
        return $data[$slug] ?? [
            ['sku' => 'ITEM-001', 'slug' => $slug . '-special', 'price' => 15.00, 'image_path' => '/images/menu-items/spring-rolls.jpg']
        ];
    }
}
