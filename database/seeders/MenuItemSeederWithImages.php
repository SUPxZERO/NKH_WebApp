<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Location;

class MenuItemSeederWithImages extends Seeder
{
    public function run(): void
    {
        // Clear existing menu items first
        MenuItem::query()->delete();
        
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
        
        // Create a category prefix for SKUs (e.g., 'appetizers' becomes 'APP')
        $categoryPrefix = strtoupper(preg_replace('/[^a-zA-Z]/', '', substr($category->slug, 0, 3)));
        
        foreach ($menuItems as $index => $item) {
            // Create unique identifiers for each location
            $uniqueSlug = "l{$location->id}-{$item['slug']}";
            $uniqueSku = "L{$location->id}-{$categoryPrefix}-{$item['sku']}";
            
            MenuItem::create([
                'location_id' => $location->id,
                'category_id' => $category->id,
                'sku' => $uniqueSku,
                'slug' => $uniqueSlug,
                'price' => $item['price'],
                'cost' => $item['price'] * 0.6,
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
                ['sku' => '001', 'slug' => 'spring-rolls', 'price' => 8.50, 'image_path' => 'menu-items/spring-rolls.jpg', 'is_popular' => true],
                ['sku' => '002', 'slug' => 'chicken-satay', 'price' => 10.50, 'image_path' => 'menu-items/chicken-satay.jpg', 'is_popular' => true],
                ['sku' => '003', 'slug' => 'fish-cakes', 'price' => 9.50, 'image_path' => 'menu-items/fish-cakes.jpg'],
                ['sku' => '004', 'slug' => 'papaya-salad', 'price' => 8.00, 'image_path' => 'menu-items/papaya-salad.jpg'],
                ['sku' => '005', 'slug' => 'beef-salad', 'price' => 12.50, 'image_path' => 'menu-items/beef-salad.jpg'],
                ['sku' => '006', 'slug' => 'mixed-appetizer-platter', 'price' => 18.50, 'image_path' => 'menu-items/mixed-appetizer.jpg', 'is_popular' => true],
            ],
            'main-courses' => [
                ['sku' => '001', 'slug' => 'grilled-beef-lolot', 'price' => 22.00, 'image_path' => 'menu-items/beef-lolot.jpg', 'is_popular' => true],
                ['sku' => '002', 'slug' => 'grilled-pork-ribs', 'price' => 24.50, 'image_path' => 'menu-items/pork-ribs.jpg', 'is_popular' => true],
                ['sku' => '003', 'slug' => 'grilled-chicken-wings', 'price' => 18.50, 'image_path' => 'menu-items/chicken-wings.jpg'],
                ['sku' => '004', 'slug' => 'khmer-noodle-soup', 'price' => 16.00, 'image_path' => 'menu-items/noodle-soup.jpg'],
                ['sku' => '005', 'slug' => 'pad-thai', 'price' => 17.50, 'image_path' => 'menu-items/pad-thai.jpg'],
                ['sku' => '006', 'slug' => 'spaghetti-carbonara', 'price' => 19.50, 'image_path' => 'menu-items/carbonara.jpg'],
            ],
            'seafood' => [
                ['sku' => '001', 'slug' => 'grilled-fish-banana-leaf', 'price' => 26.00, 'image_path' => 'menu-items/grilled-fish.jpg', 'is_popular' => true],
                ['sku' => '002', 'slug' => 'steamed-fish-ginger', 'price' => 24.50, 'image_path' => 'menu-items/steamed-fish.jpg'],
                ['sku' => '003', 'slug' => 'prawns-tamarind-sauce', 'price' => 28.00, 'image_path' => 'menu-items/prawns.jpg', 'is_popular' => true],
            ],
            'vegetarian' => [
                ['sku' => '001', 'slug' => 'stir-fried-morning-glory', 'price' => 12.50, 'image_path' => 'menu-items/morning-glory.jpg'],
                ['sku' => '002', 'slug' => 'tofu-curry', 'price' => 15.50, 'image_path' => 'menu-items/tofu-curry.jpg', 'is_popular' => true],
            ],
            'soups' => [
                ['sku' => '001', 'slug' => 'sour-soup-fish', 'price' => 16.50, 'image_path' => 'menu-items/sour-soup.jpg', 'is_popular' => true],
                ['sku' => '002', 'slug' => 'chicken-coconut-soup', 'price' => 15.50, 'image_path' => 'menu-items/coconut-soup.jpg'],
                ['sku' => '003', 'slug' => 'lotus-stem-salad', 'price' => 14.50, 'image_path' => 'menu-items/lotus-salad.jpg'],
            ],
            'desserts' => [
                ['sku' => '001', 'slug' => 'sticky-rice-mango', 'price' => 8.50, 'image_path' => 'menu-items/mango-sticky-rice.jpg', 'is_popular' => true],
                ['sku' => '002', 'slug' => 'coconut-custard', 'price' => 7.50, 'image_path' => 'menu-items/coconut-custard.jpg'],
                ['sku' => '003', 'slug' => 'coconut-ice-cream', 'price' => 6.50, 'image_path' => 'menu-items/coconut-ice-cream.jpg'],
                ['sku' => '004', 'slug' => 'mango-ice-cream', 'price' => 6.50, 'image_path' => 'menu-items/mango-ice-cream.jpg'],
                ['sku' => '005', 'slug' => 'chocolate-cake', 'price' => 8.50, 'image_path' => 'menu-items/chocolate-cake.jpg', 'is_popular' => true],
            ],
            'beverages' => [
                ['sku' => '001', 'slug' => 'cambodian-coffee', 'price' => 4.50, 'image_path' => 'menu-items/cambodian-coffee.jpg', 'is_popular' => true],
                ['sku' => '002', 'slug' => 'jasmine-tea', 'price' => 3.50, 'image_path' => 'menu-items/jasmine-tea.jpg'],
                ['sku' => '003', 'slug' => 'iced-coffee', 'price' => 4.50, 'image_path' => 'menu-items/iced-coffee.jpg'],
                ['sku' => '004', 'slug' => 'soft-drinks', 'price' => 3.00, 'image_path' => 'menu-items/soft-drinks.jpg'],
                ['sku' => '005', 'slug' => 'fresh-orange-juice', 'price' => 5.50, 'image_path' => 'menu-items/orange-juice.jpg'],
                ['sku' => '006', 'slug' => 'watermelon-juice', 'price' => 5.50, 'image_path' => 'menu-items/watermelon-juice.jpg'],
            ],
            'alcoholic-beverages' => [
                ['sku' => '001', 'slug' => 'angkor-beer', 'price' => 6.50, 'image_path' => 'menu-items/angkor-beer.jpg', 'is_popular' => true],
                ['sku' => '002', 'slug' => 'house-wine-red', 'price' => 8.50, 'image_path' => 'menu-items/red-wine.jpg'],
            ],
        ];
        
        // If category not found, return empty array instead of fallback
        return $data[$slug] ?? [];
    }
}
