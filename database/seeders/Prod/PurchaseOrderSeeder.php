<?php

namespace Database\Seeders\Prod;

use Illuminate\Database\Seeder;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Ingredient;
use App\Models\Location;
use App\Models\User;

class PurchaseOrderSeeder extends Seeder
{
    public function run(): void
    {
        $locations = Location::where('is_active', true)->get();
        $suppliers = Supplier::where('is_active', true)->get();
        $ingredients = Ingredient::all();
        $adminUser = User::where('email', 'admin@nkh.com')->first() ?? User::first();

        if ($locations->isEmpty() || $suppliers->isEmpty() || $ingredients->isEmpty() || !$adminUser) {
            $this->command->warn('Missing required data for PurchaseOrderSeeder');
            return;
        }

        $location = $locations->first();
        $poNumber = 1000;

        // Create 20 purchase orders with varying statuses and dates
        $orderConfigs = [
            // Recent received orders
            ['status' => 'received', 'daysAgo' => 2, 'itemCount' => rand(5, 10)],
            ['status' => 'received', 'daysAgo' => 5, 'itemCount' => rand(4, 8)],
            ['status' => 'received', 'daysAgo' => 7, 'itemCount' => rand(6, 12)],
            ['status' => 'received', 'daysAgo' => 10, 'itemCount' => rand(3, 7)],
            ['status' => 'received', 'daysAgo' => 15, 'itemCount' => rand(5, 9)],
            ['status' => 'received', 'daysAgo' => 20, 'itemCount' => rand(4, 8)],
            ['status' => 'received', 'daysAgo' => 25, 'itemCount' => rand(6, 11)],
            ['status' => 'received', 'daysAgo' => 30, 'itemCount' => rand(5, 10)],
            
            // Pending orders (awaiting approval/supplier)
            ['status' => 'pending', 'daysAgo' => 1, 'itemCount' => rand(4, 9)],
            ['status' => 'pending', 'daysAgo' => 3, 'itemCount' => rand(5, 10)],
            ['status' => 'pending', 'daysAgo' => 4, 'itemCount' => rand(3, 7)],
            
            // Partial deliveries
            ['status' => 'partially_received', 'daysAgo' => 2, 'itemCount' => rand(5, 12)],
            ['status' => 'partially_received', 'daysAgo' => 6, 'itemCount' => rand(4, 8)],
            ['status' => 'partially_received', 'daysAgo' => 8, 'itemCount' => rand(6, 10)],
            
            // Draft orders (being prepared)
            ['status' => 'draft', 'daysAgo' => 0, 'itemCount' => rand(3, 6)],
            ['status' => 'draft', 'daysAgo' => 1, 'itemCount' => rand(4, 8)],
            
            // Cancelled orders
            ['status' => 'cancelled', 'daysAgo' => 12, 'itemCount' => rand(3, 7)],
            ['status' => 'cancelled', 'daysAgo' => 18, 'itemCount' => rand(4, 6)],
            
            // Older received orders
            ['status' => 'received', 'daysAgo' => 45, 'itemCount' => rand(5, 10)],
            ['status' => 'received', 'daysAgo' => 60, 'itemCount' => rand(6, 12)],
        ];
        
        foreach ($orderConfigs as $config) {
            $supplier = $suppliers->random();
            $orderDate = now()->subDays($config['daysAgo']);
            $status = $config['status'];
            
            // Get ingredients from this supplier or random if none
            $supplierIngredients = $ingredients->where('supplier_id', $supplier->id);
            if ($supplierIngredients->isEmpty()) {
                $supplierIngredients = $ingredients->random(min($ingredients->count(), $config['itemCount']));
            } else {
                $supplierIngredients = $supplierIngredients->random(min($supplierIngredients->count(), $config['itemCount']));
            }

            $subtotal = 0;
            $items = [];

            foreach ($supplierIngredients as $ingredient) {
                $quantity = rand(10, 150);
                $unitPrice = $ingredient->cost_per_unit;
                $total = $quantity * $unitPrice;
                $subtotal += $total;

                // Determine received quantity based on status
                $receivedQty = 0;
                if ($status === 'received') {
                    $receivedQty = $quantity;
                } elseif ($status === 'partially_received') {
                    $receivedQty = rand(ceil($quantity * 0.3), ceil($quantity * 0.8));
                }

                $items[] = [
                    'ingredient_id' => $ingredient->id,
                    'quantity_ordered' => $quantity,
                    'unit_price' => $unitPrice,
                    'total' => $total,
                    'quantity_received' => $receivedQty,
                ];
            }

            $taxTotal = $subtotal * 0.10; // 10% tax
            $total = $subtotal + $taxTotal;

            // Determine delivery dates
            $expectedDelivery = $orderDate->copy()->addDays(rand(3, 7));
            $receivedDate = null;
            $receivedAt = null;
            
            if ($status === 'received') {
                $receivedDate = $orderDate->copy()->addDays(rand(3, 8));
                $receivedAt = $receivedDate;
            } elseif ($status === 'partially_received') {
                $receivedDate = $orderDate->copy()->addDays(rand(3, 7));
                $receivedAt = $receivedDate;
            }

            // Generate notes based on status
            $notes = '';
            switch ($status) {
                case 'draft':
                    $notes = 'Draft order - pending review and approval';
                    break;
                case 'pending':
                    $notes = 'Order submitted - awaiting supplier confirmation';
                    break;
                case 'partially_received':
                    $notes = 'Partial delivery received - remaining items expected soon';
                    break;
                case 'received':
                    $notes = 'Order completed successfully';
                    break;
                case 'cancelled':
                    $notes = 'Order cancelled - supplier unable to fulfill';
                    break;
                default:
                    $notes = 'Regular stock replenishment';
            }

            $poString = 'PO-' . str_pad($poNumber++, 6, '0', STR_PAD_LEFT);

            $po = PurchaseOrder::updateOrCreate(
                ['po_number' => $poString],
                [
                    'location_id' => $location->id,
                    'supplier_id' => $supplier->id,
                    'created_by' => $adminUser->id,
                    'order_date' => $orderDate,
                    'expected_delivery_date' => $expectedDelivery,
                    'received_date' => $receivedDate,
                    'received_at' => $receivedAt,
                    'status' => $status,
                    'subtotal' => $subtotal,
                    'tax_total' => $taxTotal,
                    'total' => $total,
                    'total_amount' => $total,
                    'currency' => 'USD',
                    'notes' => $notes,
                    'created_at' => $orderDate,
                    'updated_at' => $status === 'draft' ? $orderDate : ($receivedAt ?? $orderDate),
                ]
            );

            // Clean up existing items key to prevent duplicates on re-seed
            PurchaseOrderItem::where('purchase_order_id', $po->id)->delete();

            // Create PO items
            foreach ($items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'ingredient_id' => $item['ingredient_id'],
                    'quantity_ordered' => $item['quantity_ordered'],
                    'quantity_received' => $item['quantity_received'],
                    'unit_price' => $item['unit_price'],
                    'total' => $item['total'],
                    'created_at' => $orderDate,
                    'updated_at' => $orderDate,
                ]);
            }
        }

        $this->command->info('Created ' . count($orderConfigs) . ' purchase orders with varied statuses and dates!');
    }
}
