<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserNotification;
use App\Models\BroadcastNotification;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class DemoNotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create Broadcast Notifications (System-wide)
        $this->createBroadcasts();

        // 2. Create Targeted User Notifications (Specific scenarios)
        $this->createTargetedNotifications();

        $this->command->info('Enhanced Demo notifications seeded successfully!');
    }

    private function createBroadcasts()
    {
        $admin = User::whereHas('roles', fn($q) => $q->where('slug', 'admin'))->first() ?? User::first();

        $broadcasts = [
            [
                'title' => 'System Maintenance Scheduled 🛠️',
                'message' => 'The system will undergo scheduled maintenance this Sunday from 2 AM to 4 AM. Please save your work.',
                'type' => 'system',
                'target_type' => 'all_users',
                'recipient_count' => User::count(),
            ],
            [
                'title' => 'New Menu Items Added! 🥗',
                'message' => 'We have updated our seasonal menu with 5 new delicious vegan options. Check them out!',
                'type' => 'promotion',
                'target_type' => 'all_customers',
                'recipient_count' => User::whereHas('roles', fn($q) => $q->where('slug', 'customer'))->count(),
            ],
            [
                'title' => 'Holiday Shift Schedule Published 📅',
                'message' => 'The shift schedule for the upcoming holidays has been finalized. Please review your shifts.',
                'type' => 'system',
                'target_type' => 'all_employees',
                'recipient_count' => User::whereHas('roles', fn($q) => $q->whereIn('slug', ['admin', 'manager', 'server', 'kitchen']))->count(),
            ]
        ];

        foreach ($broadcasts as $data) {
            $broadcast = BroadcastNotification::create(array_merge($data, [
                'created_by' => $admin->id,
                'created_at' => Carbon::now()->subDays(rand(0, 5)),
            ]));

            // Distribute to a subset of users to simulate read/unread status
            // For demo purposes, we'll just link to a few random users
            $users = User::inRandomOrder()->limit(10)->get();
            foreach ($users as $user) {
                UserNotification::create([
                    'user_id' => $user->id,
                    'broadcast_notification_id' => $broadcast->id,
                    'type' => $data['type'],
                    'title' => $data['title'],
                    'message' => $data['message'],
                    'read' => rand(0, 1),
                    'read_at' => rand(0, 1) ? Carbon::now()->subHours(rand(1, 24)) : null,
                    'created_at' => $broadcast->created_at,
                ]);
            }
        }
    }

    private function createTargetedNotifications()
    {
        // Admins & Managers - Operational Alerts
        $admins = User::whereHas('roles', fn($q) => $q->whereIn('slug', ['admin', 'manager']))->get();
        foreach ($admins as $admin) {
            UserNotification::createSystemNotification(
                $admin->id,
                'Low Stock Alert: Ribeye Steak 🥩',
                'Inventory for Ribeye Steak is below reorder level (3kg remaining).',
                '/admin/inventory'
            );

            UserNotification::create([
                'user_id' => $admin->id,
                'type' => 'system',
                'title' => 'High Void Rate Detected ⚠️',
                'message' => 'Unusual number of voided items detected on Table 5 during lunch service.',
                'read' => false,
                'created_at' => Carbon::yesterday()->setHour(14),
            ]);
        }

        // Kitchen Staff - Order Alerts
        $kitchenStaff = User::whereHas('roles', fn($q) => $q->where('slug', 'kitchen'))->limit(3)->get();
        foreach ($kitchenStaff as $staff) {
            UserNotification::createOrderNotification(
                $staff->id,
                'New High Priority Order 🔥',
                'Order #1024 (VIP Guest) requires immediate attention.',
                '/kitchen/orders'
            );
        }

        // Customers - Promo & Order Updates
        $customers = User::whereHas('roles', fn($q) => $q->where('slug', 'customer'))->limit(5)->get();
        foreach ($customers as $customer) {
            UserNotification::createOrderNotification(
                $customer->id,
                'Order Delivered ✅',
                'Your order #9988 has been delivered. Enjoy your meal!',
                '/customer/orders/9988'
            );

            UserNotification::createRewardNotification(
                $customer->id,
                'Double Points Tuesday! ⭐',
                'Earn 2x points on all burger orders today only.',
                '/menu'
            );
        }
    }
}
