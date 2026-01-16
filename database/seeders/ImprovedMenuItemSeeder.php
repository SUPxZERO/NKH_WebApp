<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use App\Models\Category;
use App\Models\Location;

class ImprovedMenuItemSeeder extends Seeder
{
    /**
     * CRITICAL: All menu items MUST link to SUB-CATEGORIES only (where parent_id IS NOT NULL)
     * DO NOT link to main categories!
     */
    public function run(): void
    {
        $this->command->info('Starting ImprovedMenuItemSeeder...');

        // IMPORTANT: Only seed for ONE location to avoid duplicates
        // Get the first active location only
        $location = Location::where('is_active', true)->first();

        if (!$location) {
            $this->command->warn('No locations found. Please run LocationSeeder first!');
            return;
        }

        $this->command->info("🍽️  Creating menu items for: {$location->name}");

        // Get ALL sub-categories for this location (parent_id IS NOT NULL)
        $subCategories = Category::where('location_id', $location->id)
            ->whereNotNull('parent_id')
            ->with('translations')
            ->get()
            ->keyBy('slug');

        if ($subCategories->isEmpty()) {
            $this->command->warn("No sub-categories found for {$location->name}. Run CategorySeeder first!");
            return;
        }

        $menuData = $this->getMenuItemsData($subCategories, $location);

        foreach ($menuData as $itemData) {
            // Extract translations before creating menu item
            $translations = $itemData['translations'] ?? [];
            unset($itemData['translations']);

            $menuItem = MenuItem::updateOrCreate(
                ['location_id' => $itemData['location_id'], 'slug' => $itemData['slug']],
                $itemData
            );

            // Create translations
            foreach ($translations as $locale => $translation) {
                $menuItem->translations()->updateOrCreate(
                    ['locale' => $locale],
                    [
                        'name' => $translation['name'],
                        'description' => $translation['description'] ?? '',
                    ]
                );
            }
        }

        $itemCount = MenuItem::where('location_id', $location->id)->count();
        $this->command->info("✓ Created {$itemCount} menu items for {$location->name}");


        $total = MenuItem::count();
        $this->command->info("✅ Total menu items created: {$total}");

        // VALIDATION: Check that no menu items are linked to main categories
        $invalidItems = MenuItem::whereHas('category', function($q) {
            $q->whereNull('parent_id');
        })->count();

        if ($invalidItems > 0) {
            $this->command->error("❌ ERROR: {$invalidItems} menu items are linked to MAIN categories!");
            $this->command->error("All menu items must link to SUB-CATEGORIES only!");
        } else {
            $this->command->info("✅ VALIDATION PASSED: All menu items linked to sub-categories!");
        }
    }

    /**
     * Get comprehensive menu items data
     */
    private function getMenuItemsData($subCategories, $location): array
    {
        $items = [];
        $displayOrder = 1;

        // ============================================
        // APPETIZERS
        // ============================================

        // Hot Appetizers
        if ($hotApp = $subCategories->get('hot-appetizers')) {
            $items = array_merge($items, [
                $this->createItem($location, $hotApp, 'fried-spring-rolls', 'Fried Spring Rolls', 'បារាំងបង្ចុកចៀន', 6.50, 2.20, 'Crispy fried vegetable spring rolls', 15, 20, 180, 3, true, $displayOrder++),
                $this->createItem($location, $hotApp, 'fresh-spring-rolls', 'Fresh Spring Rolls', 'បារាំងបង្ចុកស្រស់', 7.00, 2.50, 'Fresh rice paper rolls with vegetables and herbs', 10, 0, 120, 1, true, $displayOrder++),
                $this->createItem($location, $hotApp, 'chicken-satay', 'Chicken Satay', 'សាច់មាន់ចាក់', 9.50, 3.80, 'Grilled chicken skewers with peanut sauce', 15, 12, 280, 3, true, $displayOrder++),
                $this->createItem($location, $hotApp, 'fish-cakes', 'Fish Cakes', 'នំត្រី', 8.50, 3.20, 'Cambodian style fish cakes', 10, 15, 220, 2, false, $displayOrder++),
                $this->createItem($location, $hotApp, 'crab-cakes', 'Crab Cakes', 'នំក្តាម', 12.00, 5.50, 'Golden fried crab cakes with sweet chili', 10, 18, 300, 2, false, $displayOrder++),
                $this->createItem($location, $hotApp, 'stuffed-chicken-wings', 'Stuffed Chicken Wings', 'ស្លាបមាន់ពុម', 11.00, 4.50, 'Deboned chicken wings stuffed with vegetables', 20, 25, 350, 4, false, $displayOrder++),
            ]);
        }

        // Cold Appetizers
        if ($coldApp = $subCategories->get('cold-appetizers')) {
            $items = array_merge($items, [
                $this->createItem($location, $coldApp, 'beef-salad-khmer', 'Beef Salad (Pleah Sach Ko)', 'ភ្លាសាច់គោ', 13.50, 5.00, 'Spicy Khmer beef salad with herbs', 15, 0, 250, 4, true, $displayOrder++),
                $this->createItem($location, $coldApp, 'seafood-salad', 'Seafood Salad', 'សាឡាត់សមុទ្រ', 15.00, 6.50, 'Mixed seafood with fresh vegetables', 15, 0, 220, 2, false, $displayOrder++),
                $this->createItem($location, $coldApp, 'cucumber-salad', 'Cucumber Salad', 'សាឡាត់ត្រសក់', 5.50, 1.50, 'Fresh cucumber with sweet vinegar dressing', 5, 0, 60, 1, false, $displayOrder++),
                $this->createItem($location, $coldApp, 'century-egg-tofu', 'Century Egg with Tofu', 'ពងវែកជាមួយតៅហ៊ូ', 7.50, 2.80, 'Traditional century eggs with silken tofu', 5, 0, 180, 1, false, $displayOrder++),
            ]);
        }

        // Spring Rolls & Dumplings
        if ($sprDump = $subCategories->get('spring-rolls-dumplings')) {
            $items = array_merge($items, [
                $this->createItem($location, $sprDump, 'pork-dumplings', 'Pork Dumplings', 'គុយទាវសាច់ជ្រូក', 8.00, 3.20, 'Steamed or fried pork dumplings', 15, 10, 240, 2, true, $displayOrder++),
                $this->createItem($location, $sprDump, 'shrimp-dumplings', 'Shrimp Dumplings', 'គុយទាវបង្កង', 9.50, 4.20, 'Crystal shrimp dumplings', 15, 10, 200, 1, false, $displayOrder++),
                $this->createItem($location, $sprDump, 'veggie-spring-rolls', 'Vegetable Spring Rolls', 'បង្ចុកបន្លែ', 6.00, 2.00, 'Fresh vegetables wrapped in rice paper', 10, 0, 100, 1, false, $displayOrder++),
            ]);
        }

        // Sharing Platters
        if ($platter = $subCategories->get('sharing-platters')) {
            $items = array_merge($items, [
                $this->createItem($location, $platter, 'mixed-appetizer-platter', 'Mixed Appetizer Platter', 'ចានបុព្វាហាររួម', 28.00, 12.00, 'Assorted appetizers for 4-6 people', 20, 30, 1200, 3, true, $displayOrder++),
                $this->createItem($location, $platter, 'seafood-platter', 'Seafood Platter', 'ចានអាហារសមុទ្រ', 38.00, 18.00, 'Fresh seafood selection for sharing', 25, 20, 1500, 2, false, $displayOrder++),
            ]);
        }

        // ============================================
        // RICE DISHES
        // ============================================

        // Fried Rice
        if ($friedRice = $subCategories->get('fried-rice')) {
            $items = array_merge($items, [
                $this->createItem($location, $friedRice, 'chicken-fried-rice', 'Chicken Fried Rice', 'បាយឆាមាន់', 8.50, 3.20, 'Wok-fried rice with chicken', 10, 15, 520, 2, true, $displayOrder++),
                $this->createItem($location, $friedRice, 'shrimp-fried-rice', 'Shrimp Fried Rice', 'បាយឆាបង្កង', 10.50, 4.50, 'Wok-fried rice with fresh shrimp', 10, 15, 550, 2, true, $displayOrder++),
                $this->createItem($location, $friedRice, 'crab-fried-rice', 'Crab Fried Rice', 'បាយឆាក្តាម', 14.50, 6.50, 'Premium fried rice with fresh crab meat', 12, 18, 600, 2, false, $displayOrder++),
                $this->createItem($location, $friedRice, 'pineapple-fried-rice', 'Pineapple Fried Rice', 'បាយឆាម្នាស់', 11.50, 4.20, 'Fried rice with pineapple and cashews', 12, 15, 580, 2, true, $displayOrder++),
                $this->createItem($location, $friedRice, 'vegetable-fried-rice', 'Vegetable Fried Rice', 'បាយឆាបន្លែ', 7.50, 2.50, 'Healthy fried rice with mixed vegetables', 10, 12, 480, 1, false, $displayOrder++),
                $this->createItem($location, $friedRice, 'special-fried-rice', 'NKH Special Fried Rice', 'បាយឆាពិសេស', 12.50, 5.00, 'Chef special fried rice with mixed proteins', 15, 20, 650, 3, true, $displayOrder++),
            ]);
        }

        // Steamed Rice Dishes
        if ($steamRice = $subCategories->get('steamed-rice-dishes')) {
            $items = array_merge($items, [
                $this->createItem($location, $steamRice, 'grilled-pork-rice', 'Grilled Pork with Rice', 'បាយសាច់ជ្រូកអាំង', 9.50, 3.80, 'Marinated grilled pork over steamed rice', 15, 20, 580, 3, true, $displayOrder++),
                $this->createItem($location, $steamRice, 'grilled-chicken-rice', 'Grilled Chicken Rice', 'បាយមាន់អាំង', 8.50, 3.20, 'Tender grilled chicken with jasmine rice', 15, 18, 550, 2, true, $displayOrder++),
                $this->createItem($location, $steamRice, 'crispy-pork-belly-rice', 'Crispy Pork Belly Rice', 'បាយសាច់ជ្រូកគៀប', 11.00, 4.50, 'Crispy pork belly with steamed rice', 10, 25, 680, 3, false, $displayOrder++),
                $this->createItem($location, $steamRice, 'duck-rice', 'Roasted Duck Rice', 'បាយទាកាំង', 13.50, 6.00, 'Roasted duck with five-spice seasoning', 10, 30, 720, 3, false, $displayOrder++),
            ]);
        }

        // Clay Pot Rice
        if ($clayPot = $subCategories->get('clay-pot-rice')) {
            $items = array_merge($items, [
                $this->createItem($location, $clayPot, 'chicken-clay-pot-rice', 'Chicken Clay Pot Rice', 'បាយឆ្នាំងដីមាន់', 12.00, 4.80, 'Rice cooked in clay pot with chicken', 15, 30, 620, 2, true, $displayOrder++),
                $this->createItem($location, $clayPot, 'seafood-clay-pot-rice', 'Seafood Clay Pot Rice', 'បាយឆ្នាំងដីសមុទ្រ', 15.00, 7.00, 'Rice cooked with fresh seafood', 15, 35, 680, 2, false, $displayOrder++),
            ]);
        }

        // ============================================
        // NOODLES
        // ============================================

        // Noodle Soups
        if ($noodleSoup = $subCategories->get('noodle-soups')) {
            $items = array_merge($items, [
                $this->createItem($location, $noodleSoup, 'num-banh-chok', 'Nom Banh Chok (Khmer Noodles)', 'នំបញ្ចុក', 7.50, 2.80, 'Traditional Khmer rice noodles with curry', 20, 10, 420, 3, true, $displayOrder++),
                $this->createItem($location, $noodleSoup, 'kuy-teav', 'Kuy Teav (Noodle Soup)', 'គុយទាវ', 8.00, 3.00, 'Popular Cambodian noodle soup', 15, 15, 450, 2, true, $displayOrder++),
                $this->createItem($location, $noodleSoup, 'beef-pho', 'Beef Pho', 'ហ៊្វឺសាច់គោ', 9.50, 3.80, 'Vietnamese beef noodle soup', 15, 20, 520, 2, true, $displayOrder++),
                $this->createItem($location, $noodleSoup, 'chicken-pho', 'Chicken Pho', 'ហ៊្វឺមាន់', 8.50, 3.20, 'Vietnamese chicken noodle soup', 15, 20, 480, 2, true, $displayOrder++),
                $this->createItem($location, $noodleSoup, 'tom-yum-noodles', 'Tom Yum Noodle Soup', 'មីទំយំ', 10.50, 4.20, 'Spicy and sour Thai noodle soup', 12, 18, 490, 4, false, $displayOrder++),
                $this->createItem($location, $noodleSoup, 'wonton-noodle-soup', 'Wonton Noodle Soup', 'មីវ៉ុនតាន់', 9.00, 3.50, 'Noodles with pork wontons in clear broth', 15, 15, 460, 2, false, $displayOrder++),
            ]);
        }

        // Stir-Fried Noodles
        if ($stirNoodles = $subCategories->get('stir-fried-noodles')) {
            $items = array_merge($items, [
                $this->createItem($location, $stirNoodles, 'pad-thai', 'Pad Thai', 'ផាតថៃ', 10.50, 4.00, 'Classic Thai stir-fried rice noodles', 10, 15, 540, 2, true, $displayOrder++),
                $this->createItem($location, $stirNoodles, 'pad-see-ew', 'Pad See Ew', 'ផាតសៀវ', 10.00, 3.80, 'Wide rice noodles with soy sauce', 10, 15, 520, 2, false, $displayOrder++),
                $this->createItem($location, $stirNoodles, 'drunken-noodles', 'Drunken Noodles', 'មីខ្មៅ', 11.00, 4.20, 'Spicy basil noodles', 10, 15, 560, 4, false, $displayOrder++),
                $this->createItem($location, $stirNoodles, 'singapore-noodles', 'Singapore Noodles', 'មីសិង្ហបុរី', 10.50, 4.00, 'Curry flavored rice vermicelli', 10, 15, 530, 3, false, $displayOrder++),
                $this->createItem($location, $stirNoodles, 'chow-mein', 'Chicken Chow Mein', 'មីឆាមាន់', 9.50, 3.60, 'Stir-fried egg noodles with chicken', 10, 15, 510, 2, false, $displayOrder++),
            ]);
        }

        // Dry Noodles
        if ($dryNoodles = $subCategories->get('dry-noodles')) {
            $items = array_merge($items, [
                $this->createItem($location, $dryNoodles, 'mi-kola', 'Mi Kola', 'មីកូឡា', 8.50, 3.00, 'Dry noodles with special sauce', 10, 12, 480, 2, false, $displayOrder++),
                $this->createItem($location, $dryNoodles, 'wonton-noodles-dry', 'Dry Wonton Noodles', 'មីវ៉ុនតាន់ស្ងួត', 9.00, 3.40, 'Egg noodles with pork wontons and sauce', 12, 15, 500, 2, false, $displayOrder++),
            ]);
        }

        // ============================================
        // SOUPS
        // ============================================

        // Traditional Soups
        if ($tradSoup = $subCategories->get('traditional-soups')) {
            $items = array_merge($items, [
                $this->createItem($location, $tradSoup, 'samlor-kako', 'Samlor Kako', 'សម្លកកូរ', 11.00, 4.00, 'Traditional Cambodian vegetable soup', 20, 25, 320, 2, true, $displayOrder++),
                $this->createItem($location, $tradSoup, 'samlor-machu-kroeung', 'Samlor Machu Kroeung', 'សម្លម្ជូរគ្រឿង', 12.50, 4.80, 'Sour soup with lemongrass paste', 20, 25, 380, 3, true, $displayOrder++),
                $this->createItem($location, $tradSoup, 'chicken-coconut-soup', 'Chicken Coconut Soup', 'ស៊ុបមាន់ដូង', 10.50, 4.20, 'Creamy coconut soup with chicken', 15, 20, 450, 2, false, $displayOrder++),
            ]);
        }

        // Seafood Soups
        if ($seafoodSoup = $subCategories->get('seafood-soups')) {
            $items = array_merge($items, [
                $this->createItem($location, $seafoodSoup, 'fish-sour-soup', 'Sour Fish Soup', 'សម្លម្ជូរត្រី', 13.50, 5.50, 'Traditional sour soup with fresh fish', 20, 25, 380, 3, true, $displayOrder++),
                $this->createItem($location, $seafoodSoup, 'seafood-tom-yum', 'Tom Yum Seafood', 'ទំយំសមុទ្រ', 15.00, 6.50, 'Spicy and sour Thai seafood soup', 15, 20, 420, 5, true, $displayOrder++),
                $this->createItem($location, $seafoodSoup, 'prawn-soup', 'Prawn Soup', 'ស៊ុបបង្កងធំ', 14.00, 6.00, 'Clear soup with fresh prawns', 15, 20, 350, 2, false, $displayOrder++),
            ]);
        }

        // Hot Pot
        if ($hotPot = $subCategories->get('hot-pot')) {
            $items = array_merge($items, [
                $this->createItem($location, $hotPot, 'seafood-hot-pot', 'Seafood Hot Pot', 'ម៉ូឡុកសមុទ្រ', 25.00, 12.00, 'Interactive seafood hot pot for 2-3 people', 30, 0, 800, 3, false, $displayOrder++),
                $this->createItem($location, $hotPot, 'mixed-hot-pot', 'Mixed Hot Pot', 'ម៉ូឡុករួម', 28.00, 13.00, 'Meat and seafood hot pot', 30, 0, 950, 3, false, $displayOrder++),
            ]);
        }

        // ============================================
        // CURRIES
        // ============================================

        // Red Curry
        if ($redCurry = $subCategories->get('red-curry')) {
            $items = array_merge($items, [
                $this->createItem($location, $redCurry, 'red-curry-chicken', 'Red Curry Chicken', 'ការីក្រហមមាន់', 11.50, 4.50, 'Spicy red curry with chicken', 15, 25, 520, 4, true, $displayOrder++),
                $this->createItem($location, $redCurry, 'red-curry-beef', 'Red Curry Beef', 'ការីក្រហមសាច់គោ', 13.00, 5.50, 'Rich red curry with tender beef', 15, 30, 580, 4, false, $displayOrder++),
                $this->createItem($location, $redCurry, 'red-curry-duck', 'Red Curry Duck', 'ការីក្រហមទា', 15.00, 7.00, 'Red curry with roasted duck', 15, 28, 640, 4, false, $displayOrder++),
            ]);
        }

        // Green Curry
        if ($greenCurry = $subCategories->get('green-curry')) {
            $items = array_merge($items, [
                $this->createItem($location, $greenCurry, 'green-curry-chicken', 'Green Curry Chicken', 'ការីបៃតងមាន់', 11.50, 4.50, 'Aromatic green curry with chicken', 15, 25, 510, 3, true, $displayOrder++),
                $this->createItem($location, $greenCurry, 'green-curry-seafood', 'Green Curry Seafood', 'ការីបៃតងសមុទ្រ', 14.50, 6.50, 'Green curry with fresh seafood', 15, 25, 580, 3, false, $displayOrder++),
                $this->createItem($location, $greenCurry, 'green-curry-vegetables', 'Green Curry Vegetables', 'ការីបៃតងបន្លែ', 9.50, 3.50, 'Vegetarian green curry', 12, 22, 420, 3, false, $displayOrder++),
            ]);
        }

        // Amok
        if ($amok = $subCategories->get('amok')) {
            $items = array_merge($items, [
                $this->createItem($location, $amok, 'fish-amok', 'Fish Amok', 'អាម៉ុកត្រី', 14.00, 5.50, 'Cambodia\'s signature steamed fish curry', 20, 30, 420, 3, true, $displayOrder++),
                $this->createItem($location, $amok, 'chicken-amok', 'Chicken Amok', 'អាម៉ុកមាន់', 12.50, 4.80, 'Steamed chicken curry in banana leaf', 20, 30, 480, 3, false, $displayOrder++),
                $this->createItem($location, $amok, 'seafood-amok', 'Seafood Amok', 'អាម៉ុកសមុទ្រ', 16.00, 7.50, 'Mixed seafood in coconut curry', 20, 32, 520, 3, false, $displayOrder++),
            ]);
        }

        // ============================================
        // GRILLED & BBQ
        // ============================================

        // Grilled Meats
        if ($grilledMeat = $subCategories->get('grilled-meats')) {
            $items = array_merge($items, [
                $this->createItem($location, $grilledMeat, 'grilled-beef', 'Grilled Beef', 'សាច់គោអាំង', 16.00, 7.00, 'Premium beef grilled to perfection', 10, 20, 650, 3, true, $displayOrder++),
                $this->createItem($location, $grilledMeat, 'grilled-pork-ribs', 'Grilled Pork Ribs', 'ជំនីជ្រូកអាំង', 17.50, 8.00, 'BBQ pork ribs with special sauce', 15, 35, 780, 3, false, $displayOrder++),
                $this->createItem($location, $grilledMeat, 'lemongrass-chicken', 'Lemongrass Grilled Chicken', 'មាន់ស្លឹកគ្រៃអាំង', 12.00, 4.80, 'Chicken marinated with lemongrass', 12, 25, 520, 2, true, $displayOrder++),
                $this->createItem($location, $grilledMeat, 'grilled-pork-skewers', 'Grilled Pork Skewers', 'សាច់ជ្រូកចាក់', 10.50, 4.20, 'Marinated pork on bamboo skewers', 10, 20, 480, 2, false, $displayOrder++),
            ]);
        }

        // Grilled Seafood
        if ($grilledSeafood = $subCategories->get('grilled-seafood')) {
            $items = array_merge($items, [
                $this->createItem($location, $grilledSeafood, 'grilled-prawns', 'Grilled Tiger Prawns', 'បង្កងធំអាំង', 18.00, 9.00, 'Large tiger prawns grilled with garlic', 10, 18, 320, 2, true, $displayOrder++),
                $this->createItem($location, $grilledSeafood, 'grilled-squid', 'Grilled Squid', 'មឹកអាំង', 14.00, 6.50, 'Whole squid grilled with lemon', 10, 15, 280, 2, false, $displayOrder++),
                $this->createItem($location, $grilledSeafood, 'grilled-fish', 'Grilled Whole Fish', 'ត្រីអាំង', 22.00, 11.00, 'Fresh whole fish grilled over charcoal', 15, 30, 580, 2, false, $displayOrder++),
                $this->createItem($location, $grilledSeafood, 'grilled-crab', 'Grilled Crab', 'ក្តាមអាំង', 25.00, 13.00, 'Fresh crab grilled with pepper', 12, 25, 420, 3, false, $displayOrder++),
            ]);
        }

        // Satay & Skewers
        if ($satay = $subCategories->get('satay-skewers')) {
            $items = array_merge($items, [
                $this->createItem($location, $satay, 'chicken-satay-skewers', 'Chicken Satay', 'សាតេមាន់', 9.50, 3.80, '6 pieces with peanut sauce', 12, 15, 420, 2, true, $displayOrder++),
                $this->createItem($location, $satay, 'beef-satay', 'Beef Satay', 'សាតេសាច់គោ', 11.50, 5.00, '6 pieces of tender beef satay', 12, 15, 480, 2, false, $displayOrder++),
                $this->createItem($location, $satay, 'pork-satay', 'Pork Satay', 'សាតេសាច់ជ្រូក', 9.00, 3.60, '6 pieces with sweet peanut sauce', 12, 15, 450, 2, false, $displayOrder++),
            ]);
        }

        // ============================================
        // STIR-FRY DISHES
        // ============================================

        // Vegetable Stir-Fry
        if ($vegStir = $subCategories->get('vegetable-stir-fry')) {
            $items = array_merge($items, [
                $this->createItem($location, $vegStir, 'mixed-vegetables', 'Mixed Vegetables Stir-Fry', 'បន្លែឆារួម', 7.50, 2.80, 'Fresh seasonal vegetables', 8, 12, 280, 1, false, $displayOrder++),
                $this->createItem($location, $vegStir, 'morning-glory', 'Morning Glory Stir-Fry', 'ត្រកួនឆា', 6.50, 2.20, 'Water spinach with garlic', 8, 10, 150, 2, true, $displayOrder++),
                $this->createItem($location, $vegStir, 'chinese-broccoli-oyster', 'Chinese Broccoli in Oyster Sauce', 'ផ្កាខាណាចិនឆា', 7.00, 2.50, 'Kailan with savory oyster sauce', 8, 12, 180, 1, false, $displayOrder++),
            ]);
        }

        // Meat Stir-Fry
        if ($meatStir = $subCategories->get('meat-stir-fry')) {
            $items = array_merge($items, [
                $this->createItem($location, $meatStir, 'beef-black-pepper', 'Beef with Black Pepper', 'សាច់គោម្រេចខ្មៅ', 14.50, 6.00, 'Tender beef in black pepper sauce', 10, 15, 580, 3, true, $displayOrder++),
                $this->createItem($location, $meatStir, 'chicken-cashew-nuts', 'Chicken with Cashew Nuts', 'មាន់ឆាកន្ទុយខ្យង', 12.00, 4.80, 'Chicken with roasted cashews', 10, 15, 520, 2, true, $displayOrder++),
                $this->createItem($location, $meatStir, 'pork-basil', 'Pork with Holy Basil', 'សាច់ជ្រូកឆាម្រេចម្លិះ', 11.50, 4.50, 'Spicy stir-fry with Thai basil', 10, 15, 550, 4, false, $displayOrder++),
                $this->createItem($location, $meatStir, 'beef-oyster-sauce', 'Beef in Oyster Sauce', 'សាច់គោសូសហួស្ទ័រ', 13.50, 5.80, 'Tender beef with vegetables', 10, 15, 560, 2, false, $displayOrder++),
            ]);
        }

        // Seafood Stir-Fry
        if ($seafoodStir = $subCategories->get('seafood-stir-fry')) {
            $items = array_merge($items, [
                $this->createItem($location, $seafoodStir, 'garlic-prawns', 'Garlic Butter Prawns', 'បង្កងឆាខ្ទឹម', 16.00, 7.50, 'Prawns sautéed in garlic butter', 10, 12, 380, 2, true, $displayOrder++),
                $this->createItem($location, $seafoodStir, 'squid-black-pepper', 'Squid with Black Pepper', 'មឹកឆាម្រេចខ្មៅ', 13.50, 6.00, 'Tender squid in pepper sauce', 10, 12, 320, 3, false, $displayOrder++),
                $this->createItem($location, $seafoodStir, 'crab-kampot-pepper', 'Crab with Kampot Pepper', 'ក្តាមម្រេចកំពត', 28.00, 14.00, 'Signature dish with famous Kampot pepper', 15, 20, 580, 3, true, $displayOrder++),
                $this->createItem($location, $seafoodStir, 'sweet-sour-fish', 'Sweet & Sour Fish', 'ត្រីឆាប្រហើរ', 15.00, 6.50, 'Crispy fish with sweet and sour sauce', 12, 18, 620, 2, false, $displayOrder++),
            ]);
        }

        // ============================================
        // SALADS
        // ============================================

        // Traditional Salads
        if ($tradSalad = $subCategories->get('traditional-salads')) {
            $items = array_merge($items, [
                $this->createItem($location, $tradSalad, 'banana-flower-salad', 'Banana Flower Salad', 'ញាំឈូកចេក', 8.50, 3.00, 'Shredded banana flower with chicken', 15, 0, 280, 2, false, $displayOrder++),
                $this->createItem($location, $tradSalad, 'lotus-stem-salad', 'Lotus Stem Salad', 'ញាំដើមឈូក', 9.00, 3.20, 'Crunchy lotus stems with prawns', 15, 0, 250, 2, false, $displayOrder++),
            ]);
        }

        // Papaya Salad
        if ($papayaSalad = $subCategories->get('papaya-salad')) {
            $items = array_merge($items, [
                $this->createItem($location, $papayaSalad, 'papaya-salad-classic', 'Classic Papaya Salad', 'បុកល្ហុងបែបបុរាណ', 7.50, 2.50, 'Spicy green papaya salad', 10, 0, 180, 4, true, $displayOrder++),
                $this->createItem($location, $papayaSalad, 'papaya-salad-seafood', 'Papaya Salad with Seafood', 'បុកល្ហុងសមុទ្រ', 11.00, 4.50, 'Papaya salad with fresh seafood', 10, 0, 240, 4, false, $displayOrder++),
                $this->createItem($location, $papayaSalad, 'papaya-salad-dried-shrimp', 'Papaya Salad with Dried Shrimp', 'បុកល្ហុងបង្កងស្ងួត', 8.50, 3.00, 'Traditional with dried shrimp', 10, 0, 200, 4, false, $displayOrder++),
            ]);
        }

        // Fresh Salads
        if ($freshSalad = $subCategories->get('fresh-salads')) {
            $items = array_merge($items, [
                $this->createItem($location, $freshSalad, 'garden-salad', 'Garden Salad', 'សាឡាត់បន្លែ', 6.50, 2.20, 'Fresh mixed greens with house dressing', 8, 0, 120, 1, false, $displayOrder++),
                $this->createItem($location, $freshSalad, 'caesar-salad', 'Caesar Salad', 'សាឡាត់សេសារ', 8.50, 3.20, 'Classic caesar with croutons', 10, 0, 280, 1, false, $displayOrder++),
                $this->createItem($location, $freshSalad, 'mango-salad', 'Mango Salad', 'សាឡាត់ស្វាយ', 9.00, 3.40, 'Fresh mango with prawns', 10, 0, 220, 2, false, $displayOrder++),
            ]);
        }

        // ============================================
        // DESSERTS
        // ============================================

        // Traditional Desserts
        if ($tradDessert = $subCategories->get('traditional-desserts')) {
            $items = array_merge($items, [
                $this->createItem($location, $tradDessert, 'sticky-rice-mango', 'Sticky Rice with Mango', 'បាយដំនីងស្វាយ', 6.50, 2.20, 'Sweet sticky rice with ripe mango', 15, 0, 380, 0, true, $displayOrder++),
                $this->createItem($location, $tradDessert, 'num-ansom-chek', 'Num Ansom Chek', 'នំអន្សមជ្រុក', 4.50, 1.50, 'Sticky rice cake with banana', 30, 0, 320, 0, false, $displayOrder++),
                $this->createItem($location, $tradDessert, 'sweet-corn-pudding', 'Sweet Corn Pudding', 'បបរពោតផ្អែម', 5.50, 2.00, 'Traditional corn pudding', 20, 0, 280, 0, false, $displayOrder++),
                $this->createItem($location, $tradDessert, 'pumpkin-custard', 'Pumpkin Custard', 'ស្លកល្ពៅ', 6.00, 2.20, 'Steamed pumpkin with custard', 25, 0, 320, 0, false, $displayOrder++),
            ]);
        }

        // Ice Cream & Shakes
        if ($iceCream = $subCategories->get('ice-cream-shakes')) {
            $items = array_merge($items, [
                $this->createItem($location, $iceCream, 'vanilla-ice-cream', 'Vanilla Ice Cream', 'ការ៉េមវ៉ានីឡា', 4.50, 1.80, 'Classic vanilla ice cream', 5, 0, 220, 0, false, $displayOrder++),
                $this->createItem($location, $iceCream, 'chocolate-ice-cream', 'Chocolate Ice Cream', 'ការ៉េមសូកូឡា', 4.50, 1.80, 'Rich chocolate ice cream', 5, 0, 240, 0, false, $displayOrder++),
                $this->createItem($location, $iceCream, 'mango-shake', 'Mango Shake', 'ទឹកស្វាយហាល់', 5.50, 2.20, 'Fresh mango blended shake', 5, 0, 280, 0, true, $displayOrder++),
                $this->createItem($location, $iceCream, 'avocado-shake', 'Avocado Shake', 'ទឹករកាំហាល់', 6.00, 2.50, 'Creamy avocado shake', 5, 0, 340, 0, false, $displayOrder++),
            ]);
        }

        // Tropical Fruits
        if ($fruits = $subCategories->get('tropical-fruits')) {
            $items = array_merge($items, [
                $this->createItem($location, $fruits, 'fresh-fruit-platter', 'Fresh Fruit Platter', 'ផ្លែឈើស្រស់', 8.50, 3.50, 'Seasonal tropical fruits', 10, 0, 180, 0, false, $displayOrder++),
                $this->createItem($location, $fruits, 'dragonfruit-plate', 'Dragon Fruit Plate', 'ផ្លែស្រគាខ្មៅ', 7.00, 3.00, 'Fresh dragon fruit', 5, 0, 120, 0, false, $displayOrder++),
            ]);
        }

        // ============================================
        // BEVERAGES
        // ============================================

        // Fresh Juices
        if ($juice = $subCategories->get('fresh-juices')) {
            $items = array_merge($items, [
                $this->createItem($location, $juice, 'orange-juice', 'Fresh Orange Juice', 'ទឹកក្រូចស្រស់', 4.50, 1.80, 'Freshly squeezed orange juice', 5, 0, 110, 0, false, $displayOrder++),
                $this->createItem($location, $juice, 'watermelon-juice', 'Watermelon Juice', 'ទឹកឪឡឹក', 4.00, 1.50, 'Refreshing watermelon juice', 5, 0, 90, 0, true, $displayOrder++),
                $this->createItem($location, $juice, 'sugarcane-juice', 'Sugarcane Juice', 'ទឹកអំពៅ', 3.50, 1.20, 'Fresh sugarcane juice', 5, 0, 120, 0, true, $displayOrder++),
                $this->createItem($location, $juice, 'lime-juice', 'Fresh Lime Juice', 'ទឹកក្រូចឆ្មារ', 3.50, 1.20, 'Refreshing lime juice', 5, 0, 60, 0, false, $displayOrder++),
                $this->createItem($location, $juice, 'coconut-water', 'Fresh Coconut Water', 'ទឹកដូងស្រស់', 4.50, 2.00, 'Straight from the coconut', 5, 0, 80, 0, false, $displayOrder++),
            ]);
        }

        // Smoothies
        if ($smoothie = $subCategories->get('smoothies')) {
            $items = array_merge($items, [
                $this->createItem($location, $smoothie, 'mango-smoothie', 'Mango Smoothie', 'ស្មូធីស្វាយ', 5.50, 2.20, 'Thick mango smoothie', 5, 0, 280, 0, true, $displayOrder++),
                $this->createItem($location, $smoothie, 'strawberry-smoothie', 'Strawberry Smoothie', 'ស្មូធីស្ត្របឺរី', 5.50, 2.20, 'Fresh strawberry smoothie', 5, 0, 260, 0, false, $displayOrder++),
                $this->createItem($location, $smoothie, 'mixed-berry-smoothie', 'Mixed Berry Smoothie', 'ស្មូធីផ្លែប៊ឺរី', 6.00, 2.50, 'Blueberry, raspberry and strawberry', 5, 0, 290, 0, false, $displayOrder++),
                $this->createItem($location, $smoothie, 'green-smoothie', 'Green Detox Smoothie', 'ស្មូធីបៃតង', 6.50, 2.80, 'Healthy green smoothie with spinach', 5, 0, 180, 0, false, $displayOrder++),
            ]);
        }

        // Hot Beverages
        if ($hotBev = $subCategories->get('hot-beverages')) {
            $items = array_merge($items, [
                $this->createItem($location, $hotBev, 'cambodian-coffee', 'Cambodian Coffee', 'កាហ្វេខ្មែរ', 3.50, 1.20, 'Strong local coffee with condensed milk', 5, 0, 150, 0, true, $displayOrder++),
                $this->createItem($location, $hotBev, 'espresso', 'Espresso', 'អេស្ប្រេសូ', 3.00, 1.00, 'Rich Italian espresso', 3, 0, 10, 0, false, $displayOrder++),
                $this->createItem($location, $hotBev, 'cappuccino', 'Cappuccino', 'កាពូឈីណូ', 4.50, 1.80, 'Espresso with steamed milk foam', 5, 0, 120, 0, false, $displayOrder++),
                $this->createItem($location, $hotBev, 'latte', 'Café Latte', 'ឡាតេ', 4.50, 1.80, 'Espresso with steamed milk', 5, 0, 140, 0, false, $displayOrder++),
                $this->createItem($location, $hotBev, 'green-tea', 'Green Tea', 'តែបៃតង', 3.00, 1.00, 'Traditional Asian green tea', 5, 0, 5, 0, false, $displayOrder++),
                $this->createItem($location, $hotBev, 'jasmine-tea', 'Jasmine Tea', 'តែម្លិះ', 3.50, 1.20, 'Fragrant jasmine tea', 5, 0, 5, 0, false, $displayOrder++),
            ]);
        }

        // Cold Beverages
        if ($coldBev = $subCategories->get('cold-beverages')) {
            $items = array_merge($items, [
                $this->createItem($location, $coldBev, 'iced-coffee', 'Iced Coffee', 'កាហ្វេទឹកកក', 4.00, 1.50, 'Refreshing iced coffee', 5, 0, 160, 0, true, $displayOrder++),
                $this->createItem($location, $coldBev, 'iced-latte', 'Iced Latte', 'ឡាតេត្រជាក់', 5.00, 2.00, 'Cold espresso with milk', 5, 0, 150, 0, false, $displayOrder++),
                $this->createItem($location, $coldBev, 'thai-iced-tea', 'Thai Iced Tea', 'តែថៃទឹកកក', 4.50, 1.80, 'Sweet Thai tea with milk', 5, 0, 220, 0, true, $displayOrder++),
                $this->createItem($location, $coldBev, 'iced-lemon-tea', 'Iced Lemon Tea', 'តែក្រូចឆ្មារទឹកកក', 3.50, 1.20, 'Refreshing lemon tea', 5, 0, 80, 0, false, $displayOrder++),
                $this->createItem($location, $coldBev, 'soft-drinks', 'Soft Drinks', 'ភេសជ្ជៈបែបកំប៉ុង', 2.50, 0.80, 'Coca-Cola, Sprite, Fanta', 2, 0, 140, 0, false, $displayOrder++),
            ]);
        }

        // Beer & Wine
        if ($alcohol = $subCategories->get('beer-wine')) {
            $items = array_merge($items, [
                $this->createItem($location, $alcohol, 'angkor-beer', 'Angkor Beer', 'ស្រាបៀរអង្គរ', 3.50, 1.50, 'Local Cambodian beer', 2, 0, 150, 0, true, $displayOrder++),
                $this->createItem($location, $alcohol, 'anchor-beer', 'Anchor Beer', 'ស្រាបៀរអង់ឃ័រ', 3.00, 1.20, 'Smooth lager beer', 2, 0, 145, 0, false, $displayOrder++),
                $this->createItem($location, $alcohol, 'heineken', 'Heineken', 'ហៃណេខឺន', 5.00, 2.20, 'Premium imported beer', 2, 0, 160, 0, false, $displayOrder++),
                $this->createItem($location, $alcohol, 'red-wine-glass', 'Red Wine (Glass)', 'ស្រាទំពាំងបាយជូរក្រហម', 7.00, 3.00, 'House red wine', 2, 0, 120, 0, false, $displayOrder++),
                $this->createItem($location, $alcohol, 'white-wine-glass', 'White Wine (Glass)', 'ស្រាទំពាំងបាយជូរស', 7.00, 3.00, 'House white wine', 2, 0, 115, 0, false, $displayOrder++),
            ]);
        }

        return $items;
    }

    /**
     * Helper to create menu item data array
     */
    private function createItem(
        $location,
        $category,
        $slug,
        $nameEn,
        $nameKm,
        $price,
        $cost,
        $descEn,
        $prepTime,
        $cookTime,
        $calories,
        $spiceLevel,
        $isPopular,
        $displayOrder
    ): array {
        return [
            'location_id' => $location->id,
            'category_id' => $category->id, // This MUST be a sub-category ID
            'slug' => $slug,
            'price' => $price,
            'cost' => $cost,
            'is_popular' => $isPopular,
            'is_featured' => rand(1, 10) <= 2, // 20% chance
            'featured_order' => $isPopular ? $displayOrder : 999,
            'is_active' => true,
            'display_order' => $displayOrder,
            'prep_time' => $prepTime,
            'cook_time' => $cookTime,
            'calories' => $calories,
            'rating' => round(rand(40, 50) / 10, 1), // 4.0 to 5.0
            'reviews_count' => rand(0, 150),
            'spice_level' => $spiceLevel,
            'serving_size' => '1 portion',
            'availability_status' => 'available',
            'nutrition' => [
                'protein' => rand(10, 40),
                'carbs' => rand(30, 80),
                'fat' => rand(5, 30),
                'fiber' => rand(2, 10),
            ],
            'allergens' => $this->getAllergens($slug),
            'dietary_tags' => $this->getDietaryTags($slug),
            'image_path' => $this->getImagePath($slug), // Map slug to actual image file
            'translations' => [
                'en' => [
                    'name' => $nameEn,
                    'description' => $descEn,
                ],
                'km' => [
                    'name' => $nameKm,
                    'description' => $this->translateDescription($descEn),
                ],
            ],
        ];
    }

    /**
     * Get allergens based on dish
     */
    private function getAllergens($slug): array
    {
        $allergens = [];

        if (str_contains($slug, 'peanut') || str_contains($slug, 'satay') || str_contains($slug, 'cashew')) {
            $allergens[] = 'peanuts';
            $allergens[] = 'tree nuts';
        }

        if (str_contains($slug, 'seafood') || str_contains($slug, 'prawn') || str_contains($slug, 'shrimp') ||
            str_contains($slug, 'fish') || str_contains($slug, 'crab') || str_contains($slug, 'squid')) {
            $allergens[] = 'shellfish';
            $allergens[] = 'fish';
        }

        if (str_contains($slug, 'egg')) {
            $allergens[] = 'eggs';
        }

        if (str_contains($slug, 'milk') || str_contains($slug, 'cream') || str_contains($slug, 'cheese')) {
            $allergens[] = 'dairy';
        }

        return $allergens;
    }

    /**
     * Get dietary tags
     */
    private function getDietaryTags($slug): array
    {
        $tags = [];

        if (str_contains($slug, 'vegetable') || str_contains($slug, 'veggie') || str_contains($slug, 'salad')) {
            $tags[] = 'vegetarian';
        }

        if (str_contains($slug, 'chicken') || str_contains($slug, 'beef') || str_contains($slug, 'pork')) {
            $tags[] = 'halal'; // Assuming halal preparation
        }

        if (!str_contains($slug, 'gluten') && !str_contains($slug, 'bread')) {
            $tags[] = 'gluten-free';
        }

        return $tags;
    }

    /**
     * Basic translation helper (simplified)
     */
    private function translateDescription($desc): string
    {
        // Simple Khmer description
        return 'ម្ហូបឆ្ងាញ់ពិសេស';
    }

    /**
     * Get image path for menu item based on slug
     * Maps slugs to actual image files that exist in storage/app/public/menu_images/
     */
    private function getImagePath(string $slug): ?string
    {
        $imageMapping = [
            // APPETIZERS
            'fried-spring-rolls' => 'menu_images/spring-rolls.jpg',
            'fresh-spring-rolls' => 'menu_images/spring-rolls.jpg',
            'chicken-satay' => 'menu_images/chicken-satay.jpg',
            'fish-cakes' => 'menu_images/fish-cakes.jpg',
            'crab-cakes' => 'menu_images/fish-cakes.jpg', // proxy
            'stuffed-chicken-wings' => 'menu_images/grilled-chicken-wings.jpg', // proxy
            
            // COLD APPETIZERS
            'beef-salad-khmer' => 'menu_images/beef-salad.jpg',
            'seafood-salad' => 'menu_images/beef-salad.jpg', // proxy
            'cucumber-salad' => 'menu_images/lotus-stem-salad.jpg', // proxy
            'century-egg-tofu' => 'menu_images/spring-rolls.jpg', // fallback

            // DUMPLINGS
            'pork-dumplings' => 'menu_images/spring-rolls.jpg', // fallback
            'shrimp-dumplings' => 'menu_images/spring-rolls.jpg', // fallback
            'veggie-spring-rolls' => 'menu_images/spring-rolls.jpg',

            // PLATTERS
            'mixed-appetizer-platter' => 'menu_images/mixed-appetizer-platter.jpg',
            'seafood-platter' => 'menu_images/grilled-fish-banana-leaf.jpg', // proxy

            // RICE
            'chicken-fried-rice' => 'menu_images/grilled-pork-ribs.jpg', // proxy
            'shrimp-fried-rice' => 'menu_images/pad-thai.jpg', // proxy
            'crab-fried-rice' => 'menu_images/pad-thai.jpg', // proxy
            'pineapple-fried-rice' => 'menu_images/pad-thai.jpg', // proxy
            'vegetable-fried-rice' => 'menu_images/stir-fried-morning-glory.jpg', // proxy
            'special-fried-rice' => 'menu_images/grilled-pork-ribs.jpg', // proxy
            
            'grilled-pork-rice' => 'menu_images/grilled-pork-ribs.jpg',
            'grilled-chicken-rice' => 'menu_images/grilled-chicken-wings.jpg',
            'crispy-pork-belly-rice' => 'menu_images/grilled-pork-ribs.jpg', // proxy
            'duck-rice' => 'menu_images/grilled-chicken-wings.jpg', // proxy
            
            'chicken-clay-pot-rice' => 'menu_images/steamed-fish-ginger.jpg', // proxy
            'seafood-clay-pot-rice' => 'menu_images/steamed-fish-ginger.jpg', // proxy

            // NOODLES
            'num-banh-chok' => 'menu_images/khmer-noodle-soup.jpg',
            'kuy-teav' => 'menu_images/khmer-noodle-soup.jpg',
            'beef-pho' => 'menu_images/khmer-noodle-soup.jpg',
            'chicken-pho' => 'menu_images/khmer-noodle-soup.jpg', // proxy
            'tom-yum-noodles' => 'menu_images/khmer-noodle-soup.jpg', // proxy
            'wonton-noodle-soup' => 'menu_images/khmer-noodle-soup.jpg', // proxy

            'pad-thai' => 'menu_images/pad-thai.jpg',
            'pad-see-ew' => 'menu_images/pad-thai.jpg', // proxy
            'drunken-noodles' => 'menu_images/pad-thai.jpg', // proxy
            'singapore-noodles' => 'menu_images/pad-thai.jpg', // proxy
            'chow-mein' => 'menu_images/pad-thai.jpg', // proxy

            'mi-kola' => 'menu_images/pad-thai.jpg', // proxy
            'wonton-noodles-dry' => 'menu_images/pad-thai.jpg', // proxy

            // SOUPS
            'samlor-kako' => 'menu_images/sour-soup-fish.jpg', // proxy
            'samlor-machu-kroeung' => 'menu_images/sour-soup-fish.jpg', // proxy
            'chicken-coconut-soup' => 'menu_images/chicken-coconut-soup.jpg',
            'fish-sour-soup' => 'menu_images/sour-soup-fish.jpg',
            'seafood-tom-yum' => 'menu_images/sour-soup-fish.jpg', // proxy
            'prawn-soup' => 'menu_images/sour-soup-fish.jpg', // proxy
            'seafood-hot-pot' => 'menu_images/steamed-fish-ginger.jpg', // proxy
            'mixed-hot-pot' => 'menu_images/steamed-fish-ginger.jpg', // proxy

            // CURRIES
            'red-curry-chicken' => 'menu_images/tofu-curry.jpg',
            'red-curry-beef' => 'menu_images/tofu-curry.jpg',
            'red-curry-duck' => 'menu_images/tofu-curry.jpg',
            'green-curry-chicken' => 'menu_images/tofu-curry.jpg',
            'green-curry-seafood' => 'menu_images/tofu-curry.jpg',
            'green-curry-vegetables' => 'menu_images/tofu-curry.jpg',
            'fish-amok' => 'menu_images/steamed-fish-ginger.jpg', // proxy
            'chicken-amok' => 'menu_images/steamed-fish-ginger.jpg', // proxy
            'seafood-amok' => 'menu_images/steamed-fish-ginger.jpg', // proxy

            // GRILLED
            'grilled-beef' => 'menu_images/grilled-beef-lolot.jpg',
            'grilled-pork-ribs' => 'menu_images/grilled-pork-ribs.jpg',
            'lemongrass-chicken' => 'menu_images/grilled-chicken-wings.jpg', // proxy
            'grilled-pork-skewers' => 'menu_images/grilled-pork-ribs.jpg', // proxy
            'grilled-prawns' => 'menu_images/prawns-tamarind-sauce.jpg', // proxy
            'grilled-squid' => 'menu_images/prawns-tamarind-sauce.jpg', // proxy
            'grilled-fish' => 'menu_images/grilled-fish-banana-leaf.jpg',
            'grilled-crab' => 'menu_images/prawns-tamarind-sauce.jpg', // proxy

            // SATAY
            'chicken-satay-skewers' => 'menu_images/chicken-satay.jpg',
            'beef-satay' => 'menu_images/chicken-satay.jpg', // proxy
            'pork-satay' => 'menu_images/chicken-satay.jpg', // proxy

            // STIR FRY
            'mixed-vegetables' => 'menu_images/stir-fried-morning-glory.jpg', // proxy
            'morning-glory' => 'menu_images/stir-fried-morning-glory.jpg',
            'chinese-broccoli-oyster' => 'menu_images/stir-fried-morning-glory.jpg', // proxy
            'beef-black-pepper' => 'menu_images/grilled-beef-lolot.jpg', // proxy
            'chicken-cashew-nuts' => 'menu_images/chicken-satay.jpg', // proxy
            'pork-basil' => 'menu_images/grilled-beef-lolot.jpg', // proxy
            'beef-oyster-sauce' => 'menu_images/grilled-beef-lolot.jpg', // proxy
            'garlic-prawns' => 'menu_images/prawns-tamarind-sauce.jpg',
            'squid-black-pepper' => 'menu_images/prawns-tamarind-sauce.jpg', // proxy
            'crab-kampot-pepper' => 'menu_images/prawns-tamarind-sauce.jpg', // proxy
            'sweet-sour-fish' => 'menu_images/steamed-fish-ginger.jpg', // proxy

            // SALADS
            'banana-flower-salad' => 'menu_images/lotus-stem-salad.jpg', // proxy
            'lotus-stem-salad' => 'menu_images/lotus-stem-salad.jpg',
            'papaya-salad-classic' => 'menu_images/papaya-salad.jpg',
            'papaya-salad-seafood' => 'menu_images/papaya-salad.jpg',
            'papaya-salad-dried-shrimp' => 'menu_images/papaya-salad.jpg',
            'garden-salad' => 'menu_images/beef-salad.jpg', // proxy
            'caesar-salad' => 'menu_images/beef-salad.jpg', // proxy
            'mango-salad' => 'menu_images/beef-salad.jpg', // proxy

            // DESSERTS
            'sticky-rice-mango' => 'menu_images/sticky-rice-mango.jpg',
            'num-ansom-chek' => 'menu_images/sticky-rice-mango.jpg', // proxy
            'sweet-corn-pudding' => 'menu_images/coconut-custard.jpg', // proxy
            'pumpkin-custard' => 'menu_images/coconut-custard.jpg',
            'vanilla-ice-cream' => 'menu_images/coconut-ice-cream.jpg', // proxy
            'chocolate-ice-cream' => 'menu_images/chocolate-cake.jpg', // proxy
            'mango-shake' => 'menu_images/mango-ice-cream.jpg',
            'avocado-shake' => 'menu_images/coconut-ice-cream.jpg', // proxy
            'fresh-fruit-platter' => 'menu_images/mango-ice-cream.jpg', // proxy
            'dragonfruit-plate' => 'menu_images/mango-ice-cream.jpg', // proxy

            // DRINKS
            'orange-juice' => 'menu_images/fresh-orange-juice.jpg',
            'watermelon-juice' => 'menu_images/watermelon-juice.jpg',
            'sugarcane-juice' => 'menu_images/fresh-orange-juice.jpg', // proxy
            'lime-juice' => 'menu_images/fresh-orange-juice.jpg', // proxy
            'coconut-water' => 'menu_images/fresh-orange-juice.jpg', // proxy

            'mango-smoothie' => 'menu_images/mango-ice-cream.jpg', // proxy
            'strawberry-smoothie' => 'menu_images/watermelon-juice.jpg', // proxy
            'mixed-berry-smoothie' => 'menu_images/watermelon-juice.jpg', // proxy
            'green-smoothie' => 'menu_images/fresh-orange-juice.jpg', // proxy

            'cambodian-coffee' => 'menu_images/cambodian-coffee.jpg',
            'espresso' => 'menu_images/cambodian-coffee.jpg', // proxy
            'cappuccino' => 'menu_images/cambodian-coffee.jpg', // proxy
            'latte' => 'menu_images/cambodian-coffee.jpg', // proxy
            'green-tea' => 'menu_images/jasmine-tea.jpg', // proxy
            'jasmine-tea' => 'menu_images/jasmine-tea.jpg',

            'iced-coffee' => 'menu_images/iced-coffee.jpg',
            'iced-latte' => 'menu_images/iced-coffee.jpg', // proxy
            'thai-iced-tea' => 'menu_images/iced-coffee.jpg', // proxy
            'iced-lemon-tea' => 'menu_images/iced-coffee.jpg', // proxy
            'soft-drinks' => 'menu_images/soft-drinks.jpg',

            'angkor-beer' => 'menu_images/angkor-beer.jpg',
            'anchor-beer' => 'menu_images/angkor-beer.jpg', // proxy
            'heineken' => 'menu_images/angkor-beer.jpg', // proxy
            'red-wine-glass' => 'menu_images/house-wine-red.jpg',
            'white-wine-glass' => 'menu_images/house-wine-red.jpg', // proxy, use correct glass if visible
        ];

        return $imageMapping[$slug] ?? null;
    }
}
