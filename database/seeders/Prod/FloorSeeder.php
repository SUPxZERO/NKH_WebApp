<?php

namespace Database\Seeders\Prod;

use Illuminate\Database\Seeder;
use App\Models\Floor;
use App\Models\Location;

class FloorSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::where('is_active', true)->get();
        
        foreach ($locations as $location) {
            $floors = [
                [
                    'name' => 'Ground Floor',
                    'display_order' => 1,
                    'is_active' => true,
                    'map_width' => 800,
                    'map_height' => 600,
                ],
                [
                    'name' => 'Second Floor',
                    'display_order' => 2,
                    'is_active' => true,
                    'map_width' => 800,
                    'map_height' => 600,
                ],
                [
                    'name' => 'Terrace',
                    'display_order' => 3,
                    'is_active' => true,
                    'map_width' => 600,
                    'map_height' => 400,
                ],
            ];

            // Add VIP floor for flagship location
            if ($location->code === 'NKH-DT') {
                $floors[] = [
                    'name' => 'VIP Floor',
                    'display_order' => 4,
                    'is_active' => true,
                    'map_width' => 500,
                    'map_height' => 400,
                ];
            }

            // Add Garden for Siem Reap
            if ($location->code === 'NKH-SR') {
                $floors[] = [
                    'name' => 'Garden',
                    'display_order' => 0, // Ground level outside
                    'is_active' => true,
                    'map_width' => 1000,
                    'map_height' => 800,
                ];
            }

             // Add Riverside Deck for Kampot
             if ($location->code === 'NKH-KP') {
                $floors[] = [
                    'name' => 'Riverside Deck',
                    'display_order' => 0,
                    'is_active' => true,
                    'map_width' => 900,
                    'map_height' => 400,
                ];
            }

            foreach ($floors as $floor) {
                Floor::updateOrCreate(
                    [
                        'location_id' => $location->id,
                        'name' => $floor['name'],
                    ],
                    array_diff_key($floor, ['name' => ''])
                );
            }
        }
    }
}
