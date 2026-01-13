<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'slug' => $this->faker->unique()->slug,
            'is_active' => true,
            'display_order' => $this->faker->numberBetween(1, 10),
            'image' => null,
            'parent_id' => null,
            'location_id' => \App\Models\Location::factory(),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Category $category) {
            \App\Models\CategoryTranslation::create([
                'category_id' => $category->id,
                'locale' => 'en',
                'name' => ucfirst($this->faker->word),
                'description' => $this->faker->sentence,
            ]);
        });
    }
}
