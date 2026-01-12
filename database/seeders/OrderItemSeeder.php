<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrderItem;
use App\Models\Order;
use App\Models\MenuItem;

class OrderItemSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::all();
        
        foreach ($orders as $order) {
            $itemCount = rand(1, 6); // 1 to 6 items per order
            $locationMenuItems = MenuItem::where('location_id', $order->location_id)->get();
            
            if ($locationMenuItems->isEmpty()) {
                continue;
            }
            
            $selectedItems = $locationMenuItems->random(min($itemCount, $locationMenuItems->count()));
            
            foreach ($selectedItems as $menuItem) {
                $quantity = rand(1, 3);
                $unitPrice = $menuItem->price;
                $costPrice = $menuItem->cost; // Capture cost at time of sale
                $totalPrice = $unitPrice * $quantity;
                
                // 10% chance of internal notes (e.g., void, spill, complaint)
                $notes = rand(1, 100) <= 5 ? $this->getInternalNotes() : null;

                OrderItem::create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'cost_price' => $costPrice,
                    'total_price' => $totalPrice,
                    'special_instructions' => $this->getItemInstructions(),
                    'notes' => $notes,
                ]);
            }
            
            // Update order totals based on actual items
            $this->updateOrderTotals($order);
        }
    }

    private function getInternalNotes(): string
    {
        $notes = [
            'Customer complained about temperature',
            'Spilled in kitchen - remade',
            'Complimentary item for birthday',
            'Employee meal',
            'Test order',
            'Voided item re-entered',
        ];
        return $notes[array_rand($notes)];
    }

    private function getItemInstructions(): ?string
    {
        $instructions = [
            null, null, null, null, null, // 50% no instructions
            'Extra spicy',
            'Mild spice',
            'No vegetables',
            'Extra sauce',
            'Well done',
            'Medium rare',
            'On the side',
            'Extra cheese',
            'No onions',
            'Extra herbs',
        ];
        
        return $instructions[array_rand($instructions)];
    }

    private function updateOrderTotals(Order $order): void
    {
        $orderItems = OrderItem::where('order_id', $order->id)->get();
        $subtotal = $orderItems->sum('total_price');
        $taxAmount = round($subtotal * 0.10, 2); // 10% tax
        $discountAmount = $order->discount_amount; // Keep existing discount
        $totalAmount = round($subtotal + $taxAmount - $discountAmount, 2);
        
        $order->update([
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount,
        ]);
    }
}
