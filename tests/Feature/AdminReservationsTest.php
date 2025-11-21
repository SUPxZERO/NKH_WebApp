<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReservationsTest extends TestCase
{
    use RefreshDatabase;

    public function setUp(): void
    {
        parent::setUp();
        config(['app.enforce_admin_auth' => false]);
        $this->artisan('migrate:fresh', ['--seed' => true]);
    }

    public function test_admin_reservations_index_returns_paginated_list(): void
    {
        $resp = $this->getJson('/api/admin/reservations?per_page=10');
        $resp->assertStatus(200)
             ->assertJsonStructure([
                 'data',
                 'links',
                 'meta',
             ]);

        $data = $resp->json('data');
        $this->assertIsArray($data);
        $this->assertNotEmpty($data);
        // UI-mapped fields
        $this->assertArrayHasKey('reserved_for', $data[0]);
        $this->assertArrayHasKey('guest_count', $data[0]);
        $this->assertArrayHasKey('status', $data[0]);
    }

    public function test_reservations_filter_status_all_shows_results(): void
    {
        $resp = $this->getJson('/api/admin/reservations?status=all&per_page=5');
        $resp->assertStatus(200);
        $this->assertNotEmpty($resp->json('data'));
    }
}
