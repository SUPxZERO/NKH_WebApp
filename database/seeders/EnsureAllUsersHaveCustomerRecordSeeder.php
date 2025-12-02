<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Customer;
use Illuminate\Database\Seeder;

class EnsureAllUsersHaveCustomerRecordSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::doesntHave('customer')->get();

        foreach ($users as $user) {
            Customer::create([
                'user_id' => $user->id,
                'points_balance' => 150, // Give them some points to see
                'total_spent' => 500.00,
                'total_orders' => 5,
                'tier' => 'Silver',
                'joined_at' => now(),
            ]);
            $this->command->info("Created customer record for user: {$user->name} (ID: {$user->id})");
        }
    }
}
