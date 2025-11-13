<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'slug' => 'appetizers',
                'display_order' => 1,
                'image' => 'https://images.unsplash.com/photo-1565958011705-44e211f02fa5?w=400&h=300&fit=crop',
                'translations' => [
                    'en' => ['name' => 'Appetizers', 'description' => 'Tasty starters to begin your meal.'],
                    'km' => ['name' => 'បុព្វាហារ', 'description' => 'បុព្វាហារដ៏ឆ្ងាញ់សម្រាប់ចាប់ផ្តើមអាហារ។'],
                ],
            ],
            [
                'slug' => 'main-dishes',
                'display_order' => 2,
                'image' => 'https://images.unsplash.com/photo-1604908177251-4697c3e1d3b4?w=400&h=300&fit=crop',
                'translations' => [
                    'en' => ['name' => 'Main Dishes', 'description' => 'Enjoy our selection of hearty main dishes.'],
                    'km' => ['name' => 'ម្ហូបសំខាន់', 'description' => 'ជម្រើសម្ហូបសំខាន់ដ៏ឆ្ងាញ់។'],
                ],
            ],
            [
                'slug' => 'soups-salads',
                'display_order' => 3,
                'image' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',
                'translations' => [
                    'en' => ['name' => 'Soups & Salads', 'description' => 'Fresh salads and warm soups.'],
                    'km' => ['name' => 'ស៊ុប និង សាឡាត់', 'description' => 'សាឡាត់ស្រស់ៗ និងស៊ុបក្តៅៗ។'],
                ],
            ],
            [
                'slug' => 'desserts',
                'display_order' => 4,
                'image' => 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
                'translations' => [
                    'en' => ['name' => 'Desserts', 'description' => 'Sweet treats to complete your meal.'],
                    'km' => ['name' => 'បង្អែម', 'description' => 'បង្អែមផ្អែមៗសម្រាប់បញ្ចប់អាហាររបស់អ្នក។'],
                ],
            ],
            [
                'slug' => 'beverages',
                'display_order' => 5,
                'image' => 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
                'translations' => [
                    'en' => ['name' => 'Beverages', 'description' => 'Refreshing drinks and juices.'],
                    'km' => ['name' => 'ភេសជ្ជៈ', 'description' => 'ភេសជ្ជៈស្រស់សម្រាប់បំប៉នថាមពល។'],
                ],
            ],
            [
                'slug' => 'seafood',
                'display_order' => 6,
                'image' => 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
                'translations' => [
                    'en' => ['name' => 'Seafood', 'description' => 'Fresh seafood specialties cooked to perfection.'],
                    'km' => ['name' => 'អាហារសមុទ្រ', 'description' => 'អាហារសមុទ្រស្រស់ៗដែលចម្អិនបានល្អឥតខ្ចោះ។'],
                ],
            ],
            [
                'slug' => 'grilled',
                'display_order' => 7,
                'image' => 'https://images.unsplash.com/photo-1603052875027-4f0b0cfc9b09?w=400&h=300&fit=crop',
                'translations' => [
                    'en' => ['name' => 'Grilled', 'description' => 'Smoky grilled meats and vegetables.'],
                    'km' => ['name' => 'ម្ហូបអាំង', 'description' => 'ម្ហូបអាំងក្រអូបឆ្ងាញ់។'],
                ],
            ],
            [
                'slug' => 'vegetarian',
                'display_order' => 8,
                'image' => 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
                'translations' => [
                    'en' => ['name' => 'Vegetarian', 'description' => 'Healthy and delicious vegetarian dishes.'],
                    'km' => ['name' => 'អាហារបន្លែ', 'description' => 'ម្ហូបបន្លែសុខភាពឆ្ងាញ់ៗ។'],
                ],
            ],
        ];

        foreach ($categories as $cat) {
            $category = Category::create([
                'location_id' => 1,
                'slug' => $cat['slug'],
                'display_order' => $cat['display_order'],
                'is_active' => true,
                'image' => $cat['image'],
            ]);

            foreach ($cat['translations'] as $locale => $data) {
                $category->translations()->create([
                    'locale' => $locale,
                    'name' => $data['name'],
                    'description' => $data['description'],
                ]);
            }
        }
    }
}
