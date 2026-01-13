<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\MenuItem;
use Illuminate\Database\Eloquent\Factories\Factory;

class MenuItemFactory extends Factory
{
    protected $model = MenuItem::class;

    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'slug' => $this->faker->unique()->slug,
            'price' => $this->faker->randomFloat(2, 5, 50),
            'is_active' => true,
            'prep_time' => $this->faker->numberBetween(5, 30),
            'calories' => $this->faker->numberBetween(100, 1000),
            'image_path' => null,
            'is_featured' => $this->faker->boolean(10),
            'location_id' => \App\Models\Location::factory(),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (MenuItem $menuItem) {
            \App\Models\MenuItemTranslation::create([
                'menu_item_id' => $menuItem->id,
                'locale' => 'en',
                'name' => $this->faker->words(3, true),
                'description' => $this->faker->sentence,
            ]);
        });
    }
}
