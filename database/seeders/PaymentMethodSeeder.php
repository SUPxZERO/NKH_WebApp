<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\PaymentMethod;

class PaymentMethodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Deactivate old/legacy payment methods that aren't in our main list
        PaymentMethod::whereNotIn('code', ['qr', 'cash', 'card', 'aba_pay', 'wing', 'pi_pay'])
            ->update(['is_active' => false]);

        $methods = [
            [
                'name' => 'KHQR',
                'code' => 'qr',
                'type' => 'digital_wallet',
                'description' => 'Scan to pay with any KHQR-compatible app',
                'is_active' => true,
                'display_order' => 1,
                'processing_fee' => 0.00,
            ],
            [
                'name' => 'ABA Pay',
                'code' => 'aba_pay',
                'type' => 'digital_wallet',
                'description' => 'Pay directly with ABA Mobile app',
                'is_active' => true,
                'display_order' => 2,
                'processing_fee' => 0.00,
            ],
            [
                'name' => 'Wing Money',
                'code' => 'wing',
                'type' => 'digital_wallet',
                'description' => 'Pay with Wing Money app',
                'is_active' => true,
                'display_order' => 3,
                'processing_fee' => 0.00,
            ],
            [
                'name' => 'Credit/Debit Card',
                'code' => 'card',
                'type' => 'card',
                'description' => 'Pay with Visa or Mastercard',
                'is_active' => true,
                'display_order' => 4,
                'processing_fee' => 2.50, // Card processing fee
            ],
            [
                'name' => 'Cash',
                'code' => 'cash',
                'type' => 'cash',
                'description' => 'Pay with cash at the counter',
                'is_active' => true,
                'display_order' => 5,
                'processing_fee' => 0.00,
            ],
        ];

        foreach ($methods as $method) {
            PaymentMethod::updateOrCreate(
                ['code' => $method['code']],
                $method
            );
        }
    }
}

