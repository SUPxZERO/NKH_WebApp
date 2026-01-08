<?php

namespace Tests\Feature\Performance;

use App\Models\User;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Location;
use App\Models\MenuItem;
use App\Models\OrderItem;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class QueryCountTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Location $location;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->location = Location::factory()->create();
    }

    /**
     * Helper to count queries executed during a callback
     */
    protected function countQueries(callable $callback): int
    {
        DB::enableQueryLog();
        DB::flushQueryLog();
        
        $callback();
        
        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        
        return count($queries);
    }

    /** @test */
    public function order_index_has_no_n_plus_1_queries()
    {
        // Create test data
        $category = Category::factory()->create();
        $menuItems = MenuItem::factory()->count(5)->create(['category_id' => $category->id]);
        $customers = Customer::factory()->count(3)->create();
        
        // Create 10 orders with 3 items each
        foreach ($customers as $customer) {
            $orders = Order::factory()->count(3)->create([
                'customer_id' => $customer->id,
                'location_id' => $this->location->id,
            ]);
            
            foreach ($orders as $order) {
                foreach ($menuItems->random(3) as $menuItem) {
                    OrderItem::factory()->create([
                        'order_id' => $order->id,
                        'menu_item_id' => $menuItem->id,
                    ]);
                }
            }
        }

        // Count queries for index endpoint
        $queryCount = $this->countQueries(function() {
            $this->actingAs($this->admin)
                ->getJson('/api/admin/orders?per_page=15');
        });

        // With proper eager loading:
        // 1 query: orders with relationships
        // 1 query: count for pagination
        // Expected: < 15 queries (should be around 5-8)
        $this->assertLessThan(15, $queryCount, 
            "Order index should use < 15 queries, got {$queryCount}");
    }

    /** @test */
    public function order_show_has_minimal_queries()
    {
        $category = Category::factory()->create();
        $menuItems = MenuItem::factory()->count(5)->create(['category_id' => $category->id]);
        $customer = Customer::factory()->create();
        
        $order = Order::factory()->create([
            'customer_id' => $customer->id,
            'location_id' => $this->location->id,
        ]);
        
        foreach ($menuItems as $menuItem) {
            OrderItem::factory()->create([
                'order_id' => $order->id,
                'menu_item_id' => $menuItem->id,
            ]);
        }

        $queryCount = $this->countQueries(function() use ($order) {
            $this->actingAs($this->admin)
                ->getJson("/api/orders/{$order->id}");
        });

        // Expected: < 10 queries with proper eager loading
        $this->assertLessThan(10, $queryCount,
            "Order show should use < 10 queries,got {$queryCount}");
    }

    /** @test */
    public function invoice_index_has_no_n_plus_1_queries()
    {
        // Create invoices with related data
        $customers = Customer::factory()->count(3)->create();
        
        foreach ($customers as $customer) {
            $orders = Order::factory()->count(2)->create([
                'customer_id' => $customer->id,
                'location_id' => $this->location->id,
            ]);
            
            foreach ($orders as $order) {
                \App\Models\Invoice::factory()->create([
                    'order_id' => $order->id,
                    'location_id' => $this->location->id,
                ]);
            }
        }

        $queryCount = $this->countQueries(function() {
            $this->actingAs($this->admin)
                ->getJson('/api/admin/invoices?per_page=15');
        });

        // Expected: < 12 queries (already optimized in Phase 1)
        $this->assertLessThan(12, $queryCount,
            "Invoice index should use < 12 queries, got {$queryCount}");
    }

    /** @test */
    public function customer_order_history_has_no_n_plus_1()
    {
        $customer = Customer::factory()->create();
        $user = User::factory()->create(['role' => 'customer']);
        $customer->user()->associate($user);
        $customer->save();
        
        $category = Category::factory()->create();
        $menuItems = MenuItem::factory()->count(5)->create(['category_id' => $category->id]);
        
        // Create 10 orders for customer
        $orders = Order::factory()->count(10)->create([
            'customer_id' => $customer->id,
            'location_id' => $this->location->id,
        ]);
        
        foreach ($orders as $order) {
            foreach ($menuItems->random(3) as $menuItem) {
                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                ]);
            }
        }

        $queryCount = $this->countQueries(function() use ($user) {
            $this->actingAs($user)
                ->getJson('/api/customer/orders?per_page=10');
        });

        // Expected: < 15 queries with CustomerDashboardController eager loading
        $this->assertLessThan(15, $queryCount,
            "Customer order history should use < 15 queries, got {$queryCount}");
    }

    /** @test */
    public function menu_items_index_has_no_n_plus_1()
    {
        $category = Category::factory()->create();
        MenuItem::factory()->count(20)->create([
            'category_id' => $category->id,
            'location_id' => $this->location->id,
        ]);

        $queryCount = $this->countQueries(function() {
            $this->getJson('/api/menu-items?location_id=' . $this->location->id);
        });

        // Expected: < 8 queries (menu items + translations + category translations + count)
        $this->assertLessThan(8, $queryCount,
            "Menu items index should use < 8 queries, got {$queryCount}");
    }

    /** @test */
    public function query_count_remains_constant_with_more_data()
    {
        // Create initial dataset
        $category = Category::factory()->create();
        $menuItems = MenuItem::factory()->count(5)->create(['category_id' => $category->id]);
        $customer = Customer::factory()->create();
        
        // Create 5 orders
        for ($i = 0; $i < 5; $i++) {
            $order = Order::factory()->create([
                'customer_id' => $customer->id,
                'location_id' => $this->location->id,
            ]);
            
            foreach ($menuItems as $menuItem) {
                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                ]);
            }
        }

        $queryCountSmall = $this->countQueries(function() {
            $this->actingAs($this->admin)
                ->getJson('/api/admin/orders?per_page=15');
        });

        // Create 20 more orders
        for ($i = 0; $i < 20; $i++) {
            $order = Order::factory()->create([
                'customer_id' => $customer->id,
                'location_id' => $this->location->id,
            ]);
            
            foreach ($menuItems->random(3) as $menuItem) {
                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                ]);
            }
        }

        $queryCountLarge = $this->countQueries(function() {
            $this->actingAs($this->admin)
                ->getJson('/api/admin/orders?per_page=15');
        });

        // Query count should be roughly the same regardless of dataset size
        // Allow 2 query difference for pagination count updates
        $this->assertEqualsWithDelta($queryCountSmall, $queryCountLarge, 2,
            "Query count should remain constant. Small: {$queryCountSmall}, Large: {$queryCountLarge}");
    }

    /** @test */
    public function no_duplicate_queries_in_order_index()
    {
        $category = Category::factory()->create();
        $menuItems = MenuItem::factory()->count(3)->create(['category_id' => $category->id]);
        $customer = Customer::factory()->create();
        
        $orders = Order::factory()->count(5)->create([
            'customer_id' => $customer->id,
            'location_id' => $this->location->id,
        ]);
        
        foreach ($orders as $order) {
            foreach ($menuItems as $menuItem) {
                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'menu_item_id' => $menuItem->id,
                ]);
            }
        }

        DB::enableQueryLog();
        DB::flushQueryLog();
        
        $this->actingAs($this->admin)
            ->getJson('/api/admin/orders?per_page=15');
        
        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        // Get all SQL statements
        $sqlStatements = array_map(fn($q) => $q['query'], $queries);
        
        // Count duplicates
        $uniqueQueries = array_unique($sqlStatements);
        $duplicateCount = count($sqlStatements) - count($uniqueQueries);

        // Should have minimal duplicates (allow 1-2 for pagination/count queries)
        $this->assertLessThanOrEqual(2, $duplicateCount,
            "Found {$duplicateCount} duplicate queries. This indicates potential N+1 issues.");
    }
}
