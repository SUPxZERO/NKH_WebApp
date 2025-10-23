<?php

namespace Tests\Unit;

use App\Models\Customer;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CustomerTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_customer_with_all_fields()
    {
        $user = \App\Models\User::factory()->create();
        
        $customerData = [
            'user_id' => $user->id,
            'customer_code' => 'AB1234',
            'loyalty_points' => 100,
            'total_spent' => 500.50,
            'preferred_language' => 'en',
            'dietary_preferences' => ['vegetarian', 'gluten-free'],
            'marketing_consent' => true
        ];

        $customer = Customer::create($customerData);
        
        // Test individual fields
        $this->assertEquals($user->id, $customer->user_id);
        $this->assertEquals('AB1234', $customer->customer_code);
        $this->assertEquals(100, $customer->loyalty_points);
        $this->assertEquals(500.50, $customer->total_spent);
        $this->assertEquals('en', $customer->preferred_language);
        $this->assertEquals(['vegetarian', 'gluten-free'], $customer->dietary_preferences);
        $this->assertTrue($customer->marketing_consent);

        // Test type casting
        $this->assertIsInt($customer->loyalty_points);
        $this->assertIsNumeric($customer->total_spent);
        $this->assertIsBool($customer->marketing_consent);
        $this->assertIsArray($customer->dietary_preferences);
    }
}