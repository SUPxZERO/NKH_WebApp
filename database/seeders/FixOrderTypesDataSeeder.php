<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderType;

class FixOrderTypesDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $deliveryType = OrderType::where('code', 'delivery')->first();
        $pickupType = OrderType::where('code', 'pickup')->first();

        if (!$deliveryType || !$pickupType) {
            $this->command->error('Order types not found (delivery/pickup). Run OrderTypeSeeder first.');
            return;
        }

        // Fix Delivery Orders: Have address ID and are currently not set correctly
        $deliveryCount = Order::whereNotNull('customer_address_id')
            ->where(function ($q) use ($deliveryType) {
                $q->where('order_type_id', '!=', $deliveryType->id)
                    ->orWhereNull('order_type_id');
            })
            ->update(['order_type_id' => $deliveryType->id]);

        $this->command->info("Fixed $deliveryCount delivery orders.");

        // Fix Pickup Orders: No address, but have pickup time (and are online orders)
        $pickupCount = Order::whereNull('customer_address_id')
            ->whereNotNull('pickup_time')
            ->where(function ($q) use ($pickupType) {
                $q->where('order_type_id', '!=', $pickupType->id)
                    ->orWhereNull('order_type_id');
            })
            ->update(['order_type_id' => $pickupType->id]);

        $this->command->info("Fixed $pickupCount pickup orders.");
    }
}
