<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Order;
use App\Models\User;
use App\Models\Customer;
use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;

class OrderApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed necessary data if needed
    }

    /** @test */
    public function admin_can_approve_pending_order()
    {
        $admin = User::factory()->create();
        // Assuming you have a role system: $admin->assignRole('admin');
        
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'order_type' => 'delivery',
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/approve");

        $response->assertStatus(200);
        
        $this->assertEquals(Order::APPROVAL_STATUS_APPROVED, $order->fresh()->approval_status);
        $this->assertEquals('received', $order->fresh()->status);
        $this->assertEquals($admin->id, $order->fresh()->approved_by);
        $this->assertNotNull($order->fresh()->approved_at);
    }

    /** @test */
    public function admin_can_reject_pending_order()
    {
        $admin = User::factory()->create();
        
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'order_type' => 'pickup',
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/reject", [
                'rejection_reason' => 'Out of ingredients for this order'
            ]);

        $response->assertStatus(200);
        
        $this->assertEquals(Order::APPROVAL_STATUS_REJECTED, $order->fresh()->approval_status);
        $this->assertEquals('cancelled', $order->fresh()->status);
        $this->assertEquals('Out of ingredients for this order', $order->fresh()->rejection_reason);
    }

    /** @test */
    public function cannot_approve_already_approved_order()
    {
        $admin = User::factory()->create();
        
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_APPROVED,
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/approve");

        $response->assertStatus(409);
        $response->assertJson(['message' => 'Order is not pending approval.']);
    }

    /** @test */
    public function rejection_requires_reason()
    {
        $admin = User::factory()->create();
        
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/reject", [
                'rejection_reason' => '' // Empty reason
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('rejection_reason');
    }

    /** @test */
    public function rejection_reason_must_be_at_least_10_characters()
    {
        $admin = User::factory()->create();
        
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/admin/orders/{$order->id}/reject", [
                'rejection_reason' => 'Too short'
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('rejection_reason');
    }

    /** @test */
    public function can_list_pending_approval_orders()
    {
        $admin = User::factory()->create();
        
        $location = Location::factory()->create();
        $customer = Customer::factory()->create();

        // Create 3 pending orders
        Order::factory()->count(3)->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'order_type' => 'delivery',
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        // Create 2 approved orders (should not appear)
        Order::factory()->count(2)->create([
            'approval_status' => Order::APPROVAL_STATUS_APPROVED,
            'order_type' => 'delivery',
            'location_id' => $location->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->actingAs($admin)
            ->getJson('/api/admin/orders/pending-approval');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'data');
    }

    /** @test */
    public function can_filter_pending_orders_by_location()
    {
        $admin = User::factory()->create();
        
        $location1 = Location::factory()->create();
        $location2 = Location::factory()->create();
        $customer = Customer::factory()->create();

        // Create orders for location 1
        Order::factory()->count(2)->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'order_type' => 'delivery',
            'location_id' => $location1->id,
            'customer_id' => $customer->id,
        ]);

        // Create orders for location 2
        Order::factory()->count(3)->create([
            'approval_status' => Order::APPROVAL_STATUS_PENDING,
            'order_type' => 'delivery',
            'location_id' => $location2->id,
            'customer_id' => $customer->id,
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/api/admin/orders/pending-approval?location_id={$location1->id}");

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'data');
    }
}
