<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Position;

class PositionSeeder extends Seeder
{
    public function run(): void
    {
        $positions = [
            [
                'title' => 'General Manager',
                'description' => 'Overall restaurant operations management',
                'is_active' => true,
            ],
            [
                'title' => 'Assistant Manager',
                'description' => 'Assists in daily operations and staff supervision',
                'is_active' => true,
            ],
            [
                'title' => 'Head Chef',
                'description' => 'Kitchen operations and menu development',
                'is_active' => true,
            ],
            [
                'title' => 'Sous Chef',
                'description' => 'Assists head chef and manages kitchen staff',
                'is_active' => true,
            ],
            [
                'title' => 'Line Cook',
                'description' => 'Food preparation and cooking',
                'is_active' => true,
            ],
            [
                'title' => 'Prep Cook',
                'description' => 'Food preparation and ingredient prep',
                'is_active' => true,
            ],
            [
                'title' => 'Head Waiter',
                'description' => 'Supervises wait staff and ensures service quality',
                'is_active' => true,
            ],
            [
                'title' => 'Waiter',
                'description' => 'Customer service and order taking',
                'is_active' => true,
            ],
            [
                'title' => 'Bartender',
                'description' => 'Beverage preparation and bar service',
                'is_active' => true,
            ],
            [
                'title' => 'Cashier',
                'description' => 'Payment processing and customer checkout',
                'is_active' => true,
            ],
            [
                'title' => 'Host/Hostess',
                'description' => 'Guest greeting and seating coordination',
                'is_active' => true,
            ],
            [
                'title' => 'Dishwasher',
                'description' => 'Kitchen cleaning and dishware maintenance',
                'is_active' => true,
            ],
            [
                'title' => 'Cleaner',
                'description' => 'Restaurant cleaning and maintenance',
                'is_active' => true,
            ],
        ];

        foreach ($positions as $position) {
            Position::create($position);
        }
    }
}
