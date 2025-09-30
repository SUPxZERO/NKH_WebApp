<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Location;

class MenuItemSeederFinal extends Seeder
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
                ['sku' => 'APP-001', 'slug' => 'spring-rolls', 'price' => 8.50, 'image_path' => 'https://images.unsplash.com/photo-1563379091339-03246963d96a?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'APP-002', 'slug' => 'chicken-wings', 'price' => 12.00, 'image_path' => 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'APP-003', 'slug' => 'fried-calamari', 'price' => 14.50, 'image_path' => 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&h=400&fit=crop'],
                ['sku' => 'APP-004', 'slug' => 'stuffed-mushrooms', 'price' => 10.00, 'image_path' => 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=600&h=400&fit=crop'],
                ['sku' => 'APP-005', 'slug' => 'bruschetta', 'price' => 9.50, 'image_path' => 'https://images.unsplash.com/photo-1572441713132-51c75654db73?w=600&h=400&fit=crop'],
            ],
            'main-dishes' => [
                ['sku' => 'MAIN-001', 'slug' => 'grilled-salmon', 'price' => 28.00, 'image_path' => 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'MAIN-002', 'slug' => 'beef-steak', 'price' => 32.00, 'image_path' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'MAIN-003', 'slug' => 'chicken-curry', 'price' => 18.50, 'image_path' => 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&h=400&fit=crop'],
                ['sku' => 'MAIN-004', 'slug' => 'lobster-thermidor', 'price' => 45.00, 'image_path' => 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'MAIN-005', 'slug' => 'lamb-chops', 'price' => 30.00, 'image_path' => 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&h=400&fit=crop'],
            ],
            'soups-salads' => [
                ['sku' => 'SOUP-001', 'slug' => 'tom-yum-soup', 'price' => 12.00, 'image_path' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'SOUP-002', 'slug' => 'caesar-salad', 'price' => 14.00, 'image_path' => 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop'],
                ['sku' => 'SOUP-003', 'slug' => 'mushroom-soup', 'price' => 10.50, 'image_path' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=400&fit=crop'],
                ['sku' => 'SOUP-004', 'slug' => 'greek-salad', 'price' => 13.50, 'image_path' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop'],
            ],
            'desserts' => [
                ['sku' => 'DES-001', 'slug' => 'chocolate-cake', 'price' => 8.00, 'image_path' => 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'DES-002', 'slug' => 'tiramisu', 'price' => 9.00, 'image_path' => 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'DES-003', 'slug' => 'cheesecake', 'price' => 8.50, 'image_path' => 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&h=400&fit=crop'],
                ['sku' => 'DES-004', 'slug' => 'creme-brulee', 'price' => 10.00, 'image_path' => 'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?w=600&h=400&fit=crop'],
            ],
            'beverages' => [
                ['sku' => 'BEV-001', 'slug' => 'espresso', 'price' => 4.00, 'image_path' => 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=600&h=400&fit=crop'],
                ['sku' => 'BEV-002', 'slug' => 'cappuccino', 'price' => 4.50, 'image_path' => 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&h=400&fit=crop'],
                ['sku' => 'BEV-003', 'slug' => 'fresh-orange-juice', 'price' => 5.50, 'image_path' => 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=400&fit=crop'],
                ['sku' => 'BEV-004', 'slug' => 'craft-beer', 'price' => 6.00, 'image_path' => 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop'],
                ['sku' => 'BEV-005', 'slug' => 'red-wine', 'price' => 8.00, 'image_path' => 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop'],
            ],
            'seafood' => [
                ['sku' => 'SEA-001', 'slug' => 'grilled-prawns', 'price' => 24.00, 'image_path' => 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop', 'is_popular' => true],
                ['sku' => 'SEA-002', 'slug' => 'fish-tacos', 'price' => 16.50, 'image_path' => 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop'],
                ['sku' => 'SEA-003', 'slug' => 'seafood-paella', 'price' => 32.00, 'image_path' => 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600&h=400&fit=crop', 'is_popular' => true],
            ],
            'vegetarian' => [
                ['sku' => 'VEG-001', 'slug' => 'veggie-burger', 'price' => 15.00, 'image_path' => 'https://images.unsplash.com/photo-1525059696034-4967a729002e?w=600&h=400&fit=crop'],
                ['sku' => 'VEG-002', 'slug' => 'quinoa-salad', 'price' => 13.50, 'image_path' => 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop'],
                ['sku' => 'VEG-003', 'slug' => 'veggie-pasta', 'price' => 16.00, 'image_path' => 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=600&h=400&fit=crop'],
            ],
        ];
        
        return $data[$slug] ?? [
            ['sku' => 'ITEM-001', 'slug' => $slug . '-special', 'price' => 15.00, 'image_path' => 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop']
        ];
    }
}
