<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Shift;
use App\Models\ShiftSwap;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class SprintP18Test extends TestCase
{
    use RefreshDatabase;

    public function test_shift_marketplace_flow()
    {
        // Setup
        $alice = User::factory()->create();
        $bob = User::factory()->create();
        
        // Ensure employees exist
        Employee::factory()->create(['user_id' => $alice->id]);
        Employee::factory()->create(['user_id' => $bob->id]);

        $shift = Shift::factory()->create(['user_id' => $alice->id]);

        // 1. Alice posts giveaway
        $response = $this->actingAs($alice)->postJson('/api/employee/swaps', [
            'shift_id' => $shift->id,
            'type' => 'give_away',
            'reason' => 'Busy',
        ]);
        $response->assertStatus(201);
        $swapId = $response->json('id');

        // 2. Bob lists swaps (Marketplace)
        $response = $this->actingAs($bob)->getJson('/api/employee/swaps');
        $response->assertStatus(200);
        
        // Verify Bob sees the giveaway (it matches "open requests where I am NOT requester")
        $swaps = $response->json();
        $this->assertTrue(collect($swaps)->contains('id', $swapId));

        // 3. Bob claims it
        $response = $this->actingAs($bob)->putJson("/api/employee/swaps/{$swapId}", [
            'action' => 'accept'
        ]);
        $response->assertStatus(200);
        
        $this->assertDatabaseHas('shift_swaps', [
            'id' => $swapId,
            'status' => 'accepted_by_peer',
            'recipient_id' => $bob->id
        ]);
    }

    public function test_delivery_driver_flow()
    {
        // Setup
        $driver = User::factory()->create();
        // Assuming 'driver' role or permission is checked, but for now simple auth flow
        
        $order = Order::factory()->create([
            'order_type' => 'delivery',
            'status' => 'ready',
            'driver_id' => null
        ]);

        // 1. List available
        $response = $this->actingAs($driver)->getJson('/api/employee/driver/orders');
        $response->assertStatus(200)
            ->assertJsonStructure(['my_deliveries', 'available_deliveries']);
        
        $available = $response->json('available_deliveries');
        $this->assertTrue(collect($available)->contains('id', $order->id));

        // 2. Claim
        $response = $this->actingAs($driver)->postJson("/api/employee/driver/orders/{$order->id}/claim");
        $response->assertStatus(200);
        
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'driver_id' => $driver->id
        ]);

        // 3. Update Status -> Out for Delivery
        $response = $this->actingAs($driver)->putJson("/api/employee/driver/orders/{$order->id}/status", [
            'status' => 'out_for_delivery'
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'out_for_delivery']);

        // 4. Update Status -> Delivered
        $response = $this->actingAs($driver)->putJson("/api/employee/driver/orders/{$order->id}/status", [
            'status' => 'delivered'
        ]);
        $response->assertStatus(200);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'delivered']);
    }

    public function test_pos_tips_and_split_bill()
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['total_amount' => 100]);
        // Ensure invoice
        $invoice = Invoice::create([
            'order_id' => $order->id,
            'invoice_number' => 'INV-TEST',
            'total_amount' => 100,
            'amount_due' => 100,
            'status' => 'issued'
        ]);

        // 1. Pay with Tip
        // Suppose we pay $50 first with $5 tip
        $response = $this->actingAs($user)->postJson("/api/payments/split/{$order->id}/add", [
            'payment_method' => 'cash',
            'amount' => 50,
            'tip' => 5
        ]);
        $response->assertStatus(200);

        // Check DB
        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'amount' => 50,
            'tip' => 5
        ]);

        $invoice->refresh();
        $this->assertEquals(50, $invoice->amount_paid);
        $this->assertEquals(50, $invoice->amount_due);
        $this->assertEquals('partial', $invoice->status);

        // 2. Pay remaining with no tip
        $response = $this->actingAs($user)->postJson("/api/payments/split/{$order->id}/add", [
            'payment_method' => 'card',
            'amount' => 50,
            'tip' => 0
        ]);
        $response->assertStatus(200);

        // Complete
        $response = $this->actingAs($user)->postJson("/api/payments/split/{$order->id}/complete");
        $response->assertStatus(200);

        $invoice->refresh();
        $this->assertEquals(100, $invoice->amount_paid);
        $this->assertEquals(0, $invoice->amount_due);
        $this->assertEquals('paid', $invoice->status);
    }
}
