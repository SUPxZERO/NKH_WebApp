<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use Database\Seeders\DashboardTestSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DashboardTestSeeder::class);
    }

    public function test_can_get_dashboard_stats(): void
    {
        $response = $this->getJson('/api/admin/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'today' => [
                    'orders',
                    'revenue',
                    'new_customers',
                    'reservations',
                ],
                'monthly' => [
                    'orders',
                    'revenue',
                    'revenue_growth',
                    'expenses',
                    'gross_profit',
                    'profit_margin',
                ],
                'customers' => [
                    'total',
                    'new_this_month',
                    'growth_rate',
                ],
                'business' => [
                    'active_employees',
                    'total_tables',
                    'occupied_tables',
                    'occupancy_rate',
                ],
                'menu' => [
                    'popular_items',
                    'category_performance',
                ],
                'analytics' => [
                    'hourly_revenue',
                    'order_status_distribution',
                    'revenue_trend',
                ],
                'reservations' => [
                    'today',
                    'pending',
                    'upcoming_trend',
                ],
                'requests' => [
                    'open',
                ],
                'last_updated',
            ]);
    }

    public function test_dashboard_stats_are_cached(): void
    {
        Cache::flush();
        
        // First request should not be from cache
        $firstResponse = $this->getJson('/api/admin/dashboard/stats');
        $firstResponse->assertStatus(200);
        
        // Modify some data
        $this->travel(5)->minutes();
        
        // Second request should be from cache and match the first response
        $secondResponse = $this->getJson('/api/admin/dashboard/stats');
        $this->assertEquals(
            $firstResponse->json(),
            $secondResponse->json()
        );
    }

    public function test_can_refresh_dashboard_stats(): void
    {
        // Get initial stats
        $initialResponse = $this->getJson('/api/admin/dashboard/stats');
        $initialResponse->assertStatus(200);
        
        // Wait a moment and modify some data
        $this->travel(1)->minute();
        
        // Refresh stats
        $refreshResponse = $this->postJson('/api/admin/dashboard/refresh');
        $refreshResponse->assertStatus(200);
        
        // Stats should be different after refresh
        $this->assertNotEquals(
            $initialResponse->json(),
            $refreshResponse->json()
        );
    }

    public function test_dashboard_handles_errors_gracefully(): void
    {
        // Simulate a database error by dropping a required table
        \Schema::drop('orders');
        
        $response = $this->getJson('/api/admin/dashboard/stats');
        
        $response->assertStatus(500)
            ->assertJsonStructure([
                'error',
                'message',
                'trace'
            ]);
    }
}
