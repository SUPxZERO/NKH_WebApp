<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\User;
use App\Models\Location;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        // Get users with customer role
        $customerUsers = User::whereHas('roles', function($query) {
            $query->where('name', 'customer');
        })->get();
        $locations = Location::all();
        
        foreach ($customerUsers as $user) {
            $preferredLocation = $locations->random();
            
            Customer::create([
                'user_id' => $user->id,
                'preferred_location_id' => $preferredLocation->id,
                'customer_code' => $this->generateCustomerCode(),
                'birth_date' => $this->generateBirthDate(),
                'gender' => $this->getRandomGender(),
                'loyalty_points' => rand(0, 500),
                'total_spent' => $this->generateTotalSpent(),
                'preferred_language' => $this->getPreferredLanguage(),
                'dietary_preferences' => $this->getDietaryPreferences(),
                'marketing_consent' => rand(0, 1) === 1,
            ]);
        }
    }

    private function generateCustomerCode(): string
    {
        return 'CUST-' . str_pad(rand(10000, 99999), 5, '0', STR_PAD_LEFT);
    }

    private function generateBirthDate(): string
    {
        $minAge = 18;
        $maxAge = 70;
        $age = rand($minAge, $maxAge);
        
        return now()->subYears($age)->subDays(rand(0, 365))->format('Y-m-d');
    }

    private function getRandomGender(): string
    {
        $genders = ['male', 'female', 'other'];
        return $genders[array_rand($genders)];
    }

    private function generateTotalSpent(): float
    {
        return round(rand(50, 2000) + (rand(0, 99) / 100), 2);
    }

    private function getPreferredLanguage(): string
    {
        $languages = ['en', 'km'];
        $weights = [70, 30]; // 70% English, 30% Khmer
        
        $random = rand(1, 100);
        return $random <= $weights[0] ? $languages[0] : $languages[1];
    }

    private function getDietaryPreferences(): ?string
    {
        $preferences = [
            null, null, null, null, // 40% no preferences
            'vegetarian',
            'vegan',
            'gluten_free',
            'dairy_free',
            'halal',
            'no_spicy'
        ];
        
        return $preferences[array_rand($preferences)];
    }
}
