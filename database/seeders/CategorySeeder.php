<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Location;

class CategorySeeder extends Seeder
{
    /**
     * Main categories with their translations
     */
    private array $mainCategories = [
        [
            'slug' => 'appetizers',
            'display_order' => 1,
            'image' => null,
            'translations' => [
                'en' => ['name' => 'Appetizers', 'description' => 'Start your meal with our delicious appetizers'],
                'km' => ['name' => 'បុព្វាហារ', 'description' => 'ចាប់ផ្តើមអាហាររបស់អ្នកជាមួយបុព្វាហារដ៏ឆ្ងាញ់របស់យើង'],
            ],
            'children' => [
                ['slug' => 'hot-appetizers', 'display_order' => 1, 'translations' => [
                    'en' => ['name' => 'Hot Appetizers', 'description' => 'Warm and delicious starters'],
                    'km' => ['name' => 'បុព្វាហារក្តៅ', 'description' => 'បុព្វាហារក្តៅៗ និងឆ្ងាញ់'],
                ]],
                ['slug' => 'cold-appetizers', 'display_order' => 2, 'translations' => [
                    'en' => ['name' => 'Cold Appetizers', 'description' => 'Refreshing cold starters'],
                    'km' => ['name' => 'បុព្វាហារត្រជាក់', 'description' => 'បុព្វាហារត្រជាក់ស្រស់ៗ'],
                ]],
                ['slug' => 'sharing-platters', 'display_order' => 3, 'translations' => [
                    'en' => ['name' => 'Sharing Platters', 'description' => 'Perfect for sharing with friends and family'],
                    'km' => ['name' => 'ចានចែករំលែក', 'description' => 'ល្អឥតខ្ចោះសម្រាប់ចែករំលែកជាមួយមិត្តភក្តិ និងគ្រួសារ'],
                ]],
            ],
        ],
        [
            'slug' => 'main-dishes',
            'display_order' => 2,
            'image' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
            'translations' => [
                'en' => ['name' => 'Main Dishes', 'description' => 'Experience our selection of hearty main dishes'],
                'km' => ['name' => 'មុខម្ហូបសំខាន់ៗ', 'description' => 'សូមស្វាគមន៍មកកាន់ជម្រើសម្ហូបអាហារដ៏ឆ្ងាញ់របស់យើង'],
            ],
            'children' => [
                ['slug' => 'grilled-specialties', 'display_order' => 1, 'translations' => [
                    'en' => ['name' => 'Grilled Specialties', 'description' => 'Our signature grilled dishes'],
                    'km' => ['name' => 'ម្ហូបអាំង', 'description' => 'ម្ហូបអាំងពិសេសរបស់យើង'],
                ]],
                ['slug' => 'pasta-noodles', 'display_order' => 2, 'translations' => [
                    'en' => ['name' => 'Pasta & Noodles', 'description' => 'Selection of pasta and noodle dishes'],
                    'km' => ['name' => 'ប៉ាស្តា និងមី', 'description' => 'ជម្រើសម្ហូបប៉ាស្តា និងមី'],
                ]],
                ['slug' => 'seafood', 'display_order' => 3, 'translations' => [
                    'en' => ['name' => 'Seafood', 'description' => 'Fresh seafood dishes'],
                    'km' => ['name' => 'អាហារសមុទ្រ', 'description' => 'អាហារសមុទ្រស្រស់ៗ'],
                ]],
                ['slug' => 'vegetarian', 'display_order' => 4, 'translations' => [
                    'en' => ['name' => 'Vegetarian', 'description' => 'Delicious vegetarian options'],
                    'km' => ['name' => 'អាហារបន្លែ', 'description' => 'ជម្រើសអាហារបន្លែដ៏ឆ្ងាញ់'],
                ]],
            ],
        ],
        [
            'slug' => 'soups-salads',
            'display_order' => 3,
            'image' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',
            'translations' => [
                'en' => ['name' => 'Soups & Salads', 'description' => 'Fresh salads and warming soups'],
                'km' => ['name' => 'ស៊ុប និងសាឡាត់', 'description' => 'សាឡាត់ស្រស់ៗ និងស៊ុបក្តៅៗ'],
            ],
            'children' => [
                ['slug' => 'traditional-soups', 'display_order' => 1, 'translations' => [
                    'en' => ['name' => 'Traditional Soups', 'description' => 'Classic Khmer soups'],
                    'km' => ['name' => 'ស៊ុបប្រពៃណី', 'description' => 'ស៊ុបប្រពៃណីខ្មែរ'],
                ]],
                ['slug' => 'fresh-salads', 'display_order' => 2, 'translations' => [
                    'en' => ['name' => 'Fresh Salads', 'description' => 'Light and refreshing salads'],
                    'km' => ['name' => 'សាឡាត់ស្រស់', 'description' => 'សាឡាត់ស្រស់ស្រូប'],
                ]],
            ],
        ],
        [
            'slug' => 'desserts',
            'display_order' => 4,
            'image' => 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
            'translations' => [
                'en' => ['name' => 'Desserts', 'description' => 'Sweet treats to end your meal perfectly'],
                'km' => ['name' => 'បង្អែម', 'description' => 'បង្អែមផ្អែមៗដើម្បីបញ្ចប់អាហាររបស់អ្នកយ៉ាងឥតខ្ចោះ'],
            ],
            'children' => [
                ['slug' => 'traditional-desserts', 'display_order' => 1, 'translations' => [
                    'en' => ['name' => 'Traditional Desserts', 'description' => 'Classic Khmer desserts'],
                    'km' => ['name' => 'បង្អែមប្រពៃណី', 'description' => 'បង្អែមប្រពៃណីខ្មែរ'],
                ]],
                ['slug' => 'ice-cream', 'display_order' => 2, 'translations' => [
                    'en' => ['name' => 'Ice Cream', 'description' => 'Cool and creamy ice cream treats'],
                    'km' => ['name' => 'ការ៉េម', 'description' => 'ការ៉េមត្រជាក់ស្រួយ'],
                ]],
                ['slug' => 'cakes-pastries', 'display_order' => 3, 'translations' => [
                    'en' => ['name' => 'Cakes & Pastries', 'description' => 'Fresh baked cakes and pastries'],
                    'km' => ['name' => 'នំ និងប៉េស្ទ្រី', 'description' => 'នំ និងប៉េស្ទ្រីដុតថ្មីៗ'],
                ]],
            ],
        ],
        [
            'slug' => 'beverages',
            'display_order' => 5,
            'image' => 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
            'translations' => [
                'en' => ['name' => 'Beverages', 'description' => 'Refresh yourself with our selection of drinks'],
                'km' => ['name' => 'ភេសជ្ជៈ', 'description' => 'បំពេញថាមពលជាមួយជម្រើសភេសជ្ជៈរបស់យើង'],
            ],
            'children' => [
                ['slug' => 'hot-beverages', 'display_order' => 1, 'translations' => [
                    'en' => ['name' => 'Hot Beverages', 'description' => 'Warming drinks and hot beverages'],
                    'km' => ['name' => 'ភេសជ្ជៈក្តៅ', 'description' => 'ភេសជ្ជៈក្តៅៗ'],
                ]],
                ['slug' => 'cold-beverages', 'display_order' => 2, 'translations' => [
                    'en' => ['name' => 'Cold Beverages', 'description' => 'Refreshing cold drinks'],
                    'km' => ['name' => 'ភេសជ្ជៈត្រជាក់', 'description' => 'ភេសជ្ជៈត្រជាក់ស្រស់ស្រូប'],
                ]],
                ['slug' => 'fresh-juices', 'display_order' => 3, 'translations' => [
                    'en' => ['name' => 'Fresh Juices', 'description' => 'Freshly squeezed fruit juices'],
                    'km' => ['name' => 'ទឹកផ្លែឈើស្រស់', 'description' => 'ទឹកផ្លែឈើច្របាច់ស្រស់ៗ'],
                ]],
                ['slug' => 'alcoholic-beverages', 'display_order' => 4, 'translations' => [
                    'en' => ['name' => 'Alcoholic Beverages', 'description' => 'Selection of beer, wine and spirits'],
                    'km' => ['name' => 'ភេសជ្ជៈមានជាតិស្រា', 'description' => 'ជម្រើសស្រាបៀរ ស្រាទំពាំងបាយជូរ និងស្រា'],
                ]],
            ],
        ],
    ];

    public function run(): void
    {
        // Get all active locations
        $locations = Location::where('is_active', true)->get();

        if ($locations->isEmpty()) {
            $this->command->warn('No active locations found. Creating default location...');
            $locations = collect([Location::create([
                'code' => 'NKH-MAIN',
                'name' => 'NKH Main Branch',
                'city' => 'Phnom Penh',
                'country' => 'Cambodia',
                'is_active' => true,
            ])]);
        }

        foreach ($locations as $location) {
            $this->command->info("Creating categories for location: {$location->name}");
            
            foreach ($this->mainCategories as $categoryData) {
                $this->createCategory($categoryData, $location->id, null);
            }
        }

        $totalCategories = Category::count();
        $this->command->info("✓ Created {$totalCategories} categories across {$locations->count()} location(s)");
    }

    /**
     * Create a category with its translations and children
     */
    private function createCategory(array $data, int $locationId, ?int $parentId): Category
    {
        // Create or update the category
        $category = Category::updateOrCreate(
            [
                'location_id' => $locationId,
                'slug' => $data['slug'],
            ],
            [
                'parent_id' => $parentId,
                'display_order' => $data['display_order'],
                'is_active' => true,
                'image' => $data['image'] ?? null,
            ]
        );

        // Create translations
        if (isset($data['translations'])) {
            foreach ($data['translations'] as $locale => $translation) {
                $category->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'name' => $translation['name'],
                        'description' => $translation['description'],
                    ]
                );
            }
        }

        // Create children recursively
        if (isset($data['children'])) {
            foreach ($data['children'] as $childData) {
                $this->createCategory($childData, $locationId, $category->id);
            }
        }

        return $category;
    }
}