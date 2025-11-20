<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\Location;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Main Categories
        $appetizers = Category::create([
            'location_id' => 1,
            'slug' => 'appetizers',
            'display_order' => 1,
            'is_active' => true,
        ]);
        
        $appetizers->translations()->create([
            'locale' => 'en',
            'name' => 'Appetizers',
            'description' => 'Start your meal with our delicious appetizers'
        ]);
        
        $appetizers->translations()->create([
            'locale' => 'km',
            'name' => 'បុព្វាហារ',
            'description' => 'ចាប់ផ្តើមអាហាររបស់អ្នកជាមួយបុព្វាហារដ៏ឆ្ងាញ់របស់យើង'
        ]);

        $mainDishes = Category::create([
            'location_id' => 1,
            'slug' => 'main-dishes',
            'display_order' => 2,
            'is_active' => true,
            'image' => 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
        ]);
        
        $mainDishes->translations()->create([
            'locale' => 'en',
            'name' => 'Main Dishes',
            'description' => 'Experience our selection of hearty main dishes'
        ]);
        
        $mainDishes->translations()->create([
            'locale' => 'km',
            'name' => 'មុខម្ហូបសំខាន់ៗ',
            'description' => 'សូមស្វាគមន៍មកកាន់ជម្រើសម្ហូបអាហារដ៏ឆ្ងាញ់របស់យើង'
        ]);

        $soups = Category::create([
            'location_id' => 1,
            'parent_id' => null,
            'slug' => 'soups-salads',
            'display_order' => 3,
            'is_active' => true,
            'image' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop',
        ]);
        
        $soups->translations()->create([
            'locale' => 'en',
            'name' => 'Soups & Salads',
            'description' => 'Fresh salads and warming soups'
        ]);
        
        $soups->translations()->create([
            'locale' => 'km',
            'name' => 'ស៊ុប និងសាឡាត់',
            'description' => 'សាឡាត់ស្រស់ៗ និងស៊ុបក្តៅៗ'
        ]);

        $desserts = Category::create([
            'location_id' => 1,
            'parent_id' => null,
            'slug' => 'desserts',
            'display_order' => 4,
            'is_active' => true,
            'image' => 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
        ]);
        
        $desserts->translations()->create([
            'locale' => 'en',
            'name' => 'Desserts',
            'description' => 'Sweet treats to end your meal perfectly'
        ]);
        
        $desserts->translations()->create([
            'locale' => 'km',
            'name' => 'បង្អែម',
            'description' => 'បង្អែមផ្អែមៗដើម្បីបញ្ចប់អាហាររបស់អ្នកយ៉ាងឥតខ្ចោះ'
        ]);

        $beverages = Category::create([
            'location_id' => 1,
            'parent_id' => null,
            'slug' => 'beverages',
            'display_order' => 5,
            'is_active' => true,
            'image' => 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop',
        ]);
        
        $beverages->translations()->create([
            'locale' => 'en',
            'name' => 'Beverages',
            'description' => 'Refresh yourself with our selection of drinks'
        ]);
        
        $beverages->translations()->create([
            'locale' => 'km',
            'name' => 'ភេសជ្ជៈ',
            'description' => 'បំពេញថាមពលជាមួយជម្រើសភេសជ្ជៈរបស់យើង'
        ]);

        // Menu Items for Appetizers
        $hotAppetizers = Category::create([
            'location_id' => 1,
            'parent_id' => $appetizers->id,
            'slug' => 'hot-appetizers',
            'display_order' => 1,
            'is_active' => true,
        ]);
        
        $hotAppetizers->translations()->create([
            'locale' => 'en',
            'name' => 'Hot Appetizers',
            'description' => 'Warm and delicious starters'
        ]);
        
        $hotAppetizers->translations()->create([
            'locale' => 'km',
            'name' => 'បុព្វាហារក្តៅ',
            'description' => 'បុព្វាហារក្តៅៗ និងឆ្ងាញ់'
        ]);

        $coldAppetizers = Category::create([
            'location_id' => 1,
            'parent_id' => $appetizers->id,
            'slug' => 'cold-appetizers',
            'display_order' => 2,
            'is_active' => true,
        ]);
        
        $coldAppetizers->translations()->create([
            'locale' => 'en',
            'name' => 'Cold Appetizers',
            'description' => 'Refreshing cold starters'
        ]);
        
        $coldAppetizers->translations()->create([
            'locale' => 'km',
            'name' => 'បុព្វាហារត្រជាក់',
            'description' => 'បុព្វាហារត្រជាក់ស្រស់ៗ'
        ]);

        $sharingPlatters = Category::create([
            'location_id' => 1,
            'parent_id' => $appetizers->id,
            'slug' => 'sharing-platters',
            'display_order' => 3,
            'is_active' => true,
        ]);
        
        $sharingPlatters->translations()->create([
            'locale' => 'en',
            'name' => 'Sharing Platters',
            'description' => 'Perfect for sharing with friends and family'
        ]);
        
        $sharingPlatters->translations()->create([
            'locale' => 'km',
            'name' => 'ចានចែករំលែក',
            'description' => 'ល្អឥតខ្ចោះសម្រាប់ចែករំលែកជាមួយមិត្តភក្តិ និងគ្រួសារ'
        ]);

        // Menu Items for Main Dishes
        $grilledSpecialties = Category::create([
            'location_id' => 1,
            'parent_id' => $mainDishes->id,
            'slug' => 'grilled-specialties',
            'display_order' => 1,
            'is_active' => true,
        ]);
        
        $grilledSpecialties->translations()->create([
            'locale' => 'en',
            'name' => 'Grilled Specialties',
            'description' => 'Our signature grilled dishes'
        ]);
        
        $grilledSpecialties->translations()->create([
            'locale' => 'km',
            'name' => 'ម្ហូបអាំង',
            'description' => 'ម្ហូបអាំងពិសេសរបស់យើង'
        ]);

        $pastaNoodles = Category::create([
            'location_id' => 1,
            'parent_id' => $mainDishes->id,
            'slug' => 'pasta-noodles',
            'display_order' => 2,
            'is_active' => true,
        ]);
        
        $pastaNoodles->translations()->create([
            'locale' => 'en',
            'name' => 'Pasta & Noodles',
            'description' => 'Selection of pasta and noodle dishes'
        ]);
        
        $pastaNoodles->translations()->create([
            'locale' => 'km',
            'name' => 'ប៉ាស្តា និងមី',
            'description' => 'ជម្រើសម្ហូបប៉ាស្តា និងមី'
        ]);

        $seafood = Category::create([
            'location_id' => 1,
            'parent_id' => $mainDishes->id,
            'slug' => 'seafood',
            'display_order' => 3,
            'is_active' => true,
        ]);
        
        $seafood->translations()->create([
            'locale' => 'en',
            'name' => 'Seafood',
            'description' => 'Fresh seafood dishes'
        ]);
        
        $seafood->translations()->create([
            'locale' => 'km',
            'name' => 'អាហារសមុទ្រ',
            'description' => 'អាហារសមុទ្រស្រស់ៗ'
        ]);

        $vegetarian = Category::create([
            'location_id' => 1,
            'parent_id' => $mainDishes->id,
            'slug' => 'vegetarian',
            'display_order' => 4,
            'is_active' => true,
        ]);
        
        $vegetarian->translations()->create([
            'locale' => 'en',
            'name' => 'Vegetarian',
            'description' => 'Delicious vegetarian options'
        ]);
        
        $vegetarian->translations()->create([
            'locale' => 'km',
            'name' => 'អាហារបន្លែ',
            'description' => 'ជម្រើសអាហារបន្លែដ៏ឆ្ងាញ់'
        ]);

        // Menu Items for Soups & Salads
        $traditionalSoups = Category::create([
            'location_id' => 1,
            'parent_id' => $soups->id,
            'slug' => 'traditional-soups',
            'display_order' => 1,
            'is_active' => true,
        ]);
        
        $traditionalSoups->translations()->create([
            'locale' => 'en',
            'name' => 'Traditional Soups',
            'description' => 'Classic Khmer soups'
        ]);
        
        $traditionalSoups->translations()->create([
            'locale' => 'km',
            'name' => 'ស៊ុបប្រពៃណី',
            'description' => 'ស៊ុបប្រពៃណីខ្មែរ'
        ]);

        $freshSalads = Category::create([
            'location_id' => 1,
            'parent_id' => $soups->id,
            'slug' => 'fresh-salads',
            'display_order' => 2,
            'is_active' => true,
        ]);
        
        $freshSalads->translations()->create([
            'locale' => 'en',
            'name' => 'Fresh Salads',
            'description' => 'Light and refreshing salads'
        ]);
        
        $freshSalads->translations()->create([
            'locale' => 'km',
            'name' => 'សាឡាត់ស្រស់',
            'description' => 'សាឡាត់ស្រស់ស្រូប'
        ]);

        // Menu Items for Desserts
        $traditionalDesserts = Category::create([
            'location_id' => 1,
            'parent_id' => $desserts->id,
            'slug' => 'traditional-desserts',
            'display_order' => 1,
            'is_active' => true,
        ]);
        
        $traditionalDesserts->translations()->create([
            'locale' => 'en',
            'name' => 'Traditional Desserts',
            'description' => 'Classic Khmer desserts'
        ]);
        
        $traditionalDesserts->translations()->create([
            'locale' => 'km',
            'name' => 'បង្អែមប្រពៃណី',
            'description' => 'បង្អែមប្រពៃណីខ្មែរ'
        ]);

        $iceCream = Category::create([
            'location_id' => 1,
            'parent_id' => $desserts->id,
            'slug' => 'ice-cream',
            'display_order' => 2,
            'is_active' => true,
        ]);
        
        $iceCream->translations()->create([
            'locale' => 'en',
            'name' => 'Ice Cream',
            'description' => 'Cool and creamy ice cream treats'
        ]);
        
        $iceCream->translations()->create([
            'locale' => 'km',
            'name' => 'ការ៉េម',
            'description' => 'ការ៉េមត្រជាក់ស្រួយ'
        ]);

        $cakesPastries = Category::create([
            'location_id' => 1,
            'parent_id' => $desserts->id,
            'slug' => 'cakes-pastries',
            'display_order' => 3,
            'is_active' => true,
        ]);
        
        $cakesPastries->translations()->create([
            'locale' => 'en',
            'name' => 'Cakes & Pastries',
            'description' => 'Fresh baked cakes and pastries'
        ]);
        
        $cakesPastries->translations()->create([
            'locale' => 'km',
            'name' => 'នំ និងប៉េស្ទ្រី',
            'description' => 'នំ និងប៉េស្ទ្រីដុតថ្មីៗ'
        ]);

        // Menu Items for Beverages
        $hotBeverages = Category::create([
            'location_id' => 1,
            'parent_id' => $beverages->id,
            'slug' => 'hot-beverages',
            'display_order' => 1,
            'is_active' => true,
        ]);
        
        $hotBeverages->translations()->create([
            'locale' => 'en',
            'name' => 'Hot Beverages',
            'description' => 'Warming drinks and hot beverages'
        ]);
        
        $hotBeverages->translations()->create([
            'locale' => 'km',
            'name' => 'ភេសជ្ជៈក្តៅ',
            'description' => 'ភេសជ្ជៈក្តៅៗ'
        ]);

        $coldBeverages = Category::create([
            'location_id' => 1,
            'parent_id' => $beverages->id,
            'slug' => 'cold-beverages',
            'display_order' => 2,
            'is_active' => true,
        ]);
        
        $coldBeverages->translations()->create([
            'locale' => 'en',
            'name' => 'Cold Beverages',
            'description' => 'Refreshing cold drinks'
        ]);
        
        $coldBeverages->translations()->create([
            'locale' => 'km',
            'name' => 'ភេសជ្ជៈត្រជាក់',
            'description' => 'ភេសជ្ជៈត្រជាក់ស្រស់ស្រូប'
        ]);

        $freshJuices = Category::create([
            'location_id' => 1,
            'parent_id' => $beverages->id,
            'slug' => 'fresh-juices',
            'display_order' => 3,
            'is_active' => true,
        ]);
        
        $freshJuices->translations()->create([
            'locale' => 'en',
            'name' => 'Fresh Juices',
            'description' => 'Freshly squeezed fruit juices'
        ]);
        
        $freshJuices->translations()->create([
            'locale' => 'km',
            'name' => 'ទឹកផ្លែឈើស្រស់',
            'description' => 'ទឹកផ្លែឈើច្របាច់ស្រស់ៗ'
        ]);

        $alcoholicBeverages = Category::create([
            'location_id' => 1,
            'parent_id' => $beverages->id,
            'slug' => 'alcoholic-beverages',
            'display_order' => 4,
            'is_active' => true,
        ]);
        
        $alcoholicBeverages->translations()->create([
            'locale' => 'en',
            'name' => 'Alcoholic Beverages',
            'description' => 'Selection of beer, wine and spirits'
        ]);
        
        $alcoholicBeverages->translations()->create([
            'locale' => 'km',
            'name' => 'ភេសជ្ជៈមានជាតិស្រា',
            'description' => 'ជម្រើសស្រាបៀរ ស្រាទំពាំងបាយជូរ និងស្រា'
        ]);
    }
}