<?php

namespace Database\Seeders\Ref;

use Illuminate\Database\Seeder;
use App\Models\PaymentStatus;

class PaymentStatusSeeder extends Seeder
{
    public function run(): void
    {
        $statuses = [
            ['code' => 'pending', 'name' => 'Pending', 'icon' => 'clock', 'color' => '#FFA500', 'is_successful' => false, 'is_terminal' => false, 'display_order' => 1],
            ['code' => 'processing', 'name' => 'Processing', 'icon' => 'spinner', 'color' => '#3B82F6', 'is_successful' => false, 'is_terminal' => false, 'display_order' => 2],
            ['code' => 'completed', 'name' => 'Completed', 'icon' => 'check-circle', 'color' => '#10B981', 'is_successful' => true, 'is_terminal' => true, 'display_order' => 3],
            ['code' => 'failed', 'name' => 'Failed', 'icon' => 'x-circle', 'color' => '#EF4444', 'is_successful' => false, 'is_terminal' => true, 'display_order' => 4],
            ['code' => 'refunded', 'name' => 'Refunded', 'icon' => 'arrow-left-circle', 'color' => '#8B5CF6', 'is_successful' => false, 'is_terminal' => true, 'display_order' => 5],
            ['code' => 'cancelled', 'name' => 'Cancelled', 'icon' => 'ban', 'color' => '#6B7280', 'is_successful' => false, 'is_terminal' => true, 'display_order' => 6],
        ];

        foreach ($statuses as $status) {
            PaymentStatus::updateOrCreate(
                ['code' => $status['code']],
                $status
            );
        }
    }
}
