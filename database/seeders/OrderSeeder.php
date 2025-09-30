<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\Location;
use Carbon\Carbon;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $customers = Customer::all();
        $tables = DiningTable::all();
        $locations = Location::all();
        
        $orderStatuses = ['pending', 'received', 'preparing', 'ready', 'completed', 'cancelled'];
        $orderTypes = ['dine_in', 'pickup', 'delivery'];
        
        // Generate orders for the last 3 months
        $startDate = Carbon::now()->subMonths(3);
        $endDate = Carbon::now();
        
        for ($i = 0; $i < 250; $i++) {
            $location = $locations->random();
            $customer = $customers->random();
            $orderType = $orderTypes[array_rand($orderTypes)];
            
            // Get table for dine-in orders
            $table = null;
            if ($orderType === 'dine_in') {
                $locationTables = $tables->where('floor.location_id', $location->id);
                $table = $locationTables->isNotEmpty() ? $locationTables->random() : null;
            }
            
            $orderDate = $this->randomDateBetween($startDate, $endDate);
            $status = $this->getOrderStatus($orderDate);
            
            Order::create([
                'location_id' => $location->id,
                'customer_id' => $customer->id,
                'table_id' => $table?->id,
                'order_number' => $this->generateOrderNumber($location->code, $orderDate),
                'order_type' => $orderType,
                'status' => $status,
                'subtotal' => $this->generateSubtotal(),
                'tax_amount' => $this->calculateTax($this->generateSubtotal()),
                'discount_amount' => $this->generateDiscount(),
                'total_amount' => $this->calculateTotal(),
                'special_instructions' => $this->getSpecialInstructions(),
                'estimated_ready_time' => $this->getEstimatedReadyTime($orderDate, $orderType),
                'ordered_at' => $orderDate,
                'completed_at' => $status === 'completed' ? $orderDate->addMinutes(rand(20, 60)) : null,
            ]);
        }
    }

    private function randomDateBetween(Carbon $start, Carbon $end): Carbon
    {
        $timestamp = rand($start->timestamp, $end->timestamp);
        return Carbon::createFromTimestamp($timestamp);
    }

    private function getOrderStatus(Carbon $orderDate): string
    {
        $hoursAgo = Carbon::now()->diffInHours($orderDate);
        
        if ($hoursAgo > 24) {
            return rand(0, 10) < 9 ? 'completed' : 'cancelled';
        } elseif ($hoursAgo > 2) {
            return ['completed', 'completed', 'completed', 'cancelled'][array_rand(['completed', 'completed', 'completed', 'cancelled'])];
        } else {
            return ['pending', 'received', 'preparing', 'ready', 'completed'][array_rand(['pending', 'received', 'preparing', 'ready', 'completed'])];
        }
    }

    private function generateOrderNumber(string $locationCode, Carbon $date): string
    {
        return $locationCode . '-' . $date->format('Ymd') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    }

    private function generateSubtotal(): float
    {
        return round(rand(1500, 8000) / 100, 2); // $15.00 to $80.00
    }

    private function calculateTax(float $subtotal): float
    {
        return round($subtotal * 0.10, 2); // 10% tax
    }

    private function generateDiscount(): float
    {
        return rand(0, 100) < 20 ? round(rand(200, 1000) / 100, 2) : 0.00; // 20% chance of discount
    }

    private function calculateTotal(): float
    {
        $subtotal = $this->generateSubtotal();
        $tax = $this->calculateTax($subtotal);
        $discount = $this->generateDiscount();
        
        return round($subtotal + $tax - $discount, 2);
    }

    private function getSpecialInstructions(): ?string
    {
        $instructions = [
            null, null, null, null, // 40% no instructions
            'No spicy please',
            'Extra vegetables',
            'Well done',
            'On the side',
            'No onions',
            'Extra sauce',
            'Less salt',
            'Gluten free preparation',
            'Vegetarian option',
            'Make it spicy',
        ];
        
        return $instructions[array_rand($instructions)];
    }

    private function getEstimatedReadyTime(Carbon $orderDate, string $orderType): ?Carbon
    {
        $minutes = match($orderType) {
            'dine_in' => rand(15, 30),
            'pickup' => rand(20, 35),
            'delivery' => rand(30, 50),
            default => rand(20, 30),
        };
        
        return $orderDate->copy()->addMinutes($minutes);
    }
}
