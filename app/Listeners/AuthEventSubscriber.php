<?php

namespace App\Listeners;

use App\Services\AuditService;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Events\Dispatcher;

/**
 * Auth Event Subscriber - Tracks ALL authentication events
 * 
 * This subscriber captures:
 * - Login (success)
 * - Logout
 * - Registration
 * - Failed login attempts
 * - Password resets
 * 
 * All events are logged to the audit_logs table via AuditService
 */
class AuthEventSubscriber
{
    /**
     * Handle user login events.
     */
    public function handleLogin(Login $event): void
    {
        AuditService::log(
            action: 'login',
            model: $event->user,
            before: null,
            after: [
                'guard' => $event->guard,
                'remember' => $event->remember ?? false,
            ],
            metadata: [
                'event' => 'auth.login',
                'guard' => $event->guard,
            ]
        );
    }

    /**
     * Handle user logout events.
     */
    public function handleLogout(Logout $event): void
    {
        if ($event->user) {
            AuditService::log(
                action: 'logout',
                model: $event->user,
                before: null,
                after: null,
                metadata: [
                    'event' => 'auth.logout',
                    'guard' => $event->guard,
                ]
            );
        }
    }

    /**
     * Handle user registration events.
     */
    public function handleRegistered(Registered $event): void
    {
        AuditService::log(
            action: 'registered',
            model: $event->user,
            before: null,
            after: ($event->user instanceof \Illuminate\Database\Eloquent\Model)
            ? $event->user->getAttributes()
            : ['id' => $event->user->getAuthIdentifier()],
            metadata: [
                'event' => 'auth.registered',
            ]
        );
    }

    /**
     * Handle failed login attempts.
     */
    public function handleFailed(Failed $event): void
    {
        AuditService::logFailure(
            action: 'login_failed',
            errorMessage: 'Invalid credentials provided',
            context: [
                'event' => 'auth.failed',
                'guard' => $event->guard,
                'email' => $event->credentials['email'] ?? null,
                // Never log passwords
            ]
        );
    }

    /**
     * Handle password reset events.
     */
    public function handlePasswordReset(PasswordReset $event): void
    {
        AuditService::log(
            action: 'password_reset',
            model: $event->user,
            before: null,
            after: null,
            metadata: [
                'event' => 'auth.password_reset',
            ]
        );
    }

    /**
     * Register the listeners for the subscriber.
     */
    public function subscribe(Dispatcher $events): array
    {
        return [
            Login::class => 'handleLogin',
            Logout::class => 'handleLogout',
            Registered::class => 'handleRegistered',
            Failed::class => 'handleFailed',
            PasswordReset::class => 'handlePasswordReset',
        ];
    }
}
