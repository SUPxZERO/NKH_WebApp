<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Role;
use App\Models\Employee;
use App\Models\Location;
use App\Models\Position;
use App\Models\DiningTable;
use App\Models\Floor;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class OrderManagementTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $employee;
    protected $location;
    protected $table;
    protected $menuItem;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create roles
        Role::create(['name' => 'Waiter', 'slug' => 'waiter']);
        Role::create(['name' => 'Admin', 'slug' => 'admin']);
        
        // Create location
        $this->location = Location::create([
            'name' => 'Test Restaurant',
            'address' => '123 Test St',
            'phone' => '123-456-7890',
            'email' => 'test@restaurant.com',
            'is_active' => true,
        ]);
        
        // Create floor and table
        $floor = Floor::create([
            'location_id' => $this->location->id,
            'name' => 'Ground Floor',
            'display_order' => 1,
        ]);
        
        $this->table = DiningTable::create([
            'location_id' => $this->location->id,
            'floor_id' => $floor->id,
            'table_number' => 'T001',
            'capacity' => 4,
            'status' => 'available',
        ]);
        
        // Create position and employee
        $position = Position::create([
            'name' => 'Waiter',
            'description' => 'Server position',
        ]);
        
        $user = User::factory()->create();
        $user->roles()->attach(Role::where('slug', 'waiter')->first()->id);
        
        $this->employee = Employee::create([
            'user_id' => $user->id,
            'location_id' => $this->location->id,
            'position_id' => $position->id,
            'employee_number' => 'EMP001',
            'hire_date' => now(),
            'is_active' => true,
        ]);
        
        // Create category and menu item
        $category = Category::create([
            'location_id' => $this->location->id,
            'name' => 'Main Course',
            'slug' => 'main-course',
            'is_active' => true,
        ]);
        
        $this->menuItem = MenuItem::create([
            'location_id' => $this->location->id,
            'category_id' => $category->id,
            'slug' => 'test-dish',
            'price' => 15.99,
            'is_active' => true,
        ]);
    }

    public function test_employee_can_create_dine_in_order()
    {
        $response = $this->actingAs($this->employee->user, 'sanctum')
                         ->postJson('/api/employee/orders', [
                             'table_id' => $this->table->id,
                             'notes' => 'Test order',
                         ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'order_number',
                        'type',
                        'status',
                        'table',
                        'items'
                    ]
                ]);

        $this->assertDatabaseHas('orders', [
            'table_id' => $this->table->id,
            'employee_id' => $this->employee->id,
            'type' => 'dine_in',
            'status' => 'received',
        ]);

        // Verify table is marked as occupied
        $this->assertDatabaseHas('tables', [
            'id' => $this->table->id,
            'status' => 'occupied',
        ]);
    }

    public function test_employee_can_add_items_to_order()
    {
        $order = Order::create([
            'location_id' => $this->location->id,
            'table_id' => $this->table->id,
            'employee_id' => $this->employee->id,
            'order_number' => 'ORD-001',
            'type' => 'dine_in',
            'status' => 'received',
            'currency' => 'USD',
            'placed_at' => now(),
        ]);

        $response = $this->actingAs($this->employee->user, 'sanctum')
                         ->postJson("/api/employee/orders/{$order->id}/items", [
                             'menu_item_id' => $this->menuItem->id,
                             'quantity' => 2,
                             'notes' => 'Extra spicy',
                         ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'data' => [
                        'id',
                        'menu_item_id',
                        'quantity',
                        'unit_price',
                        'total',
                        'notes'
                    ]
                ]);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'menu_item_id' => $this->menuItem->id,
            'quantity' => 2,
            'unit_price' => $this->menuItem->price,
        ]);
    }

    public function test_employee_can_update_order_item()
    {
        $order = Order::create([
            'location_id' => $this->location->id,
            'table_id' => $this->table->id,
            'employee_id' => $this->employee->id,
            'order_number' => 'ORD-001',
            'type' => 'dine_in',
            'status' => 'received',
            'currency' => 'USD',
            'placed_at' => now(),
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $this->menuItem->id,
            'quantity' => 1,
            'unit_price' => $this->menuItem->price,
            'total' => $this->menuItem->price,
            'kitchen_status' => 'pending',
        ]);

        $response = $this->actingAs($this->employee->user, 'sanctum')
                         ->putJson("/api/employee/order-items/{$orderItem->id}", [
                             'quantity' => 3,
                             'notes' => 'Updated notes',
                         ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('order_items', [
            'id' => $orderItem->id,
            'quantity' => 3,
            'notes' => 'Updated notes',
        ]);
    }

    public function test_employee_can_remove_order_item()
    {
        $order = Order::create([
            'location_id' => $this->location->id,
            'table_id' => $this->table->id,
            'employee_id' => $this->employee->id,
            'order_number' => 'ORD-001',
            'type' => 'dine_in',
            'status' => 'received',
            'currency' => 'USD',
            'placed_at' => now(),
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $this->menuItem->id,
            'quantity' => 1,
            'unit_price' => $this->menuItem->price,
            'total' => $this->menuItem->price,
            'kitchen_status' => 'pending',
        ]);

        $response = $this->actingAs($this->employee->user, 'sanctum')
                         ->deleteJson("/api/employee/order-items/{$orderItem->id}");

        $response->assertStatus(200)
                ->assertJson(['message' => 'Order item removed.']);

        $this->assertDatabaseMissing('order_items', [
            'id' => $orderItem->id,
        ]);
    }

    public function test_employee_can_submit_order_to_kitchen()
    {
        $order = Order::create([
            'location_id' => $this->location->id,
            'table_id' => $this->table->id,
            'employee_id' => $this->employee->id,
            'order_number' => 'ORD-001',
            'type' => 'dine_in',
            'status' => 'received',
            'currency' => 'USD',
            'placed_at' => now(),
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'menu_item_id' => $this->menuItem->id,
            'quantity' => 1,
            'unit_price' => $this->menuItem->price,
            'total' => $this->menuItem->price,
            'kitchen_status' => 'pending',
        ]);

        $response = $this->actingAs($this->employee->user, 'sanctum')
                         ->postJson("/api/employee/orders/{$order->id}/submit");

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'preparing',
        ]);
    }

    public function test_cannot_create_order_for_occupied_table()
    {
        $this->table->update(['status' => 'occupied']);

        $response = $this->actingAs($this->employee->user, 'sanctum')
                         ->postJson('/api/employee/orders', [
                             'table_id' => $this->table->id,
                         ]);

        $response->assertStatus(409)
                ->assertJson(['message' => 'Table is currently occupied.']);
    }

    public function test_cannot_modify_non_pending_order()
    {
        $order = Order::create([
            'location_id' => $this->location->id,
            'table_id' => $this->table->id,
            'employee_id' => $this->employee->id,
            'order_number' => 'ORD-001',
            'type' => 'dine_in',
            'status' => 'preparing', // Not in received status
            'currency' => 'USD',
            'placed_at' => now(),
        ]);

        $response = $this->actingAs($this->employee->user, 'sanctum')
                         ->postJson("/api/employee/orders/{$order->id}/items", [
                             'menu_item_id' => $this->menuItem->id,
                             'quantity' => 1,
                         ]);

        $response->assertStatus(409);
    }
}
