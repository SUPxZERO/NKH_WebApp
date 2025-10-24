<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\MenuTranslation;
use Illuminate\Database\Seeder;

class MenuTranslationSeeder extends Seeder
{
    public function run(): void
    {
        $translations = [
            'Spring Rolls' => [
                'en' => [
                    'name' => 'Spring Rolls',
                    'description' => 'Crispy vegetable spring rolls with sweet chili sauce'
                ],
                'km' => [
                    'name' => 'នំប្រោងចៀន',
                    'description' => 'នំប្រោងចៀនបន្លែដែលមានរសជាតិឆ្ងាញ់ជាមួយទឹកជ្រលក់ផ្អែមហឹរ'
                ]
            ],
            'Fish Cakes' => [
                'en' => [
                    'name' => 'Fish Cakes',
                    'description' => 'Traditional Khmer fish cakes with cucumber relish'
                ],
                'km' => [
                    'name' => 'ត្រីចៀន',
                    'description' => 'ត្រីចៀនតាមបែបខ្មែរជាមួយត្រសក់ជ្រក់'
                ]
            ],
            'Mixed Grill Platter' => [
                'en' => [
                    'name' => 'Mixed Grill Platter',
                    'description' => 'Selection of grilled meats and seafood with dipping sauces'
                ],
                'km' => [
                    'name' => 'ចានអាំងចម្រុះ',
                    'description' => 'ជម្រើសនៃសាច់ និងអាហារសមុទ្រអាំងជាមួយទឹកជ្រលក់'
                ]
            ],
            'Grilled Lemongrass Chicken' => [
                'en' => [
                    'name' => 'Grilled Lemongrass Chicken',
                    'description' => 'Char-grilled chicken marinated in lemongrass and Khmer spices'
                ],
                'km' => [
                    'name' => 'មាន់អាំងស្លឹកគ្រៃ',
                    'description' => 'មាន់អាំងជាមួយស្លឹកគ្រៃ និងគ្រឿងទេសខ្មែរ'
                ]
            ],
            'Samlor Machu Trey' => [
                'en' => [
                    'name' => 'Samlor Machu Trey',
                    'description' => 'Sour fish soup with morning glory and pineapple'
                ],
                'km' => [
                    'name' => 'សម្លម្ជូរត្រី',
                    'description' => 'សម្លម្ជូរត្រីជាមួយត្រកួន និងម្នាស់'
                ]
            ],
            'Iced Lemon Tea' => [
                'en' => [
                    'name' => 'Iced Lemon Tea',
                    'description' => 'Fresh brewed tea with lemon and honey'
                ],
                'km' => [
                    'name' => 'តែក្រូចឆ្មាទឹកកក',
                    'description' => 'តែស្រស់ជាមួយក្រូចឆ្មា និងទឹកឃ្មុំ'
                ]
            ]
        ];

        foreach (MenuItem::all() as $menuItem) {
            if (isset($translations[$menuItem->name])) {
                foreach ($translations[$menuItem->name] as $locale => $data) {
                    MenuTranslation::create([
                        'menu_item_id' => $menuItem->id,
                        'locale' => $locale,
                        'name' => $data['name'],
                        'description' => $data['description']
                    ]);
                }
            }
        }
    }
}