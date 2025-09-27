<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodsSeeder extends Seeder
{
    public function run(): void
    {
        $methods = [
            ['name' => 'Cash', 'code' => 'CASH', 'display_order' => 1, 'is_active' => true],
            ['name' => 'Credit Card', 'code' => 'CARD', 'display_order' => 2, 'is_active' => true],
            ['name' => 'Mobile Pay', 'code' => 'MOBILE', 'display_order' => 3, 'is_active' => true],
        ];

        foreach ($methods as $m) {
            PaymentMethod::updateOrCreate(
                ['code' => $m['code']],
                $m
            );
        }
    }
}
