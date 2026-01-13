<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Location;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\PaymentStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 10, 200);

        return [
            'uuid' => Str::uuid(),
            'location_id' => Location::factory(),
            'invoice_id' => Invoice::factory(),
            'payment_method_id' => PaymentMethod::inRandomOrder()->first()?->id ?? PaymentMethod::factory(),
            'payment_status_id' => PaymentStatus::where('code', 'pending')->first()?->id ?? PaymentStatus::factory(),
            'amount' => $amount,
            'amount_in_base_currency' => $amount,
            'exchange_rate' => 1.0000,
            'currency' => 'USD',
            'status' => 'pending', // To be removed later, keeping for now
            'initiated_at' => now(),
            'created_by' => User::factory(),
        ];
    }

    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $status = PaymentStatus::where('code', 'completed')->first();
            return [
                'payment_status_id' => $status?->id,
                'status' => 'completed',
                'processed_at' => now(),
                'confirmed_at' => now(),
                'confirmed_by' => User::factory(),
            ];
        });
    }

    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'payment_status_id' => PaymentStatus::where('code', 'pending')->first()?->id,
            'status' => 'pending',
            'processed_at' => null,
        ]);
    }
    
    public function failed(): static
    {
        return $this->state(fn (array $attributes) => [
             'payment_status_id' => PaymentStatus::where('code', 'failed')->first()?->id,
             'status' => 'failed',
             'failure_reason' => $this->faker->sentence,
             'processed_at' => now(),
        ]);
    }
}
