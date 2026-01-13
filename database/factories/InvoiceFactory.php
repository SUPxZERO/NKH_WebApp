<?php

namespace Database\Factories;

use App\Models\Invoice;
use App\Models\Location;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    public function definition(): array
    {
        $subtotal = $this->faker->randomFloat(2, 10, 200);
        $tax = round($subtotal * 0.1, 2);
        
        return [
            'location_id' => Location::factory(),
            'order_id' => Order::factory(),
            'invoice_number' => 'INV-' . $this->faker->unique()->numerify('######'),
            'subtotal' => $subtotal,
            'tax_amount' => $tax,
            'discount_amount' => 0,
            'total_amount' => $subtotal + $tax,
            'status' => 'issued',
            'issued_at' => now(),
            'currency' => 'USD',
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'paid',
            'paid_at' => now(),
        ]);
    }
}
