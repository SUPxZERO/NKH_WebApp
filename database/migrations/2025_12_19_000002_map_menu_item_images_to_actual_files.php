<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Map menu item slugs to actual image files that exist
        // The seeder creates items with slugs, but the actual images have different names

        $imageMapping = [
            'angkor-beer' => 'angkor-beer.jpg',
            'beef-salad-khmer' => 'beef-salad.jpg',
            'cambodian-coffee' => 'cambodian-coffee.jpg',
            'chicken-coconut-soup' => 'chicken-coconut-soup.jpg',
            'chicken-satay' => 'chicken-satay.jpg',
            'chicken-satay-skewers' => 'chicken-satay.jpg',
            'chocolate-cake' => 'chocolate-cake.jpg',
            'pumpkin-custard' => 'coconut-custard.jpg',
            'chocolate-ice-cream' => 'chocolate-ice-cream.jpg',
            'coconut-ice-cream' => 'coconut-ice-cream.jpg',
            'fish-cakes' => 'fish-cakes.jpg',
            'orange-juice' => 'fresh-orange-juice.jpg',
            'grilled-beef' => 'grilled-beef-lolot.jpg',
            'grilled-chicken-wings' => 'grilled-chicken-wings.jpg',
            'grilled-fish' => 'grilled-fish-banana-leaf.jpg',
            'grilled-pork-ribs' => 'grilled-pork-ribs.jpg',
            'red-wine-glass' => 'house-wine-red.jpg',
            'iced-coffee' => 'iced-coffee.jpg',
            'jasmine-tea' => 'jasmine-tea.jpg',
            'khmer-noodle-soup' => 'khmer-noodle-soup.jpg',
            'lotus-stem-salad' => 'lotus-stem-salad.jpg',
            'mango-ice-cream' => 'mango-ice-cream.jpg',
            'mixed-appetizer-platter' => 'mixed-appetizer-platter.jpg',
            'pad-thai' => 'pad-thai.jpg',
            'papaya-salad-classic' => 'papaya-salad.jpg',
            'garlic-prawns' => 'prawns-tamarind-sauce.jpg',
            'grilled-prawns' => 'prawns-tamarind-sauce.jpg',
            'soft-drinks' => 'soft-drinks.jpg',
            'fish-sour-soup' => 'sour-soup-fish.jpg',
            'spaghetti-carbonara' => 'spaghetti-carbonara.jpg',
            'spring-rolls' => 'spring-rolls.jpg',
            'fresh-spring-rolls' => 'spring-rolls.jpg',
            'fried-spring-rolls' => 'spring-rolls.jpg',
            'steamed-fish' => 'steamed-fish-ginger.jpg',
            'sticky-rice-mango' => 'sticky-rice-mango.jpg',
            'morning-glory' => 'stir-fried-morning-glory.jpg',
            'tofu-curry' => 'tofu-curry.jpg',
            'green-curry-vegetables' => 'tofu-curry.jpg',
            'watermelon-juice' => 'watermelon-juice.jpg',
        ];

        foreach ($imageMapping as $slug => $imageFile) {
            DB::table('menu_items')
                ->where('slug', $slug)
                ->update([
                    'image_path' => 'menu_images/' . $imageFile
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to null or keep as-is
    }
};
