<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentMethod;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $paymentMethods = [
            [
                'name' => 'Cash',
                'code' => 'CASH',
                'type' => 'cash',
                'is_active' => true,
                'processing_fee' => 0.00,
                'description' => 'Cash payment',
            ],
            [
                'name' => 'Credit Card',
                'code' => 'CREDIT',
                'type' => 'card',
                'is_active' => true,
                'processing_fee' => 2.50,
                'description' => 'Visa, MasterCard, American Express',
            ],
            [
                'name' => 'Debit Card',
                'code' => 'DEBIT',
                'type' => 'card',
                'is_active' => true,
                'processing_fee' => 1.50,
                'description' => 'Bank debit cards',
            ],
            [
                'name' => 'Mobile Payment',
                'code' => 'MOBILE',
                'type' => 'digital',
                'is_active' => true,
                'processing_fee' => 1.00,
                'description' => 'ABA Mobile, Wing, Pi Pay',
            ],
            [
                'name' => 'Bank Transfer',
                'code' => 'TRANSFER',
                'type' => 'transfer',
                'is_active' => true,
                'processing_fee' => 0.50,
                'description' => 'Direct bank transfer',
            ],
            [
                'name' => 'Gift Card',
                'code' => 'GIFT',
                'type' => 'voucher',
                'is_active' => true,
                'processing_fee' => 0.00,
                'description' => 'Restaurant gift cards',
            ],
        ];

        foreach ($paymentMethods as $method) {
            PaymentMethod::create($method);
        }
    }
}
