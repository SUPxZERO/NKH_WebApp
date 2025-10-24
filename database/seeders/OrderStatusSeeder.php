<?php

namespace Database\Seeders;

use App\Models\OrderStatus;
use Illuminate\Database\Seeder;

class OrderStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            [
                'name' => 'pending',
                'display_name_en' => 'Pending',
                'display_name_km' => 'កំពុងរង់ចាំ',
                'description_en' => 'Order received but not yet confirmed',
                'description_km' => 'បានទទួលការបញ្ជាទិញ ប៉ុន្តែមិនទាន់បានបញ្ជាក់',
                'color' => '#FFA500', // Orange
                'icon' => 'pending_circle',
                'display_order' => 1
            ],
            [
                'name' => 'confirmed',
                'display_name_en' => 'Confirmed',
                'display_name_km' => 'បានបញ្ជាក់',
                'description_en' => 'Order confirmed and being prepared',
                'description_km' => 'ការបញ្ជាទិញត្រូវបានបញ្ជាក់ និងកំពុងរៀបចំ',
                'color' => '#4CAF50', // Green
                'icon' => 'check_circle',
                'display_order' => 2
            ],
            [
                'name' => 'preparing',
                'display_name_en' => 'Preparing',
                'display_name_km' => 'កំពុងរៀបចំ',
                'description_en' => 'Food is being prepared in the kitchen',
                'description_km' => 'អាហារកំពុងត្រូវបានរៀបចំនៅក្នុងផ្ទះបាយ',
                'color' => '#2196F3', // Blue
                'icon' => 'kitchen',
                'display_order' => 3
            ],
            [
                'name' => 'ready',
                'display_name_en' => 'Ready',
                'display_name_km' => 'រួចរាល់',
                'description_en' => 'Order is ready for pickup/service',
                'description_km' => 'ការបញ្ជាទិញរួចរាល់សម្រាប់ការដឹកជញ្ជូន/សេវាកម្ម',
                'color' => '#9C27B0', // Purple
                'icon' => 'room_service',
                'display_order' => 4
            ],
            [
                'name' => 'served',
                'display_name_en' => 'Served',
                'display_name_km' => 'បានបម្រើ',
                'description_en' => 'Order has been served to the customer',
                'description_km' => 'ការបញ្ជាទិញត្រូវបានបម្រើដល់អតិថិជន',
                'color' => '#4CAF50', // Green
                'icon' => 'done_all',
                'display_order' => 5
            ],
            [
                'name' => 'completed',
                'display_name_en' => 'Completed',
                'display_name_km' => 'បានបញ្ចប់',
                'description_en' => 'Order has been completed and paid',
                'description_km' => 'ការបញ្ជាទិញត្រូវបានបញ្ចប់ និងបង់ប្រាក់',
                'color' => '#4CAF50', // Green
                'icon' => 'task_alt',
                'display_order' => 6
            ],
            [
                'name' => 'cancelled',
                'display_name_en' => 'Cancelled',
                'display_name_km' => 'បានបោះបង់',
                'description_en' => 'Order has been cancelled',
                'description_km' => 'ការបញ្ជាទិញត្រូវបានបោះបង់',
                'color' => '#F44336', // Red
                'icon' => 'cancel',
                'display_order' => 7
            ]
        ];

        foreach ($statuses as $status) {
            OrderStatus::create($status);
        }
    }
}