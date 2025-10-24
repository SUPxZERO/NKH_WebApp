<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\Category;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $menuItems = [
            'hot-appetizers' => [
                [
                    'name_en' => 'Spring Rolls',
                    'name_km' => 'នំប្រោងចៀន',
                    'description_en' => 'Crispy vegetable spring rolls with sweet chili sauce',
                    'description_km' => 'នំប្រោងចៀនបន្លែដែលមានរសជាតិឆ្ងាញ់ជាមួយទឹកជ្រលក់ផ្អែមហឹរ',
                    'price' => 5.99,
                    'image' => 'https://images.unsplash.com/photo-1544591892-c5ca6231abc9?w=400&h=300&fit=crop'
                ],
                [
                    'name_en' => 'Fish Cakes',
                    'name_km' => 'ត្រីចៀន',
                    'description_en' => 'Traditional Khmer fish cakes with cucumber relish',
                    'description_km' => 'ត្រីចៀនតាមបែបខ្មែរជាមួយត្រសក់ជ្រក់',
                    'price' => 7.99,
                    'image' => 'https://images.unsplash.com/photo-1548869206-93b036288d7e?w=400&h=300&fit=crop'
                ]
            ],
            'sharing-platters' => [
                [
                    'name_en' => 'Mixed Grill Platter',
                    'name_km' => 'ចានអាំងចម្រុះ',
                    'description_en' => 'Selection of grilled meats and seafood with dipping sauces',
                    'description_km' => 'ជម្រើសនៃសាច់ និងអាហារសមុទ្រអាំងជាមួយទឹកជ្រលក់',
                    'price' => 29.99,
                    'image' => 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop'
                ]
            ],
            'grilled-specialties' => [
                [
                    'name_en' => 'Grilled Lemongrass Chicken',
                    'name_km' => 'មាន់អាំងស្លឹកគ្រៃ',
                    'description_en' => 'Char-grilled chicken marinated in lemongrass and Khmer spices',
                    'description_km' => 'មាន់អាំងជាមួយស្លឹកគ្រៃ និងគ្រឿងទេសខ្មែរ',
                    'price' => 12.99,
                    'image' => 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&h=300&fit=crop'
                ]
            ],
            'traditional-soups' => [
                [
                    'name_en' => 'Samlor Machu Trey',
                    'name_km' => 'សម្លម្ជូរត្រី',
                    'description_en' => 'Sour fish soup with morning glory and pineapple',
                    'description_km' => 'សម្លម្ជូរត្រីជាមួយត្រកួន និងម្នាស់',
                    'price' => 8.99,
                    'image' => 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop'
                ]
            ],
            'beverages' => [
                [
                    'name_en' => 'Iced Lemon Tea',
                    'name_km' => 'តែក្រូចឆ្មាទឹកកក',
                    'description_en' => 'Fresh brewed tea with lemon and honey',
                    'description_km' => 'តែស្រស់ជាមួយក្រូចឆ្មា និងទឹកឃ្មុំ',
                    'price' => 2.99,
                    'image' => 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop'
                ]
            ]
        ];

        foreach ($menuItems as $categorySlug => $items) {
            $categories = Category::where('slug', $categorySlug)->get();
            
            foreach ($categories as $category) {
                foreach ($items as $item) {
                    MenuItem::create([
                        'category_id' => $category->id,
                        'location_id' => $category->location_id,
                        'name' => $item['name_en'],
                        'description' => $item['description_en'],
                        'price' => $item['price'],
                        'image' => $item['image'],
                        'is_active' => true,
                        'is_featured' => rand(0, 1),
                        'preparation_time' => rand(10, 30),
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }
            }
        }
    }
}