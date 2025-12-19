<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Location;

class ImprovedCategorySeeder extends Seeder
{
    /**
     * Main categories with sub-categories for an Asian restaurant
     * Structure: Main Category (parent_id = NULL) → Sub-Categories (parent_id = main_category.id)
     */
    private array $mainCategories = [
        [
            'slug' => 'appetizers',
            'display_order' => 1,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Appetizers',
                    'description' => 'Start your meal with our delicious selection of appetizers and starters'
                ],
                'km' => [
                    'name' => 'បុព្វាហារ',
                    'description' => 'ចាប់ផ្តើមអាហាររបស់អ្នកជាមួយបុព្វាហារដ៏ឆ្ងាញ់របស់យើង'
                ],
            ],
            'children' => [
                [
                    'slug' => 'hot-appetizers',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Hot Appetizers', 'description' => 'Warm and crispy starters'],
                        'km' => ['name' => 'បុព្វាហារក្តៅ', 'description' => 'បុព្វាហារក្តៅៗ និងគៀប'],
                    ]
                ],
                [
                    'slug' => 'cold-appetizers',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Cold Appetizers', 'description' => 'Fresh and refreshing cold starters'],
                        'km' => ['name' => 'បុព្វាហារត្រជាក់', 'description' => 'បុព្វាហារត្រជាក់ស្រស់ៗ'],
                    ]
                ],
                [
                    'slug' => 'spring-rolls-dumplings',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Spring Rolls & Dumplings', 'description' => 'Handmade rolls and dumplings'],
                        'km' => ['name' => 'នំបញ្ចុក និងគុយទាវ', 'description' => 'នំបញ្ចុក និងគុយទាវធ្វើដោយដៃ'],
                    ]
                ],
                [
                    'slug' => 'sharing-platters',
                    'display_order' => 4,
                    'translations' => [
                        'en' => ['name' => 'Sharing Platters', 'description' => 'Perfect for sharing with family and friends'],
                        'km' => ['name' => 'ចានចែករំលែក', 'description' => 'ល្អសម្រាប់ចែករំលែកជាមួយគ្រួសារ និងមិត្តភក្តិ'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'rice-dishes',
            'display_order' => 2,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Rice Dishes',
                    'description' => 'Traditional and flavorful rice dishes'
                ],
                'km' => [
                    'name' => 'ម្ហូបបាយ',
                    'description' => 'ម្ហូបបាយប្រពៃណី និងឆ្ងាញ់'
                ],
            ],
            'children' => [
                [
                    'slug' => 'fried-rice',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Fried Rice', 'description' => 'Wok-fried rice with your choice of protein'],
                        'km' => ['name' => 'បាយឆា', 'description' => 'បាយឆាជាមួយសាច់តាមជម្រើស'],
                    ]
                ],
                [
                    'slug' => 'steamed-rice-dishes',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Steamed Rice Dishes', 'description' => 'Steamed rice with flavorful toppings'],
                        'km' => ['name' => 'បាយដំអិល', 'description' => 'បាយដំអិលជាមួយគ្រឿងទម្រង់ឆ្ងាញ់'],
                    ]
                ],
                [
                    'slug' => 'clay-pot-rice',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Clay Pot Rice', 'description' => 'Rice cooked in traditional clay pot'],
                        'km' => ['name' => 'បាយឆ្នាំងដីឥដ្ឋ', 'description' => 'បាយដុតក្នុងឆ្នាំងដីឥដ្ឋប្រពៃណី'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'noodles',
            'display_order' => 3,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Noodles',
                    'description' => 'Fresh noodles prepared in various traditional styles'
                ],
                'km' => [
                    'name' => 'មី',
                    'description' => 'មីស្រស់ៗ ធ្វើតាមរបៀបប្រពៃណីផ្សេងៗ'
                ],
            ],
            'children' => [
                [
                    'slug' => 'noodle-soups',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Noodle Soups', 'description' => 'Hot and comforting noodle soups'],
                        'km' => ['name' => 'មីស៊ុប', 'description' => 'មីស៊ុបក្តៅៗ និងឆ្ងាញ់'],
                    ]
                ],
                [
                    'slug' => 'stir-fried-noodles',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Stir-Fried Noodles', 'description' => 'Wok-tossed noodles with savory sauce'],
                        'km' => ['name' => 'មីឆា', 'description' => 'មីឆាក្នុងខ្ទះជាមួយទឹកស៊ីុឆ្ងាញ់'],
                    ]
                ],
                [
                    'slug' => 'dry-noodles',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Dry Noodles', 'description' => 'Noodles served with sauce on the side'],
                        'km' => ['name' => 'មីស្ងួត', 'description' => 'មីស្ងួតជាមួយទឹកស៊ីុ'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'soups',
            'display_order' => 4,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Soups',
                    'description' => 'Traditional soups and broths'
                ],
                'km' => [
                    'name' => 'ស៊ុប',
                    'description' => 'ស៊ុបប្រពៃណី'
                ],
            ],
            'children' => [
                [
                    'slug' => 'traditional-soups',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Traditional Soups', 'description' => 'Classic Cambodian soups'],
                        'km' => ['name' => 'ស៊ុបប្រពៃណី', 'description' => 'ស៊ុបប្រពៃណីខ្មែរ'],
                    ]
                ],
                [
                    'slug' => 'seafood-soups',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Seafood Soups', 'description' => 'Fresh seafood in flavorful broth'],
                        'km' => ['name' => 'ស៊ុបសមុទ្រ', 'description' => 'អាហារសមុទ្រស្រស់ក្នុងទឹកស៊ុបឆ្ងាញ់'],
                    ]
                ],
                [
                    'slug' => 'hot-pot',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Hot Pot', 'description' => 'Interactive hot pot dining experience'],
                        'km' => ['name' => 'ម៉ូឡុក', 'description' => 'បទពិសោធន៍ញ៉ាំម៉ូឡុក'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'curries',
            'display_order' => 5,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Curries',
                    'description' => 'Rich and aromatic curry dishes'
                ],
                'km' => [
                    'name' => 'ការី',
                    'description' => 'ម្ហូបការីក្រអូបល្អិតល្អន់'
                ],
            ],
            'children' => [
                [
                    'slug' => 'red-curry',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Red Curry', 'description' => 'Spicy and rich red curry'],
                        'km' => ['name' => 'ការីក្រហម', 'description' => 'ការីក្រហមហឹរ'],
                    ]
                ],
                [
                    'slug' => 'green-curry',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Green Curry', 'description' => 'Fresh and aromatic green curry'],
                        'km' => ['name' => 'ការីបៃតង', 'description' => 'ការីបៃតងក្រអូប'],
                    ]
                ],
                [
                    'slug' => 'amok',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Amok (Steamed Curry)', 'description' => 'Traditional Khmer steamed curry'],
                        'km' => ['name' => 'អាម៉ុក', 'description' => 'អាម៉ុកខ្មែរប្រពៃណី'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'grilled-bbq',
            'display_order' => 6,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Grilled & BBQ',
                    'description' => 'Charcoal grilled meats and seafood'
                ],
                'km' => [
                    'name' => 'អាំង',
                    'description' => 'សាច់ និងអាហារសមុទ្រអាំងធ្យូងភ្លើង'
                ],
            ],
            'children' => [
                [
                    'slug' => 'grilled-meats',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Grilled Meats', 'description' => 'Marinated and grilled to perfection'],
                        'km' => ['name' => 'សាច់អាំង', 'description' => 'សាច់ចំអិនអាំងល្អឥតខ្ចោះ'],
                    ]
                ],
                [
                    'slug' => 'grilled-seafood',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Grilled Seafood', 'description' => 'Fresh seafood grilled over charcoal'],
                        'km' => ['name' => 'អាហារសមុទ្រអាំង', 'description' => 'អាហារសមុទ្រស្រស់អាំងលើធ្យូង'],
                    ]
                ],
                [
                    'slug' => 'satay-skewers',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Satay & Skewers', 'description' => 'Marinated skewers with peanut sauce'],
                        'km' => ['name' => 'សាច់ចាក់ និងសាតេ', 'description' => 'សាច់ចាក់ជាមួយទឹកស្វាយ'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'stir-fry',
            'display_order' => 7,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Stir-Fry Dishes',
                    'description' => 'Quick-fried dishes with fresh ingredients'
                ],
                'km' => [
                    'name' => 'ឆាឆា',
                    'description' => 'ម្ហូបឆាឆាជាមួយគ្រឿងផ្សំស្រស់'
                ],
            ],
            'children' => [
                [
                    'slug' => 'vegetable-stir-fry',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Vegetable Stir-Fry', 'description' => 'Fresh vegetables in savory sauce'],
                        'km' => ['name' => 'បន្លែឆា', 'description' => 'បន្លែស្រស់ឆាជាមួយទឹកស៊ីុ'],
                    ]
                ],
                [
                    'slug' => 'meat-stir-fry',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Meat Stir-Fry', 'description' => 'Tender meat with vegetables'],
                        'km' => ['name' => 'សាច់ឆា', 'description' => 'សាច់ទន់ឆាជាមួយបន្លែ'],
                    ]
                ],
                [
                    'slug' => 'seafood-stir-fry',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Seafood Stir-Fry', 'description' => 'Fresh seafood stir-fried with vegetables'],
                        'km' => ['name' => 'អាហារសមុទ្រឆា', 'description' => 'អាហារសមុទ្រឆាជាមួយបន្លែ'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'salads',
            'display_order' => 8,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Salads',
                    'description' => 'Fresh and healthy salad options'
                ],
                'km' => [
                    'name' => 'សាឡាត់',
                    'description' => 'សាឡាត់ស្រស់ៗ និងល្អសុខភាព'
                ],
            ],
            'children' => [
                [
                    'slug' => 'traditional-salads',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Traditional Salads', 'description' => 'Classic Cambodian salads'],
                        'km' => ['name' => 'សាឡាត់ប្រពៃណី', 'description' => 'សាឡាត់ប្រពៃណីខ្មែរ'],
                    ]
                ],
                [
                    'slug' => 'papaya-salad',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Papaya Salad', 'description' => 'Spicy green papaya salad'],
                        'km' => ['name' => 'បុកល្ហុង', 'description' => 'បុកល្ហុងហឹរ'],
                    ]
                ],
                [
                    'slug' => 'fresh-salads',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Fresh Salads', 'description' => 'Light and refreshing salads'],
                        'km' => ['name' => 'សាឡាត់ស្រស់', 'description' => 'សាឡាត់ស្រស់ស្រួយ'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'desserts',
            'display_order' => 9,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Desserts',
                    'description' => 'Sweet treats to complete your meal'
                ],
                'km' => [
                    'name' => 'បង្អែម',
                    'description' => 'បង្អែមផ្អែមៗដើម្បីបញ្ចប់អាហាររបស់អ្នក'
                ],
            ],
            'children' => [
                [
                    'slug' => 'traditional-desserts',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Traditional Desserts', 'description' => 'Classic Cambodian sweet treats'],
                        'km' => ['name' => 'បង្អែមប្រពៃណី', 'description' => 'បង្អែមប្រពៃណីខ្មែរ'],
                    ]
                ],
                [
                    'slug' => 'ice-cream-shakes',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Ice Cream & Shakes', 'description' => 'Cool and creamy frozen treats'],
                        'km' => ['name' => 'ការ៉េម', 'description' => 'ការ៉េមត្រជាក់'],
                    ]
                ],
                [
                    'slug' => 'tropical-fruits',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Tropical Fruits', 'description' => 'Fresh seasonal fruits'],
                        'km' => ['name' => 'ផ្លែឈើត្រូពិច', 'description' => 'ផ្លែឈើស្រស់តាមរដូវកាល'],
                    ]
                ],
            ],
        ],
        [
            'slug' => 'beverages',
            'display_order' => 10,
            'image' => null,
            'translations' => [
                'en' => [
                    'name' => 'Beverages',
                    'description' => 'Refreshing drinks and beverages'
                ],
                'km' => [
                    'name' => 'ភេសជ្ជៈ',
                    'description' => 'ភេសជ្ជៈស្រស់ស្រួយ'
                ],
            ],
            'children' => [
                [
                    'slug' => 'fresh-juices',
                    'display_order' => 1,
                    'translations' => [
                        'en' => ['name' => 'Fresh Juices', 'description' => 'Freshly squeezed fruit juices'],
                        'km' => ['name' => 'ទឹកផ្លែឈើ', 'description' => 'ទឹកផ្លែឈើច្របាច់ស្រស់ៗ'],
                    ]
                ],
                [
                    'slug' => 'smoothies',
                    'display_order' => 2,
                    'translations' => [
                        'en' => ['name' => 'Smoothies', 'description' => 'Thick and creamy fruit smoothies'],
                        'km' => ['name' => 'ស្មូធី', 'description' => 'ស្មូធីផ្លែឈើក្រាស់'],
                    ]
                ],
                [
                    'slug' => 'hot-beverages',
                    'display_order' => 3,
                    'translations' => [
                        'en' => ['name' => 'Hot Beverages', 'description' => 'Coffee, tea, and hot drinks'],
                        'km' => ['name' => 'ភេសជ្ជៈក្តៅ', 'description' => 'កាហ្វេ តែ និងភេសជ្ជៈក្តៅ'],
                    ]
                ],
                [
                    'slug' => 'cold-beverages',
                    'display_order' => 4,
                    'translations' => [
                        'en' => ['name' => 'Cold Beverages', 'description' => 'Iced drinks and soft drinks'],
                        'km' => ['name' => 'ភេសជ្ជៈត្រជាក់', 'description' => 'ភេសជ្ជៈដាក់ទឹកកក'],
                    ]
                ],
                [
                    'slug' => 'beer-wine',
                    'display_order' => 5,
                    'translations' => [
                        'en' => ['name' => 'Beer & Wine', 'description' => 'Alcoholic beverages'],
                        'km' => ['name' => 'ស្រាបៀរ និងស្រាទំពាំងបាយជូរ', 'description' => 'ភេសជ្ជៈមានជាតិស្រា'],
                    ]
                ],
            ],
        ],
    ];

    public function run(): void
    {
        $this->command->info('Starting ImprovedCategorySeeder...');

        // IMPORTANT: Only seed for ONE location to avoid duplicates
        // Get the first active location only
        $location = Location::where('is_active', true)->first();

        if (!$location) {
            $this->command->warn('No active locations found. Skipping category seeding.');
            $this->command->warn('Please run LocationSeeder first!');
            return;
        }

        $this->command->info("📁 Creating categories for location: {$location->name}");

        $mainCount = 0;
        $subCount = 0;

        foreach ($this->mainCategories as $categoryData) {
            $category = $this->createCategory($categoryData, $location->id, null);
            $mainCount++;

            if (isset($categoryData['children'])) {
                $subCount += count($categoryData['children']);
            }
        }

        $this->command->info("✓ Created {$mainCount} main categories and {$subCount} sub-categories for {$location->name}");

        $totalMain = Category::whereNull('parent_id')->count();
        $totalSub = Category::whereNotNull('parent_id')->count();
        $this->command->info("✅ Total: {$totalMain} main categories, {$totalSub} sub-categories");
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

        // Create or update translations
        if (isset($data['translations'])) {
            foreach ($data['translations'] as $locale => $translation) {
                $category->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'name' => $translation['name'],
                        'description' => $translation['description'] ?? '',
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
