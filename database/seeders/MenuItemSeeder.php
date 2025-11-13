<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Location;

class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();

        foreach ($locations as $location) {
            // Get all categories for this location
            $categories = Category::where('location_id', $location->id)->get()->keyBy('slug');

            $appetizers = $categories->where('slug', 'appetizers')->first();
            $soupsSalads = $categories->where('slug', 'soups-salads')->first();
            $desserts = $categories->where('slug', 'desserts')->first();
            $beverages = $categories->where('slug', 'beverages')->first();
            $mainDishes = $categories->where('slug', 'main-dishes')->first();
            $grilled = $categories->where('slug', 'grilled')->first();
            $seafood = $categories->where('slug', 'seafood')->first();
            $vegetarian = $categories->where('slug', 'vegetarian')->first();
   

            $menuItems = [
                // Appetizers
                [
                    'category_id' => $appetizers->id,
                    'slug' => 'spring-rolls',
                    'price' => 8.50,
                    'cost' => 3.20,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\spring-rolls.jpg',
                ],
                [
                    'category_id' => $appetizers->id,
                    'slug' => 'chicken-satay',
                    'price' => 12.00,
                    'cost' => 4.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\chicken-satay.jpg',
                ],
                [
                    'category_id' => $appetizers->id,
                    'slug' => 'fish-cakes',
                    'price' => 10.50,
                    'cost' => 4.00,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\fish-cakes.jpg',
                ],
                [
                    'category_id' => $appetizers->id,
                    'slug' => 'papaya-salad',
                    'price' => 9.00,
                    'cost' => 2.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\papaya-salad.jpg',
                ],
                [
                    'category_id' => $appetizers->id,
                    'slug' => 'beef-salad',
                    'price' => 13.50,
                    'cost' => 5.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\beef-salad.jpg',
                ],
                [
                    'category_id' => $appetizers->id,
                    'slug' => 'mixed-appetizer-platter',
                    'price' => 28.00,
                    'cost' => 12.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\mixed-appetizer-platter.jpg',
                ],

                // Main Dishes
                [
                    'category_id' => $mainDishes->id,
                    'slug' => 'khmer-noodle-soup',
                    'price' => 12.50,
                    'cost' => 4.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\khmer-noodle-soup.jpg',
                ],
                [
                    'category_id' => $mainDishes->id,
                    'slug' => 'pad-thai',
                    'price' => 14.00,
                    'cost' => 4.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\pad-thai.jpg',
                ],
                [
                    'category_id' => $mainDishes->id,
                    'slug' => 'spaghetti-carbonara',
                    'price' => 16.50,
                    'cost' => 5.50,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\spaghetti-carbonara.jpg',
                ],

                // Soups & Salads
                [
                    'category_id' => $soupsSalads->id,
                    'slug' => 'sour-soup-fish',
                    'price' => 15.00,
                    'cost' => 5.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\sour-soup-fish.jpg',
                ],
                [
                    'category_id' => $soupsSalads->id,
                    'slug' => 'chicken-coconut-soup',
                    'price' => 13.50,
                    'cost' => 4.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\chicken-coconut-soup.jpg',
                ],
                [
                    'category_id' => $soupsSalads->id,
                    'slug' => 'lotus-stem-salad',
                    'price' => 10.00,
                    'cost' => 3.00,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\lotus-stem-salad.jpg',
                ],

                // Desserts
                [
                    'category_id' => $desserts->id,
                    'slug' => 'sticky-rice-mango',
                    'price' => 7.50,
                    'cost' => 2.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\sticky-rice-mango.jpg',
                ],
                [
                    'category_id' => $desserts->id,
                    'slug' => 'coconut-custard',
                    'price' => 6.50,
                    'cost' => 2.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\coconut-custard.jpg',
                ],
                [
                    'category_id' => $desserts->id,
                    'slug' => 'coconut-ice-cream',
                    'price' => 5.50,
                    'cost' => 1.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\coconut-ice-cream.jpg',
                ],
                [
                    'category_id' => $desserts->id,
                    'slug' => 'mango-ice-cream',
                    'price' => 6.00,
                    'cost' => 1.80,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\mango-ice-cream.jpg',
                ],
                [
                    'category_id' => $desserts->id,
                    'slug' => 'chocolate-cake',
                    'price' => 8.50,
                    'cost' => 3.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\chocolate-cake.jpg',
                ],

                // Beverages
                [
                    'category_id' => $beverages->id,
                    'slug' => 'cambodian-coffee',
                    'price' => 4.50,
                    'cost' => 1.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\cambodian-coffee.jpg',
                ],
                [
                    'category_id' => $beverages->id,
                    'slug' => 'jasmine-tea',
                    'price' => 3.50,
                    'cost' => 0.80,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\jasmine-tea.jpg',
                ],
                [
                    'category_id' => $beverages->id,
                    'slug' => 'iced-coffee',
                    'price' => 4.00,
                    'cost' => 1.20,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\iced-coffee.jpg',
                ],
                [
                    'category_id' => $beverages->id,
                    'slug' => 'soft-drinks',
                    'price' => 2.50,
                    'cost' => 0.80,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\soft-drinks.jpg',
                ],
                [
                    'category_id' => $beverages->id,
                    'slug' => 'fresh-orange-juice',
                    'price' => 5.50,
                    'cost' => 2.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\fresh-orange-juice.jpg',
                ],
                [
                    'category_id' => $beverages->id,
                    'slug' => 'watermelon-juice',
                    'price' => 4.50,
                    'cost' => 1.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\watermelon-juice.jpg',
                ],
                [
                    'category_id' => $beverages->id,
                    'slug' => 'angkor-beer',
                    'price' => 3.50,
                    'cost' => 1.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\angkor-beer.jpg',
                ],
                [
                    'category_id' => $beverages->id,
                    'slug' => 'house-wine-red',
                    'price' => 8.50,
                    'cost' => 3.50,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\house-wine-red.jpg',
                ],

                // Seafood
                [
                    'category_id' => $seafood->id,
                    'slug' => 'grilled-fish-banana-leaf',
                    'price' => 25.00,
                    'cost' => 10.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\grilled-fish-banana-leaf.jpg',
                ],
                [
                    'category_id' => $seafood->id,
                    'slug' => 'steamed-fish-ginger',
                    'price' => 28.00,
                    'cost' => 12.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\steamed-fish-ginger.jpg',
                ],
                [
                    'category_id' => $seafood->id,
                    'slug' => 'prawns-tamarind-sauce',
                    'price' => 32.00,
                    'cost' => 14.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\prawns-tamarind-sauce.jpg',
                ],

                // Grilled
                [
                    'category_id' => $grilled->id,
                    'slug' => 'grilled-beef-lolot',
                    'price' => 18.50,
                    'cost' => 7.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\grilled-beef-lolot.jpg',
                ],
                [
                    'category_id' => $grilled->id,
                    'slug' => 'grilled-pork-ribs',
                    'price' => 22.00,
                    'cost' => 9.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\grilled-pork-ribs.jpg',
                ],
                [
                    'category_id' => $grilled->id,
                    'slug' => 'grilled-chicken-wings',
                    'price' => 15.00,
                    'cost' => 5.50,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\grilled-chicken-wings.jpg',
                ],

                // Vegetarian
                [
                    'category_id' => $vegetarian->id,
                    'slug' => 'stir-fried-morning-glory',
                    'price' => 8.00,
                    'cost' => 2.00,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\stir-fried-morning-glory.jpg',
                ],
                [
                    'category_id' => $vegetarian->id,
                    'slug' => 'tofu-curry',
                    'price' => 11.50,
                    'cost' => 3.50,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\tofu-curry.jpg',
                ],
            ];



            foreach ($menuItems as $item) {
                if ($item['category_id']) {
                    MenuItem::create(array_merge($item, [
                        'location_id' => $location->id,
                    ]));
                }
            }
        }
    }
}
