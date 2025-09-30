<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Location;

class CategorySeederFixed extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        
        $categories = [
            ['slug' => 'appetizers', 'display_order' => 1],
            ['slug' => 'main-dishes', 'display_order' => 2],
            ['slug' => 'soups-salads', 'display_order' => 3],
            ['slug' => 'desserts', 'display_order' => 4],
            ['slug' => 'beverages', 'display_order' => 5],
            ['slug' => 'hot-appetizers', 'display_order' => 6],
            ['slug' => 'cold-appetizers', 'display_order' => 7],
            ['slug' => 'seafood', 'display_order' => 8],
            ['slug' => 'meat-dishes', 'display_order' => 9],
            ['slug' => 'vegetarian', 'display_order' => 10],
            ['slug' => 'noodles-rice', 'display_order' => 11],
            ['slug' => 'traditional-soups', 'display_order' => 12],
            ['slug' => 'fresh-salads', 'display_order' => 13],
            ['slug' => 'khmer-desserts', 'display_order' => 14],
            ['slug' => 'international-desserts', 'display_order' => 15],
            ['slug' => 'hot-beverages', 'display_order' => 16],
            ['slug' => 'cold-beverages', 'display_order' => 17],
            ['slug' => 'fresh-juices', 'display_order' => 18],
            ['slug' => 'alcoholic-beverages', 'display_order' => 19],
        ];
        
        foreach ($locations as $location) {
            foreach ($categories as $categoryData) {
                Category::create([
                    'location_id' => $location->id,
                    'slug' => $categoryData['slug'],
                    'display_order' => $categoryData['display_order'],
                    'is_active' => true,
                ]);
            }
        }
    }
}
