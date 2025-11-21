<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;

class LoyaltyPointsSeeder extends Seeder
{
    public function run(): void
    {
        $points = [
            1 => 0,
            2 => 257,
            3 => 245,
            4 => 48,
            5 => 265,
            6 => 236,
            7 => 96,
            8 => 327,
            9 => 483,
            10 => 236,
            11 => 335,
        ];

        foreach ($points as $id => $value) {
            Customer::where('id', $id)->update([
                'loyalty_points' => $value
            ]);
        }
    }
}
