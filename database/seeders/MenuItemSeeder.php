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
            $categories = Category::where('location_id', $location->id)->get();
            
            // Get categories by slug for easier reference
            $hotAppetizers = $categories->where('slug', 'hot-appetizers')->first();
            $coldAppetizers = $categories->where('slug', 'cold-appetizers')->first();
            $sharingPlatters = $categories->where('slug', 'sharing-platters')->first();
            $grilledSpecialties = $categories->where('slug', 'grilled-specialties')->first();
            $pastaNoodles = $categories->where('slug', 'pasta-noodles')->first();
            $seafood = $categories->where('slug', 'seafood')->first();
            $vegetarian = $categories->where('slug', 'vegetarian')->first();
            $traditionalSoups = $categories->where('slug', 'traditional-soups')->first();
            $freshSalads = $categories->where('slug', 'fresh-salads')->first();
            $traditionalDesserts = $categories->where('slug', 'traditional-desserts')->first();
            $iceCream = $categories->where('slug', 'ice-cream')->first();
            $cakesPastries = $categories->where('slug', 'cakes-pastries')->first();
            $hotBeverages = $categories->where('slug', 'hot-beverages')->first();
            $coldBeverages = $categories->where('slug', 'cold-beverages')->first();
            $freshJuices = $categories->where('slug', 'fresh-juices')->first();
            $alcoholicBeverages = $categories->where('slug', 'alcoholic-beverages')->first();

            $menuItems = [
                // Hot Appetizers
                [
                    'category_id' => $hotAppetizers?->id,
                    'slug' => 'spring-rolls',
                    'price' => 8.50,
                    'cost' => 3.20,
                    'prep_time' => 15,
                    'calories' => 180,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\spring-rolls.jpg',
                ],
                [
                    'category_id' => $hotAppetizers?->id,
                    'slug' => 'chicken-satay',
                    'price' => 12.00,
                    'cost' => 4.50,
                    'prep_time' => 20,
                    'calories' => 250,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\chicken-satay.jpg',
                ],
                [
                    'category_id' => $hotAppetizers?->id,
                    'slug' => 'fish-cakes',
                    'price' => 10.50,
                    'cost' => 4.00,
                    'prep_time' => 18,
                    'calories' => 220,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\fish-cakes.jpg',
                ],

                // Cold Appetizers
                [
                    'category_id' => $coldAppetizers?->id,
                    'slug' => 'papaya-salad',
                    'price' => 9.00,
                    'cost' => 2.50,
                    'prep_time' => 10,
                    'calories' => 120,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\papaya-salad.jpg',
                ],
                [
                    'category_id' => $coldAppetizers?->id,
                    'slug' => 'beef-salad',
                    'price' => 13.50,
                    'cost' => 5.00,
                    'prep_time' => 15,
                    'calories' => 280,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\beef-salad.jpg',
                ],

                // Sharing Platters
                [
                    'category_id' => $sharingPlatters?->id,
                    'slug' => 'mixed-appetizer-platter',
                    'price' => 28.00,
                    'cost' => 12.00,
                    'prep_time' => 25,
                    'calories' => 850,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\mixed-appetizer-platter.jpg',
                ],

                // Grilled Specialties
                [
                    'category_id' => $grilledSpecialties?->id,
                    'slug' => 'grilled-beef-lolot',
                    'price' => 18.50,
                    'cost' => 7.50,
                    'prep_time' => 25,
                    'calories' => 420,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\grilled-beef-lolot.jpg',
                ],
                [
                    'category_id' => $grilledSpecialties?->id,
                    'slug' => 'grilled-pork-ribs',
                    'price' => 22.00,
                    'cost' => 9.00,
                    'prep_time' => 35,
                    'calories' => 580,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\grilled-pork-ribs.jpg',
                ],
                [
                    'category_id' => $grilledSpecialties?->id,
                    'slug' => 'grilled-chicken-wings',
                    'price' => 15.00,
                    'cost' => 5.50,
                    'prep_time' => 20,
                    'calories' => 380,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\grilled-chicken-wings.jpg',
                ],

                // Pasta & Noodles
                [
                    'category_id' => $pastaNoodles?->id,
                    'slug' => 'khmer-noodle-soup',
                    'price' => 12.50,
                    'cost' => 4.00,
                    'prep_time' => 20,
                    'calories' => 450,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\khmer-noodle-soup.jpg',
                ],
                [
                    'category_id' => $pastaNoodles?->id,
                    'slug' => 'pad-thai',
                    'price' => 14.00,
                    'cost' => 4.50,
                    'prep_time' => 18,
                    'calories' => 520,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\pad-thai.jpg',
                ],
                [
                    'category_id' => $pastaNoodles?->id,
                    'slug' => 'spaghetti-carbonara',
                    'price' => 16.50,
                    'cost' => 5.50,
                    'prep_time' => 22,
                    'calories' => 680,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\spaghetti-carbonara.jpg',
                ],

                // Seafood
                [
                    'category_id' => $seafood?->id,
                    'slug' => 'grilled-fish-banana-leaf',
                    'price' => 25.00,
                    'cost' => 10.00,
                    'prep_time' => 30,
                    'calories' => 380,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\grilled-fish-banana-leaf.jpg',
                ],
                [
                    'category_id' => $seafood?->id,
                    'slug' => 'steamed-fish-ginger',
                    'price' => 28.00,
                    'cost' => 12.00,
                    'prep_time' => 25,
                    'calories' => 320,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\steamed-fish-ginger.jpg',
                ],
                [
                    'category_id' => $seafood?->id,
                    'slug' => 'prawns-tamarind-sauce',
                    'price' => 32.00,
                    'cost' => 14.00,
                    'prep_time' => 20,
                    'calories' => 420,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\prawns-tamarind-sauce.jpg',
                ],

                // Vegetarian
                [
                    'category_id' => $vegetarian?->id,
                    'slug' => 'stir-fried-morning-glory',
                    'price' => 8.00,
                    'cost' => 2.00,
                    'prep_time' => 12,
                    'calories' => 150,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\stir-fried-morning-glory.jpg',
                ],
                [
                    'category_id' => $vegetarian?->id,
                    'slug' => 'tofu-curry',
                    'price' => 11.50,
                    'cost' => 3.50,
                    'prep_time' => 18,
                    'calories' => 280,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\tofu-curry.jpg',
                ],

                // Traditional Soups
                [
                    'category_id' => $traditionalSoups?->id,
                    'slug' => 'sour-soup-fish',
                    'price' => 15.00,
                    'cost' => 5.50,
                    'prep_time' => 25,
                    'calories' => 320,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\sour-soup-fish.jpg',
                ],
                [
                    'category_id' => $traditionalSoups?->id,
                    'slug' => 'chicken-coconut-soup',
                    'price' => 13.50,
                    'cost' => 4.50,
                    'prep_time' => 20,
                    'calories' => 380,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\chicken-coconut-soup.jpg',
                ],

                // Fresh Salads
                [
                    'category_id' => $freshSalads?->id,
                    'slug' => 'lotus-stem-salad',
                    'price' => 10.00,
                    'cost' => 3.00,
                    'prep_time' => 15,
                    'calories' => 180,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\lotus-stem-salad.jpg',
                ],

                // Traditional Desserts
                [
                    'category_id' => $traditionalDesserts?->id,
                    'slug' => 'sticky-rice-mango',
                    'price' => 7.50,
                    'cost' => 2.50,
                    'prep_time' => 10,
                    'calories' => 320,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\sticky-rice-mango.jpg',
                ],
                [
                    'category_id' => $traditionalDesserts?->id,
                    'slug' => 'coconut-custard',
                    'price' => 6.50,
                    'cost' => 2.00,
                    'prep_time' => 8,
                    'calories' => 280,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\coconut-custard.jpg',
                ],

                // Ice Cream
                [
                    'category_id' => $iceCream?->id,
                    'slug' => 'coconut-ice-cream',
                    'price' => 5.50,
                    'cost' => 1.50,
                    'prep_time' => 5,
                    'calories' => 220,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\coconut-ice-cream.jpg',
                ],
                [
                    'category_id' => $iceCream?->id,
                    'slug' => 'mango-ice-cream',
                    'price' => 6.00,
                    'cost' => 1.80,
                    'prep_time' => 5,
                    'calories' => 240,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\mango-ice-cream.jpg',
                ],

                // Cakes & Pastries
                [
                    'category_id' => $cakesPastries?->id,
                    'slug' => 'chocolate-cake',
                    'price' => 8.50,
                    'cost' => 3.00,
                    'prep_time' => 5,
                    'calories' => 420,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\chocolate-cake.jpg',
                ],

                // Hot Beverages
                [
                    'category_id' => $hotBeverages?->id,
                    'slug' => 'cambodian-coffee',
                    'price' => 4.50,
                    'cost' => 1.00,
                    'prep_time' => 5,
                    'calories' => 120,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\cambodian-coffee.jpg',
                ],
                [
                    'category_id' => $hotBeverages?->id,
                    'slug' => 'jasmine-tea',
                    'price' => 3.50,
                    'cost' => 0.80,
                    'prep_time' => 3,
                    'calories' => 5,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\jasmine-tea.jpg',
                ],

                // Cold Beverages
                [
                    'category_id' => $coldBeverages?->id,
                    'slug' => 'iced-coffee',
                    'price' => 4.00,
                    'cost' => 1.20,
                    'prep_time' => 3,
                    'calories' => 150,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\iced-coffee.jpg',
                ],
                [
                    'category_id' => $coldBeverages?->id,
                    'slug' => 'soft-drinks',
                    'price' => 2.50,
                    'cost' => 0.80,
                    'prep_time' => 1,
                    'calories' => 140,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\soft-drinks.jpg',
                ],

                // Fresh Juices
                [
                    'category_id' => $freshJuices?->id,
                    'slug' => 'fresh-orange-juice',
                    'price' => 5.50,
                    'cost' => 2.00,
                    'prep_time' => 5,
                    'calories' => 110,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\fresh-orange-juice.jpg',
                ],
                [
                    'category_id' => $freshJuices?->id,
                    'slug' => 'watermelon-juice',
                    'price' => 4.50,
                    'cost' => 1.50,
                    'prep_time' => 5,
                    'calories' => 90,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\watermelon-juice.jpg',
                ],

                // Alcoholic Beverages
                [
                    'category_id' => $alcoholicBeverages?->id,
                    'slug' => 'angkor-beer',
                    'price' => 3.50,
                    'cost' => 1.50,
                    'prep_time' => 1,
                    'calories' => 150,
                    'is_popular' => true,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\angkor-beer.jpg',
                ],
                [
                    'category_id' => $alcoholicBeverages?->id,
                    'slug' => 'house-wine-red',
                    'price' => 8.50,
                    'cost' => 3.50,
                    'prep_time' => 2,
                    'calories' => 125,
                    'is_popular' => false,
                    'is_active' => true,
                    'image_path' => '\images\menu-items\house-wine-red.jpg',
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
