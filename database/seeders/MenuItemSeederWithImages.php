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
                ['sku' => 'APP-001', 'slug' => 'spring-rolls', 'price' => 8.50, 'image_path' => 'https://images.unsplash.com/photo-1563379091339-03246963d96a?w=400', 'is_popular' => true],
                ['sku' => 'APP-002', 'slug' => 'chicken-wings', 'price' => 12.00, 'image_path' => 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400', 'is_popular' => true],
                ['sku' => 'APP-003', 'slug' => 'fried-calamari', 'price' => 14.50, 'image_path' => 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400'],
            ],
            'main-dishes' => [
                ['sku' => 'MAIN-001', 'slug' => 'grilled-salmon', 'price' => 28.00, 'image_path' => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400', 'is_popular' => true],
                ['sku' => 'MAIN-002', 'slug' => 'beef-steak', 'price' => 32.00, 'image_path' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', 'is_popular' => true],
                ['sku' => 'MAIN-003', 'slug' => 'chicken-curry', 'price' => 18.50, 'image_path' => 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400'],
            ],
            'desserts' => [
                ['sku' => 'DES-001', 'slug' => 'chocolate-cake', 'price' => 8.00, 'image_path' => 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', 'is_popular' => true],
                ['sku' => 'DES-002', 'slug' => 'tiramisu', 'price' => 9.00, 'image_path' => 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400'],
            ],
            'beverages' => [
                ['sku' => 'BEV-001', 'slug' => 'coffee', 'price' => 4.00, 'image_path' => 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400'],
                ['sku' => 'BEV-002', 'slug' => 'fresh-juice', 'price' => 5.50, 'image_path' => 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'],
            ],
        ];
        
        return $data[$slug] ?? [
            ['sku' => 'ITEM-001', 'slug' => $slug . '-special', 'price' => 15.00, 'image_path' => 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400']
        ];
    }
}
