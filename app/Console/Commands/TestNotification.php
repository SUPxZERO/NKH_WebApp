<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Order;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class TestNotification extends Command
{
    protected $signature = 'notification:test 
        {type=system : Notification type (order, reward, promotion, system)}
        {--user= : User ID to notify}
        {--all : Send to all customers}
        {--role= : Send to users with specific role (admin, manager, waiter, chef, cashier, delivery)}
        {--tier= : Send to customers with specific tier (bronze, silver, gold, platinum)}
        {--employees : Send to all employees}';
        
    protected $description = 'Test the notification system with various targeting options';

    public function handle()
    {
        $notificationService = app(NotificationService::class);
        $type = $this->argument('type');
        
        // Get target user(s) based on options
        $users = $this->resolveRecipients($notificationService);
        
        if ($users->isEmpty()) {
            $this->error('No users found matching the criteria.');
            return 1;
        }

        $this->info("Sending {$type} notification to {$users->count()} user(s)...");

        switch ($type) {
            case 'order':
                $order = Order::latest()->first();
                if ($order) {
                    $notificationService->sendOrderNotification($order, 'approved');
                    $this->info("Sent order approval notification for order #{$order->id}");
                } else {
                    $this->warn('No orders found. Sending a system notification instead.');
                    $notificationService->sendSystemNotification(
                        'Test Order Notification 🛒',
                        'This is a test order notification from the command line.',
                        $users
                    );
                }
                break;

            case 'reward':
                foreach ($users as $user) {
                    $notificationService->sendRewardNotification(
                        $user,
                        50,
                        "Test: You earned 50 bonus points! ⭐",
                        '/customer/loyalty'
                    );
                }
                $this->info("Sent reward notification to {$users->count()} users.");
                break;

            case 'promotion':
                $notificationService->sendSystemNotification(
                    '🔥 Test Promotion Alert!',
                    'Use code TESTPROMO for 20% off your next order!',
                    $users,
                    '/menu'
                );
                $this->info("Sent promotion notification to {$users->count()} users.");
                break;

            case 'system':
            default:
                $notificationService->sendSystemNotification(
                    '📢 Test System Notification',
                    'This is a test notification from the NKH notification system.',
                    $users
                );
                $this->info("Sent system notification to {$users->count()} users.");
                break;
        }

        $this->newLine();
        $this->info('✅ Notification test completed!');
        $this->info('Check the user_notifications table or the customer UI to verify.');

        return 0;
    }

    protected function resolveRecipients(NotificationService $notificationService)
    {
        $userId = $this->option('user');
        $sendToAll = $this->option('all');
        $role = $this->option('role');
        $tier = $this->option('tier');
        $employees = $this->option('employees');

        if ($userId) {
            $this->info("Targeting specific user ID: {$userId}");
            return User::where('id', $userId)->get();
        }
        
        if ($role) {
            $this->info("Targeting users with role: {$role}");
            return $notificationService->getUsersByRoles([$role]);
        }
        
        if ($tier) {
            $this->info("Targeting customers with tier: {$tier}");
            return $notificationService->getCustomersByTier([$tier]);
        }
        
        if ($employees) {
            $this->info("Targeting all employees");
            return $notificationService->getEmployees();
        }
        
        if ($sendToAll) {
            $this->info("Targeting all customers");
            return $notificationService->getCustomers();
        }
        
        // Default: first customer user
        $this->info("Targeting first customer (use --all for all customers)");
        return User::whereHas('customer')->limit(1)->get();
    }
}

