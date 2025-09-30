<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DiningTable;
use App\Models\Floor;

class TableSeeder extends Seeder
{
    public function run(): void
    {
        $floors = Floor::all();
        
        $tableStatuses = ['available', 'reserved', 'occupied', 'unavailable'];
        $capacities = [2, 4, 6, 8];
        
        foreach ($floors as $floor) {
            $tableCount = $this->getTableCountForFloor($floor->name);
            
            for ($i = 1; $i <= $tableCount; $i++) {
                $capacity = $capacities[array_rand($capacities)];
                $status = $this->getTableStatus($i, $tableCount);
                
                DiningTable::create([
                    'floor_id' => $floor->id,
                    'code' => $this->generateTableCode($floor, $i),
                    'capacity' => $capacity,
                    'status' => $status,
                ]);
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
            default => 'FL',
        };
        
        return $floorCode . '-' . str_pad($tableNumber, 2, '0', STR_PAD_LEFT);
    }

    private function getTableStatus(int $tableNumber, int $totalTables): string
    {
        // Create realistic distribution of table statuses
        $ratio = $tableNumber / $totalTables;
        
        if ($ratio <= 0.6) {
            return 'available';
        } elseif ($ratio <= 0.8) {
            return 'occupied';
        } elseif ($ratio <= 0.9) {
            return 'reserved';
        } else {
            return rand(0, 1) ? 'available' : 'unavailable';
        }
    }
}
