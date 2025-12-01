<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Customer;

class CreateAdminCustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Get the first user (admin)
        $user = User::first();
        
        if (!$user) {
            $this->command->error('No users found in database');
            return;
        }
        
        // Check if customer already exists
        $existingCustomer = Customer::where('user_id', $user->id)->first();
        
        if ($existingCustomer) {
            $this->command->info("Customer already exists for user {$user->name}");
            return;
        }
        
        // Create customer record with sample data
        $customer = Customer::create([
            'user_id' => $user->id,
            'customer_code' => 'CUST-' . strtoupper(substr(md5($user->id), 0, 6)),
            'points_balance' => 150,
            'customer_tier' => 'gold',
            'total_spent' => 1250.50,
            'visit_count' => 15,
            'average_order_value' => 83.37,
            'referral_code' => 'REF-' . strtoupper(substr(md5($user->id . 'ref'), 0, 6)),
        ]);
        
        $this->command->info("Created customer record (ID: {$customer->id}) for user: {$user->name}");
    }
}
