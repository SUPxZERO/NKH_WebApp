<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\CategoryTranslation;

class CategoryTranslationSeeder extends Seeder
{
    public function run(): void
    {
        $translations = [
            // Main Categories
            'appetizers' => [
                'en' => ['name' => 'Appetizers', 'description' => 'Start your meal with our delicious appetizers'],
                'km' => ['name' => 'ម្ហូបបំប៉ន', 'description' => 'ចាប់ផ្តើមអាហារដោយម្ហូបបំប៉នឆ្ងាញ់របស់យើង'],
            ],
            'main-dishes' => [
                'en' => ['name' => 'Main Dishes', 'description' => 'Hearty and satisfying main courses'],
                'km' => ['name' => 'ម្ហូបចម្បង', 'description' => 'ម្ហូបចម្បងឆ្ងាញ់និងធ្វើឱ្យឆ្អែត'],
            ],
            'soups-salads' => [
                'en' => ['name' => 'Soups & Salads', 'description' => 'Fresh and healthy options'],
                'km' => ['name' => 'ស៊ុប និង សាឡាត់', 'description' => 'ជម្រើសស្រស់និងមានសុខភាពល្អ'],
            ],
            'desserts' => [
                'en' => ['name' => 'Desserts', 'description' => 'Sweet endings to your perfect meal'],
                'km' => ['name' => 'បង្អែម', 'description' => 'ការបញ្ចប់ដ៏ផ្អែមនៃអាហារឥតខ្ចោះ'],
            ],
            'beverages' => [
                'en' => ['name' => 'Beverages', 'description' => 'Refreshing drinks for every taste'],
                'km' => ['name' => 'ភេសជ្ជៈ', 'description' => 'ភេសជ្ជៈធ្វើឱ្យស្រស់សម្រាប់រសជាតិគ្រប់យ៉ាង'],
            ],
            
            // Menu Items
            'hot-appetizers' => [
                'en' => ['name' => 'Hot Appetizers', 'description' => 'Warm and savory starters'],
                'km' => ['name' => 'ម្ហូបបំប៉នក្តៅ', 'description' => 'ម្ហូបបំប៉នក្តៅៗឆ្ងាញ់'],
            ],
            'cold-appetizers' => [
                'en' => ['name' => 'Cold Appetizers', 'description' => 'Fresh and light starters'],
                'km' => ['name' => 'ម្ហូបបំប៉នត្រជាក់', 'description' => 'ម្ហូបបំប៉នស្រស់និងស្រាល'],
            ],
            'sharing-platters' => [
                'en' => ['name' => 'Sharing Platters', 'description' => 'Perfect for groups and families'],
                'km' => ['name' => 'ចានចែករំលែក', 'description' => 'ល្អឥតខ្ចោះសម្រាប់ក្រុម និង គ្រួសារ'],
            ],
            'grilled-specialties' => [
                'en' => ['name' => 'Grilled Specialties', 'description' => 'Expertly grilled to perfection'],
                'km' => ['name' => 'ម្ហូបអាំងពិសេស', 'description' => 'អាំងដោយជំនាញឱ្យបានល្អឥតខ្ចោះ'],
            ],
            'pasta-noodles' => [
                'en' => ['name' => 'Pasta & Noodles', 'description' => 'Italian and Asian noodle dishes'],
                'km' => ['name' => 'ប៉ាស្តា និង មី', 'description' => 'ម្ហូបមីអ៊ីតាលី និង អាស៊ី'],
            ],
            'seafood' => [
                'en' => ['name' => 'Seafood', 'description' => 'Fresh from the ocean'],
                'km' => ['name' => 'អាហារសមុទ្រ', 'description' => 'ស្រស់ពីសមុទ្រ'],
            ],
            'vegetarian' => [
                'en' => ['name' => 'Vegetarian', 'description' => 'Plant-based delicious options'],
                'km' => ['name' => 'បួសបរិសុទ្ធ', 'description' => 'ជម្រើសឆ្ងាញ់ពីរុក្ខជាតិ'],
            ],
            'traditional-soups' => [
                'en' => ['name' => 'Traditional Soups', 'description' => 'Authentic local soup recipes'],
                'km' => ['name' => 'ស៊ុបប្រពៃណី', 'description' => 'រូបមន្តស៊ុបក្នុងស្រុកពិតប្រាកដ'],
            ],
            'fresh-salads' => [
                'en' => ['name' => 'Fresh Salads', 'description' => 'Crisp and healthy salad options'],
                'km' => ['name' => 'សាឡាត់ស្រស់', 'description' => 'ជម្រើសសាឡាត់ស្រស់និងមានសុខភាពល្អ'],
            ],
            'traditional-desserts' => [
                'en' => ['name' => 'Traditional Desserts', 'description' => 'Classic Cambodian sweets'],
                'km' => ['name' => 'បង្អែមប្រពៃណី', 'description' => 'បង្អែមកម្ពុជាបុរាណ'],
            ],
            'ice-cream' => [
                'en' => ['name' => 'Ice Cream', 'description' => 'Cool and creamy treats'],
                'km' => ['name' => 'ការ៉េម', 'description' => 'បង្អែមត្រជាក់និងក្រែម'],
            ],
            'cakes-pastries' => [
                'en' => ['name' => 'Cakes & Pastries', 'description' => 'Freshly baked sweet treats'],
                'km' => ['name' => 'នំកេក និង នំបុ័ង', 'description' => 'បង្អែមដុតស្រស់'],
            ],
            'hot-beverages' => [
                'en' => ['name' => 'Hot Beverages', 'description' => 'Warm drinks to comfort you'],
                'km' => ['name' => 'ភេសជ្ជៈក្តៅ', 'description' => 'ភេសជ្ជៈក្តៅៗធ្វើឱ្យស្រួល'],
            ],
            'cold-beverages' => [
                'en' => ['name' => 'Cold Beverages', 'description' => 'Refreshing cold drinks'],
                'km' => ['name' => 'ភេសជ្ជៈត្រជាក់', 'description' => 'ភេសជ្ជៈត្រជាក់ធ្វើឱ្យស្រស់'],
            ],
            'fresh-juices' => [
                'en' => ['name' => 'Fresh Juices', 'description' => 'Freshly squeezed fruit juices'],
                'km' => ['name' => 'ទឹកផ្លែឈើស្រស់', 'description' => 'ទឹកផ្លែឈើច្របាច់ស្រស់'],
            ],
            'alcoholic-beverages' => [
                'en' => ['name' => 'Alcoholic Beverages', 'description' => 'Wine, beer, and cocktails'],
                'km' => ['name' => 'ភេសជ្ជៈមានជាតិអាល់កុល', 'description' => 'ស្រាបៀរ និង ស្រាលាយ'],
            ],
        ];

        $categories = Category::all();
        
        foreach ($categories as $category) {
            if (isset($translations[$category->slug])) {
                foreach ($translations[$category->slug] as $locale => $translation) {
                    CategoryTranslation::create([
                        'category_id' => $category->id,
                        'locale' => $locale,
                        'name' => $translation['name'],
                        'description' => $translation['description'],
                    ]);
                }
            }
        }
    }
}
