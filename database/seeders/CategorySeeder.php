<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Location;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        
        foreach ($locations as $location) {
            // Main Categories
            $appetizers = Category::create([
                'location_id' => $location->id,
                'slug' => 'appetizers',
                'display_order' => 1,
                'is_active' => true,
            ]);

            $mainDishes = Category::create([
                'location_id' => $location->id,
                'slug' => 'main-dishes',
                'display_order' => 2,
                'is_active' => true,
                'image' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
            ]);

            $soups = Category::create([
                'location_id' => $location->id,
                'parent_id' => null,
                'slug' => 'soups-salads',
                'display_order' => 3,
                'is_active' => true,
                'image' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',
            ]);

            $desserts = Category::create([
                'location_id' => $location->id,
                'parent_id' => null,
                'slug' => 'desserts',
                'display_order' => 4,
                'is_active' => true,
                'image' => 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
            ]);

            $beverages = Category::create([
                'location_id' => $location->id,
                'parent_id' => null,
                'slug' => 'beverages',
                'display_order' => 5,
                'is_active' => true,
                'image' => 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
            ]);

            // Menu Items for Appetizers
            Category::create([
                'location_id' => $location->id,
                'parent_id' => $appetizers->id,
                'slug' => 'hot-appetizers',
                'display_order' => 1,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $appetizers->id,
                'slug' => 'cold-appetizers',
                'display_order' => 2,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $appetizers->id,
                'slug' => 'sharing-platters',
                'display_order' => 3,
                'is_active' => true,
            ]);

            // Menu Items for Main Dishes
            Category::create([
                'location_id' => $location->id,
                'parent_id' => $mainDishes->id,
                'slug' => 'grilled-specialties',
                'display_order' => 1,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $mainDishes->id,
                'slug' => 'pasta-noodles',
                'display_order' => 2,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $mainDishes->id,
                'slug' => 'seafood',
                'display_order' => 3,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $mainDishes->id,
                'slug' => 'vegetarian',
                'display_order' => 4,
                'is_active' => true,
            ]);

            // Menu Items for Soups & Salads
            Category::create([
                'location_id' => $location->id,
                'parent_id' => $soups->id,
                'slug' => 'traditional-soups',
                'display_order' => 1,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $soups->id,
                'slug' => 'fresh-salads',
                'display_order' => 2,
                'is_active' => true,
            ]);

            // Menu Items for Desserts
            Category::create([
                'location_id' => $location->id,
                'parent_id' => $desserts->id,
                'slug' => 'traditional-desserts',
                'display_order' => 1,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $desserts->id,
                'slug' => 'ice-cream',
                'display_order' => 2,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $desserts->id,
                'slug' => 'cakes-pastries',
                'display_order' => 3,
                'is_active' => true,
            ]);

            // Menu Items for Beverages
            Category::create([
                'location_id' => $location->id,
                'parent_id' => $beverages->id,
                'slug' => 'hot-beverages',
                'display_order' => 1,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $beverages->id,
                'slug' => 'cold-beverages',
                'display_order' => 2,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $beverages->id,
                'slug' => 'fresh-juices',
                'display_order' => 3,
                'is_active' => true,
            ]);

            Category::create([
                'location_id' => $location->id,
                'parent_id' => $beverages->id,
                'slug' => 'alcoholic-beverages',
                'display_order' => 4,
                'is_active' => true,
            ]);
        }
    }
}
