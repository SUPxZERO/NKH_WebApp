<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TelegramUser;
use App\Models\Customer;

class TelegramUserSeeder extends Seeder
{
    public function run(): void
    {
        // specific users
        $users = [
            [
                'telegram_id' => 123456789,
                'telegram_username' => 'john_doe_tg',
                'first_name' => 'John',
                'last_name' => 'Doe',
                'language_code' => 'en',
                'is_active' => true,
            ],
            [
                'telegram_id' => 987654321,
                'telegram_username' => 'jane_smith_tg',
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'language_code' => 'en',
                'is_active' => true,
            ],
            [
                'telegram_id' => 112233445,
                'telegram_username' => 'guest_user_tg',
                'first_name' => 'Guest',
                'last_name' => 'User',
                'language_code' => 'en',
                'is_active' => true,
            ],
        ];

        foreach ($users as $userData) {
            TelegramUser::updateOrCreate(
                ['telegram_id' => $userData['telegram_id']],
                $userData
            );
        }

        // Create some random ones
        TelegramUser::factory()->count(10)->create();
        
        // Link some to customers to test "Registered Telegram User" scenario
        // Ensure we have customers
        if (Customer::exists()) {
             TelegramUser::factory()
                ->count(3)
                ->linked()
                ->create();
        }
    }
}
