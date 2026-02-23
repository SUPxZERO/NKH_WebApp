<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OrderStatus;

class OrderStatusSeeder extends Seeder
{
    public function run()
    {
        $statuses = [
            ['code' => 'out_for_delivery', 'name' => 'Out for Delivery', 'color' => 'orange', 'is_active' => true],
            ['code' => 'delivered', 'name' => 'Delivered', 'color' => 'green', 'is_active' => true]
        ];

        foreach ($statuses as $status) {
            $obj = OrderStatus::where('code', $status['code'])->first();
            if (!$obj) {
                $obj = new OrderStatus();
                $obj->code = $status['code'];
            }
            $obj->name = $status['name'];
            $obj->color = $status['color'];
            $obj->is_active = $status['is_active'];
            $obj->save();
        }
    }
}
