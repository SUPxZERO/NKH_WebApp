<?php

namespace Database\Seeders\Prod;

use Illuminate\Database\Seeder;
use App\Models\DiningTable;
use App\Models\Floor;
use App\Models\Location;

class TableSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::where('is_active', true)->get();
        if ($locations->isEmpty()) return;
        
        $tableStatuses = ['available', 'reserved', 'occupied', 'unavailable'];
        $capacities = [2, 4, 6, 8];
        
        foreach ($locations as $location) {
            $floors = Floor::where('location_id', $location->id)->get();

            foreach ($floors as $floor) {
                $tableCount = $this->getTableCountForFloor($floor->name);
                
                for ($i = 1; $i <= $tableCount; $i++) {
                    $capacity = $capacities[array_rand($capacities)];
                    // Default to available for fresh seed, operations will change status
                    $status = 'available'; 
                    
                    DiningTable::updateOrCreate(
                        [
                            'location_id' => $location->id,
                            'floor_id' => $floor->id,
                            'code' => $this->generateTableCode($floor, $i),
                        ],
                        [
                            'table_number' => 'T-' . $i, // Add readable number
                            'capacity' => $capacity,
                            'status' => $status,
                            'x_position' => rand(50, $floor->map_width ?? 800 - 50),
                            'y_position' => rand(50, $floor->map_height ?? 600 - 50),
                        ]
                    );
                }
            }
        }
    }

    private function getTableCountForFloor(string $floorName): int
    {
        return match($floorName) {
            'Ground Floor' => 12,
            'Second Floor' => 10,
            'Terrace' => 8,
            'VIP Floor' => 6,
            'Garden' => 14,
            'Riverside Deck' => 12,
            default => 10,
        };
    }

    private function generateTableCode(Floor $floor, int $tableNumber): string
    {
        $floorCode = match($floor->name) {
            'Ground Floor' => 'GF',
            'Second Floor' => '2F',
            'Terrace' => 'TR',
            'VIP Floor' => 'VIP',
            'Garden' => 'GD',
            'Riverside Deck' => 'RD',
            default => 'FL',
        };
        
        return $floorCode . '-' . str_pad($tableNumber, 2, '0', STR_PAD_LEFT);
    }
}
