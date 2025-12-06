<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Database\Seeder;

class DemoNotificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first few users as customers
        $customers = User::limit(5)->get();
        
        foreach ($customers as $customer) {
            // Order notifications
            UserNotification::createOrderNotification(
                $customer->id,
                'Order Confirmed! 🎉',
                'Your order #12345 has been confirmed and is being prepared.',
                '/customer/orders'
            );
            
            UserNotification::createOrderNotification(
                $customer->id,
                'Order On The Way 🚗',
                'Your order #12344 is out for delivery. Estimated arrival: 20-30 mins.',
                '/customer/orders'
            );
            
            // Promotion notifications
            UserNotification::createPromotionNotification(
                $customer->id,
                '20% Off This Weekend! 🔥',
                'Use code WEEKEND20 for 20% off all orders this Saturday & Sunday.',
                '/menu'
            );
            
            // Reward notifications
            UserNotification::createRewardNotification(
                $customer->id,
                'You Earned 50 Points! ⭐',
                'Your recent order earned you 50 loyalty points. Keep ordering to earn more!',
                '/customer/loyalty'
            );
            
            // System notifications
            UserNotification::createSystemNotification(
                $customer->id,
                'Welcome to NKH Restaurant! 👋',
                'Thank you for joining us. Explore our menu and enjoy delicious meals.',
                '/menu'
            );
        }
        
        $this->command->info('Demo notifications seeded successfully!');
    }
}
