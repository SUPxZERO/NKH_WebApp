<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminOrdersTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        // Avoid auth to simplify E2E API checks
        config(['app.enforce_admin_auth' => false]);
        $this->artisan('migrate:fresh', ['--seed' => true]);
    }

    public function test_admin_orders_index_returns_paginated_list(): void
    {
        $resp = $this->getJson('/api/admin/orders?per_page=10');
        $resp->assertStatus(200)
             ->assertJsonStructure([
                 'data',
                 'links',
                 'meta',
             ]);

        $data = $resp->json('data');
        $this->assertIsArray($data);
        // Ensure at least one order seeded
        $this->assertNotEmpty($data);
        // Validate resource fields
        $this->assertArrayHasKey('order_number', $data[0]);
        $this->assertArrayHasKey('total_amount', $data[0]);
        $this->assertArrayHasKey('total', $data[0]);
        $this->assertArrayHasKey('created_at', $data[0]);
    }

    public function test_admin_orders_index_ignores_status_all(): void
    {
        $resp = $this->getJson('/api/admin/orders?status=all&per_page=5');
        $resp->assertStatus(200);
        $this->assertNotEmpty($resp->json('data'));
    }
}
