<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DebugFactoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_factory()
    {
        $user = User::factory()->create();
        $this->assertNotNull($user);
    }
}
