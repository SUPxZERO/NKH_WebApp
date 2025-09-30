<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Location;

class MenuItemSeederFixed extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        
        foreach ($locations as $location) {
            $categories = Category::where('location_id', $location->id)->get();
            
            // Create menu items for each category
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
                'price' => $item['price'],
                'cost' => $item['cost'] ?? $item['price'] * 0.6, // 60% cost ratio
                'image_path' => $item['image_path'] ?? null,
                'is_popular' => $item['is_popular'] ?? false,
                'is_active' => true,
                'display_order' => $index + 1,
            ]);
        }
    }
    
    private function getMenuItemsForSlug($slug)
    {
        $menuItemsData = [
            'appetizers' => [
                ['sku' => 'APP-001', 'slug' => 'spring-rolls', 'price' => 8.50],
                ['sku' => 'APP-002', 'slug' => 'chicken-wings', 'price' => 12.00, 'is_popular' => true],
                ['sku' => 'APP-003', 'slug' => 'fried-calamari', 'price' => 14.50],
            ],
            'main-dishes' => [
                ['sku' => 'MAIN-001', 'slug' => 'grilled-salmon', 'price' => 28.00, 'is_popular' => true],
                ['sku' => 'MAIN-002', 'slug' => 'beef-steak', 'price' => 32.00, 'is_popular' => true],
                ['sku' => 'MAIN-003', 'slug' => 'chicken-curry', 'price' => 18.50],
                ['sku' => 'MAIN-004', 'slug' => 'pork-ribs', 'price' => 24.00],
            ],
            'soups-salads' => [
                ['sku' => 'SOUP-001', 'slug' => 'tom-yum-soup', 'price' => 12.00],
                ['sku' => 'SOUP-002', 'slug' => 'caesar-salad', 'price' => 14.00],
                ['sku' => 'SOUP-003', 'slug' => 'mushroom-soup', 'price' => 10.50],
            ],
            'desserts' => [
                ['sku' => 'DES-001', 'slug' => 'chocolate-cake', 'price' => 8.00, 'is_popular' => true],
                ['sku' => 'DES-002', 'slug' => 'ice-cream', 'price' => 6.50],
                ['sku' => 'DES-003', 'slug' => 'fruit-tart', 'price' => 7.50],
            ],
            'beverages' => [
                ['sku' => 'BEV-001', 'slug' => 'fresh-orange-juice', 'price' => 5.50],
                ['sku' => 'BEV-002', 'slug' => 'coffee', 'price' => 4.00],
                ['sku' => 'BEV-003', 'slug' => 'iced-tea', 'price' => 3.50],
                ['sku' => 'BEV-004', 'slug' => 'beer', 'price' => 6.00],
            ],
        ];
        
        return $menuItemsData[$slug] ?? [
            ['sku' => 'ITEM-' . strtoupper(substr($slug, 0, 3)) . '-001', 'slug' => $slug . '-special', 'price' => 15.00]
        ];
    }
}
