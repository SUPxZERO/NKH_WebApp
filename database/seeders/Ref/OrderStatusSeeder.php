<?php

namespace Database\Seeders\Ref;

use App\Models\OrderStatus;
use Illuminate\Database\Seeder;

class OrderStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [
                'code' => 'pending',
                'name' => 'Pending',
                'description' => 'Order received but not yet confirmed',
                'color' => '#FFA500', // Orange
                'icon' => 'pending_circle',
                'display_order' => 1,
                'workflow_position' => 1,
                'is_terminal' => false,
            ],
            [
                'code' => 'received',
                'name' => 'Received',
                'description' => 'Order received and confirmed by staff',
                'color' => '#2196F3', // Blue
                'icon' => 'check_circle',
                'display_order' => 2,
                'workflow_position' => 2,
                'is_terminal' => false,
            ],
            [
                'code' => 'preparing',
                'name' => 'Preparing',
                'description' => 'Food is being prepared in the kitchen',
                'color' => '#2196F3', // Blue
                'icon' => 'kitchen',
                'display_order' => 3,
                'workflow_position' => 3,
                'is_terminal' => false,
            ],
            [
                'code' => 'ready',
                'name' => 'Ready',
                'description' => 'Order is ready for pickup/service',
                'color' => '#9C27B0', // Purple
                'icon' => 'room_service',
                'display_order' => 4,
                'workflow_position' => 4,
                'is_terminal' => false,
            ],
            [
                'code' => 'served',
                'name' => 'Served',
                'description' => 'Order has been served to the customer',
                'color' => '#4CAF50', // Green
                'icon' => 'done_all',
                'display_order' => 5,
                'workflow_position' => 5,
                'is_terminal' => false,
            ],
            [
                'code' => 'completed',
                'name' => 'Completed',
                'description' => 'Order has been completed and paid',
                'color' => '#4CAF50', // Green
                'icon' => 'task_alt',
                'display_order' => 6,
                'workflow_position' => 6,
                'is_terminal' => true,
            ],
            [
                'code' => 'cancelled',
                'name' => 'Cancelled',
                'description' => 'Order has been cancelled',
                'color' => '#F44336', // Red
                'icon' => 'cancel',
                'display_order' => 7,
                'workflow_position' => 7,
                'is_terminal' => true,
            ]
        ];

        foreach ($statuses as $status) {
            OrderStatus::updateOrCreate(
                ['code' => $status['code']],
                $status
            );
        }
    }
}
