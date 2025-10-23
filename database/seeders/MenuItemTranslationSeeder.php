<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use App\Models\MenuItemTranslation;

class MenuItemTranslationSeeder extends Seeder
{
    public function run(): void
    {
        $translations = [
            'spring-rolls' => [
                'en' => ['name' => 'Fresh Spring Rolls', 'description' => 'Crispy spring rolls filled with fresh vegetables and herbs, served with sweet chili sauce'],
                'km' => ['name' => 'នំបញ្ចុំ', 'description' => 'នំបញ្ចុំគ្រឿងសម្រាប់ដាក់បន្លែស្រស់ និង ស្លឹកឈូក ជាមួយទឹកជ្រលក់ផ្អែម'],
            ],
            'chicken-satay' => [
                'en' => ['name' => 'Chicken Satay', 'description' => 'Grilled chicken skewers marinated in aromatic spices, served with peanut sauce'],
                'km' => ['name' => 'សាច់មាន់អាំង', 'description' => 'សាច់មាន់អាំងជាមួយគ្រឿងទេស ផ្តល់ជាមួយទឹកជ្រលក់សណ្តែកដី'],
            ],
            'fish-cakes' => [
                'en' => ['name' => 'Cambodian Fish Cakes', 'description' => 'Traditional fish cakes made with fresh river fish and aromatic herbs'],
                'km' => ['name' => 'អាម៉ុកត្រី', 'description' => 'អាម៉ុកត្រីប្រពៃណីធ្វើពីត្រីស្រស់ និង ស្លឹកឈូក'],
            ],
            'papaya-salad' => [
                'en' => ['name' => 'Green Papaya Salad', 'description' => 'Fresh and tangy salad with shredded green papaya, tomatoes, and lime dressing'],
                'km' => ['name' => 'បុកល្ហុង', 'description' => 'សាឡាត់ល្ហុងបៃតងស្រស់ជាមួយប៉េងប៉ោះ និង ទឹកក្រូចឆ្មា'],
            ],
            'beef-salad' => [
                'en' => ['name' => 'Cambodian Beef Salad', 'description' => 'Tender beef slices with fresh herbs, vegetables and tangy lime dressing'],
                'km' => ['name' => 'ភ្លាសាច់គោ', 'description' => 'សាច់គោជាមួយស្លឹកឈូកស្រស់ និង ទឹកក្រូចឆ្មា'],
            ],
            'mixed-appetizer-platter' => [
                'en' => ['name' => 'Mixed Appetizer Platter', 'description' => 'A selection of our finest appetizers perfect for sharing'],
                'km' => ['name' => 'ចានម្ហូបបំប៉នចម្រុះ', 'description' => 'ម្ហូបបំប៉នពិសេសៗសម្រាប់ចែករំលែក'],
            ],
            'grilled-beef-lolot' => [
                'en' => ['name' => 'Grilled Beef in Lolot Leaves', 'description' => 'Premium beef wrapped in aromatic lolot leaves and grilled to perfection'],
                'km' => ['name' => 'សាច់គោអាំងស្លឹកលលត', 'description' => 'សាច់គោពិសេសរុំស្លឹកលលត អាំងឱ្យបានល្អ'],
            ],
            'grilled-pork-ribs' => [
                'en' => ['name' => 'Grilled Pork Ribs', 'description' => 'Tender pork ribs marinated in special sauce and grilled over charcoal'],
                'km' => ['name' => 'ជំនីសាច់ជ្រូកអាំង', 'description' => 'ជំនីសាច់ជ្រូកទន់ជាមួយទឹកជ្រលក់ពិសេស អាំងលើធ្យូង'],
            ],
            'grilled-chicken-wings' => [
                'en' => ['name' => 'Grilled Chicken Wings', 'description' => 'Juicy chicken wings marinated in herbs and spices, grilled to golden perfection'],
                'km' => ['name' => 'ស្លាបមាន់អាំង', 'description' => 'ស្លាបមាន់ជាមួយគ្រឿងទេស អាំងឱ្យបានពណ៌មាស'],
            ],
            'khmer-noodle-soup' => [
                'en' => ['name' => 'Traditional Khmer Noodle Soup', 'description' => 'Authentic Cambodian noodle soup with rich broth and fresh herbs'],
                'km' => ['name' => 'គុយទាវខ្មែរ', 'description' => 'គុយទាវខ្មែរប្រពៃណីជាមួយទឹកស៊ុបឈុំ និង ស្លឹកឈូក'],
            ],
            'pad-thai' => [
                'en' => ['name' => 'Pad Thai', 'description' => 'Classic Thai stir-fried noodles with shrimp, tofu, and bean sprouts'],
                'km' => ['name' => 'មីឆាថៃ', 'description' => 'មីឆាថៃបុរាណជាមួយបង្គា តៅហ៊ូ និង សណ្តែកខ្ចី'],
            ],
            'spaghetti-carbonara' => [
                'en' => ['name' => 'Spaghetti Carbonara', 'description' => 'Classic Italian pasta with creamy sauce, bacon, and parmesan cheese'],
                'km' => ['name' => 'ស្ប៉ាហ្គេទីកាបូណារ៉ា', 'description' => 'ប៉ាស្តាអ៊ីតាលីជាមួយទឹកជ្រលក់ក្រែម និង ឈីសប៉ាម៉េសាន់'],
            ],
            'grilled-fish-banana-leaf' => [
                'en' => ['name' => 'Grilled Fish in Banana Leaf', 'description' => 'Fresh fish grilled in banana leaf with traditional Khmer spices'],
                'km' => ['name' => 'ត្រីអាំងស្លឹកចេក', 'description' => 'ត្រីស្រស់អាំងក្នុងស្លឹកចេកជាមួយគ្រឿងទេសខ្មែរ'],
            ],
            'steamed-fish-ginger' => [
                'en' => ['name' => 'Steamed Fish with Ginger', 'description' => 'Delicate steamed fish with fresh ginger and soy sauce'],
                'km' => ['name' => 'ត្រីចំហុយខ្ញី', 'description' => 'ត្រីចំហុយជាមួយខ្ញីស្រស់ និង ទឹកស៊ីអ៊ីវ'],
            ],
            'prawns-tamarind-sauce' => [
                'en' => ['name' => 'Prawns in Tamarind Sauce', 'description' => 'Fresh prawns cooked in sweet and sour tamarind sauce'],
                'km' => ['name' => 'បង្គាអំពិលទុំ', 'description' => 'បង្គាស្រស់ចម្អិនជាមួយអំពិលទុំផ្អែមឆ្មា'],
            ],
            'stir-fried-morning-glory' => [
                'en' => ['name' => 'Stir-fried Morning Glory', 'description' => 'Fresh water spinach stir-fried with garlic and oyster sauce'],
                'km' => ['name' => 'ត្រកួនឆាកតិច', 'description' => 'ត្រកួនស្រស់ឆាជាមួយកតិច និង ទឹកជ្រលក់ហោយ'],
            ],
            'tofu-curry' => [
                'en' => ['name' => 'Tofu Red Curry', 'description' => 'Silky tofu in aromatic red curry with vegetables'],
                'km' => ['name' => 'ការីក្រហមតៅហ៊ូ', 'description' => 'តៅហ៊ូក្នុងការីក្រហមជាមួយបន្លែ'],
            ],
            'sour-soup-fish' => [
                'en' => ['name' => 'Sour Fish Soup', 'description' => 'Traditional Cambodian sour soup with fresh fish and vegetables'],
                'km' => ['name' => 'សម្លម្ជូរត្រី', 'description' => 'សម្លម្ជូរខ្មែរប្រពៃណីជាមួយត្រីស្រស់ និង បន្លែ'],
            ],
            'chicken-coconut-soup' => [
                'en' => ['name' => 'Chicken Coconut Soup', 'description' => 'Creamy coconut soup with tender chicken and aromatic herbs'],
                'km' => ['name' => 'សម្លដូងមាន់', 'description' => 'សម្លដូងក្រែមជាមួយសាច់មាន់ទន់ និង ស្លឹកឈូក'],
            ],
            'lotus-stem-salad' => [
                'en' => ['name' => 'Lotus Stem Salad', 'description' => 'Crunchy lotus stem salad with herbs and lime dressing'],
                'km' => ['name' => 'ញាំងជ្រួញ', 'description' => 'ញាំងជ្រួញកកេបជាមួយស្លឹកឈូក និង ទឹកក្រូចឆ្មា'],
            ],
            'sticky-rice-mango' => [
                'en' => ['name' => 'Sticky Rice with Mango', 'description' => 'Sweet sticky rice served with fresh mango slices and coconut milk'],
                'km' => ['name' => 'បាយដំណើបស្វាយ', 'description' => 'បាយដំណើបផ្អែមជាមួយស្វាយស្រស់ និង ទឹកដូង'],
            ],
            'coconut-custard' => [
                'en' => ['name' => 'Coconut Custard', 'description' => 'Traditional Cambodian coconut custard dessert'],
                'km' => ['name' => 'សង់ខ្យាដូង', 'description' => 'បង្អែមសង់ខ្យាដូងខ្មែរប្រពៃណី'],
            ],
            'coconut-ice-cream' => [
                'en' => ['name' => 'Coconut Ice Cream', 'description' => 'Creamy coconut ice cream made with fresh coconut milk'],
                'km' => ['name' => 'ការ៉េមដូង', 'description' => 'ការ៉េមដូងក្រែមធ្វើពីទឹកដូងស្រស់'],
            ],
            'mango-ice-cream' => [
                'en' => ['name' => 'Mango Ice Cream', 'description' => 'Rich and creamy mango ice cream made with fresh mangoes'],
                'km' => ['name' => 'ការ៉េមស្វាយ', 'description' => 'ការ៉េមស្វាយក្រែមធ្វើពីស្វាយស្រស់'],
            ],
            'chocolate-cake' => [
                'en' => ['name' => 'Chocolate Cake', 'description' => 'Rich chocolate cake with smooth chocolate ganache'],
                'km' => ['name' => 'នំកេកសូកូឡា', 'description' => 'នំកេកសូកូឡាក្រែមជាមួយសូកូឡាហ្គាណាស'],
            ],
            'cambodian-coffee' => [
                'en' => ['name' => 'Traditional Cambodian Coffee', 'description' => 'Strong Cambodian coffee served with condensed milk'],
                'km' => ['name' => 'កាហ្វេខ្មែរ', 'description' => 'កាហ្វេខ្មែរខ្លាំងជាមួយទឹកដោះគោបង្រួម'],
            ],
            'jasmine-tea' => [
                'en' => ['name' => 'Jasmine Tea', 'description' => 'Fragrant jasmine tea served hot'],
                'km' => ['name' => 'តែម្លិះ', 'description' => 'តែម្លិះក្រអូបក្តៅៗ'],
            ],
            'iced-coffee' => [
                'en' => ['name' => 'Iced Coffee', 'description' => 'Refreshing iced coffee with condensed milk'],
                'km' => ['name' => 'កាហ្វេទឹកកក', 'description' => 'កាហ្វេទឹកកកធ្វើឱ្យស្រស់ជាមួយទឹកដោះគោបង្រួម'],
            ],
            'soft-drinks' => [
                'en' => ['name' => 'Soft Drinks', 'description' => 'Selection of carbonated soft drinks'],
                'km' => ['name' => 'ភេសជ្ជៈបែបកាបូន', 'description' => 'ជម្រើសភេសជ្ជៈបែបកាបូន'],
            ],
            'fresh-orange-juice' => [
                'en' => ['name' => 'Fresh Orange Juice', 'description' => 'Freshly squeezed orange juice'],
                'km' => ['name' => 'ទឹកក្រូចស្រស់', 'description' => 'ទឹកក្រូចច្របាច់ស្រស់'],
            ],
            'watermelon-juice' => [
                'en' => ['name' => 'Watermelon Juice', 'description' => 'Fresh watermelon juice, perfect for hot weather'],
                'km' => ['name' => 'ទឹកឪឡឹក', 'description' => 'ទឹកឪឡឹកស្រស់ល្អសម្រាប់អាកាសធាតុក្តៅ'],
            ],
            'angkor-beer' => [
                'en' => ['name' => 'Angkor Beer', 'description' => 'Cambodia\'s premium local beer'],
                'km' => ['name' => 'ស្រាបៀរអង្គរ', 'description' => 'ស្រាបៀរក្នុងស្រុកពិសេសរបស់កម្ពុជា'],
            ],
            'house-wine-red' => [
                'en' => ['name' => 'House Red Wine', 'description' => 'Our selection of red wine by the glass'],
                'km' => ['name' => 'ស្រាវ៉ាំក្រហម', 'description' => 'ស្រាវ៉ាំក្រហមជម្រើសរបស់យើង'],
            ],
        ];

        // Clear existing translations first
        MenuItemTranslation::query()->delete();
        
        $menuItems = MenuItem::all();
        
        foreach ($menuItems as $menuItem) {
            // Extract base slug by removing location prefix
            $baseSlug = preg_replace('/^l\d+-/', '', $menuItem->slug);
            
            if (isset($translations[$baseSlug])) {
                foreach ($translations[$baseSlug] as $locale => $translation) {
                    MenuItemTranslation::create([
                        'menu_item_id' => $menuItem->id,
                        'locale' => $locale,
                        'name' => $translation['name'],
                        'description' => $translation['description'],
                    ]);
                }
            }
        }
    }
}
