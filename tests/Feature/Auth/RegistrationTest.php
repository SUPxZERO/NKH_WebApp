<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register_as_customer(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '1234567890',
            'role' => 'customer',
            'terms' => true,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('customer.dashboard', absolute: false));
        
        // Verify user was created with customer role
        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'role' => 'customer',
        ]);
    }

    /**
     * Security test: Verify that admin role cannot be registered.
     */
    public function test_public_registration_rejects_admin_role(): void
    {
        $response = $this->post('/register', [
            'name' => 'Malicious User',
            'email' => 'attacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '1234567892',
            'role' => 'admin',
            'terms' => true,
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors(['role']);
        $this->assertDatabaseMissing('users', ['email' => 'attacker@example.com']);
    }

    /**
     * Security test: Verify that employee role cannot be registered publicly.
     */
    public function test_public_registration_rejects_employee_role(): void
    {
        $response = $this->post('/register', [
            'name' => 'Fake Employee',
            'email' => 'fake_employee@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '1234567893',
            'role' => 'employee',
            'terms' => true,
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors(['role']);
    }

    /**
     * Security test: Verify that manager role is rejected.
     */
    public function test_public_registration_rejects_manager_role(): void
    {
        $response = $this->post('/register', [
            'name' => 'Another Attacker',
            'email' => 'manager_attacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '1234567894',
            'role' => 'manager',
            'terms' => true,
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors(['role']);
    }
}
