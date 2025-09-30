<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Floor;
use App\Models\Location;

class FloorSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::all();
        
        foreach ($locations as $location) {
            $floors = [
                [
                    'name' => 'Ground Floor',
                    'display_order' => 1,
                    'is_active' => true,
                ],
                [
                    'name' => 'Second Floor',
                    'display_order' => 2,
                    'is_active' => true,
                ],
                [
                    'name' => 'Terrace',
                    'display_order' => 3,
                    'is_active' => true,
                ],
            ];

            // Add VIP floor for flagship location
            if ($location->code === 'NKH-DT') {
                $floors[] = [
                    'name' => 'VIP Floor',
                    'display_order' => 4,
                    'is_active' => true,
                ];
            }

            foreach ($floors as $floor) {
                Floor::create(array_merge($floor, [
                    'location_id' => $location->id,
                ]));
            }
        }
    }
}
